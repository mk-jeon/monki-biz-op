import { createMiddleware } from 'hono/factory';
import type { Bindings, Variables } from '../types';
import { getSessionIdFromCookie, getSession, getUserById } from '../lib/auth';

/**
 * 인증 미들웨어 - 세션 확인 및 사용자 정보 로드
 */
export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const cookieHeader = c.req.header('Cookie');
    const sessionId = getSessionIdFromCookie(cookieHeader);

    if (sessionId) {
      const session = await getSession(c.env.DB, sessionId);
      if (session) {
        const user = await getUserById(c.env.DB, session.user_id);
        if (user) {
          c.set('user', user);
          c.set('session', session);
        }
      }
    }

    await next();
  }
);

/**
 * 로그인 필수 미들웨어
 */
export const requireAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  }
);

/**
 * 역할 기반 접근 제어 미들웨어
 */
export const requireRole = (allowedRoles: string[]) => {
  return createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
    async (c, next) => {
      const user = c.get('user');

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!allowedRoles.includes(user.role)) {
        return c.json({ error: 'Forbidden' }, 403);
      }

      await next();
    }
  );
};
