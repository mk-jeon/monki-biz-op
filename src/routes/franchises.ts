import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import type { Bindings, Variables } from '../types';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 모든 라우트에 인증 미들웨어 적용
app.use('*', requireAuth);

// 가맹점 목록 조회 (페이징, 필터링, 검색)
app.get('/', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  const search = c.req.query('search') || '';
  const status = c.req.query('status') || '';
  const region = c.req.query('region') || '';

  try {
    let whereConditions = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push(
        `(franchise_name LIKE ? OR business_number LIKE ? OR representative LIKE ? OR contact LIKE ?)`
      );
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      whereConditions.push('operation_status = ?');
      params.push(status);
    }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 전체 개수
    const countQuery = `SELECT COUNT(*) as total FROM franchises ${whereClause}`;
    const countStmt = env.DB.prepare(countQuery);
    if (params.length > 0) {
      countStmt.bind(...params);
    }
    const countResult = await countStmt.first<{ total: number }>();
    const total = countResult?.total || 0;

    // 목록 조회
    const listQuery = `
      SELECT 
        id, franchise_name, business_number, representative, contact, 
        operation_status, region, district, contract_date, installation_date,
        termination_date, rental_company, model_name
      FROM franchises 
      ${whereClause}
      ORDER BY contract_date DESC
      LIMIT ? OFFSET ?
    `;
    const listStmt = env.DB.prepare(listQuery);
    const listParams = [...params, limit, offset];
    const { results } = await listStmt.bind(...listParams).all();

    return c.json({
      franchises: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('가맹점 목록 조회 오류:', error);
    return c.json({ error: '가맹점 목록 조회에 실패했습니다.' }, 500);
  }
});

// 가맹점 상세 조회
app.get('/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');

  try {
    const stmt = env.DB.prepare('SELECT * FROM franchises WHERE id = ?');
    const franchise = await stmt.bind(id).first();

    if (!franchise) {
      return c.json({ error: '가맹점을 찾을 수 없습니다.' }, 404);
    }

    return c.json({ franchise });
  } catch (error) {
    console.error('가맹점 상세 조회 오류:', error);
    return c.json({ error: '가맹점 조회에 실패했습니다.' }, 500);
  }
});

// 가맹점 통계 (대시보드용)
app.get('/stats/summary', async (c) => {
  const { env } = c;

  try {
    // 전체 가맹점 수
    const totalResult = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM franchises'
    ).first<{ total: number }>();

    // 운영 중
    const activeResult = await env.DB.prepare(
      "SELECT COUNT(*) as active FROM franchises WHERE operation_status = 'active'"
    ).first<{ active: number }>();

    // 해지
    const terminatedResult = await env.DB.prepare(
      "SELECT COUNT(*) as terminated FROM franchises WHERE operation_status = 'terminated'"
    ).first<{ terminated: number }>();

    // 일시중지
    const suspendedResult = await env.DB.prepare(
      "SELECT COUNT(*) as suspended FROM franchises WHERE operation_status = 'suspended'"
    ).first<{ suspended: number }>();

    // 지역별 분포
    const regionResult = await env.DB.prepare(
      'SELECT region, COUNT(*) as count FROM franchises GROUP BY region ORDER BY count DESC'
    ).all();

    return c.json({
      total: totalResult?.total || 0,
      active: activeResult?.active || 0,
      terminated: terminatedResult?.terminated || 0,
      suspended: suspendedResult?.suspended || 0,
      byRegion: regionResult.results,
    });
  } catch (error) {
    console.error('가맹점 통계 조회 오류:', error);
    return c.json({ error: '통계 조회에 실패했습니다.' }, 500);
  }
});

