import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth } from '../middleware/auth';

const contracts = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/contracts
 * 계약현황 목록 조회
 */
contracts.get('/', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const status = c.req.query('status') || '';
    const showAll = c.req.query('show_all') === 'true'; // 통계용
    const searchArchive = c.req.query('search_archive') === 'true'; // 이전 기록 검색
    const offset = (page - 1) * limit;

    let whereClause = '';
    const bindings = [];
    
    if (searchArchive) {
      // 이전 기록 검색 모드: 계약완료 또는 취소 건만 조회
      whereClause = 'WHERE c.status IN (?, ?)';
      bindings.push('completed', 'cancelled');
      
      // 특정 상태 필터링
      if (status && (status === 'completed' || status === 'cancelled')) {
        whereClause = 'WHERE c.status = ?';
        bindings.length = 0;
        bindings.push(status);
      }
    } else {
      // 일반 모드: 미이관 건만 표시
      // 계약완료 건도 표시하되, 이관 후에만 숨김
      // 취소 건은 최근 5건만 포함
      whereClause = 'WHERE (c.migrated_to_installation = 0 OR c.migrated_to_installation IS NULL)';
      
      // 통계용 조회 시 이관 건 포함
      if (showAll) {
        whereClause = 'WHERE 1=1';
      }
      
      // 특정 상태 필터링
      if (status) {
        whereClause += ' AND c.status = ?';
        bindings.push(status);
      }
    }

    const countQuery = `SELECT COUNT(*) as count FROM contracts c ${whereClause}`;
    const countResult = await c.env.DB
      .prepare(countQuery)
      .bind(...bindings)
      .first<{ count: number }>();
    
    const total = countResult?.count || 0;

    let query = '';
    
    if (searchArchive) {
      // 이전 기록 검색: 전체 조회
      query = `
        SELECT 
          c.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM contracts c
        LEFT JOIN users u1 ON c.created_by = u1.id
        LEFT JOIN users u2 ON c.updated_by = u2.id
        ${whereClause}
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      // 일반 모드: 취소 건은 최근 5건만
      query = `
        SELECT 
          c.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM contracts c
        LEFT JOIN users u1 ON c.created_by = u1.id
        LEFT JOIN users u2 ON c.updated_by = u2.id
        ${whereClause}
          AND (
            c.status != 'cancelled' 
            OR c.id IN (
              SELECT id FROM contracts 
              WHERE status = 'cancelled' 
              ORDER BY updated_at DESC 
              LIMIT 5
            )
          )
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
    }
    
    bindings.push(limit, offset);
    const result = await c.env.DB
      .prepare(query)
      .bind(...bindings)
      .all();

    return c.json({
      contracts: result.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contracts error:', error);
    return c.json({ error: '계약현황 목록을 불러올 수 없습니다.' }, 500);
  }
});

/**
 * GET /api/contracts/:id
 * 계약현황 상세 조회
 */
