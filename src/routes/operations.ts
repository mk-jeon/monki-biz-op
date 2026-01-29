import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth } from '../middleware/auth';

const operations = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 운영등재 목록 조회
operations.get('/', requireAuth, async (c) => {
  try {
    const { page = '1', limit = '1000' } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM operations
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
      LIMIT ? OFFSET ?
    `).bind(limitNum, offset).all();

    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM operations'
    ).first<{ total: number }>();

    return c.json({
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Operations list error:', error);
    return c.json({ error: '운영등재 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 운영등재 상세 조회
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

// 운영등재 등록
operations.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    const result = await c.env.DB.prepare(`
      INSERT INTO operations (
        installation_id, customer_name, phone, status, memo,
        created_by, created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.installation_id || null,
      data.customer_name,
      data.phone || '',
      data.status || 'contract_pending',
      data.memo || '',
      user.id,
      user.name
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error('Create operation error:', error);
    return c.json({ error: '운영등재 등록 중 오류가 발생했습니다.' }, 500);
  }
});

// 설치현황에서 운영등재로 이관
operations.post('/migrate', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { installation_ids } = await c.req.json();

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const installId of installation_ids) {
      try {
        const install = await c.env.DB.prepare(
          'SELECT * FROM installations WHERE id = ?'
        ).bind(installId).first();

        if (!install) {
          errorCount++;
          errors.push(`설치 ID ${installId}: 존재하지 않음`);
          continue;
        }

        await c.env.DB.prepare(`
          INSERT INTO operations (
            installation_id, customer_name, phone, status,
            created_by, created_by_name
          ) VALUES (?, ?, ?, 'contract_pending', ?, ?)
        `).bind(
          install.id,
          install.customer_name,
          install.phone,
          user.id,
          user.name
        ).run();

        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`설치 ID ${installId}: ${err.message}`);
      }
    }

    return c.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Migrate to operations error:', error);
    return c.json({ error: '운영이관 중 오류가 발생했습니다.' }, 500);
  }
});

// 상태 변경 (드래그앤드롭용)
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

    // 운영등재완료 시 가맹점현황으로 자동 이관
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

// 운영등재 삭제
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
