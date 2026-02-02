// 설치현황 모듈 - IIFE로 스코프 격리
(function() {
  'use strict';
  
  console.log('🔵 installation.js 모듈 로드 시작 (Phase 3: 5-Tab UI)');

/**
 * 날짜 포맷 함수
 */
function formatDate(dateString) {
  const utcDate = new Date(dateString);
  const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
  const now = new Date();
  const diff = now - kstDate;
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return '방금 전';
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return kstDate.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Seoul'
    });
  }
}

let currentInstallationPage = 1;
let currentInstallationViewMode = 'list';
let installationTypes = []; // 설치유형 목록

/**
 * 설치 정렬 처리 함수
 */
function handleSort_installation(field) {
  window.handleSort(field, 'installation', () => loadInstallationList(currentInstallationPage));
}

/**
 * 설치현황 페이지 로드
 */
async function loadInstallationPage() {
  console.log('✅ loadInstallationPage 호출됨');
  // 드롭다운 항목 로드
  await loadDropdownItems('installation_type').then(items => installationTypes = items);
  loadInstallationList();
}

/**
 * 리스트/칸반 모드 전환
 */
function toggleInstallationViewMode() {
  currentInstallationViewMode = currentInstallationViewMode === 'list' ? 'kanban' : 'list';
  
  if (currentInstallationViewMode === 'list') {
    loadInstallationList();
  } else {
    loadInstallationKanban();
  }
}

/**
 * 설치현황 리스트 조회
 */