contracts.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    const contract = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM contracts c
        LEFT JOIN users u1 ON c.created_by = u1.id
        LEFT JOIN users u2 ON c.updated_by = u2.id
        WHERE c.id = ?
      `)
      .bind(id)
      .first();

    if (!contract) {
      return c.json({ error: '계약 정보를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ contract });
  } catch (error) {
    console.error('Get contract error:', error);
    return c.json({ error: '계약 정보를 불러올 수 없습니다.' }, 500);
  }
});

/**
 * POST /api/contracts
 * 계약현황 등록
 */
contracts.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { consultation_id, customer_name, phone, inflow_source, notes } = await c.req.json();

    if (!phone) {
      return c.json({ error: '전화번호는 필수입니다.' }, 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO contracts 
        (consultation_id, customer_name, phone, inflow_source, notes, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'waiting')
      `)
      .bind(consultation_id || null, customer_name || '', phone, inflow_source || '', notes || '', user.id)
      .run();

    return c.json({
      success: true,
      id: result.meta.last_row_id
    });
  } catch (error) {
    console.error('Create contract error:', error);
    return c.json({ error: '계약 등록 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * POST /api/contracts/migrate
 * 상담현황에서 계약현황으로 일괄 이관
 */
contracts.post('/migrate', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { consultation_ids } = await c.req.json<{ consultation_ids: number[] }>();

    if (!consultation_ids || !Array.isArray(consultation_ids) || consultation_ids.length === 0) {
      return c.json({ error: '이관할 상담이 없습니다.' }, 400);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const consultationId of consultation_ids) {
      try {
        // 상담 정보 조회
        const consultation = await c.env.DB
          .prepare('SELECT * FROM consultations WHERE id = ? AND status = ? AND migrated_to_contract = 0')
          .bind(consultationId, 'completed')
          .first();

        if (!consultation) {
          errorCount++;
          errors.push(`상담 ID ${consultationId}: 계약확정 상태가 아니거나 이미 이관되었습니다.`);
          continue;
        }

        // 계약현황에 등록
        await c.env.DB
          .prepare(`
            INSERT INTO contracts 
            (consultation_id, customer_name, phone, inflow_source, notes, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?, 'waiting')
          `)
          .bind(
            consultationId,
            consultation.customer_name || '',
            consultation.phone,
            consultation.inflow_source || '',
            consultation.notes || '',
            user.id
          )
          .run();

        // 상담현황에 이관 플래그 설정
        await c.env.DB
          .prepare(`
            UPDATE consultations 
            SET migrated_to_contract = 1, migrated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(consultationId)
          .run();

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`상담 ID ${consultationId}: ${error.message}`);
        console.error(`Migrate consultation ${consultationId} error:`, error);
      }
    }

    // 모두 실패한 경우 400 에러 반환
    if (successCount === 0 && errorCount > 0) {
      return c.json({
        success: false,
        error: '모든 이관이 실패했습니다.',
        successCount: 0,
        errorCount,
        errors: errors.slice(0, 10)
      }, 400);
    }

    return c.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Migrate contracts error:', error);
    return c.json({ error: '계약 이관 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/contracts/:id
 * 계약현황 수정
 */
contracts.put('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { customer_name, phone, inflow_source, notes, status, pre_installation } = await c.req.json();

    if (!phone) {
      return c.json({ error: '전화번호는 필수입니다.' }, 400);
    }

    await c.env.DB
      .prepare(`
        UPDATE contracts 
        SET customer_name = ?, phone = ?, inflow_source = ?, notes = ?,
            status = ?, pre_installation = ?,
            updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        customer_name || '',
        phone,
        inflow_source || '',
        notes || '',
        status || 'waiting',
        pre_installation ? 1 : 0,
        user.id,
        id
      )
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update contract error:', error);
    return c.json({ error: '계약 수정 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/contracts/:id/status
 * 상태 변경 (드래그앤드롭용)
 */
contracts.put('/:id/status', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: '상태 값이 필요합니다.' }, 400);
    }

    await c.env.DB
      .prepare(`
        UPDATE contracts 
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
 * GET /api/contracts/stats/completed
 * 계약완료 및 선설치 건수 조회 (설치이관용)
 * - 계약완료(status='completed') 건
 * - 선설치(pre_installation=1) 건
 */
contracts.get('/stats/completed', requireAuth, async (c) => {
  try {
    // 전체 건수
    const totalResult = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as count,
          GROUP_CONCAT(id) as ids
        FROM contracts
        WHERE (
          status = 'completed' 
          OR pre_installation = 1
        )
        AND (migrated_to_installation = 0 OR migrated_to_installation IS NULL)
      `)
      .first<{ count: number; ids: string }>();

    // 계약완료 건수
    const completedResult = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count
        FROM contracts
        WHERE status = 'completed'
        AND (migrated_to_installation = 0 OR migrated_to_installation IS NULL)
      `)
      .first<{ count: number }>();

    // 선설치 건수
    const preInstallResult = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count
        FROM contracts
        WHERE pre_installation = 1
        AND (migrated_to_installation = 0 OR migrated_to_installation IS NULL)
      `)
      .first<{ count: number }>();

    const count = totalResult?.count || 0;
    const ids = totalResult?.ids 
      ? totalResult.ids.split(',').map((id: string) => parseInt(id.trim(), 10)) 
      : [];
    const completedCount = completedResult?.count || 0;
    const preInstallCount = preInstallResult?.count || 0;

    return c.json({ 
      count, 
      ids, 
      completedCount, 
      preInstallCount 
    });
  } catch (error) {
    console.error('Get completed stats error:', error);
    return c.json({ error: '통계를 불러올 수 없습니다.' }, 500);
  }
});

/**
 * DELETE /api/contracts/:id
 * 계약현황 삭제
 */
contracts.delete('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB
      .prepare('DELETE FROM contracts WHERE id = ?')
      .bind(id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete contract error:', error);
    return c.json({ error: '계약 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default contracts;
