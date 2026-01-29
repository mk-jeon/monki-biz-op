import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth } from '../middleware/auth';

const notices = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/notices
 * 공지사항 목록 조회
 */
notices.get('/', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    // 전체 개수
    const countResult = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM notices')
      .first<{ count: number }>();
    
    const total = countResult?.count || 0;

    // 목록 조회 (고정 공지 + 일반 공지)
    const result = await c.env.DB
      .prepare(`
        SELECT 
          n.*,
          u.name as author_name
        FROM notices n
        LEFT JOIN users u ON n.author_id = u.id
        ORDER BY n.is_pinned DESC, n.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all();

    return c.json({
      notices: result.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notices error:', error);
    return c.json({ error: '공지사항 목록을 불러올 수 없습니다.' }, 500);
  }
});

/**
 * GET /api/notices/:id
 * 공지사항 상세 조회
 */
notices.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');

    // 조회수 증가
    await c.env.DB
      .prepare('UPDATE notices SET views = views + 1 WHERE id = ?')
      .bind(id)
      .run();

    // 공지사항 조회
    const notice = await c.env.DB
      .prepare(`
        SELECT 
          n.*,
          u.name as author_name
        FROM notices n
        LEFT JOIN users u ON n.author_id = u.id
        WHERE n.id = ?
      `)
      .bind(id)
      .first();

    if (!notice) {
      return c.json({ error: '공지사항을 찾을 수 없습니다.' }, 404);
    }

    return c.json({ notice });
  } catch (error) {
    console.error('Get notice error:', error);
    return c.json({ error: '공지사항을 불러올 수 없습니다.' }, 500);
  }
});

/**
 * POST /api/notices
 * 공지사항 작성
 */
notices.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { title, content, is_pinned } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: '제목과 내용을 입력해주세요.' }, 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO notices (title, content, author_id, is_pinned)
        VALUES (?, ?, ?, ?)
      `)
      .bind(title, content, user.id, is_pinned ? 1 : 0)
      .run();

    return c.json({
      success: true,
      id: result.meta.last_row_id
    });
  } catch (error) {
    console.error('Create notice error:', error);
    return c.json({ error: '공지사항 작성 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * PUT /api/notices/:id
 * 공지사항 수정
 */
notices.put('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { title, content, is_pinned } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: '제목과 내용을 입력해주세요.' }, 400);
    }

    // 작성자 확인
    const notice = await c.env.DB
      .prepare('SELECT author_id FROM notices WHERE id = ?')
      .bind(id)
      .first<{ author_id: number }>();

    if (!notice) {
      return c.json({ error: '공지사항을 찾을 수 없습니다.' }, 404);
    }

    // 작성자 또는 관리자만 수정 가능
    if (notice.author_id !== user.id && !['master', 'admin'].includes(user.role)) {
      return c.json({ error: '수정 권한이 없습니다.' }, 403);
    }

    await c.env.DB
      .prepare(`
        UPDATE notices 
        SET title = ?, content = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(title, content, is_pinned ? 1 : 0, id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update notice error:', error);
    return c.json({ error: '공지사항 수정 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * DELETE /api/notices/:id
 * 공지사항 삭제
 */
notices.delete('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    // 작성자 확인
    const notice = await c.env.DB
      .prepare('SELECT author_id FROM notices WHERE id = ?')
      .bind(id)
      .first<{ author_id: number }>();

    if (!notice) {
      return c.json({ error: '공지사항을 찾을 수 없습니다.' }, 404);
    }

    // 작성자 또는 관리자만 삭제 가능
    if (notice.author_id !== user.id && !['master', 'admin'].includes(user.role)) {
      return c.json({ error: '삭제 권한이 없습니다.' }, 403);
    }

    await c.env.DB
      .prepare('DELETE FROM notices WHERE id = ?')
      .bind(id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete notice error:', error);
    return c.json({ error: '공지사항 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default notices;