async function loadInstallationList(page = 1) {
  console.log(`✅ loadInstallationList 실행 (page=${page})`);
  try {
    const response = await axios.get(`/api/installations?page=${page}&limit=50`);
    let { installations, pagination } = response.data;
    
    // 정렬 적용
    const sortState = window.sortStates.installation;
    installations = window.sortData(installations, sortState.field, sortState.order, 'installation');

    const statusMap = {
      'waiting': { text: '설치대기', color: 'bg-gray-500', icon: 'fa-clock' },
      'in_progress': { text: '설치 중', color: 'bg-blue-500', icon: 'fa-spinner' },
      'hold': { text: '설치보류', color: 'bg-yellow-500', icon: 'fa-pause-circle' },
      'completed': { text: '설치완료', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '설치취소', color: 'bg-red-500', icon: 'fa-times-circle' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치현황
            </h2>
            <div class="flex space-x-2">
              <button onclick="showInstallationArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="toggleInstallationViewMode()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas ${currentInstallationViewMode === 'list' ? 'fa-th' : 'fa-list'} mr-2"></i>
                ${currentInstallationViewMode === 'list' ? '칸반 보기' : '리스트 보기'}
              </button>
              <button onclick="showInstallationFormModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <!-- 테이블 -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('id')">
                  번호 ${window.renderSortIcon('installation', 'id')}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('status')">
                  상태 ${window.renderSortIcon('installation', 'status')}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유입경로</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('created_at')">
                  등록일 ${window.renderSortIcon('installation', 'created_at')}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록자</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${installations.map(inst => {
                const statusInfo = statusMap[inst.status] || statusMap['waiting'];
                return `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="showInstallationDetailModal(${inst.id})">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${inst.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="${statusInfo.color} text-white px-3 py-1 rounded-full text-xs font-medium">
                        <i class="fas ${statusInfo.icon} mr-1"></i>
                        ${statusInfo.text}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${inst.customer_name || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${inst.phone || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${inst.inflow_source || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(inst.created_at)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${inst.created_by_name || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex space-x-2">
                        <button onclick="event.stopPropagation(); showInstallationEditModal(${inst.id})" class="text-blue-600 hover:text-blue-800">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deleteInstallation(${inst.id})" class="text-red-600 hover:text-red-800">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="p-6 border-t border-gray-200">
          ${window.renderPagination(pagination.currentPage, pagination.totalPages, 'loadInstallationList')}
        </div>
      </div>
    `;
    
    document.getElementById('contentArea').innerHTML = content;
    currentInstallationPage = page;
  } catch (error) {
    console.error('설치 목록 로드 오류:', error);
    document.getElementById('contentArea').innerHTML = `
      <div class="p-8 text-center text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    `;
  }
}

/**
 * ===============================================
 * Phase 3: 5-Tab 모달 구조 (설치현황)
 * ===============================================
 * Tab 1: 기본정보 (고객명, 연락처, 사업자번호, 대표자, 주소 등)
 * Tab 2: 금융정보 (은행, 계좌, 예금주, 계약유형, 출금일, 렌탈료 등)
 * Tab 3: H/W 정보 (POS, 테이블오더, 거치대, 네트워크 등)
 * Tab 4: 관리 (부가서비스, 메모)
 * Tab 5: 증빙 (계약서, 설치확인서, 설치사진, 두레이 드라이브 URL) ✅ 필수
 */

/**
 * 설치 등록 폼 모달 (5-Tab)
 */
function showInstallationFormModal() {
  const modal = document.getElementById('installationFormModal') || createInstallationFormModal();
  modal.classList.remove('hidden');
  
  // 폼 초기화
  document.getElementById('installationForm').reset();
  document.getElementById('installationFormTitle').textContent = '설치 신규 등록';
  
  // Tab 1을 기본으로 활성화
  switchInstallationTab(1);
}

/**
 * 설치 수정 폼 모달 (5-Tab)
 */
async function showInstallationEditModal(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const inst = response.data;
    
    const modal = document.getElementById('installationFormModal') || createInstallationFormModal();
    modal.classList.remove('hidden');
    
    // 폼에 데이터 채우기
    document.getElementById('installationFormTitle').textContent = '설치 정보 수정';
    document.getElementById('installationForm').dataset.id = id;
    document.getElementById('installationForm').dataset.mode = 'edit';
    
    // Tab 1: 기본정보
    document.getElementById('customerName').value = inst.customer_name || '';
    document.getElementById('phone').value = inst.phone || '';
    document.getElementById('inflowSource').value = inst.inflow_source || '';
    document.getElementById('birthDate').value = inst.birth_date || '';
    document.getElementById('email').value = inst.email || '';
    document.getElementById('businessNumber').value = inst.business_number || '';
    document.getElementById('representative').value = inst.representative || '';
    document.getElementById('roadAddress').value = inst.road_address || '';
    document.getElementById('detailAddress').value = inst.detail_address || '';
    document.getElementById('region').value = inst.region || '';
    document.getElementById('regionType').value = inst.region_type || '';
    
    // Tab 2: 금융정보
    document.getElementById('bankName').value = inst.bank_name || '';
    document.getElementById('accountNumber').value = inst.account_number || '';
    document.getElementById('accountHolder').value = inst.account_holder || '';
    document.getElementById('contractType').value = inst.contract_type || '';
    document.getElementById('withdrawalDay').value = inst.withdrawal_day || '';
    document.getElementById('monthlyRentalFee').value = inst.monthly_rental_fee || '';
    document.getElementById('deposit').value = inst.deposit || '';
    document.getElementById('contractDate').value = inst.contract_date || '';
    document.getElementById('contractNumber').value = inst.contract_number || '';
    
    // Tab 3: H/W 정보
    document.getElementById('posAgency').value = inst.pos_agency || '';
    document.getElementById('posVendor').value = inst.pos_vendor || '';
    document.getElementById('posModel').value = inst.pos_model || '';
    document.getElementById('posProgram').value = inst.pos_program || '';
    document.getElementById('aspId').value = inst.asp_id || '';
    document.getElementById('aspPassword').value = inst.asp_password || '';
    document.getElementById('aspUrl').value = inst.asp_url || '';
    document.getElementById('tableOrderQty').value = inst.table_order_qty || 0;
    document.getElementById('standStandard').value = inst.stand_standard || 0;
    document.getElementById('standFlat').value = inst.stand_flat || 0;
    document.getElementById('standExtended').value = inst.stand_extended || 0;
    document.getElementById('chargerQty').value = inst.charger_qty || 0;
    document.getElementById('batteryQty').value = inst.battery_qty || 0;
    document.getElementById('routerQty').value = inst.router_qty || 0;
    document.getElementById('kioskQty').value = inst.kiosk_qty || 0;
    document.getElementById('kitchenPrinterQty').value = inst.kitchen_printer_qty || 0;
    document.getElementById('callBellQty').value = inst.call_bell_qty || 0;
    
    // Tab 4: 관리
    document.getElementById('crmService').checked = inst.crm_service === 1;
    document.getElementById('aiSalesService').checked = inst.ai_sales_service === 1;
    document.getElementById('memo').value = inst.memo || '';
    
    // Tab 5: 증빙 (✅ 운영등재 이관 시 필수)
    document.getElementById('contractChecked').checked = inst.contract_checked === 1;
    document.getElementById('certChecked').checked = inst.installation_cert_checked === 1;
    document.getElementById('photoChecked').checked = inst.installation_photo_checked === 1;
    document.getElementById('driveUrl').value = inst.drive_url || '';
    
    // Tab 1을 기본으로 활성화
    switchInstallationTab(1);
    
  } catch (error) {
    console.error('설치 정보 로드 오류:', error);
    alert('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 설치 폼 모달 생성 (5-Tab 구조)
 */
function createInstallationFormModal() {
  const modalHTML = `
    <div id="installationFormModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">
        <!-- 모달 헤더 -->
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div class="flex items-center justify-between">
            <h3 id="installationFormTitle" class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치 신규 등록
            </h3>
            <button onclick="closeInstallationFormModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Tab 네비게이션 -->
          <div class="flex space-x-2 mt-4 border-b border-gray-200">
            <button type="button" onclick="switchInstallationTab(1)" id="installationTab1" class="installation-tab px-4 py-2 font-semibold text-purple-600 border-b-2 border-purple-600">
              <i class="fas fa-user mr-1"></i> 기본정보
            </button>
            <button type="button" onclick="switchInstallationTab(2)" id="installationTab2" class="installation-tab px-4 py-2 text-gray-600 hover:text-purple-600">
              <i class="fas fa-credit-card mr-1"></i> 금융정보
            </button>
            <button type="button" onclick="switchInstallationTab(3)" id="installationTab3" class="installation-tab px-4 py-2 text-gray-600 hover:text-purple-600">
              <i class="fas fa-desktop mr-1"></i> H/W 정보
            </button>
            <button type="button" onclick="switchInstallationTab(4)" id="installationTab4" class="installation-tab px-4 py-2 text-gray-600 hover:text-purple-600">
              <i class="fas fa-cog mr-1"></i> 관리
            </button>
            <button type="button" onclick="switchInstallationTab(5)" id="installationTab5" class="installation-tab px-4 py-2 text-gray-600 hover:text-purple-600">
              <i class="fas fa-cloud mr-1"></i> 증빙 <span class="text-red-500">*</span>
            </button>
          </div>
        </div>

        <!-- 모달 본문 -->
        <form id="installationForm" class="p-6">
          
          <!-- Tab 1: 기본정보 -->
          <div id="installationTabContent1" class="installation-tab-content">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-user mr-1"></i> 고객명 <span class="text-red-500">*</span>
                </label>
                <input type="text" id="customerName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-phone mr-1"></i> 연락처 <span class="text-red-500">*</span>
                </label>
                <input type="tel" id="phone" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-map-marker-alt mr-1"></i> 유입경로
                </label>
                <input type="text" id="inflowSource" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-birthday-cake mr-1"></i> 생년월일
                </label>
                <input type="date" id="birthDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-envelope mr-1"></i> 이메일
                </label>
                <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-building mr-1"></i> 사업자번호
                </label>
                <input type="text" id="businessNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-user-tie mr-1"></i> 대표자
                </label>
                <input type="text" id="representative" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-road mr-1"></i> 도로명주소
                </label>
                <input type="text" id="roadAddress" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-home mr-1"></i> 상세주소
                </label>
                <input type="text" id="detailAddress" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-map mr-1"></i> 지역
                </label>
                <input type="text" id="region" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-tags mr-1"></i> 지역구분
                </label>
                <select id="regionType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">선택</option>
                  <option value="urban">도심</option>
                  <option value="suburban">교외</option>
                  <option value="rural">시골</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tab 2: 금융정보 -->
          <div id="installationTabContent2" class="installation-tab-content hidden">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-university mr-1"></i> 은행명
                </label>
                <input type="text" id="bankName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-credit-card mr-1"></i> 계좌번호
                </label>
                <input type="text" id="accountNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-user-circle mr-1"></i> 예금주
                </label>
                <input type="text" id="accountHolder" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-file-contract mr-1"></i> 계약유형
                </label>
                <select id="contractType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">선택</option>
                  <option value="rental">렌탈</option>
                  <option value="purchase">매매</option>
                  <option value="lease">리스</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-calendar-day mr-1"></i> 출금일
                </label>
                <input type="number" id="withdrawalDay" min="1" max="31" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-won-sign mr-1"></i> 월 렌탈료
                </label>
                <input type="number" id="monthlyRentalFee" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-money-bill-wave mr-1"></i> 보증금
                </label>
                <input type="number" id="deposit" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-calendar-check mr-1"></i> 계약일
                </label>
                <input type="date" id="contractDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-hashtag mr-1"></i> 계약번호
                </label>
                <input type="text" id="contractNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>
          </div>

          <!-- Tab 3: H/W 정보 -->
          <div id="installationTabContent3" class="installation-tab-content hidden">
            <div class="space-y-4">
              <!-- POS 정보 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-desktop mr-2"></i>POS 정보</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">POS 대행사</label>
                    <input type="text" id="posAgency" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">POS 벤더</label>
                    <input type="text" id="posVendor" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">POS 모델</label>
                    <input type="text" id="posModel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">POS 프로그램</label>
                    <input type="text" id="posProgram" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ASP ID</label>
                    <input type="text" id="aspId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ASP 비밀번호</label>
                    <input type="password" id="aspPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">ASP URL</label>
                    <input type="url" id="aspUrl" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                </div>
              </div>

              <!-- 테이블오더 & 거치대 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-tablet-alt mr-2"></i>테이블오더 & 거치대</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">테이블오더 수량</label>
                    <input type="number" id="tableOrderQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">스탠드형 거치대</label>
                    <input type="number" id="standStandard" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">평면형 거치대</label>
                    <input type="number" id="standFlat" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">확장형 거치대</label>
                    <input type="number" id="standExtended" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">충전기</label>
                    <input type="number" id="chargerQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">배터리</label>
                    <input type="number" id="batteryQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                </div>
              </div>

              <!-- 네트워크 & 기타 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-network-wired mr-2"></i>네트워크 & 기타</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">공유기</label>
                    <input type="number" id="routerQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">키오스크</label>
                    <input type="number" id="kioskQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">주방프린터</label>
                    <input type="number" id="kitchenPrinterQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">호출벨</label>
                    <input type="number" id="callBellQty" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 4: 관리 -->
          <div id="installationTabContent4" class="installation-tab-content hidden">
            <div class="space-y-4">
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-cogs mr-2"></i>부가서비스</h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-3">
                    <input type="checkbox" id="crmService" class="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                    <span class="text-sm font-medium text-gray-700">CRM 서비스 사용</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input type="checkbox" id="aiSalesService" class="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                    <span class="text-sm font-medium text-gray-700">AI 매출관리 서비스 사용</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-sticky-note mr-1"></i> 메모
                </label>
                <textarea id="memo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="설치 관련 특이사항을 입력하세요..."></textarea>
              </div>
            </div>
          </div>

          <!-- Tab 5: 증빙 (✅ 운영등재 이관 시 필수) -->
          <div id="installationTabContent5" class="installation-tab-content hidden">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p class="text-sm text-yellow-800">
                <i class="fas fa-info-circle mr-2"></i>
                <strong>운영등재 이관 시 필수:</strong> 모든 증빙 자료를 확인하고 두레이 드라이브 URL을 입력해야 합니다.
              </p>
            </div>
            
            <div class="space-y-4">
              <!-- 체크박스 3개 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-check-square mr-2"></i>증빙 자료 확인</h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-3">
                    <input type="checkbox" id="contractChecked" class="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                    <span class="text-sm font-medium text-gray-700">계약서 확인 완료</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input type="checkbox" id="certChecked" class="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                    <span class="text-sm font-medium text-gray-700">설치 확인서 확인 완료</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input type="checkbox" id="photoChecked" class="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                    <span class="text-sm font-medium text-gray-700">설치 사진 확인 완료</span>
                  </label>
                </div>
              </div>

              <!-- 두레이 드라이브 URL -->
              <div class="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-cloud mr-1 text-blue-600"></i>
                  두레이 드라이브 URL (사업팀 전용) <span class="text-red-500">*</span>
                </label>
                <input type="url" id="driveUrl" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="https://drive.dooray.com/...">
                <p class="text-xs text-gray-600 mt-2">
                  <i class="fas fa-info-circle mr-1"></i>
                  모든 증빙 자료가 업로드된 두레이 드라이브 폴더 링크를 입력하세요.
                </p>
              </div>
            </div>
          </div>

        </form>

        <!-- 모달 푸터 -->
        <div class="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
          <button type="button" onclick="closeInstallationFormModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
            취소
          </button>
          <button type="button" onclick="saveInstallation()" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
            <i class="fas fa-save mr-2"></i>
            저장
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  return document.getElementById('installationFormModal');
}

/**
 * 탭 전환 함수
 */
function switchInstallationTab(tabNumber) {
  // 모든 탭 버튼 비활성화
  for (let i = 1; i <= 5; i++) {
    const tabBtn = document.getElementById(`installationTab${i}`);
    const tabContent = document.getElementById(`installationTabContent${i}`);
    
    if (i === tabNumber) {
      tabBtn.classList.add('text-purple-600', 'border-b-2', 'border-purple-600', 'font-semibold');
      tabBtn.classList.remove('text-gray-600');
      tabContent.classList.remove('hidden');
    } else {
      tabBtn.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600', 'font-semibold');
      tabBtn.classList.add('text-gray-600');
      tabContent.classList.add('hidden');
    }
  }
}

/**
 * 저장 버튼 핸들러 (type="button" + onclick)
 */
async function saveInstallation() {
  const form = document.getElementById('installationForm');
  const mode = form.dataset.mode || 'create';
  const id = form.dataset.id;

  // 50개 컬럼 수집
  const data = {
    // Tab 1: 기본정보
    customer_name: document.getElementById('customerName').value || null,
    phone: document.getElementById('phone').value || null,
    inflow_source: document.getElementById('inflowSource').value || null,
    birth_date: document.getElementById('birthDate').value || null,
    email: document.getElementById('email').value || null,
    business_number: document.getElementById('businessNumber').value || null,
    representative: document.getElementById('representative').value || null,
    road_address: document.getElementById('roadAddress').value || null,
    detail_address: document.getElementById('detailAddress').value || null,
    region: document.getElementById('region').value || null,
    region_type: document.getElementById('regionType').value || null,
    
    // Tab 2: 금융정보
    bank_name: document.getElementById('bankName').value || null,
    account_number: document.getElementById('accountNumber').value || null,
    account_holder: document.getElementById('accountHolder').value || null,
    contract_type: document.getElementById('contractType').value || null,
    withdrawal_day: document.getElementById('withdrawalDay').value || null,
    monthly_rental_fee: document.getElementById('monthlyRentalFee').value || null,
    deposit: document.getElementById('deposit').value || null,
    contract_date: document.getElementById('contractDate').value || null,
    contract_number: document.getElementById('contractNumber').value || null,
    
    // Tab 3: H/W 정보
    pos_agency: document.getElementById('posAgency').value || null,
    pos_vendor: document.getElementById('posVendor').value || null,
    pos_model: document.getElementById('posModel').value || null,
    pos_program: document.getElementById('posProgram').value || null,
    asp_id: document.getElementById('aspId').value || null,
    asp_password: document.getElementById('aspPassword').value || null,
    asp_url: document.getElementById('aspUrl').value || null,
    table_order_qty: parseInt(document.getElementById('tableOrderQty').value) || 0,
    stand_standard: parseInt(document.getElementById('standStandard').value) || 0,
    stand_flat: parseInt(document.getElementById('standFlat').value) || 0,
    stand_extended: parseInt(document.getElementById('standExtended').value) || 0,
    charger_qty: parseInt(document.getElementById('chargerQty').value) || 0,
    battery_qty: parseInt(document.getElementById('batteryQty').value) || 0,
    router_qty: parseInt(document.getElementById('routerQty').value) || 0,
    kiosk_qty: parseInt(document.getElementById('kioskQty').value) || 0,
    kitchen_printer_qty: parseInt(document.getElementById('kitchenPrinterQty').value) || 0,
    call_bell_qty: parseInt(document.getElementById('callBellQty').value) || 0,
    
    // Tab 4: 관리
    crm_service: document.getElementById('crmService').checked ? 1 : 0,
    ai_sales_service: document.getElementById('aiSalesService').checked ? 1 : 0,
    memo: document.getElementById('memo').value || null,
    
    // Tab 5: 증빙 (✅ 필수)
    contract_checked: document.getElementById('contractChecked').checked ? 1 : 0,
    installation_cert_checked: document.getElementById('certChecked').checked ? 1 : 0,
    installation_photo_checked: document.getElementById('photoChecked').checked ? 1 : 0,
    drive_url: document.getElementById('driveUrl').value || null
  };

  try {
    if (mode === 'edit') {
      await axios.put(`/api/installations/${id}`, data);
    } else {
      await axios.post('/api/installations', data);
    }
    
    alert('저장완료');
    closeInstallationFormModal();
    loadInstallationList(currentInstallationPage);
    
  } catch (error) {
    console.error('저장 오류:', error);
    alert('저장 중 오류가 발생했습니다: ' + (error.response?.data?.error || error.message));
  }
}

/**
 * 모달 닫기
 */
function closeInstallationFormModal() {
  const modal = document.getElementById('installationFormModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('installationForm').reset();
    delete document.getElementById('installationForm').dataset.id;
    delete document.getElementById('installationForm').dataset.mode;
  }
}

/**
 * ===============================================
 * 운영등재 이관 모달 (설치 → 운영)
 * ===============================================
 */
function showMigrateToOperationModal() {
  const selectedIds = Array.from(document.querySelectorAll('input[name="installationSelect"]:checked'))
    .map(cb => cb.value);
  
  if (selectedIds.length === 0) {
    alert('이관할 설치 항목을 선택해주세요.');
    return;
  }

  const modalHTML = `
    <div id="migrateToOperationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-arrow-right mr-2 text-green-600"></i>
          운영등재 이관
        </h3>
        <p class="text-gray-600 mb-6">
          선택한 <strong class="text-purple-600">${selectedIds.length}건</strong>의 설치 항목을 운영등재로 이관하시겠습니까?
        </p>
        <div class="flex justify-end space-x-3">
          <button onclick="closeMigrateToOperationModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
            취소
          </button>
          <button onclick="executeMigrateToOperation(${JSON.stringify(selectedIds)})" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
            <i class="fas fa-check mr-2"></i>
            확인
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeMigrateToOperationModal() {
  const modal = document.getElementById('migrateToOperationModal');
  if (modal) modal.remove();
}

async function executeMigrateToOperation(ids) {
  try {
    const response = await axios.post('/api/operations/migrate', {
      installation_ids: ids
    });
    
    const { success, successCount, errorCount, errors } = response.data;
    
    if (success && successCount > 0) {
      let msg = `이관 완료! 성공: ${successCount}건`;
      if (errorCount > 0) {
        msg += `, 실패: ${errorCount}건\n\n실패 사유:\n${errors.map(e => `- ${e.id}: ${e.error}`).join('\n')}`;
      }
      alert(msg);
    } else {
      alert(`이관 실패\n실패: ${errorCount}건\n\n${errors.map(e => `- ${e.id}: ${e.error}`).join('\n')}`);
    }
    
    closeMigrateToOperationModal();
    loadInstallationList(currentInstallationPage);
    
  } catch (error) {
    console.error('이관 오류:', error);
    alert('이관 중 오류가 발생했습니다: ' + (error.response?.data?.error || error.message));
  }
}

/**
 * ===============================================
 * 칸반 뷰 (간략 버전)
 * ===============================================
 */
async function loadInstallationKanban() {
  console.log('✅ loadInstallationKanban 실행');
  try {
    const response = await axios.get('/api/installations?page=1&limit=1000');
    const installations = response.data.installations;

    const statusGroups = {
      'waiting': { text: '설치대기', color: 'bg-gray-500', items: [] },
      'in_progress': { text: '설치 중', color: 'bg-blue-500', items: [] },
      'hold': { text: '설치보류', color: 'bg-yellow-500', items: [] },
      'completed': { text: '설치완료', color: 'bg-green-500', items: [] },
      'cancelled': { text: '설치취소', color: 'bg-red-500', items: [] }
    };

    installations.forEach(inst => {
      const status = inst.status || 'waiting';
      if (statusGroups[status]) {
        statusGroups[status].items.push(inst);
      }
    });

    const content = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-tools mr-2 text-purple-600"></i>
            설치현황 (칸반)
          </h2>
          <button onclick="toggleInstallationViewMode()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
            <i class="fas fa-list mr-2"></i>리스트 보기
          </button>
        </div>
        <div class="grid grid-cols-5 gap-4">
          ${Object.entries(statusGroups).map(([status, group]) => `
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-700 mb-3">${group.text} (${group.items.length})</h3>
              <div class="space-y-2">
                ${group.items.map(inst => `
                  <div class="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md" onclick="showInstallationDetailModal(${inst.id})">
                    <p class="font-medium text-gray-800">${inst.customer_name || '-'}</p>
                    <p class="text-xs text-gray-600">${inst.phone || '-'}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.getElementById('contentArea').innerHTML = content;
    
  } catch (error) {
    console.error('칸반 로드 오류:', error);
  }
}

/**
 * ===============================================
 * 상세 모달 (간략 버전)
 * ===============================================
 */
async function showInstallationDetailModal(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const inst = response.data;
    
    const modalHTML = `
      <div id="installationDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치 상세
            </h3>
            <button onclick="closeInstallationDetailModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="space-y-2">
            <p><strong>고객명:</strong> ${inst.customer_name || '-'}</p>
            <p><strong>연락처:</strong> ${inst.phone || '-'}</p>
            <p><strong>유입경로:</strong> ${inst.inflow_source || '-'}</p>
            <p><strong>상태:</strong> ${inst.status || '-'}</p>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button onclick="closeInstallationDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              닫기
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
  } catch (error) {
    console.error('상세 조회 오류:', error);
    alert('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function closeInstallationDetailModal() {
  const modal = document.getElementById('installationDetailModal');
  if (modal) modal.remove();
}

/**
 * ===============================================
 * 삭제
 * ===============================================
 */
async function deleteInstallation(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  try {
    await axios.delete(`/api/installations/${id}`);
    alert('삭제되었습니다.');
    loadInstallationList(currentInstallationPage);
  } catch (error) {
    console.error('삭제 오류:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

/**
 * ===============================================
 * 이전 기록 검색 모달 (간략)
 * ===============================================
 */
function showInstallationArchiveSearchModal() {
  alert('이전 기록 검색 기능은 준비 중입니다.');
}

/**
 * ===============================================
 * 드롭다운 항목 로드 (공통 함수 활용)
 * ===============================================
 */
async function loadDropdownItems(category) {
  try {
    const response = await axios.get(`/api/items?category=${category}`);
    return response.data.items || [];
  } catch (error) {
    console.error('드롭다운 로드 오류:', error);
    return [];
  }
}

// 윈도우 바인딩
window.loadInstallationPage = loadInstallationPage;
window.loadInstallationList = loadInstallationList;
window.loadInstallationKanban = loadInstallationKanban;
window.toggleInstallationViewMode = toggleInstallationViewMode;
window.showInstallationFormModal = showInstallationFormModal;
window.showInstallationEditModal = showInstallationEditModal;
window.showInstallationDetailModal = showInstallationDetailModal;
window.closeInstallationFormModal = closeInstallationFormModal;
window.closeInstallationDetailModal = closeInstallationDetailModal;
window.saveInstallation = saveInstallation;
window.deleteInstallation = deleteInstallation;
window.switchInstallationTab = switchInstallationTab;
window.showMigrateToOperationModal = showMigrateToOperationModal;
window.closeMigrateToOperationModal = closeMigrateToOperationModal;
window.executeMigrateToOperation = executeMigrateToOperation;
window.showInstallationArchiveSearchModal = showInstallationArchiveSearchModal;
window.handleSort_installation = handleSort_installation;

console.log('✅ installation.js 모듈 로드 완료 (Phase 3: 5-Tab UI)');

})();
