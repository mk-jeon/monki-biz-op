import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth } from '../middleware/auth';

const consultations = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/consultations
 * 상담현황 목록 조회
 */
consultations.get('/', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const status = c.req.query('status') || '';
    const showAll = c.req.query('show_all') === 'true'; // 통계용: 이관 건 포함
    const offset = (page - 1) * limit;

    // WHERE 조건: 기본적으로 미이관 건만 표시
    let whereClause = 'WHERE c.migrated_to_contract = 0';
    const bindings = [];
    
    // 통계용 조회 시 이관 건 포함
    if (showAll) {
      whereClause = '';
    }
    
    if (status) {
      whereClause += (whereClause ? ' AND' : 'WHERE') + ' c.status = ?';
      bindings.push(status);
    }

    // 전체 개수
    const countQuery = `SELECT COUNT(*) as count FROM consultations c ${whereClause}`;
    const countResult = await c.env.DB
      .prepare(countQuery)
      .bind(...bindings)
      .first<{ count: number }>();
    
    const total = countResult?.count || 0;

    // 목록 조회
    const query = `
      SELECT 
        c.*,
        u1.name as created_by_name,
        u2.name as updated_by_name
      FROM consultations c
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    bindings.push(limit, offset);
    const result = await c.env.DB
      .prepare(query)
      .bind(...bindings)
      .all();

    return c.json({
      consultations: result.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    return c.json({ error: '상담현황 목록을 불러올 수 없습니다.' }, 500);
  }
});

/**
 * GET /api/consultations/:id
 * 상담현황 상세 조회
 */
consultations.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    const consultation = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          u1.name as created_by_name,
          u2.name as updated_by_name
        FROM consultations c
        LEFT JOIN users u1 ON c.created_by = u1.id
        LEFT JOIN users u2 ON c.updated_by = u2.id
        WHERE c.id = ?
      `)
      .bind(id)
      .first();

    if (!consultation) {
      return c.json({ error: '상담 정보를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ consultation });
  } catch (error) {
    console.error('Get consultation error:', error);
    return c.json({ error: '상담 정보를 불러올 수 없습니다.' }, 500);
  }
});

/**
 * POST /api/consultations
 * 상담현황 등록
 */
consultations.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { customer_name, phone, inflow_source, notes } = await c.req.json();

    if (!phone) {
      return c.json({ error: '전화번호는 필수입니다.' }, 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO consultations 
        (customer_name, phone, inflow_source, notes, created_by, status)
        VALUES (?, ?, ?, ?, ?, 'waiting')
      `)
      .bind(customer_name || '', phone, inflow_source || '', notes || '', user.id)
      .run();

    return c.json({
      success: true,
      id: result.meta.last_row_id
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    return c.json({ error: '상담 등록 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * POST /api/consultations/bulk
 * 엑셀 일괄 업로드
 */
consultations.post('/bulk', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { data } = await c.req.json<{ data: any[] }>();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return c.json({ error: '업로드할 데이터가 없습니다.' }, 400);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row.phone) {
        errorCount++;
        errors.push(`${i + 1}번째 행: 전화번호 누락`);
        continue;
      }

      try {
        await c.env.DB
          .prepare(`
            INSERT INTO consultations 
            (customer_name, phone, inflow_source, notes, created_by, status)
            VALUES (?, ?, ?, ?, ?, 'waiting')
          `)
          .bind(
            row.customer_name || '',
            row.phone,
            row.inflow_source || '',
            row.notes || '',
            user.id
          )
          .run();
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`${i + 1}번째 행: ${error.message}`);
      }
    }

    return c.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // 최대 10개까지만 반환
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return c.json({ error: '일괄 업로드 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/consultations/:id
 * 상담현황 수정
 */
consultations.put('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { customer_name, phone, inflow_source, notes, status, is_visit_consultation, has_quotation } = await c.req.json();

    if (!phone) {
      return c.json({ error: '전화번호는 필수입니다.' }, 400);
    }

    await c.env.DB
      .prepare(`
        UPDATE consultations 
        SET customer_name = ?, phone = ?, inflow_source = ?, notes = ?,
            status = ?, is_visit_consultation = ?, has_quotation = ?,
            updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        customer_name || '',
        phone,
        inflow_source || '',
        notes || '',
        status || 'waiting',
        is_visit_consultation ? 1 : 0,
        has_quotation ? 1 : 0,
        user.id,
        id
      )
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update consultation error:', error);
    return c.json({ error: '상담 수정 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/consultations/:id/status
 * 상태 변경 (드래그앤드롭용)
 */
consultations.put('/:id/status', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: '상태 값이 필요합니다.' }, 400);
    }

    await c.env.DB
      .prepare(`
        UPDATE consultations 
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
 * DELETE /api/consultations/:id
 * 상담현황 삭제
 */
consultations.delete('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB
      .prepare('DELETE FROM consultations WHERE id = ?')
      .bind(id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete consultation error:', error);
    return c.json({ error: '상담 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * GET /api/consultations/categories/:type
 * 항목 목록 조회 (유입경로 등)
 */
consultations.get('/categories/:type', requireAuth, async (c) => {
  try {
    const type = c.req.param('type');

    const result = await c.env.DB
      .prepare(`
        SELECT * FROM item_categories
        WHERE category_type = ? AND is_active = 1
        ORDER BY display_order, id
      `)
      .bind(type)
      .all();

    return c.json({ items: result.results || [] });
  } catch (error) {
    console.error('Get categories error:', error);
    return c.json({ error: '항목을 불러올 수 없습니다.' }, 500);
  }
});

/**
 * GET /api/consultations/stats/completed
 * 계약확정 상태 건수 조회 (미이관 건만)
 */
consultations.get('/stats/completed', requireAuth, async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as count,
          GROUP_CONCAT(id) as ids
        FROM consultations 
        WHERE status = 'completed'
          AND (migrated_to_contract = 0 OR migrated_to_contract IS NULL)
      `)
      .first<{ count: number; ids: string }>();

    const count = result?.count || 0;
    const ids = result?.ids ? result.ids.split(',').map(id => parseInt(id)) : [];

    return c.json({ count, ids });
  } catch (error) {
    console.error('Get completed stats error:', error);
    return c.json({ error: '통계를 불러올 수 없습니다.' }, 500);
  }
});

export default consultations;
