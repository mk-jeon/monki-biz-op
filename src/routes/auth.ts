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
      role: user.role
    }
  });
});

export default auth;
