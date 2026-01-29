import bcrypt from 'bcryptjs';
import type { Context } from 'hono';
import type { Bindings, User, Session, Variables } from '../types';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 세션 ID 생성
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * 세션 생성
 */
export async function createSession(
  db: D1Database,
  userId: number
): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db
    .prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    )
    .bind(sessionId, userId, expiresAt.toISOString())
    .run();

  return sessionId;
}

/**
 * 세션 조회
 */
export async function getSession(
  db: D1Database,
  sessionId: string
): Promise<Session | null> {
  const result = await db
    .prepare(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
    )
    .bind(sessionId)
    .first<Session>();

  return result;
}

/**
 * 세션 삭제
 */
export async function deleteSession(
  db: D1Database,
  sessionId: string
): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

/**
 * 사용자 조회
 */
export async function getUserById(
  db: D1Database,
  userId: number
): Promise<User | null> {
  const result = await db
    .prepare('SELECT id, username, name, nickname, phone, department, position, role, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first<User>();

  return result;
}

/**
 * 사용자 인증
 */
export async function authenticateUser(
  db: D1Database,
  username: string,
  password: string
): Promise<User | null> {
  const user = await db
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first<User & { password: string }>();

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // 비밀번호 제외하고 반환
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * 쿠키에서 세션 ID 가져오기
 */
export function getSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith('session='));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1];
}

/**
 * 세션 쿠키 설정
 */
export function setSessionCookie(sessionId: string): string {
  const maxAge = SESSION_DURATION / 1000; // seconds
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * 세션 쿠키 삭제
 */
export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
