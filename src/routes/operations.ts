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

    // 전체 목록 조회 (필터 제거)
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
    
    // Phase 2: 기본 정보 (8개)
    if (data.birth_date !== undefined) {
      fields.push('birth_date = ?');
      bindings.push(data.birth_date || null);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      bindings.push(data.email || null);
    }
    if (data.business_number !== undefined) {
      fields.push('business_number = ?');
      bindings.push(data.business_number || null);
    }
    if (data.representative !== undefined) {
      fields.push('representative = ?');
      bindings.push(data.representative || null);
    }
    if (data.road_address !== undefined) {
      fields.push('road_address = ?');
      bindings.push(data.road_address || null);
    }
    if (data.detail_address !== undefined) {
      fields.push('detail_address = ?');
      bindings.push(data.detail_address || null);
    }
    if (data.region !== undefined) {
      fields.push('region = ?');
      bindings.push(data.region || null);
    }
    if (data.region_type !== undefined) {
      fields.push('region_type = ?');
      bindings.push(data.region_type || null);
    }

    // Phase 2: 금융 정보 (9개)
    if (data.bank_name !== undefined) {
      fields.push('bank_name = ?');
      bindings.push(data.bank_name || null);
    }
    if (data.account_number !== undefined) {
      fields.push('account_number = ?');
      bindings.push(data.account_number || null);
    }
    if (data.account_holder !== undefined) {
      fields.push('account_holder = ?');
      bindings.push(data.account_holder || null);
    }
    if (data.contract_type !== undefined) {
      fields.push('contract_type = ?');
      bindings.push(data.contract_type || null);
    }
    if (data.withdrawal_day !== undefined) {
      fields.push('withdrawal_day = ?');
      bindings.push(data.withdrawal_day || null);
    }
    if (data.monthly_rental_fee !== undefined) {
      fields.push('monthly_rental_fee = ?');
      bindings.push(data.monthly_rental_fee || null);
    }
    if (data.deposit !== undefined) {
      fields.push('deposit = ?');
      bindings.push(data.deposit || null);
    }
    if (data.contract_date !== undefined) {
      fields.push('contract_date = ?');
      bindings.push(data.contract_date || null);
    }
    if (data.contract_number !== undefined) {
      fields.push('contract_number = ?');
      bindings.push(data.contract_number || null);
    }

    // Phase 2: H/W: POS (7개)
    if (data.pos_agency !== undefined) {
      fields.push('pos_agency = ?');
      bindings.push(data.pos_agency || null);
    }
    if (data.pos_vendor !== undefined) {
      fields.push('pos_vendor = ?');
      bindings.push(data.pos_vendor || null);
    }
    if (data.pos_model !== undefined) {
      fields.push('pos_model = ?');
      bindings.push(data.pos_model || null);
    }
    if (data.pos_program !== undefined) {
      fields.push('pos_program = ?');
      bindings.push(data.pos_program || null);
    }
    if (data.asp_id !== undefined) {
      fields.push('asp_id = ?');
      bindings.push(data.asp_id || null);
    }
    if (data.asp_password !== undefined) {
      fields.push('asp_password = ?');
      bindings.push(data.asp_password || null);
    }
    if (data.asp_url !== undefined) {
      fields.push('asp_url = ?');
      bindings.push(data.asp_url || null);
    }

    // Phase 2: H/W: 테이블오더 & 거치대 (6개)
    if (data.table_order_qty !== undefined) {
      fields.push('table_order_qty = ?');
      bindings.push(data.table_order_qty || 0);
    }
    if (data.stand_standard !== undefined) {
      fields.push('stand_standard = ?');
      bindings.push(data.stand_standard || 0);
    }
    if (data.stand_flat !== undefined) {
      fields.push('stand_flat = ?');
      bindings.push(data.stand_flat || 0);
    }
    if (data.stand_extended !== undefined) {
      fields.push('stand_extended = ?');
      bindings.push(data.stand_extended || 0);
    }
    if (data.charger_qty !== undefined) {
      fields.push('charger_qty = ?');
      bindings.push(data.charger_qty || 0);
    }
    if (data.battery_qty !== undefined) {
      fields.push('battery_qty = ?');
      bindings.push(data.battery_qty || 0);
    }

    // Phase 2: H/W: 네트워크 & 기타 (4개)
    if (data.router_qty !== undefined) {
      fields.push('router_qty = ?');
      bindings.push(data.router_qty || 0);
    }
    if (data.kiosk_qty !== undefined) {
      fields.push('kiosk_qty = ?');
      bindings.push(data.kiosk_qty || 0);
    }
    if (data.kitchen_printer_qty !== undefined) {
      fields.push('kitchen_printer_qty = ?');
      bindings.push(data.kitchen_printer_qty || 0);
    }
    if (data.call_bell_qty !== undefined) {
      fields.push('call_bell_qty = ?');
      bindings.push(data.call_bell_qty || 0);
    }

    // Phase 2: 관리 정보 (2개)
    if (data.crm_service !== undefined) {
      fields.push('crm_service = ?');
      bindings.push(data.crm_service || 0);
    }
    if (data.ai_sales_service !== undefined) {
      fields.push('ai_sales_service = ?');
      bindings.push(data.ai_sales_service || 0);
    }
    
    // Tab 5 증빙 자료 필드
    if (data.contract_checked !== undefined) {
      fields.push('contract_checked = ?');
      bindings.push(data.contract_checked);
    }
    if (data.installation_cert_checked !== undefined) {
      fields.push('installation_cert_checked = ?');
      bindings.push(data.installation_cert_checked);
    }
    if (data.installation_photo_checked !== undefined) {
      fields.push('installation_photo_checked = ?');
      bindings.push(data.installation_photo_checked);
    }
    if (data.drive_url !== undefined) {
      fields.push('drive_url = ?');
      bindings.push(data.drive_url);
    }
    // 기존 URL 필드들 (하위 호환성)
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

