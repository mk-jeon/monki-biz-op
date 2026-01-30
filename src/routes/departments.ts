import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 부서 목록 조회
app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, created_at
      FROM departments
      ORDER BY id ASC
    `).all()

    return c.json({ departments: results })
  } catch (error) {
    console.error('부서 목록 조회 오류:', error)
    return c.json({ error: '부서 목록 조회에 실패했습니다.' }, 500)
  }
})

export default app
