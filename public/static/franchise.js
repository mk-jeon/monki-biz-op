/**
 * 가맹점현황 페이지
 */

(function() {
  'use strict';

  let currentPage = 1;
  let currentSearch = '';
  let currentStatus = '';
  let currentRegion = '';
  let userRole = '';

  // 페이지 로드
  async function loadFranchisePage() {
    console.log('🏪 가맹점현황 페이지 로드');

    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      console.error('❌ main-content 요소를 찾을 수 없습니다.');
      return;
    }

    // 사용자 정보 가져오기
    try {
      const userResponse = await axios.get('/api/auth/me');
      userRole = userResponse.data.user.role;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      userRole = 'user';
    }

    // 등록 버튼은 마스터/관리자만 표시
    const addButton = (userRole === 'master' || userRole === 'admin') 
      ? `<button onclick="window.franchise.showForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
           <i class="fas fa-plus mr-2"></i>가맹점 등록
         </button>`
      : '';

    mainContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">가맹점현황</h2>
          ${addButton}
        </div>

        <!-- 필터 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input 
            type="text" 
            id="search-input" 
            placeholder="가맹점명, 사업자번호, 대표자, 연락처 검색"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onkeypress="if(event.key==='Enter') window.franchise.search()">
          
          <select id="status-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" onchange="window.franchise.filterStatus()">
            <option value="">전체 상태</option>
            <option value="active">운영중</option>
            <option value="terminated">해지</option>
            <option value="suspended">일시중지</option>
          </select>

          <select id="region-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" onchange="window.franchise.filterRegion()">
            <option value="">전체 지역</option>
          </select>

          <button onclick="window.franchise.resetFilters()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            <i class="fas fa-redo mr-2"></i>필터 초기화
          </button>
        </div>

        <!-- 통계 카드 -->
        <div id="stats-container" class="grid grid-cols-4 gap-4 mb-6"></div>

        <!-- 목록 -->
        <div id="franchise-list" class="overflow-x-auto"></div>

        <!-- 페이지네이션 -->
        <div id="pagination" class="mt-6"></div>
      </div>

      <!-- 상세 모달 -->
      <div id="detail-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
          <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
            <h3 id="modal-title" class="text-2xl font-bold text-gray-900"></h3>
            <button onclick="window.franchise.closeModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- 탭 -->
          <div class="flex border-b border-gray-200 px-6">
            <button class="tab-btn px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600" data-tab="basic" onclick="window.franchise.switchTab('basic')">기본정보</button>
            <button class="tab-btn px-6 py-3 font-medium text-gray-600 hover:text-gray-900" data-tab="contract" onclick="window.franchise.switchTab('contract')">계약정보</button>
            <button class="tab-btn px-6 py-3 font-medium text-gray-600 hover:text-gray-900" data-tab="address" onclick="window.franchise.switchTab('address')">주소정보</button>
            <button class="tab-btn px-6 py-3 font-medium text-gray-600 hover:text-gray-900" data-tab="payment" onclick="window.franchise.switchTab('payment')">결제정보</button>
            <button class="tab-btn px-6 py-3 font-medium text-gray-600 hover:text-gray-900" data-tab="equipment" onclick="window.franchise.switchTab('equipment')">장비정보</button>
            <button class="tab-btn px-6 py-3 font-medium text-gray-600 hover:text-gray-900" data-tab="operation" onclick="window.franchise.switchTab('operation')">운영정보</button>
          </div>

          <!-- 탭 콘텐츠 -->
          <div id="tab-content" class="p-6"></div>
        </div>
      </div>
    `;

    try {
      await loadStats();
      await loadRegions();
      await loadList();
    } catch (error) {
      console.error('페이지 로드 오류:', error);
      mainContent.innerHTML += '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">데이터를 불러오는데 실패했습니다.</div>';
    }
  }

  // 통계 로드
  async function loadStats() {
    try {
      const response = await axios.get('/api/franchises/stats/summary');
      const stats = response.data;

      document.getElementById('stats-container').innerHTML = `
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div class="text-sm opacity-90">전체</div>
          <div class="text-2xl font-bold">${stats.total.toLocaleString()}</div>
        </div>
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div class="text-sm opacity-90">운영중</div>
          <div class="text-2xl font-bold">${stats.active.toLocaleString()}</div>
        </div>
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div class="text-sm opacity-90">해지</div>
          <div class="text-2xl font-bold">${stats.terminated.toLocaleString()}</div>
        </div>
        <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div class="text-sm opacity-90">일시중지</div>
          <div class="text-2xl font-bold">${stats.suspended.toLocaleString()}</div>
        </div>
      `;
    } catch (error) {
      console.error('통계 로드 오류:', error);
    }
  }

  // 지역 목록 로드
  async function loadRegions() {
    try {
      const response = await axios.get('/api/franchises/stats/summary');
      const regions = response.data.byRegion;

      const select = document.getElementById('region-filter');
      regions.forEach(r => {
        const option = document.createElement('option');
        option.value = r.region;
        option.textContent = `${r.region} (${r.count})`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('지역 목록 로드 오류:', error);
    }
  }

  // 목록 로드
  async function loadList() {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });

      if (currentSearch) params.append('search', currentSearch);
      if (currentStatus) params.append('status', currentStatus);
      if (currentRegion) params.append('region', currentRegion);

      const response = await axios.get(`/api/franchises?${params}`);
      const { franchises, pagination } = response.data;

      renderList(franchises);
      renderPagination(pagination);
    } catch (error) {
      console.error('목록 로드 오류:', error);
      alert('목록을 불러오는데 실패했습니다.');
    }
  }

  // 목록 렌더링
  function renderList(franchises) {
    const container = document.getElementById('franchise-list');
    
    if (!container) {
      console.error('❌ franchise-list 요소를 찾을 수 없습니다.');
      return;
    }
    
    if (franchises.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">가맹점이 없습니다.</p>';
      return;
    }

    // 수정 버튼은 마스터/관리자만 표시
    const canEdit = (userRole === 'master' || userRole === 'admin');

    const html = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가맹점명</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사업자번호</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대표자</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지역</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계약일</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${franchises.map(f => `
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="window.franchise.showDetail(${f.id})">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${f.franchise_name}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${f.business_number || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${f.representative || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${f.contact || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${f.region || '-'} ${f.district || ''}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${getStatusBadge(f.operation_status)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(f.contract_date)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="event.stopPropagation(); window.franchise.showDetail(${f.id})" class="text-blue-600 hover:text-blue-900 ${canEdit ? 'mr-3' : ''}">
                  <i class="fas fa-eye"></i>
                </button>
                ${canEdit ? `
                <button onclick="event.stopPropagation(); window.franchise.editFranchise(${f.id})" class="text-green-600 hover:text-green-900">
                  <i class="fas fa-edit"></i>
                </button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  // 상태 뱃지
  function getStatusBadge(status) {
    const badges = {
      active: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">운영중</span>',
      terminated: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">해지</span>',
      suspended: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">일시중지</span>'
    };
    return badges[status] || badges.active;
  }

  // 날짜 포맷
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }

  // 페이지네이션 렌더링
  function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    const { page, totalPages } = pagination;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<div class="flex justify-center gap-2">';

    // 이전
    if (page > 1) {
      html += `<button onclick="window.franchise.goToPage(${page - 1})" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">이전</button>`;
    }

    // 페이지 번호
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      const active = i === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-100';
      html += `<button onclick="window.franchise.goToPage(${i})" class="px-3 py-1 rounded ${active}">${i}</button>`;
    }

    // 다음
    if (page < totalPages) {
      html += `<button onclick="window.franchise.goToPage(${page + 1})" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">다음</button>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // 상세 보기
  async function showDetail(id) {
    try {
      const response = await axios.get(`/api/franchises/${id}`);
      const franchise = response.data.franchise;

      document.getElementById('modal-title').textContent = franchise.franchise_name;
      document.getElementById('detail-modal').classList.remove('hidden');

      // 기본 탭 표시
      switchTab('basic', franchise);
    } catch (error) {
      console.error('상세 조회 오류:', error);
      alert('상세 정보를 불러오는데 실패했습니다.');
    }
  }

  // 탭 전환
  async function switchTab(tab, franchise) {
    // 탭 버튼 스타일 변경
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
      btn.classList.add('text-gray-600');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    document.querySelector(`[data-tab="${tab}"]`).classList.remove('text-gray-600');

    // franchise 데이터가 없으면 다시 조회
    if (!franchise) {
      const id = window.currentFranchiseId; // 전역 변수로 저장
      const response = await axios.get(`/api/franchises/${id}`);
      franchise = response.data.franchise;
    } else {
      window.currentFranchiseId = franchise.id;
    }

    const content = document.getElementById('tab-content');
    
    if (tab === 'basic') {
      content.innerHTML = renderBasicTab(franchise);
    } else if (tab === 'contract') {
      content.innerHTML = renderContractTab(franchise);
    } else if (tab === 'address') {
      content.innerHTML = renderAddressTab(franchise);
    } else if (tab === 'payment') {
      content.innerHTML = renderPaymentTab(franchise);
    } else if (tab === 'equipment') {
      content.innerHTML = renderEquipmentTab(franchise);
    } else if (tab === 'operation') {
      content.innerHTML = renderOperationTab(franchise);
    }
  }

  // 기본정보 탭
  function renderBasicTab(f) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div><span class="font-medium text-gray-700">가맹점명:</span> <span class="text-gray-900">${f.franchise_name}</span></div>
        <div><span class="font-medium text-gray-700">사업자번호:</span> <span class="text-gray-900">${f.business_number || '-'}</span></div>
        <div><span class="font-medium text-gray-700">대표자:</span> <span class="text-gray-900">${f.representative || '-'}</span></div>
        <div><span class="font-medium text-gray-700">연락처:</span> <span class="text-gray-900">${f.contact || '-'}</span></div>
        <div><span class="font-medium text-gray-700">이메일:</span> <span class="text-gray-900">${f.email || '-'}</span></div>
        <div><span class="font-medium text-gray-700">운영상태:</span> ${getStatusBadge(f.operation_status)}</div>
      </div>
    `;
  }

  // 계약정보 탭
  function renderContractTab(f) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div><span class="font-medium text-gray-700">계약일:</span> <span class="text-gray-900">${formatDate(f.contract_date)}</span></div>
        <div><span class="font-medium text-gray-700">계약년도:</span> <span class="text-gray-900">${f.contract_year || '-'}</span></div>
        <div><span class="font-medium text-gray-700">계약월:</span> <span class="text-gray-900">${f.contract_month || '-'}</span></div>
        <div><span class="font-medium text-gray-700">분기:</span> <span class="text-gray-900">${f.contract_quarter || '-'}</span></div>
        <div><span class="font-medium text-gray-700">설치일:</span> <span class="text-gray-900">${formatDate(f.installation_date)}</span></div>
        <div><span class="font-medium text-gray-700">해지일:</span> <span class="text-gray-900">${formatDate(f.termination_date)}</span></div>
        <div><span class="font-medium text-gray-700">계약종료일:</span> <span class="text-gray-900">${formatDate(f.contract_end_date)}</span></div>
        <div><span class="font-medium text-gray-700">설치구분:</span> <span class="text-gray-900">${f.installation_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">계약번호:</span> <span class="text-gray-900">${f.contract_number || '-'}</span></div>
        <div><span class="font-medium text-gray-700">약정구분:</span> <span class="text-gray-900">${f.contract_type || '-'}</span></div>
      </div>
    `;
  }

  // 주소정보 탭
  function renderAddressTab(f) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div><span class="font-medium text-gray-700">지역타입:</span> <span class="text-gray-900">${f.region_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">지역구분:</span> <span class="text-gray-900">${f.region || '-'}</span></div>
        <div><span class="font-medium text-gray-700">행정구역:</span> <span class="text-gray-900">${f.district || '-'}</span></div>
        <div class="col-span-2"><span class="font-medium text-gray-700">도로명주소:</span> <span class="text-gray-900">${f.road_address || '-'}</span></div>
        <div class="col-span-2"><span class="font-medium text-gray-700">상세주소:</span> <span class="text-gray-900">${f.detail_address || '-'}</span></div>
      </div>
    `;
  }

  // 결제정보 탭
  function renderPaymentTab(f) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div><span class="font-medium text-gray-700">은행명:</span> <span class="text-gray-900">${f.bank_name || '-'}</span></div>
        <div><span class="font-medium text-gray-700">계좌번호:</span> <span class="text-gray-900">${f.account_number || '-'}</span></div>
        <div><span class="font-medium text-gray-700">예금주:</span> <span class="text-gray-900">${f.account_holder || '-'}</span></div>
        <div><span class="font-medium text-gray-700">단가:</span> <span class="text-gray-900">${f.unit_price ? f.unit_price.toLocaleString() + '원' : '-'}</span></div>
        <div><span class="font-medium text-gray-700">출금일:</span> <span class="text-gray-900">${f.withdrawal_day ? f.withdrawal_day + '일' : '-'}</span></div>
        <div><span class="font-medium text-gray-700">렌탈료 계:</span> <span class="text-gray-900">${f.rental_fee_total ? f.rental_fee_total.toLocaleString() + '원' : '-'}</span></div>
      </div>
    `;
  }

  // 장비정보 탭
  function renderEquipmentTab(f) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div><span class="font-medium text-gray-700">모델명:</span> <span class="text-gray-900">${f.model_name || '-'}</span></div>
        <div><span class="font-medium text-gray-700">POS:</span> <span class="text-gray-900">${f.pos_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">T/O 계:</span> <span class="text-gray-900">${f.to_count || 0}</span></div>
        <div><span class="font-medium text-gray-700">수량:</span> <span class="text-gray-900">${f.quantity || 0}</span></div>
        <div><span class="font-medium text-gray-700">마스터:</span> <span class="text-gray-900">${f.master_count || 0}</span></div>
        <div><span class="font-medium text-gray-700">QR:</span> <span class="text-gray-900">${f.qr_count || 0}</span></div>
        <div><span class="font-medium text-gray-700">거치대 계:</span> <span class="text-gray-900">${f.stand_total || 0}</span></div>
        <div><span class="font-medium text-gray-700">표준:</span> <span class="text-gray-900">${f.stand_standard || 0}</span></div>
        <div><span class="font-medium text-gray-700">평판:</span> <span class="text-gray-900">${f.stand_flat || 0}</span></div>
        <div><span class="font-medium text-gray-700">확장:</span> <span class="text-gray-900">${f.stand_extended || 0}</span></div>
        <div><span class="font-medium text-gray-700">충전기set:</span> <span class="text-gray-900">${f.charger_set || 0}</span></div>
        <div><span class="font-medium text-gray-700">공유기:</span> <span class="text-gray-900">${f.router || 0}</span></div>
        <div><span class="font-medium text-gray-700">배터리:</span> <span class="text-gray-900">${f.battery || 0}</span></div>
        <div><span class="font-medium text-gray-700">VAN:</span> <span class="text-gray-900">${f.van_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">ASP ID:</span> <span class="text-gray-900">${f.asp_id || '-'}</span></div>
        <div><span class="font-medium text-gray-700">ASP PW:</span> <span class="text-gray-900">${f.asp_pw || '-'}</span></div>
        <div class="col-span-2"><span class="font-medium text-gray-700">ASP URL:</span> <span class="text-gray-900">${f.asp_url || '-'}</span></div>
      </div>
    `;
  }

  // 운영정보 탭
  function renderOperationTab(f) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div><span class="font-medium text-gray-700">CRM 구분:</span> <span class="text-gray-900">${f.crm_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">Ai매출업:</span> <span class="text-gray-900">${f.ai_sales_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">렌탈사:</span> <span class="text-gray-900">${f.rental_company || '-'}</span></div>
        <div><span class="font-medium text-gray-700">동작구분:</span> <span class="text-gray-900">${f.operation_type || '-'}</span></div>
        <div><span class="font-medium text-gray-700">설치담당처:</span> <span class="text-gray-900">${f.installation_manager || '-'}</span></div>
        <div><span class="font-medium text-gray-700">관리대리점:</span> <span class="text-gray-900">${f.management_agency || '-'}</span></div>
        <div class="col-span-2"><span class="font-medium text-gray-700">비고:</span> <span class="text-gray-900">${f.notes || '-'}</span></div>
      </div>
    `;
  }

  // 모달 닫기
  function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    window.currentFranchiseId = null;
  }

  // 검색
  function search() {
    currentSearch = document.getElementById('search-input').value;
    currentPage = 1;
    loadList();
  }

  // 상태 필터
  function filterStatus() {
    currentStatus = document.getElementById('status-filter').value;
    currentPage = 1;
    loadList();
  }

  // 지역 필터
  function filterRegion() {
    currentRegion = document.getElementById('region-filter').value;
    currentPage = 1;
    loadList();
  }

  // 필터 초기화
  function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('region-filter').value = '';
    currentSearch = '';
    currentStatus = '';
    currentRegion = '';
    currentPage = 1;
    loadList();
  }

  // 페이지 이동
  function goToPage(page) {
    currentPage = page;
    loadList();
  }

  // 폼 표시 (등록/수정)
  function showForm(id = null) {
    alert('가맹점 등록/수정 기능은 추후 구현 예정입니다.');
  }

  // 수정
  function editFranchise(id) {
    showForm(id);
  }

  // window에 바인딩
  window.franchise = {
    loadFranchisePage,
    showDetail,
    switchTab,
    closeModal,
    search,
    filterStatus,
    filterRegion,
    resetFilters,
    goToPage,
    showForm,
    editFranchise
  };

  console.log('✅ 가맹점현황 모듈 로드 완료');
})();
