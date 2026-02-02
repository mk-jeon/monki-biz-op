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

    // Phase 2: 50개 확장 컬럼 처리
    // 기본 정보 (8개)
    if (data.birth_date !== undefined) {
      fields.push('birth_date = ?');
      bindings.push(data.birth_date || null);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      bindings.push(data.email || null);
    }
    if (data.business_number !== undefined) {
      fields.push('business_number = ?');
      bindings.push(data.business_number || null);
    }
    if (data.representative !== undefined) {
      fields.push('representative = ?');
      bindings.push(data.representative || null);
    }
    if (data.road_address !== undefined) {
      fields.push('road_address = ?');
      bindings.push(data.road_address || null);
    }
    if (data.detail_address !== undefined) {
      fields.push('detail_address = ?');
      bindings.push(data.detail_address || null);
    }
    if (data.region !== undefined) {
      fields.push('region = ?');
      bindings.push(data.region || null);
    }
    if (data.region_type !== undefined) {
      fields.push('region_type = ?');
      bindings.push(data.region_type || null);
    }

    // 금융 정보 (9개)
    if (data.bank_name !== undefined) {
      fields.push('bank_name = ?');
      bindings.push(data.bank_name || null);
    }
    if (data.account_number !== undefined) {
      fields.push('account_number = ?');
      bindings.push(data.account_number || null);
    }
    if (data.account_holder !== undefined) {
      fields.push('account_holder = ?');
      bindings.push(data.account_holder || null);
    }
    if (data.contract_type !== undefined) {
      fields.push('contract_type = ?');
      bindings.push(data.contract_type || null);
    }
    if (data.withdrawal_day !== undefined) {
      fields.push('withdrawal_day = ?');
      bindings.push(data.withdrawal_day || null);
    }
    if (data.monthly_rental_fee !== undefined) {
      fields.push('monthly_rental_fee = ?');
      bindings.push(data.monthly_rental_fee || null);
    }
    if (data.deposit !== undefined) {
      fields.push('deposit = ?');
      bindings.push(data.deposit || null);
    }
    if (data.contract_date !== undefined) {
      fields.push('contract_date = ?');
      bindings.push(data.contract_date || null);
    }
    if (data.contract_number !== undefined) {
      fields.push('contract_number = ?');
      bindings.push(data.contract_number || null);
    }

    // H/W: POS (7개)
    if (data.pos_agency !== undefined) {
      fields.push('pos_agency = ?');
      bindings.push(data.pos_agency || null);
    }
    if (data.pos_vendor !== undefined) {
      fields.push('pos_vendor = ?');
      bindings.push(data.pos_vendor || null);
    }
    if (data.pos_model !== undefined) {
      fields.push('pos_model = ?');
      bindings.push(data.pos_model || null);
    }
    if (data.pos_program !== undefined) {
      fields.push('pos_program = ?');
      bindings.push(data.pos_program || null);
    }
    if (data.asp_id !== undefined) {
      fields.push('asp_id = ?');
      bindings.push(data.asp_id || null);
    }
    if (data.asp_password !== undefined) {
      fields.push('asp_password = ?');
      bindings.push(data.asp_password || null);
    }
    if (data.asp_url !== undefined) {
      fields.push('asp_url = ?');
      bindings.push(data.asp_url || null);
    }

    // H/W: 테이블오더 & 거치대 (6개)
    if (data.table_order_qty !== undefined) {
      fields.push('table_order_qty = ?');
      bindings.push(data.table_order_qty || 0);
    }
    if (data.stand_standard !== undefined) {
      fields.push('stand_standard = ?');
      bindings.push(data.stand_standard || 0);
    }
    if (data.stand_flat !== undefined) {
      fields.push('stand_flat = ?');
      bindings.push(data.stand_flat || 0);
    }
    if (data.stand_extended !== undefined) {
      fields.push('stand_extended = ?');
      bindings.push(data.stand_extended || 0);
    }
    if (data.charger_qty !== undefined) {
      fields.push('charger_qty = ?');
      bindings.push(data.charger_qty || 0);
    }
    if (data.battery_qty !== undefined) {
      fields.push('battery_qty = ?');
      bindings.push(data.battery_qty || 0);
    }

    // H/W: 네트워크 & 기타 (4개)
    if (data.router_qty !== undefined) {
      fields.push('router_qty = ?');
      bindings.push(data.router_qty || 0);
    }
    if (data.kiosk_qty !== undefined) {
      fields.push('kiosk_qty = ?');
      bindings.push(data.kiosk_qty || 0);
    }
    if (data.kitchen_printer_qty !== undefined) {
      fields.push('kitchen_printer_qty = ?');
      bindings.push(data.kitchen_printer_qty || 0);
    }
    if (data.call_bell_qty !== undefined) {
      fields.push('call_bell_qty = ?');
      bindings.push(data.call_bell_qty || 0);
    }

    // 관리 정보 (2개)
    if (data.crm_service !== undefined) {
      fields.push('crm_service = ?');
      bindings.push(data.crm_service || 0);
    }
    if (data.ai_sales_service !== undefined) {
      fields.push('ai_sales_service = ?');
      bindings.push(data.ai_sales_service || 0);
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
 * PUT/PATCH /api/installations/:id/status
 * 상태 변경 (드래그앤드롭 및 리스트용)
 */
const updateStatus = async (c) => {
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
};

installations.put('/:id/status', requireAuth, updateStatus);
installations.patch('/:id/status', requireAuth, updateStatus);

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
