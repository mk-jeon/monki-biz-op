import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireAuth, requireRole } from '../middleware/auth';
import { hashPassword } from '../lib/auth';

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 사용자 목록 조회
users.get('/', requireAuth, requireRole(['master', 'admin']), async (c) => {
  try {
    const { page = '1', limit = '1000' } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { results } = await c.env.DB.prepare(`
      SELECT id, username, name, nickname, phone, department, position, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limitNum, offset).all();

    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM users'
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
    console.error('Users list error:', error);
    return c.json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 사용자 상세 조회
users.get('/:id', requireAuth, requireRole(['master', 'admin']), async (c) => {
  try {
    const id = c.req.param('id');
    const user = await c.env.DB.prepare(`
      SELECT id, username, name, nickname, phone, department, position, role, created_at
      FROM users
      WHERE id = ?
    `).bind(id).first();

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ data: user });
  } catch (error) {
    console.error('User detail error:', error);
    return c.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 사용자 등록
users.post('/', requireAuth, requireRole(['master', 'admin']), async (c) => {
  try {
    const data = await c.req.json();

    // 필수 필드 확인
    if (!data.username || !data.password || !data.name) {
      return c.json({ error: '아이디, 비밀번호, 이름은 필수입니다.' }, 400);
    }

    // 비밀번호 길이 확인
    if (data.password.length < 8) {
      return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400);
    }

    // 아이디 중복 확인
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(data.username).first();

    if (existingUser) {
      return c.json({ error: '이미 존재하는 아이디입니다.' }, 400);
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(data.password);

    // 사용자 생성
    const result = await c.env.DB.prepare(`
      INSERT INTO users (
        username, password, name, nickname, phone, department, position, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.username,
      hashedPassword,
      data.name,
      data.nickname || '',
      data.phone || '',
      data.department || '',
      data.position || '',
      data.role || 'user'
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: '사용자 등록 중 오류가 발생했습니다.' }, 500);
  }
});

// 사용자 수정
users.put('/:id', requireAuth, requireRole(['master', 'admin']), async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const currentUser = c.get('user');

    // 본인이 아닌 경우 권한 확인
    if (parseInt(id) !== currentUser.id && currentUser.role !== 'master') {
      return c.json({ error: '권한이 없습니다.' }, 403);
    }

    // 수정할 사용자 조회
    const targetUser = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).bind(id).first<{ role: string }>();

    if (!targetUser) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 마스터 계정은 마스터만 수정 가능
    if (targetUser.role === 'master' && currentUser.role !== 'master') {
      return c.json({ error: '마스터 계정은 수정할 수 없습니다.' }, 403);
    }

    const fields = [];
    const bindings = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      bindings.push(data.name);
    }

    if (data.nickname !== undefined) {
      fields.push('nickname = ?');
      bindings.push(data.nickname || '');
    }

    if (data.phone !== undefined) {
      fields.push('phone = ?');
      bindings.push(data.phone || '');
    }

    if (data.department !== undefined) {
      fields.push('department = ?');
      bindings.push(data.department || '');
    }

    if (data.position !== undefined) {
      fields.push('position = ?');
      bindings.push(data.position || '');
    }

    if (data.role !== undefined && currentUser.role === 'master') {
      fields.push('role = ?');
      bindings.push(data.role);
    }

    if (data.newPassword) {
      if (data.newPassword.length < 8) {
        return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400);
      }
      const hashedPassword = await hashPassword(data.newPassword);
      fields.push('password = ?');
      bindings.push(hashedPassword);
    }

    if (fields.length === 0) {
      return c.json({ error: '수정할 내용이 없습니다.' }, 400);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(id);

    await c.env.DB.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();

    const updatedUser = await c.env.DB.prepare(`
      SELECT id, username, name, nickname, phone, department, position, role, created_at
      FROM users
      WHERE id = ?
    `).bind(id).first();

    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: '사용자 수정 중 오류가 발생했습니다.' }, 500);
  }
});

// 사용자 삭제
users.delete('/:id', requireAuth, requireRole(['master']), async (c) => {
  try {
    const id = c.req.param('id');

    // 삭제할 사용자 조회
    const targetUser = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).bind(id).first<{ role: string }>();

    if (!targetUser) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 마스터 계정은 삭제 불가
    if (targetUser.role === 'master') {
      return c.json({ error: '마스터 계정은 삭제할 수 없습니다.' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: '사용자 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default users;
