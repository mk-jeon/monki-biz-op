// 설치현황 관련 함수

let currentInstallationPage = 1;
let currentInstallationViewMode = 'list'; // 'list' or 'kanban'
let installationTypes = []; // 설치유형 목록

/**
 * 설치 정렬 처리 함수
 */
function handleSort_installation(field) {
  window.handleSort(field, 'installation', () => loadInstallationList(currentInstallationPage));
}

/**
 * 날짜 포맷 함수
 */
function formatInstallationDate(dateString) {
  if (!dateString) return '-';
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

/**
 * 설치현황 페이지 로드
 */
async function loadInstallationPage() {
  console.log('✅ loadInstallationPage 호출됨');
  try {
    if (typeof loadDropdownItems === 'function') {
      installationTypes = await loadDropdownItems('installation_type');
      console.log('✅ installationTypes 로드 완료:', installationTypes.length);
    }
  } catch (error) {
    console.error('드롭다운 로드 오류:', error);
  }
  
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
      'waiting': { text: '설치대기', color: 'bg-gray-500' },
      'in_progress': { text: '설치 중', color: 'bg-blue-500' },
      'hold': { text: '설치보류', color: 'bg-yellow-500' },
      'completed': { text: '설치완료', color: 'bg-green-500' },
      'cancelled': { text: '설치취소', color: 'bg-red-500' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치현황 (${pagination.total}건)
            </h2>
            <div class="flex space-x-2">
              <button onclick="toggleInstallationViewMode()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
                <i class="fas fa-${currentInstallationViewMode === 'list' ? 'columns' : 'list'} mr-2"></i>
                ${currentInstallationViewMode === 'list' ? '칸반 보기' : '리스트 보기'}
              </button>
              <button onclick="showInstallationNewModal()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <!-- 테이블 -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('id')">
                  ID ${window.sortStates.installation.field === 'id' ? (window.sortStates.installation.order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('status')">
                  상태 ${window.sortStates.installation.field === 'status' ? (window.sortStates.installation.order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('customer_name')">
                  고객명 ${window.sortStates.installation.field === 'customer_name' ? (window.sortStates.installation.order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전화번호
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="handleSort_installation('created_at')">
                  등록일 ${window.sortStates.installation.field === 'created_at' ? (window.sortStates.installation.order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록자
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${installations.length === 0 ? `
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>등록된 설치 건이 없습니다.</p>
                  </td>
                </tr>
              ` : installations.map(item => `
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #${item.id}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusMap[item.status]?.color || 'bg-gray-500'}">
                      ${statusMap[item.status]?.text || item.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.customer_name || '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.phone || '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatInstallationDate(item.created_at)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.created_by_name || '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button onclick="showInstallationDetailModal(${item.id})" class="text-blue-600 hover:text-blue-800 font-medium">
                      <i class="fas fa-eye mr-1"></i>
                      상세
                    </button>
                    <button onclick="showInstallationEditModal(${item.id})" class="text-green-600 hover:text-green-800 font-medium">
                      <i class="fas fa-edit mr-1"></i>
                      수정
                    </button>
                    <button onclick="deleteInstallation(${item.id})" class="text-red-600 hover:text-red-800 font-medium">
                      <i class="fas fa-trash mr-1"></i>
                      삭제
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        ${pagination.totalPages > 1 ? `
          <div class="px-6 py-4 border-t border-gray-200 flex justify-center space-x-2">
            ${Array.from({length: pagination.totalPages}, (_, i) => i + 1).map(p => `
              <button 
                onclick="loadInstallationList(${p})" 
                class="px-3 py-1 ${p === pagination.page ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded transition"
              >
                ${p}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    currentInstallationPage = page;
  } catch (error) {
    console.error('설치 목록 로드 오류:', error);
    document.getElementById('mainContent').innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <p class="text-red-600">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          설치현황을 불러올 수 없습니다: ${error.message}
        </p>
      </div>
    `;
  }
}

/**
 * 설치 상세보기 (5-Tab 구조)
 */
async function showInstallationDetailModal(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const item = response.data.installation;

    const statusMap = {
      'waiting': '설치대기',
      'in_progress': '설치 중',
      'hold': '설치보류',
      'completed': '설치완료',
      'cancelled': '설치취소'
    };

    const modalHTML = `
      <div id="installationDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-info-circle mr-2 text-purple-600"></i>
              설치 상세 정보
            </h3>
            <button onclick="closeInstallationDetailModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchInstallationDetailTab('basic')" class="installation-detail-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-purple-500 text-purple-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchInstallationDetailTab('finance')" class="installation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchInstallationDetailTab('hardware')" class="installation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchInstallationDetailTab('manage')" class="installation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchInstallationDetailTab('evidence')" class="installation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <!-- Tab 1: 기본 정보 (50개 필드 중 기본 필드) -->
          <div id="installation-detail-tab-basic" class="installation-detail-tab-content">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">고객명</label>
                <p class="text-gray-800">${item.customer_name || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">전화번호</label>
                <p class="text-gray-800">${item.phone || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">이메일</label>
                <p class="text-gray-800">${item.email || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">생년월일</label>
                <p class="text-gray-800">${item.birth_date || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">상태</label>
                <p class="text-gray-800">${statusMap[item.status] || item.status}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">유입경로</label>
                <p class="text-gray-800">${item.inflow_source || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">사업자번호</label>
                <p class="text-gray-800">${item.business_number || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">대표자명</label>
                <p class="text-gray-800">${item.representative || '-'}</p>
              </div>
              <div class="col-span-2">
                <label class="text-sm font-semibold text-gray-600">도로명주소</label>
                <p class="text-gray-800">${item.road_address || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">상세주소</label>
                <p class="text-gray-800">${item.detail_address || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">지역</label>
                <p class="text-gray-800">${item.region || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">지역구분</label>
                <p class="text-gray-800">${item.region_type || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tab 2: 금융 정보 -->
          <div id="installation-detail-tab-finance" class="installation-detail-tab-content hidden">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">은행명</label>
                <p class="text-gray-800">${item.bank_name || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">계좌번호</label>
                <p class="text-gray-800">${item.account_number || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">예금주</label>
                <p class="text-gray-800">${item.account_holder || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">계약유형</label>
                <p class="text-gray-800">${item.contract_type || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">출금일</label>
                <p class="text-gray-800">${item.withdrawal_day || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">월렌탈료</label>
                <p class="text-gray-800">${item.monthly_rental_fee ? item.monthly_rental_fee.toLocaleString() + '원' : '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">보증금</label>
                <p class="text-gray-800">${item.deposit ? item.deposit.toLocaleString() + '원' : '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">계약일</label>
                <p class="text-gray-800">${item.contract_date || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">계약번호</label>
                <p class="text-gray-800">${item.contract_number || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tab 3: H/W 정보 -->
          <div id="installation-detail-tab-hardware" class="installation-detail-tab-content hidden">
            <div class="space-y-6">
              <!-- POS 정보 -->
              <div>
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-desktop mr-2 text-blue-600"></i>
                  POS 시스템
                </h4>
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label class="text-sm font-semibold text-gray-600">대리점</label>
                    <p class="text-gray-800">${item.pos_agency || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">제조사</label>
                    <p class="text-gray-800">${item.pos_vendor || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">모델명</label>
                    <p class="text-gray-800">${item.pos_model || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">프로그램</label>
                    <p class="text-gray-800">${item.pos_program || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">ASP ID</label>
                    <p class="text-gray-800">${item.asp_id || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">ASP 비밀번호</label>
                    <p class="text-gray-800">${item.asp_password || '-'}</p>
                  </div>
                  <div class="col-span-2">
                    <label class="text-sm font-semibold text-gray-600">ASP URL</label>
                    <p class="text-gray-800">${item.asp_url || '-'}</p>
                  </div>
                </div>
              </div>

              <!-- 테이블오더 & 거치대 -->
              <div>
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-tablet-alt mr-2 text-green-600"></i>
                  테이블오더 & 거치대
                </h4>
                <div class="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label class="text-sm font-semibold text-gray-600">테이블오더</label>
                    <p class="text-gray-800">${item.table_order_qty || 0}대</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">표준형 거치대</label>
                    <p class="text-gray-800">${item.stand_standard || 0}개</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">평면형 거치대</label>
                    <p class="text-gray-800">${item.stand_flat || 0}개</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">연장형 거치대</label>
                    <p class="text-gray-800">${item.stand_extended || 0}개</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">충전기</label>
                    <p class="text-gray-800">${item.charger_qty || 0}개</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">배터리</label>
                    <p class="text-gray-800">${item.battery_qty || 0}개</p>
                  </div>
                </div>
              </div>

              <!-- 네트워크 & 기타 -->
              <div>
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-network-wired mr-2 text-orange-600"></i>
                  네트워크 & 기타
                </h4>
                <div class="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label class="text-sm font-semibold text-gray-600">공유기</label>
                    <p class="text-gray-800">${item.router_qty || 0}대</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">키오스크</label>
                    <p class="text-gray-800">${item.kiosk_qty || 0}대</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">주방프린터</label>
                    <p class="text-gray-800">${item.kitchen_printer_qty || 0}대</p>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-gray-600">호출벨</label>
                    <p class="text-gray-800">${item.call_bell_qty || 0}개</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 4: 관리 정보 -->
          <div id="installation-detail-tab-manage" class="installation-detail-tab-content hidden">
            <div class="space-y-4">
              <!-- 부가서비스 -->
              <div>
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-star mr-2 text-yellow-600"></i>
                  부가서비스
                </h4>
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div class="flex items-center">
                    <input type="checkbox" ${item.crm_service ? 'checked' : ''} disabled class="w-4 h-4 text-purple-600 border-gray-300 rounded">
                    <label class="ml-2 text-sm text-gray-800">CRM 서비스</label>
                  </div>
                  <div class="flex items-center">
                    <input type="checkbox" ${item.ai_sales_service ? 'checked' : ''} disabled class="w-4 h-4 text-purple-600 border-gray-300 rounded">
                    <label class="ml-2 text-sm text-gray-800">AI 매출분석 서비스</label>
                  </div>
                </div>
              </div>

              <!-- 메모 -->
              ${item.notes ? `
                <div>
                  <label class="text-sm font-semibold text-gray-600 block mb-2">메모</label>
                  <p class="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">${item.notes}</p>
                </div>
              ` : '<p class="text-gray-500">메모가 없습니다.</p>'}
            </div>
          </div>

          <!-- Tab 5: 증빙 자료 (설치 특화: 계약서 작성 여부 체크박스만) -->
          <div id="installation-detail-tab-evidence" class="installation-detail-tab-content hidden">
            <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                증빙 자료 확인
              </h4>
              <div class="space-y-3">
                <label class="flex items-center space-x-3">
                  <input type="checkbox" ${item.contract_completed ? 'checked' : ''} disabled class="w-5 h-5 text-purple-600 border-gray-300 rounded">
                  <span class="text-sm font-medium text-gray-800">
                    <i class="fas fa-file-contract mr-2 text-green-600"></i>
                    계약서 작성 여부
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- 하단 버튼 -->
          <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
            <button onclick="closeInstallationDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              닫기
            </button>
            <button onclick="closeInstallationDetailModal(); showInstallationEditModal(${id})" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
              <i class="fas fa-edit mr-2"></i>
              수정
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Tab 전환 함수 등록 (상세보기용)
    window.switchInstallationDetailTab = function(tabName) {
      document.querySelectorAll('.installation-detail-tab-btn').forEach(btn => {
        btn.classList.remove('text-purple-600', 'border-purple-500');
        btn.classList.add('text-gray-500', 'border-transparent');
      });
      
      const activeBtn = document.querySelector(`.installation-detail-tab-btn[data-tab="${tabName}"]`);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-purple-600', 'border-purple-500');
      }
      
      document.querySelectorAll('.installation-detail-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const activeContent = document.getElementById(`installation-detail-tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    };

  } catch (error) {
    console.error('설치 상세 모달 오류:', error);
    alert('상세 정보를 불러올 수 없습니다.');
  }
}

function closeInstallationDetailModal() {
  const modal = document.getElementById('installationDetailModal');
  if (modal) modal.remove();
}

/**
 * 설치 수정 모달 (5-Tab 구조 + 50개 필드)
 */
async function showInstallationEditModal(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const item = response.data.installation;

    const modalHTML = `
      <div id="installationEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2 text-purple-600"></i>
              설치 수정
            </h3>
            <button onclick="closeInstallationEditModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchInstallationTab('basic')" class="installation-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-purple-500 text-purple-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchInstallationTab('finance')" class="installation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchInstallationTab('hardware')" class="installation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchInstallationTab('manage')" class="installation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchInstallationTab('evidence')" class="installation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <form id="installationEditForm">
            <!-- Tab 1: 기본 정보 -->
            <div id="installation-tab-basic" class="installation-tab-content">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">고객명 <span class="text-red-500">*</span></label>
                  <input type="text" id="editCustomerName" value="${item.customer_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
                  <input type="tel" id="editPhone" value="${item.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                  <input type="email" id="editEmail" value="${item.email || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">생년월일</label>
                  <input type="date" id="editBirthDate" value="${item.birth_date || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">상태</label>
                  <select id="editStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="waiting" ${item.status === 'waiting' ? 'selected' : ''}>설치대기</option>
                    <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>설치 중</option>
                    <option value="hold" ${item.status === 'hold' ? 'selected' : ''}>설치보류</option>
                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>설치완료</option>
                    <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>설치취소</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">유입경로</label>
                  <input type="text" id="editInflowSource" value="${item.inflow_source || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">사업자번호</label>
                  <input type="text" id="editBusinessNumber" value="${item.business_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">대표자명</label>
                  <input type="text" id="editRepresentative" value="${item.representative || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">도로명주소</label>
                  <input type="text" id="editRoadAddress" value="${item.road_address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">상세주소</label>
                  <input type="text" id="editDetailAddress" value="${item.detail_address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">지역</label>
                  <input type="text" id="editRegion" value="${item.region || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">지역구분</label>
                  <select id="editRegionType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">선택</option>
                    <option value="서울" ${item.region_type === '서울' ? 'selected' : ''}>서울</option>
                    <option value="경기" ${item.region_type === '경기' ? 'selected' : ''}>경기</option>
                    <option value="인천" ${item.region_type === '인천' ? 'selected' : ''}>인천</option>
                    <option value="기타" ${item.region_type === '기타' ? 'selected' : ''}>기타</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tab 2: 금융 정보 -->
            <div id="installation-tab-finance" class="installation-tab-content hidden">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">은행명</label>
                  <input type="text" id="editBankName" value="${item.bank_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계좌번호</label>
                  <input type="text" id="editAccountNumber" value="${item.account_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">예금주</label>
                  <input type="text" id="editAccountHolder" value="${item.account_holder || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계약유형</label>
                  <select id="editContractType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">선택</option>
                    <option value="렌탈" ${item.contract_type === '렌탈' ? 'selected' : ''}>렌탈</option>
                    <option value="일시불" ${item.contract_type === '일시불' ? 'selected' : ''}>일시불</option>
                    <option value="리스" ${item.contract_type === '리스' ? 'selected' : ''}>리스</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">출금일</label>
                  <input type="number" id="editWithdrawalDay" value="${item.withdrawal_day || ''}" min="1" max="31" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">월렌탈료 (원)</label>
                  <input type="number" id="editMonthlyRentalFee" value="${item.monthly_rental_fee || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">보증금 (원)</label>
                  <input type="number" id="editDeposit" value="${item.deposit || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계약일</label>
                  <input type="date" id="editContractDate" value="${item.contract_date || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계약번호</label>
                  <input type="text" id="editContractNumber" value="${item.contract_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
              </div>
            </div>

            <!-- Tab 3: H/W 정보 -->
            <div id="installation-tab-hardware" class="installation-tab-content hidden">
              <div class="space-y-6">
                <!-- POS 정보 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-desktop mr-2 text-blue-600"></i>
                    POS 시스템
                  </h4>
                  <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">대리점</label>
                      <input type="text" id="editPosAgency" value="${item.pos_agency || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">제조사</label>
                      <input type="text" id="editPosVendor" value="${item.pos_vendor || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">모델명</label>
                      <input type="text" id="editPosModel" value="${item.pos_model || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">프로그램</label>
                      <input type="text" id="editPosProgram" value="${item.pos_program || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">ASP ID</label>
                      <input type="text" id="editAspId" value="${item.asp_id || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">ASP 비밀번호</label>
                      <input type="text" id="editAspPassword" value="${item.asp_password || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div class="col-span-2">
                      <label class="block text-sm font-semibold text-gray-700 mb-2">ASP URL</label>
                      <input type="text" id="editAspUrl" value="${item.asp_url || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                  </div>
                </div>

                <!-- 테이블오더 & 거치대 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-tablet-alt mr-2 text-green-600"></i>
                    테이블오더 & 거치대
                  </h4>
                  <div class="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">테이블오더</label>
                      <input type="number" id="editTableOrderQty" value="${item.table_order_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">표준형 거치대</label>
                      <input type="number" id="editStandStandard" value="${item.stand_standard || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">평면형 거치대</label>
                      <input type="number" id="editStandFlat" value="${item.stand_flat || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">연장형 거치대</label>
                      <input type="number" id="editStandExtended" value="${item.stand_extended || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">충전기</label>
                      <input type="number" id="editChargerQty" value="${item.charger_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">배터리</label>
                      <input type="number" id="editBatteryQty" value="${item.battery_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                  </div>
                </div>

                <!-- 네트워크 & 기타 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-network-wired mr-2 text-orange-600"></i>
                    네트워크 & 기타
                  </h4>
                  <div class="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">공유기</label>
                      <input type="number" id="editRouterQty" value="${item.router_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">키오스크</label>
                      <input type="number" id="editKioskQty" value="${item.kiosk_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">주방프린터</label>
                      <input type="number" id="editKitchenPrinterQty" value="${item.kitchen_printer_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">호출벨</label>
                      <input type="number" id="editCallBellQty" value="${item.call_bell_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 4: 관리 정보 -->
            <div id="installation-tab-manage" class="installation-tab-content hidden">
              <div class="space-y-4">
                <!-- 부가서비스 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-star mr-2 text-yellow-600"></i>
                    부가서비스
                  </h4>
                  <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div class="flex items-center">
                      <input type="checkbox" id="editCrmService" ${item.crm_service ? 'checked' : ''} class="w-4 h-4 text-purple-600 border-gray-300 rounded">
                      <label class="ml-2 text-sm text-gray-800">CRM 서비스</label>
                    </div>
                    <div class="flex items-center">
                      <input type="checkbox" id="editAiSalesService" ${item.ai_sales_service ? 'checked' : ''} class="w-4 h-4 text-purple-600 border-gray-300 rounded">
                      <label class="ml-2 text-sm text-gray-800">AI 매출분석 서비스</label>
                    </div>
                  </div>
                </div>

                <!-- 메모 -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">메모</label>
                  <textarea id="editMemo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="추가 메모사항을 입력하세요...">${item.notes || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- Tab 5: 증빙 자료 (설치 특화: 계약서 작성 여부 체크박스만) -->
            <div id="installation-tab-evidence" class="installation-tab-content hidden">
              <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                  증빙 자료 확인
                </h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="editContractCompleted" ${item.contract_completed ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-file-contract mr-2 text-green-600"></i>
                      계약서 작성 여부
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button type="button" onclick="closeInstallationEditModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
                <i class="fas fa-times mr-2"></i>
                취소
              </button>
              <button type="submit" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                <i class="fas fa-save mr-2"></i>
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Tab 전환 함수 등록
    window.switchInstallationTab = function(tabName) {
      document.querySelectorAll('.installation-tab-btn').forEach(btn => {
        btn.classList.remove('text-purple-600', 'border-purple-500');
        btn.classList.add('text-gray-500', 'border-transparent');
      });
      
      const activeBtn = document.querySelector(`.installation-tab-btn[data-tab="${tabName}"]`);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-purple-600', 'border-purple-500');
      }
      
      document.querySelectorAll('.installation-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const activeContent = document.getElementById(`installation-tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    };

    // 폼 제출 이벤트
    document.getElementById('installationEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateInstallation(id);
    });

  } catch (error) {
    console.error('설치 수정 모달 오류:', error);
    alert('수정 모달을 불러올 수 없습니다.');
  }
}

function closeInstallationEditModal() {
  const modal = document.getElementById('installationEditModal');
  if (modal) modal.remove();
}

/**
 * 설치 정보 업데이트 (50개 필드 안전 처리)
 */
async function updateInstallation(id) {
  try {
    const data = {
      // 기본 정보 (Tab 1)
      customer_name: document.getElementById('editCustomerName')?.value ?? '',
      phone: document.getElementById('editPhone')?.value ?? '',
      email: document.getElementById('editEmail')?.value ?? '',
      birth_date: document.getElementById('editBirthDate')?.value ?? null,
      status: document.getElementById('editStatus')?.value ?? 'waiting',
      inflow_source: document.getElementById('editInflowSource')?.value ?? '',
      business_number: document.getElementById('editBusinessNumber')?.value ?? '',
      representative: document.getElementById('editRepresentative')?.value ?? '',
      road_address: document.getElementById('editRoadAddress')?.value ?? '',
      detail_address: document.getElementById('editDetailAddress')?.value ?? '',
      region: document.getElementById('editRegion')?.value ?? '',
      region_type: document.getElementById('editRegionType')?.value ?? '',

      // 금융 정보 (Tab 2)
      bank_name: document.getElementById('editBankName')?.value ?? '',
      account_number: document.getElementById('editAccountNumber')?.value ?? '',
      account_holder: document.getElementById('editAccountHolder')?.value ?? '',
      contract_type: document.getElementById('editContractType')?.value ?? '',
      withdrawal_day: parseInt(document.getElementById('editWithdrawalDay')?.value || '0') || null,
      monthly_rental_fee: parseInt(document.getElementById('editMonthlyRentalFee')?.value || '0') || null,
      deposit: parseInt(document.getElementById('editDeposit')?.value || '0') || null,
      contract_date: document.getElementById('editContractDate')?.value ?? null,
      contract_number: document.getElementById('editContractNumber')?.value ?? '',

      // H/W: POS (Tab 3)
      pos_agency: document.getElementById('editPosAgency')?.value ?? '',
      pos_vendor: document.getElementById('editPosVendor')?.value ?? '',
      pos_model: document.getElementById('editPosModel')?.value ?? '',
      pos_program: document.getElementById('editPosProgram')?.value ?? '',
      asp_id: document.getElementById('editAspId')?.value ?? '',
      asp_password: document.getElementById('editAspPassword')?.value ?? '',
      asp_url: document.getElementById('editAspUrl')?.value ?? '',

      // H/W: 테이블오더 & 거치대 (Tab 3)
      table_order_qty: parseInt(document.getElementById('editTableOrderQty')?.value || '0'),
      stand_standard: parseInt(document.getElementById('editStandStandard')?.value || '0'),
      stand_flat: parseInt(document.getElementById('editStandFlat')?.value || '0'),
      stand_extended: parseInt(document.getElementById('editStandExtended')?.value || '0'),
      charger_qty: parseInt(document.getElementById('editChargerQty')?.value || '0'),
      battery_qty: parseInt(document.getElementById('editBatteryQty')?.value || '0'),

      // H/W: 네트워크 & 기타 (Tab 3)
      router_qty: parseInt(document.getElementById('editRouterQty')?.value || '0'),
      kiosk_qty: parseInt(document.getElementById('editKioskQty')?.value || '0'),
      kitchen_printer_qty: parseInt(document.getElementById('editKitchenPrinterQty')?.value || '0'),
      call_bell_qty: parseInt(document.getElementById('editCallBellQty')?.value || '0'),

      // 관리 정보 (Tab 4)
      crm_service: document.getElementById('editCrmService')?.checked ? 1 : 0,
      ai_sales_service: document.getElementById('editAiSalesService')?.checked ? 1 : 0,
      notes: document.getElementById('editMemo')?.value ?? '',

      // 증빙 자료 (Tab 5)
      contract_completed: document.getElementById('editContractCompleted')?.checked ? 1 : 0
    };

    await axios.put(`/api/installations/${id}`, data);
    
    alert('수정되었습니다.');
    closeInstallationEditModal();
    closeInstallationDetailModal();
    
    // 리스트 새로고침
    if (currentInstallationViewMode === 'list') {
      loadInstallationList(currentInstallationPage);
    } else {
      loadInstallationKanban();
    }
  } catch (error) {
    console.error('설치 수정 오류:', error);
    alert(error.response?.data?.error || '수정 중 오류가 발생했습니다.');
  }
}

/**
 * 신규 등록 모달 (5-Tab 구조)
 */
async function showInstallationNewModal() {
  const modalHTML = `
    <div id="installationNewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- 모달 헤더 -->
        <div class="flex items-center justify-between mb-6 pb-4 border-b">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-plus mr-2 text-purple-600"></i>
            신규 설치 등록
          </h3>
          <button onclick="closeInstallationNewModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <!-- 5-Tab 네비게이션 -->
        <div class="mb-6 border-b">
          <nav class="flex space-x-2">
            <button type="button" onclick="switchInstallationNewTab('basic')" class="installation-new-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-purple-500 text-purple-600" data-tab="basic">
              <i class="fas fa-user mr-2"></i>기본
            </button>
            <button type="button" onclick="switchInstallationNewTab('finance')" class="installation-new-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
              <i class="fas fa-won-sign mr-2"></i>금융
            </button>
            <button type="button" onclick="switchInstallationNewTab('hardware')" class="installation-new-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
              <i class="fas fa-laptop mr-2"></i>H/W
            </button>
            <button type="button" onclick="switchInstallationNewTab('manage')" class="installation-new-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
              <i class="fas fa-cog mr-2"></i>관리
            </button>
            <button type="button" onclick="switchInstallationNewTab('evidence')" class="installation-new-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
              <i class="fas fa-folder-open mr-2"></i>증빙
            </button>
          </nav>
        </div>
        
        <form id="installationNewForm">
          <!-- Tab 1: 기본 정보 -->
          <div id="installation-new-tab-basic" class="installation-new-tab-content">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">고객명 <span class="text-red-500">*</span></label>
                <input type="text" id="newCustomerName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
                <input type="tel" id="newPhone" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                <input type="email" id="newEmail" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">생년월일</label>
                <input type="date" id="newBirthDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">유입경로</label>
                <input type="text" id="newInflowSource" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">사업자번호</label>
                <input type="text" id="newBusinessNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">대표자명</label>
                <input type="text" id="newRepresentative" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2">도로명주소</label>
                <input type="text" id="newRoadAddress" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">상세주소</label>
                <input type="text" id="newDetailAddress" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">지역</label>
                <input type="text" id="newRegion" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">지역구분</label>
                <select id="newRegionType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">선택</option>
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tab 2: 금융 정보 -->
          <div id="installation-new-tab-finance" class="installation-new-tab-content hidden">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">은행명</label>
                <input type="text" id="newBankName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">계좌번호</label>
                <input type="text" id="newAccountNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">예금주</label>
                <input type="text" id="newAccountHolder" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">계약유형</label>
                <select id="newContractType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">선택</option>
                  <option value="렌탈">렌탈</option>
                  <option value="일시불">일시불</option>
                  <option value="리스">리스</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">출금일</label>
                <input type="number" id="newWithdrawalDay" min="1" max="31" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">월렌탈료 (원)</label>
                <input type="number" id="newMonthlyRentalFee" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">보증금 (원)</label>
                <input type="number" id="newDeposit" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">계약일</label>
                <input type="date" id="newContractDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">계약번호</label>
                <input type="text" id="newContractNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>
          </div>

          <!-- Tab 3: H/W 정보 (동일 구조) -->
          <div id="installation-new-tab-hardware" class="installation-new-tab-content hidden">
            <p class="text-gray-500">H/W 정보는 선택사항입니다.</p>
          </div>

          <!-- Tab 4: 관리 정보 -->
          <div id="installation-new-tab-manage" class="installation-new-tab-content hidden">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">메모</label>
              <textarea id="newMemo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
          </div>

          <!-- Tab 5: 증빙 자료 -->
          <div id="installation-new-tab-evidence" class="installation-new-tab-content hidden">
            <p class="text-gray-500">증빙 자료는 등록 후 수정 가능합니다.</p>
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
            <button type="button" onclick="closeInstallationNewModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              취소
            </button>
            <button type="submit" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
              <i class="fas fa-check mr-2"></i>
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Tab 전환 함수 등록
  window.switchInstallationNewTab = function(tabName) {
    document.querySelectorAll('.installation-new-tab-btn').forEach(btn => {
      btn.classList.remove('text-purple-600', 'border-purple-500');
      btn.classList.add('text-gray-500', 'border-transparent');
    });
    
    const activeBtn = document.querySelector(`.installation-new-tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('text-gray-500', 'border-transparent');
      activeBtn.classList.add('text-purple-600', 'border-purple-500');
    }
    
    document.querySelectorAll('.installation-new-tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`installation-new-tab-${tabName}`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  };

  // 폼 제출
  document.getElementById('installationNewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createInstallation();
  });
}

function closeInstallationNewModal() {
  const modal = document.getElementById('installationNewModal');
  if (modal) modal.remove();
}

/**
 * 신규 설치 생성
 */
async function createInstallation() {
  try {
    const data = {
      customer_name: document.getElementById('newCustomerName')?.value ?? '',
      phone: document.getElementById('newPhone')?.value ?? '',
      email: document.getElementById('newEmail')?.value ?? '',
      birth_date: document.getElementById('newBirthDate')?.value ?? null,
      inflow_source: document.getElementById('newInflowSource')?.value ?? '',
      business_number: document.getElementById('newBusinessNumber')?.value ?? '',
      representative: document.getElementById('newRepresentative')?.value ?? '',
      road_address: document.getElementById('newRoadAddress')?.value ?? '',
      detail_address: document.getElementById('newDetailAddress')?.value ?? '',
      region: document.getElementById('newRegion')?.value ?? '',
      region_type: document.getElementById('newRegionType')?.value ?? '',
      bank_name: document.getElementById('newBankName')?.value ?? '',
      account_number: document.getElementById('newAccountNumber')?.value ?? '',
      account_holder: document.getElementById('newAccountHolder')?.value ?? '',
      contract_type: document.getElementById('newContractType')?.value ?? '',
      withdrawal_day: parseInt(document.getElementById('newWithdrawalDay')?.value || '0') || null,
      monthly_rental_fee: parseInt(document.getElementById('newMonthlyRentalFee')?.value || '0') || null,
      deposit: parseInt(document.getElementById('newDeposit')?.value || '0') || null,
      contract_date: document.getElementById('newContractDate')?.value ?? null,
      contract_number: document.getElementById('newContractNumber')?.value ?? '',
      notes: document.getElementById('newMemo')?.value ?? ''
    };

    await axios.post('/api/installations', data);
    
    alert('등록되었습니다.');
    closeInstallationNewModal();
    loadInstallationList(1);
  } catch (error) {
    console.error('설치 등록 오류:', error);
    alert(error.response?.data?.error || '등록 중 오류가 발생했습니다.');
  }
}

/**
 * 설치 삭제
 */
async function deleteInstallation(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`/api/installations/${id}`);
    alert('삭제되었습니다.');
    loadInstallationList(currentInstallationPage);
  } catch (error) {
    console.error('설치 삭제 오류:', error);
    alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.');
  }
}

/**
 * 설치현황 칸반 조회
 */
async function loadInstallationKanban() {
  try {
    const response = await axios.get('/api/installations?show_all=true');
    const installations = response.data.installations || [];

    const groups = {
      'waiting': { title: '설치대기', items: [], color: 'gray' },
      'in_progress': { title: '설치 중', items: [], color: 'blue' },
      'hold': { title: '설치보류', items: [], color: 'yellow' },
      'completed': { title: '설치완료', items: [], color: 'green' },
      'cancelled': { title: '설치취소', items: [], color: 'red' }
    };

    installations.forEach(item => {
      if (groups[item.status]) {
        groups[item.status].items.push(item);
      }
    });

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치현황 (칸반)
            </h2>
            <div class="flex space-x-2">
              <button onclick="toggleInstallationViewMode()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
                <i class="fas fa-list mr-2"></i>
                리스트 보기
              </button>
              <button onclick="showInstallationNewModal()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-5 gap-4">
            ${Object.entries(groups).map(([status, group]) => `
              <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-bold text-${group.color}-600 mb-4 flex items-center justify-between">
                  ${group.title}
                  <span class="bg-${group.color}-100 text-${group.color}-800 px-2 py-1 rounded text-sm">${group.items.length}</span>
                </h3>
                <div class="space-y-3" id="kanban-${status}">
                  ${group.items.map(item => `
                    <div class="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition" onclick="showInstallationDetailModal(${item.id})">
                      <div class="font-semibold text-gray-800 mb-1">#${item.id} ${item.customer_name || '-'}</div>
                      <div class="text-xs text-gray-500">${item.phone || '-'}</div>
                      <div class="text-xs text-gray-400 mt-2">${formatInstallationDate(item.created_at)}</div>
                    </div>
                  `).join('')}
                  ${group.items.length === 0 ? '<p class="text-gray-400 text-sm text-center py-4">항목 없음</p>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;

    // SortableJS 초기화
    if (typeof Sortable !== 'undefined') {
      Object.keys(groups).forEach(status => {
        const el = document.getElementById(`kanban-${status}`);
        if (el) {
          Sortable.create(el, {
            group: 'shared',
            animation: 150,
            onEnd: async function (evt) {
              const itemId = evt.item.innerText.match(/#(\d+)/)?.[1];
              const newStatus = evt.to.id.replace('kanban-', '');
              
              if (itemId && newStatus) {
                try {
                  await axios.put(`/api/installations/${itemId}/status`, { status: newStatus });
                  console.log(`설치 #${itemId} 상태 변경: ${newStatus}`);
                } catch (error) {
                  console.error('상태 변경 오류:', error);
                  alert('상태 변경 중 오류가 발생했습니다.');
                  loadInstallationKanban();
                }
              }
            }
          });
        }
      });
    }

  } catch (error) {
    console.error('설치 칸반 로드 오류:', error);
    document.getElementById('mainContent').innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <p class="text-red-600">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          설치현황 칸반을 불러올 수 없습니다: ${error.message}
        </p>
      </div>
    `;
  }
}
