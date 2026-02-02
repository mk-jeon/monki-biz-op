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

// 설치현황에서 운영등재로 이관 (50개 컬럼 완전 복사)
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

        // 50개 컬럼 완전 복사
        await c.env.DB.prepare(`
          INSERT INTO operations (
            installation_id, customer_name, phone, status, inflow_source, memo,
            created_by, created_by_name,
            -- 기본 정보 (8개)
            birth_date, email, business_number, representative,
            road_address, detail_address, region, region_type,
            -- 금융 정보 (9개)
            bank_name, account_number, account_holder, contract_type,
            withdrawal_day, monthly_rental_fee, deposit, contract_date, contract_number,
            -- H/W: POS (7개)
            pos_agency, pos_vendor, pos_model, pos_program,
            asp_id, asp_password, asp_url,
            -- H/W: 테이블오더 & 거치대 (6개)
            table_order_qty, stand_standard, stand_flat, stand_extended,
            charger_qty, battery_qty,
            -- H/W: 네트워크 & 기타 (4개)
            router_qty, kiosk_qty, kitchen_printer_qty, call_bell_qty,
            -- 관리 정보 (2개)
            crm_service, ai_sales_service
          ) VALUES (
            ?, ?, ?, 'contract_pending', ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?
          )
        `).bind(
          install.id,
          install.customer_name,
          install.phone,
          install.inflow_source || '',
          install.notes || '',
          user.id,
          user.name,
          // 기본 정보
          install.birth_date || null,
          install.email || null,
          install.business_number || null,
          install.representative || null,
          install.road_address || null,
          install.detail_address || null,
          install.region || null,
          install.region_type || null,
          // 금융 정보
          install.bank_name || null,
          install.account_number || null,
          install.account_holder || null,
          install.contract_type || null,
          install.withdrawal_day || null,
          install.monthly_rental_fee || null,
          install.deposit || null,
          install.contract_date || null,
          install.contract_number || null,
          // H/W: POS
          install.pos_agency || null,
          install.pos_vendor || null,
          install.pos_model || null,
          install.pos_program || null,
          install.asp_id || null,
          install.asp_password || null,
          install.asp_url || null,
          // H/W: 테이블오더 & 거치대
          install.table_order_qty || 0,
          install.stand_standard || 0,
          install.stand_flat || 0,
          install.stand_extended || 0,
          install.charger_qty || 0,
          install.battery_qty || 0,
          // H/W: 네트워크 & 기타
          install.router_qty || 0,
          install.kiosk_qty || 0,
          install.kitchen_printer_qty || 0,
          install.call_bell_qty || 0,
          // 관리 정보
          install.crm_service || 0,
          install.ai_sales_service || 0
        ).run();

        // 설치현황에 이관 플래그 설정
        await c.env.DB.prepare(`
          UPDATE installations 
          SET migrated_to_operation = 1, migrated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(install.id).run();

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

// 운영등재 수정
operations.put('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();

    const fields = [];
    const bindings = [];

    if (data.customer_name !== undefined) {
      fields.push('customer_name = ?');
      bindings.push(data.customer_name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      bindings.push(data.phone);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      bindings.push(data.status);
    }
    if (data.memo !== undefined) {
      fields.push('memo = ?');
      bindings.push(data.memo);
    }
    if (data.contract_document_url !== undefined) {
      fields.push('contract_document_url = ?');
      bindings.push(data.contract_document_url);
    }
    if (data.install_certificate_url !== undefined) {
      fields.push('install_certificate_url = ?');
      bindings.push(data.install_certificate_url);
    }
    if (data.install_photo_url !== undefined) {
      fields.push('install_photo_url = ?');
      bindings.push(data.install_photo_url);
    }
    if (data.drive_url !== undefined) {
      fields.push('drive_url = ?');
      bindings.push(data.drive_url);
    }

    if (fields.length === 0) {
      return c.json({ error: '수정할 데이터가 없습니다.' }, 400);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    fields.push('updated_by = ?');
    fields.push('updated_by_name = ?');
    bindings.push(user.id, user.name, id);

    await c.env.DB.prepare(`
      UPDATE operations SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update operation error:', error);
    return c.json({ error: '운영등재 수정 중 오류가 발생했습니다.' }, 500);
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
