import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import { requireAuth } from '../middleware/auth'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 모든 API는 인증 필요
app.use('*', requireAuth)

// 카테고리 목록 조회 (페이지별)
app.get('/categories', async (c) => {
  try {
    const page = c.req.query('page') // consultation, contract, installation, common

    let query = `
      SELECT id, name, label, page, description, sort_order, created_at
      FROM item_categories
    `
    const params: string[] = []

    if (page) {
      query += ` WHERE page = ?`
      params.push(page)
    }

    query += ` ORDER BY page, sort_order, id`

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ categories: results })
  } catch (error) {
    console.error('카테고리 조회 오류:', error)
    return c.json({ error: '카테고리 조회에 실패했습니다.' }, 500)
  }
})

// 특정 카테고리의 항목 조회
app.get('/categories/:id/values', async (c) => {
  try {
    const categoryId = c.req.param('id')

    const { results } = await c.env.DB.prepare(`
      SELECT id, category_id, value, label, sort_order, is_active, created_at
      FROM item_values
      WHERE category_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `).bind(categoryId).all()

    return c.json({ values: results })
  } catch (error) {
    console.error('항목 조회 오류:', error)
    return c.json({ error: '항목 조회에 실패했습니다.' }, 500)
  }
})

// 카테고리명으로 항목 조회 (드롭다운용)
app.get('/values/:categoryName', async (c) => {
  try {
    const categoryName = c.req.param('categoryName')

    const { results } = await c.env.DB.prepare(`
      SELECT iv.id, iv.value, iv.label, iv.sort_order
      FROM item_values iv
      JOIN item_categories ic ON iv.category_id = ic.id
      WHERE ic.name = ? AND iv.is_active = 1
      ORDER BY iv.sort_order, iv.id
    `).bind(categoryName).all()

    return c.json({ values: results })
  } catch (error) {
    console.error('항목 조회 오류:', error)
    return c.json({ error: '항목 조회에 실패했습니다.' }, 500)
  }
})

// 항목 추가 (마스터/관리자만)
app.post('/values', async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'master' && user.role !== 'admin') {
      return c.json({ error: '권한이 없습니다.' }, 403)
    }

    const { category_id, value, label, sort_order = 0 } = await c.req.json()

    if (!category_id || !value || !label) {
      return c.json({ error: '필수 항목을 입력해주세요.' }, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO item_values (category_id, value, label, sort_order)
      VALUES (?, ?, ?, ?)
    `).bind(category_id, value, label, sort_order).run()

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: '항목이 추가되었습니다.' 
    })
  } catch (error) {
    console.error('항목 추가 오류:', error)
    return c.json({ error: '항목 추가에 실패했습니다.' }, 500)
  }
})

// 항목 수정 (마스터/관리자만)
app.put('/values/:id', async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'master' && user.role !== 'admin') {
      return c.json({ error: '권한이 없습니다.' }, 403)
    }

    const id = c.req.param('id')
    const { value, label, sort_order, is_active } = await c.req.json()

    const updates: string[] = []
    const bindings: any[] = []

    if (value !== undefined) {
      updates.push('value = ?')
      bindings.push(value)
    }
    if (label !== undefined) {
      updates.push('label = ?')
      bindings.push(label)
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?')
      bindings.push(sort_order)
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?')
      bindings.push(is_active ? 1 : 0)
    }

    if (updates.length === 0) {
      return c.json({ error: '수정할 내용이 없습니다.' }, 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    bindings.push(id)

    await c.env.DB.prepare(`
      UPDATE item_values
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run()

    return c.json({ success: true, message: '항목이 수정되었습니다.' })
  } catch (error) {
    console.error('항목 수정 오류:', error)
    return c.json({ error: '항목 수정에 실패했습니다.' }, 500)
  }
})

// 항목 삭제 (마스터만, 실제로는 비활성화)
app.delete('/values/:id', async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'master') {
      return c.json({ error: '권한이 없습니다.' }, 403)
    }

    const id = c.req.param('id')

    // 실제 삭제 대신 비활성화
    await c.env.DB.prepare(`
      UPDATE item_values
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run()

    return c.json({ success: true, message: '항목이 삭제되었습니다.' })
  } catch (error) {
    console.error('항목 삭제 오류:', error)
    return c.json({ error: '항목 삭제에 실패했습니다.' }, 500)
  }
})

export default app
