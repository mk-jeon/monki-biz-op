import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth } from '../middleware/auth';

const installations = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/installations
 * 설치현황 목록 조회
 */
installations.get('/', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const status = c.req.query('status') || '';
    const showAll = c.req.query('show_all') === 'true';
    const searchArchive = c.req.query('search_archive') === 'true';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const bindings = [];
    
    if (searchArchive) {
      // 이전 기록 검색: 설치완료 또는 취소 건만
      whereClause = 'WHERE i.status IN (?, ?)';
      bindings.push('completed', 'cancelled');
      
      if (status && (status === 'completed' || status === 'cancelled')) {
        whereClause = 'WHERE i.status = ?';
        bindings.length = 0;
        bindings.push(status);
      }
    } else {
      // 일반 모드: 미이관 건만
      whereClause = 'WHERE (i.migrated_to_operation = 0 OR i.migrated_to_operation IS NULL)';
      
      if (showAll) {
        whereClause = 'WHERE 1=1';
      }
      
      if (status) {
        whereClause += ' AND i.status = ?';
        bindings.push(status);
      }
    }

    const countQuery = `SELECT COUNT(*) as count FROM installations i ${whereClause}`;
    const countResult = await c.env.DB
      .prepare(countQuery)
      .bind(...bindings)
      .first<{ count: number }>();
    
    const total = countResult?.count || 0;

    let query = '';
    
    if (searchArchive) {
      query = `
        SELECT 
          i.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM installations i
        LEFT JOIN users u1 ON i.created_by = u1.id
        LEFT JOIN users u2 ON i.updated_by = u2.id
        ${whereClause}
        ORDER BY i.updated_at DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      // 취소 건은 최근 5건만
      query = `
        SELECT 
          i.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM installations i
        LEFT JOIN users u1 ON i.created_by = u1.id
        LEFT JOIN users u2 ON i.updated_by = u2.id
        ${whereClause}
          AND (
            i.status != 'cancelled' 
            OR i.id IN (
              SELECT id FROM installations 
              WHERE status = 'cancelled' 
              ORDER BY updated_at DESC 
              LIMIT 5
            )
          )
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
      `;
    }
    
    bindings.push(limit, offset);
    const result = await c.env.DB
      .prepare(query)
      .bind(...bindings)
      .all();

    return c.json({
      installations: result.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get installations error:', error);
    return c.json({ error: '설치현황 목록을 불러올 수 없습니다.' }, 500);
  }
});

/**
 * GET /api/installations/:id
 * 설치현황 상세 조회
 */
installations.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    const installation = await c.env.DB
      .prepare(`
        SELECT 
          i.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM installations i
        LEFT JOIN users u1 ON i.created_by = u1.id
        LEFT JOIN users u2 ON i.updated_by = u2.id
        WHERE i.id = ?
      `)
      .bind(id)
      .first();

    if (!installation) {
      return c.json({ error: '설치 정보를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ installation });
  } catch (error) {
    console.error('Get installation error:', error);
    return c.json({ error: '설치 정보를 불러올 수 없습니다.' }, 500);
  }
});

/**
 * POST /api/installations/migrate
 * 계약현황에서 설치현황으로 일괄 이관
 */
installations.post('/migrate', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { contract_ids } = await c.req.json<{ contract_ids: number[] }>();

    if (!contract_ids || !Array.isArray(contract_ids) || contract_ids.length === 0) {
      return c.json({ error: '이관할 계약이 없습니다.' }, 400);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const contractId of contract_ids) {
      try {
        // 계약 정보 조회
        const contract = await c.env.DB
          .prepare(`
            SELECT * FROM contracts 
            WHERE id = ? 
              AND (status = 'completed' OR pre_installation = 1)
              AND migrated_to_installation = 0
          `)
          .bind(contractId)
          .first();

        if (!contract) {
          errorCount++;
          errors.push(`계약 ID ${contractId}: 이관 조건을 만족하지 않습니다.`);
          continue;
        }

        // 설치현황에 등록
        await c.env.DB
          .prepare(`
            INSERT INTO installations 
            (
              contract_id, consultation_id, customer_name, phone, inflow_source,
              is_pre_installation, contract_completed, notes, created_by, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting')
          `)
          .bind(
            contractId,
            contract.consultation_id || null,
            contract.customer_name || '',
            contract.phone,
            contract.inflow_source || '',
            contract.pre_installation || 0,
            contract.pre_installation ? 0 : 1, // 선설치 건은 계약미완료
            contract.notes || '',
            user.id
          )
          .run();

        // 계약현황에 이관 플래그 설정
        await c.env.DB
          .prepare(`
            UPDATE contracts 
            SET migrated_to_installation = 1, migrated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(contractId)
          .run();

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`계약 ID ${contractId}: ${error.message}`);
      }
    }

    return c.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Migrate installations error:', error);
    return c.json({ error: '설치 이관 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/installations/:id
 * 설치현황 수정
 */
installations.put('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();

    const fields = [];
    const bindings = [];

    // 기본 필드
    if (data.customer_name !== undefined) {
      fields.push('customer_name = ?');
      bindings.push(data.customer_name || '');
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      bindings.push(data.phone);
    }
    if (data.inflow_source !== undefined) {
      fields.push('inflow_source = ?');
      bindings.push(data.inflow_source || '');
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      bindings.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      bindings.push(data.notes || '');
    }

    // 선설치 관련
    if (data.contract_completed !== undefined) {
      fields.push('contract_completed = ?');
      bindings.push(data.contract_completed ? 1 : 0);
    }

    // 체크리스트
    if (data.has_confirmation_doc !== undefined) {
      fields.push('has_confirmation_doc = ?');
      bindings.push(data.has_confirmation_doc ? 1 : 0);
    }
    if (data.has_photos !== undefined) {
      fields.push('has_photos = ?');
      bindings.push(data.has_photos ? 1 : 0);
    }
    if (data.has_drive_upload !== undefined) {
      fields.push('has_drive_upload = ?');
      bindings.push(data.has_drive_upload ? 1 : 0);
    }

    // 재방문 관련 (1~5차)
    for (let i = 1; i <= 5; i++) {
      const suffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
      
      if (data[`revisit_${suffix}`] !== undefined) {
        fields.push(`revisit_${suffix} = ?`);
        bindings.push(data[`revisit_${suffix}`] ? 1 : 0);
      }
      if (data[`revisit_${suffix}_paid`] !== undefined) {
        fields.push(`revisit_${suffix}_paid = ?`);
        bindings.push(data[`revisit_${suffix}_paid`] ? 1 : 0);
      }
      if (data[`revisit_${suffix}_cost`] !== undefined) {
        fields.push(`revisit_${suffix}_cost = ?`);
        bindings.push(data[`revisit_${suffix}_cost`] || 0);
      }
      if (data[`revisit_${suffix}_payment_status`] !== undefined) {
        fields.push(`revisit_${suffix}_payment_status = ?`);
        bindings.push(data[`revisit_${suffix}_payment_status`] || 'pending');
      }
      if (data[`revisit_${suffix}_payment_note`] !== undefined) {
        fields.push(`revisit_${suffix}_payment_note = ?`);
        bindings.push(data[`revisit_${suffix}_payment_note`] || '');
      }
    }

    // 운영이관 관련
    if (data.migrated_to_operation !== undefined) {
      fields.push('migrated_to_operation = ?');
      bindings.push(data.migrated_to_operation ? 1 : 0);
    }
    if (data.migrated_at !== undefined) {
      fields.push('migrated_at = ?');
      bindings.push(data.migrated_at);
    }

    if (fields.length === 0) {
      return c.json({ error: '수정할 내용이 없습니다.' }, 400);
    }

    fields.push('updated_by = ?');
    fields.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(user.id);
    bindings.push(id);

    await c.env.DB
      .prepare(`UPDATE installations SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update installation error:', error);
    return c.json({ error: '설치 수정 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/installations/:id/status
 * 상태 변경 (드래그앤드롭용)
 */
installations.put('/:id/status', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: '상태 값이 필요합니다.' }, 400);
    }

    await c.env.DB
      .prepare(`
        UPDATE installations 
        SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(status, user.id, id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    return c.json({ error: '상태 변경 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * GET /api/installations/stats/completed
 * 설치완료 건수 조회 (운영이관용)
 */
installations.get('/stats/completed', requireAuth, async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as count,
          GROUP_CONCAT(id) as ids
        FROM installations
        WHERE status = 'completed' 
          AND (migrated_to_operation = 0 OR migrated_to_operation IS NULL)
      `)
      .first<{ count: number; ids: string }>();

    const count = result?.count || 0;
    const ids = result?.ids 
      ? result.ids.split(',').map((id: string) => parseInt(id.trim(), 10)) 
      : [];

    return c.json({ count, ids });
  } catch (error) {
    console.error('Get completed stats error:', error);
    return c.json({ error: '통계를 불러올 수 없습니다.' }, 500);
  }
});

/**
 * DELETE /api/installations/:id
 * 설치현황 삭제
 */
installations.delete('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB
      .prepare('DELETE FROM installations WHERE id = ?')
      .bind(id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete installation error:', error);
    return c.json({ error: '설치 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default installations;