// 운영등재 승인 (가맹점현황으로 이관)
operations.post('/:id/approve', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    // 운영등재 정보 조회
    const operation = await c.env.DB.prepare(
      'SELECT * FROM operations WHERE id = ?'
    ).bind(id).first();

    if (!operation) {
      return c.json({ error: '운영등재를 찾을 수 없습니다.' }, 404);
    }

    // 유효성 검사: Tab 5 증빙 데이터 체크
    const validationErrors = [];
    
    if (!operation.contract_checked) {
      validationErrors.push('계약서 작성 확인이 필요합니다.');
    }
    if (!operation.installation_cert_checked) {
      validationErrors.push('설치확인서 확인이 필요합니다.');
    }
    if (!operation.installation_photo_checked) {
      validationErrors.push('설치사진 확인이 필요합니다.');
    }
    if (!operation.drive_url || operation.drive_url.trim() === '') {
      validationErrors.push('구글 드라이브 URL이 필요합니다.');
    }

    if (validationErrors.length > 0) {
      return c.json({ 
        error: '승인 조건을 충족하지 못했습니다.',
        validationErrors 
      }, 400);
    }

    // Franchises 테이블로 데이터 이관
    await c.env.DB.prepare(`
      INSERT INTO franchises (
        franchise_name, business_number, representative, contact, email,
        contract_date, installation_date, contract_number, operation_status,
        region_type, region, road_address, detail_address,
        bank_name, account_number, account_holder, contract_type, withdrawal_day, rental_fee_total,
        model_name, to_count, stand_standard, stand_flat, stand_extended, charger_set, router, battery,
        asp_id, asp_pw, asp_url,
        notes, created_by, created_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, 'active',
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, CURRENT_TIMESTAMP
      )
    `).bind(
      operation.customer_name || '',
      operation.business_number || null,
      operation.representative || null,
      operation.phone || '',
      operation.email || null,
      operation.contract_date || null,
      null, // installation_date
      operation.contract_number || null,
      operation.region_type || null,
      operation.region || null,
      operation.road_address || null,
      operation.detail_address || null,
      operation.bank_name || null,
      operation.account_number || null,
      operation.account_holder || null,
      operation.contract_type || null,
      operation.withdrawal_day || null,
      operation.monthly_rental_fee || null,
      operation.pos_model || null,
      operation.table_order_qty || 0,
      operation.stand_standard || 0,
      operation.stand_flat || 0,
      operation.stand_extended || 0,
      operation.charger_qty || 0,
      operation.router_qty || 0,
      operation.battery_qty || 0,
      operation.asp_id || null,
      operation.asp_password || null,
      operation.asp_url || null,
      operation.memo || null,
      user.id
    ).run();

    // Operations 상태 업데이트
    await c.env.DB.prepare(`
      UPDATE operations SET
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?,
        updated_by_name = ?
      WHERE id = ?
    `).bind(user.id, user.name, id).run();

    return c.json({ 
      success: true,
      message: '운영등재가 승인되어 가맹점현황으로 이관되었습니다.'
    });
  } catch (error) {
    console.error('Operation approval error:', error);
    return c.json({ error: '승인 처리 중 오류가 발생했습니다.' }, 500);
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
