import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authenticateUser, createSession, setSessionCookie, clearSessionCookie, deleteSession, getSessionIdFromCookie } from '../lib/auth';
import { requireAuth } from '../middleware/auth';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * POST /api/auth/login
 * 로그인
 */
auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: '아이디와 비밀번호를 입력해주세요.' }, 400);
    }

    const user = await authenticateUser(c.env.DB, username, password);

    if (!user) {
      return c.json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' }, 401);
    }

    // 세션 생성
    const sessionId = await createSession(c.env.DB, user.id);

    // 쿠키 설정
    c.header('Set-Cookie', setSessionCookie(sessionId));

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * POST /api/auth/logout
 * 로그아웃
 */
auth.post('/logout', requireAuth, async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie');
    const sessionId = getSessionIdFromCookie(cookieHeader);

    if (sessionId) {
      await deleteSession(c.env.DB, sessionId);
    }

    c.header('Set-Cookie', clearSessionCookie());

    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: '로그아웃 처리 중 오류가 발생했습니다.' }, 500);
  }
});

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보
 */
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user');

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      nickname: user.nickname,
      phone: user.phone,
      department: user.department,
      position: user.position
    }
  });
});

/**
 * PUT /api/auth/profile
 * 프로필 수정
 */
auth.put('/profile', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    // 업데이트할 필드 준비
    const fields: string[] = [];
    const bindings: any[] = [];

    // 이름 (한글)
    if (data.name !== undefined && data.name !== null) {
      fields.push('name = ?');
      bindings.push(data.name);
    }

    // 닉네임 (영문)
    if (data.nickname !== undefined && data.nickname !== null) {
      fields.push('nickname = ?');
      bindings.push(data.nickname);
    }

    // 연락처
    if (data.phone !== undefined && data.phone !== null) {
      fields.push('phone = ?');
      bindings.push(data.phone);
    }

    // 부서명
    if (data.department !== undefined && data.department !== null) {
      fields.push('department = ?');
      bindings.push(data.department);
    }

    // 직책
    if (data.position !== undefined && data.position !== null) {
      fields.push('position = ?');
      bindings.push(data.position);
    }

    // 비밀번호 변경 (새 비밀번호와 확인이 일치하는 경우)
    if (data.newPassword && data.confirmPassword) {
      if (data.newPassword !== data.confirmPassword) {
        return c.json({ error: '새 비밀번호가 일치하지 않습니다.' }, 400);
      }

      // bcrypt로 해시
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      
      fields.push('password = ?');
      bindings.push(hashedPassword);
    }

    if (fields.length === 0) {
      return c.json({ error: '수정할 내용이 없습니다.' }, 400);
    }

    // updated_at 추가
    fields.push('updated_at = CURRENT_TIMESTAMP');

    // SQL 실행
    bindings.push(user.id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    await c.env.DB.prepare(sql).bind(...bindings).run();

    // 업데이트된 사용자 정보 조회
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, username, name, nickname, phone, department, position, role FROM users WHERE id = ?'
    ).bind(user.id).first();

    return c.json({ 
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ error: '프로필 수정 중 오류가 발생했습니다.' }, 500);
  }
});

export default auth;