// 가맹점 등록 (마스터/관리자만)
app.post('/', async (c) => {
  const { env, var: { user } } = c;

  if (user.role !== 'master' && user.role !== 'admin') {
    return c.json({ error: '권한이 없습니다.' }, 403);
  }

  try {
    const body = await c.req.json();

    const stmt = env.DB.prepare(`
      INSERT INTO franchises (
        franchise_name, business_number, representative, contact, email,
        contract_date, contract_year, contract_month, contract_quarter,
        installation_date, termination_date, contract_end_date,
        installation_type, contract_number, operation_status,
        region_type, region, district, road_address, detail_address,
        bank_name, account_number, account_holder, unit_price,
        contract_type, withdrawal_day, rental_fee_total,
        crm_type, ai_sales_type, rental_company, operation_type,
        installation_manager, management_agency,
        model_name, pos_type, to_count, quantity,
        master_count, qr_count, stand_total, stand_standard,
        stand_flat, stand_extended, charger_set, router, battery,
        van_type, asp_id, asp_pw, asp_url, notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.bind(
      body.franchise_name, body.business_number, body.representative, body.contact, body.email,
      body.contract_date, body.contract_year, body.contract_month, body.contract_quarter,
      body.installation_date, body.termination_date, body.contract_end_date,
      body.installation_type, body.contract_number, body.operation_status || 'active',
      body.region_type, body.region, body.district, body.road_address, body.detail_address,
      body.bank_name, body.account_number, body.account_holder, body.unit_price,
      body.contract_type, body.withdrawal_day, body.rental_fee_total,
      body.crm_type, body.ai_sales_type, body.rental_company, body.operation_type,
      body.installation_manager, body.management_agency,
      body.model_name, body.pos_type, body.to_count || 0, body.quantity || 0,
      body.master_count || 0, body.qr_count || 0, body.stand_total || 0, body.stand_standard || 0,
      body.stand_flat || 0, body.stand_extended || 0, body.charger_set || 0, body.router || 0, body.battery || 0,
      body.van_type, body.asp_id, body.asp_pw, body.asp_url, body.notes,
      user.id
    ).run();

    return c.json({
      message: '가맹점이 등록되었습니다.',
      id: result.meta.last_row_id,
    });
  } catch (error) {
    console.error('가맹점 등록 오류:', error);
    return c.json({ error: '가맹점 등록에 실패했습니다.' }, 500);
  }
});

// 가맹점 수정 (마스터/관리자만)
app.put('/:id', async (c) => {
  const { env, var: { user } } = c;

  if (user.role !== 'master' && user.role !== 'admin') {
    return c.json({ error: '권한이 없습니다.' }, 403);
  }

  const id = c.req.param('id');

  try {
    const body = await c.req.json();

    const updateFields = [];
    const params: any[] = [];

    // 동적으로 업데이트 필드 생성
    const allowedFields = [
      'franchise_name', 'business_number', 'representative', 'contact', 'email',
      'contract_date', 'contract_year', 'contract_month', 'contract_quarter',
      'installation_date', 'termination_date', 'contract_end_date',
      'installation_type', 'contract_number', 'operation_status',
      'region_type', 'region', 'district', 'road_address', 'detail_address',
      'bank_name', 'account_number', 'account_holder', 'unit_price',
      'contract_type', 'withdrawal_day', 'rental_fee_total',
      'crm_type', 'ai_sales_type', 'rental_company', 'operation_type',
      'installation_manager', 'management_agency',
      'model_name', 'pos_type', 'to_count', 'quantity',
      'master_count', 'qr_count', 'stand_total', 'stand_standard',
      'stand_flat', 'stand_extended', 'charger_set', 'router', 'battery',
      'van_type', 'asp_id', 'asp_pw', 'asp_url', 'notes'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(body[field]);
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: '수정할 필드가 없습니다.' }, 400);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = env.DB.prepare(`
      UPDATE franchises 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    await stmt.bind(...params).run();

    return c.json({ message: '가맹점 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('가맹점 수정 오류:', error);
    return c.json({ error: '가맹점 수정에 실패했습니다.' }, 500);
  }
});

// 가맹점 삭제 (마스터만)
app.delete('/:id', async (c) => {
  const { env, var: { user } } = c;

  if (user.role !== 'master') {
    return c.json({ error: '권한이 없습니다.' }, 403);
  }

  const id = c.req.param('id');

  try {
    const stmt = env.DB.prepare('DELETE FROM franchises WHERE id = ?');
    await stmt.bind(id).run();

    return c.json({ message: '가맹점이 삭제되었습니다.' });
  } catch (error) {
    console.error('가맹점 삭제 오류:', error);
    return c.json({ error: '가맹점 삭제에 실패했습니다.' }, 500);
  }
});

export default app;
