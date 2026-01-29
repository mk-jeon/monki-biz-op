import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth } from '../middleware/auth';

const operations = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/operations
 * 운영등재 목록 조회 (페이징, 필터링)
 */
operations.get('/', requireAuth, async (c) => {
  try {
    const { page = '1', limit = '50', status, search } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = [];
    let params: any[] = [];

    // 상태 필터
    if (status && status !== 'all') {
      whereConditions.push('status = ?');
      params.push(status);
    }

    // 검색
    if (search) {
      whereConditions.push('(customer_name LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // 총 개수 조회
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM operations ${whereClause}`
    ).bind(...params).first<{ total: number }>();

    const total = countResult?.total || 0;

    // 데이터 조회
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM operations ${whereClause} 
       ORDER BY 
         CASE status
           WHEN 'contract_pending' THEN 1
           WHEN 'install_cert_pending' THEN 2
           WHEN 'install_photo_pending' THEN 3
           WHEN 'drive_upload_pending' THEN 4
           WHEN 'completed' THEN 5
           WHEN 'cancelled' THEN 6
         END,
         created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limitNum, offset).all();

    return c.json({
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Operations list error:', error);
    return c.json({ error: '운영등재 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * GET /api/operations/:id
 * 운영등재 상세 조회
 */
operations.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const operation = await c.env.DB.prepare(
      'SELECT * FROM operations WHERE id = ?'
    ).bind(id).first();

    if (!operation) {
      return c.json({ error: '운영등재를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ data: operation });
  } catch (error) {
    console.error('Operation detail error:', error);
    return c.json({ error: '운영등재 조회 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * POST /api/operations
 * 운영등재 등록
 */
operations.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    const result = await c.env.DB.prepare(`
      INSERT INTO operations (
        contract_id, customer_name, phone, status, memo,
        created_by, created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.contract_id || null,
      data.customer_name,
      data.phone,
      data.status || 'contract_pending',
      data.memo || '',
      user.id,
      user.name
    ).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('Create operation error:', error);
    return c.json({ error: '운영등재 등록 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/operations/:id
 * 운영등재 수정
 */
operations.put('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE operations SET
        customer_name = ?,
        phone = ?,
        status = ?,
        contract_document_url = ?,
        install_certificate_url = ?,
        install_photo_url = ?,
        drive_url = ?,
        memo = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?,
        updated_by_name = ?
      WHERE id = ?
    `).bind(
      data.customer_name,
      data.phone,
      data.status,
      data.contract_document_url || null,
      data.install_certificate_url || null,
      data.install_photo_url || null,
      data.drive_url || null,
      data.memo || '',
      user.id,
      user.name,
      id
    ).run();

    // 운영등재 완료 시 가맹점현황으로 자동 이관
    if (data.status === 'completed') {
      // 기존 운영등재 데이터 조회
      const operation = await c.env.DB.prepare(
        'SELECT * FROM operations WHERE id = ?'
      ).bind(id).first();

      if (operation) {
        // 가맹점현황 테이블에 삽입 (franchises 테이블이 있다고 가정)
        await c.env.DB.prepare(`
          INSERT INTO franchises (
            operation_id, customer_name, phone, status,
            created_by, created_by_name
          ) VALUES (?, ?, ?, 'active', ?, ?)
        `).bind(
          operation.id,
          operation.customer_name,
          operation.phone,
          user.id,
          user.name
        ).run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Update operation error:', error);
    return c.json({ error: '운영등재 수정 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PATCH /api/operations/:id/status
 * 운영등재 상태 변경
 */
operations.patch('/:id/status', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE operations SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?,
        updated_by_name = ?
      WHERE id = ?
    `).bind(status, user.id, user.name, id).run();

    // 운영등재 완료 시 가맹점현황으로 자동 이관
    if (status === 'completed') {
      const operation = await c.env.DB.prepare(
        'SELECT * FROM operations WHERE id = ?'
      ).bind(id).first();

      if (operation) {
        await c.env.DB.prepare(`
          INSERT INTO franchises (
            operation_id, customer_name, phone, status,
            created_by, created_by_name
          ) VALUES (?, ?, ?, 'active', ?, ?)
        `).bind(
          operation.id,
          operation.customer_name,
          operation.phone,
          user.id,
          user.name
        ).run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Update operation status error:', error);
    return c.json({ error: '상태 변경 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * DELETE /api/operations/:id
 * 운영등재 삭제
 */
operations.delete('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(
      'DELETE FROM operations WHERE id = ?'
    ).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete operation error:', error);
    return c.json({ error: '운영등재 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default operations;
