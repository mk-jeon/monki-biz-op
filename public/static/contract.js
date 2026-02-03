// 계약현황 관련 함수

let currentContractPage = 1;
let currentContractViewMode = 'list'; // 'list' or 'kanban'
let contractTypes = []; // 계약유형 목록
let registrationReasons = []; // 등록사유 목록

/**
 * 계약 정렬 처리 함수
 */
function handleSort_contract(field) {
  window.handleSort(field, 'contract', () => loadContractList(currentContractPage));
}

/**
 * 날짜 포맷 함수
 */
function formatContractDate(dateString) {
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
 * 계약현황 페이지 로드
 */
async function loadContractPage() {
  // 드롭다운 항목 먼저 로드 및 캐시 저장
  await Promise.all([
    loadDropdownItems('contract_type').then(items => {
      contractTypes = items;
      itemCache['contract_type'] = items;
    }),
    loadDropdownItems('registration_reason').then(items => {
      registrationReasons = items;
      itemCache['registration_reason'] = items;
    })
  ]);
  
  // 리스트 모드로 시작
  loadContractList();
}

/**
 * 리스트/칸반 모드 전환
 */
function toggleContractViewMode() {
  currentContractViewMode = currentContractViewMode === 'list' ? 'kanban' : 'list';
  
  if (currentContractViewMode === 'list') {
    loadContractList();
  } else {
    loadContractKanban();
  }
}

/**
 * 계약현황 리스트 조회
 */
async function loadContractList(page = 1) {
  try {
    const response = await axios.get(`/api/contracts?page=${page}&limit=50`);
    let { contracts, pagination } = response.data;
    
    // 정렬 적용
    const sortState = window.sortStates.contract;
    contracts = window.sortData(contracts, sortState.field, sortState.order, 'contract');

    const statusMap = {
      'waiting': { text: '계약대기', color: 'bg-gray-500' },
      'in_progress': { text: '계약 중', color: 'bg-blue-500' },
      'signature_pending': { text: '서명대기', color: 'bg-purple-500' },
      'hold': { text: '계약보류', color: 'bg-yellow-500' },
      'completed': { text: '계약완료', color: 'bg-green-500' },
      'cancelled': { text: '취소', color: 'bg-red-500' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-file-contract mr-2 text-green-600"></i>
              계약현황
            </h2>
            <div class="flex space-x-2">
              <button onclick="showContractArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="showMigrateToInstallationModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                설치 이관
              </button>
              <button onclick="toggleContractViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-${currentContractViewMode === 'list' ? 'th-large' : 'list'} mr-2"></i>
                ${currentContractViewMode === 'list' ? '칸반 보기' : '리스트 보기'}
              </button>
              <button onclick="showContractForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <!-- 리스트 테이블 -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_contract('id')">
                  <div class="flex items-center">
                    ID
                    ${window.getSortIcon('id', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_contract('status')">
                  <div class="flex items-center">
                    상태
                    ${window.getSortIcon('status', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_contract('customer_name')">
                  <div class="flex items-center">
                    고객명
                    ${window.getSortIcon('customer_name', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_contract('phone')">
                  <div class="flex items-center">
                    전화번호
                    ${window.getSortIcon('phone', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">등록사유</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">옵션</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_contract('created_at')">
                  <div class="flex items-center">
                    등록일
                    ${window.getSortIcon('created_at', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_contract('created_by_name')">
                  <div class="flex items-center">
                    등록자
                    ${window.getSortIcon('created_by_name', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">수정자</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${contracts.length === 0 ? `
                <tr>
                  <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>등록된 계약이 없습니다.</p>
                  </td>
                </tr>
              ` : contracts.map(item => {
                const status = statusMap[item.status] || statusMap['waiting'];
                return `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="viewContractDetail(${item.id})">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.id}</td>
                    <td class="px-4 py-3">
                      <span class="${status.color} text-white text-xs px-2 py-1 rounded">${status.text}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.phone}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.registration_reason || '-'}</td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-1">
                        ${item.pre_installation ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">선설치</span>' : ''}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${formatContractDate(item.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.created_by_name}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.updated_by_name || '-'}</td>
                    <td class="px-4 py-3 text-center">
                      <button onclick="event.stopPropagation(); showContractEditModal(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button onclick="event.stopPropagation(); deleteContract(${item.id})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        ${pagination.totalPages > 1 ? `
          <div class="p-4 border-t border-gray-200 flex justify-center space-x-2">
            ${pagination.page > 1 ? `
              <button onclick="loadContractList(${pagination.page - 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-left"></i>
              </button>
            ` : ''}
            
            <span class="px-4 py-2 bg-indigo-600 text-white rounded">
              ${pagination.page} / ${pagination.totalPages}
            </span>
            
            ${pagination.page < pagination.totalPages ? `
              <button onclick="loadContractList(${pagination.page + 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-right"></i>
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    currentContractPage = page;
  } catch (error) {
    console.error('Load contract list error:', error);
    alert('계약 목록을 불러올 수 없습니다.');
  }
}

/**
 * 계약 상세 보기 (5-Tab 모달 구조)
 */
async function viewContractDetail(id) {
  try {
    const response = await axios.get(`/api/contracts/${id}`);
    const item = response.data.contract;

    const statusMap = {
      'waiting': '계약대기',
      'in_progress': '계약 중',
      'signature_pending': '서명대기',
      'hold': '계약보류',
      'completed': '계약완료',
      'cancelled': '취소'
    };

    const modalHTML = `
      <div id="contractDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-info-circle mr-2 text-green-600"></i>
              계약 상세 정보
            </h3>
            <button onclick="closeContractDetailModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchContractDetailTab('basic')" class="contract-detail-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-green-500 text-green-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchContractDetailTab('finance')" class="contract-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchContractDetailTab('hardware')" class="contract-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchContractDetailTab('manage')" class="contract-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchContractDetailTab('evidence')" class="contract-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <!-- Tab 1: 기본 정보 -->
          <div id="contract-detail-tab-basic" class="contract-detail-tab-content">
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
                <label class="text-sm font-semibold text-gray-600">상태</label>
                <p class="text-gray-800">${statusMap[item.status] || item.status}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">등록사유</label>
                <p class="text-gray-800">${item.registration_reason || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tab 2: 금융 정보 -->
          <div id="contract-detail-tab-finance" class="contract-detail-tab-content hidden">
            <p class="text-gray-500">금융 정보가 없습니다.</p>
          </div>

          <!-- Tab 3: H/W 정보 -->
          <div id="contract-detail-tab-hardware" class="contract-detail-tab-content hidden">
            <p class="text-gray-500">H/W 정보가 없습니다.</p>
          </div>

          <!-- Tab 4: 관리 정보 -->
          <div id="contract-detail-tab-manage" class="contract-detail-tab-content hidden">
            ${item.notes ? `
              <div>
                <label class="text-sm font-semibold text-gray-600 block mb-2">메모</label>
                <p class="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">${item.notes}</p>
              </div>
            ` : '<p class="text-gray-500">메모가 없습니다.</p>'}
          </div>

          <!-- Tab 5: 증빙 자료 (계약 특화: 선설치 후계약 진행 체크박스만) -->
          <div id="contract-detail-tab-evidence" class="contract-detail-tab-content hidden">
            <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                증빙 자료 확인
              </h4>
              <div class="space-y-3">
                <label class="flex items-center space-x-3">
                  <input type="checkbox" ${item.pre_installation ? 'checked' : ''} disabled class="w-5 h-5 text-purple-600 border-gray-300 rounded">
                  <span class="text-sm font-medium text-gray-800">
                    <i class="fas fa-tools mr-2 text-orange-600"></i>
                    선설치 후계약 진행
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- 버튼 영역 -->
          <div class="flex justify-between items-center pt-6 border-t mt-6">
            <button onclick="showContractEditModal(${item.id})" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              <i class="fas fa-edit mr-2"></i>
              수정
            </button>
            <button onclick="closeContractDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              닫기
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

  } catch (error) {
    console.error('계약 상세 조회 오류:', error);
    alert('상세 정보를 불러올 수 없습니다.');
  }
}

function closeContractDetailModal() {
  const modal = document.getElementById('contractDetailModal');
  if (modal) modal.remove();
}

/**
 * 계약 수정 모달 (5-Tab 구조)
 */
async function showContractEditModal(id) {
  try {
    const response = await axios.get(`/api/contracts/${id}`);
    const item = response.data.contract;

    const modalHTML = `
      <div id="contractEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2 text-green-600"></i>
              계약 수정
            </h3>
            <button onclick="closeContractEditModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchContractTab('basic')" class="contract-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-green-500 text-green-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchContractTab('finance')" class="contract-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchContractTab('hardware')" class="contract-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchContractTab('manage')" class="contract-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchContractTab('evidence')" class="contract-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <form id="contractEditForm">
            <!-- Tab 1: 기본 정보 -->
            <div id="contract-tab-basic" class="contract-tab-content">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">고객명</label>
                  <input type="text" id="editCustomerName" value="${item.customer_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
                  <input type="tel" id="editPhone" value="${item.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">등록사유 <span class="text-red-500">*</span></label>
                  <select id="editRegistrationReason" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required>
                    <option value="">선택하세요</option>
                    ${registrationReasons.map(reason => `
                      <option value="${reason.value}" ${item.registration_reason === reason.value ? 'selected' : ''}>
                        ${reason.label}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">상태</label>
                  <select id="editStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="waiting" ${item.status === 'waiting' ? 'selected' : ''}>계약대기</option>
                    <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>계약 중</option>
                    <option value="signature_pending" ${item.status === 'signature_pending' ? 'selected' : ''}>서명대기</option>
                    <option value="hold" ${item.status === 'hold' ? 'selected' : ''}>계약보류</option>
                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>계약완료</option>
                    <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>취소</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tab 2: 금융 정보 -->
            <div id="contract-tab-finance" class="contract-tab-content hidden">
              <p class="text-gray-500">계약 단계에서는 금융 정보를 입력하지 않습니다.</p>
            </div>

            <!-- Tab 3: H/W 정보 -->
            <div id="contract-tab-hardware" class="contract-tab-content hidden">
              <p class="text-gray-500">계약 단계에서는 H/W 정보를 입력하지 않습니다.</p>
            </div>

            <!-- Tab 4: 관리 정보 -->
            <div id="contract-tab-manage" class="contract-tab-content hidden">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">메모</label>
                  <textarea id="editMemo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="추가 메모사항을 입력하세요...">${item.notes || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- Tab 5: 증빙 자료 (계약 특화: 선설치 후계약 진행 체크박스만) -->
            <div id="contract-tab-evidence" class="contract-tab-content hidden">
              <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                  증빙 자료 확인
                </h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="editPreInstallation" ${item.pre_installation ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-tools mr-2 text-orange-600"></i>
                      선설치 후계약 진행
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button type="button" onclick="closeContractEditModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
                <i class="fas fa-times mr-2"></i>
                취소
              </button>
              <button type="submit" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
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
    window.switchContractTab = function(tabName) {
      document.querySelectorAll('.contract-tab-btn').forEach(btn => {
        btn.classList.remove('text-green-600', 'border-green-500');
        btn.classList.add('text-gray-500', 'border-transparent');
      });
      
      const activeBtn = document.querySelector(`.contract-tab-btn[data-tab="${tabName}"]`);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-green-600', 'border-green-500');
      }
      
      document.querySelectorAll('.contract-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const activeContent = document.getElementById(`contract-tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    };

    // Tab 전환 함수 등록 (상세보기용)
    window.switchContractDetailTab = function(tabName) {
      document.querySelectorAll('.contract-detail-tab-btn').forEach(btn => {
        btn.classList.remove('text-green-600', 'border-green-500');
        btn.classList.add('text-gray-500', 'border-transparent');
      });
      
      const activeBtn = document.querySelector(`.contract-detail-tab-btn[data-tab="${tabName}"]`);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-green-600', 'border-green-500');
      }
      
      document.querySelectorAll('.contract-detail-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const activeContent = document.getElementById(`contract-detail-tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    };

    // 폼 제출 이벤트
    document.getElementById('contractEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateContract(id);
    });

  } catch (error) {
    console.error('계약 수정 모달 오류:', error);
    alert('수정 모달을 불러올 수 없습니다.');
  }
}

function closeContractEditModal() {
  const modal = document.getElementById('contractEditModal');
  if (modal) modal.remove();
}

/**
 * 계약 정보 업데이트
 */
async function updateContract(id) {
  try {
    const data = {
      customer_name: document.getElementById('editCustomerName').value,
      phone: document.getElementById('editPhone').value,
      registration_reason: document.getElementById('editRegistrationReason').value,
      status: document.getElementById('editStatus').value,
      notes: document.getElementById('editMemo').value || null,
      pre_installation: document.getElementById('editPreInstallation').checked ? 1 : 0
    };

    await axios.put(`/api/contracts/${id}`, data);
    
    alert('수정되었습니다.');
    closeContractEditModal();
    closeContractDetailModal();
    
    // 리스트 새로고침
    if (currentContractViewMode === 'list') {
      loadContractList(currentContractPage);
    } else {
      loadContractKanban();
    }
  } catch (error) {
    console.error('계약 수정 오류:', error);
    alert(error.response?.data?.error || '수정 중 오류가 발생했습니다.');
  }
}

/**
 * 신규 등록 폼 표시 (간략 버전 - 등록사유 추가, 유입경로 제거)
 */
async function showContractForm(id = null) {
  const isEdit = id !== null;
  let contract = null;

  if (isEdit) {
    try {
      const response = await axios.get(`/api/contracts/${id}`);
      contract = response.data.contract;
    } catch (error) {
      alert('계약 정보를 불러올 수 없습니다.');
      return;
    }
  }

  const content = `
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-${isEdit ? 'edit' : 'plus'} mr-2 text-indigo-600"></i>
          ${isEdit ? '계약 정보 수정' : '신규 계약 등록'}
        </h2>
      </div>

      <form id="contractForm" class="p-6 space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              고객명 <span class="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              id="customerName"
              value="${isEdit && contract ? contract.customer_name || '' : ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="고객명 입력"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              전화번호 <span class="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              required
              value="${isEdit && contract ? contract.phone : ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="010-1234-5678"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            등록사유 <span class="text-red-500">*</span>
          </label>
          <select
            id="registrationReason"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">선택하세요</option>
            ${registrationReasons.map(reason => `
              <option value="${reason.value}" ${isEdit && contract && contract.registration_reason === reason.value ? 'selected' : ''}>
                ${reason.label}
              </option>
            `).join('')}
          </select>
        </div>

        ${isEdit ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              진행 상태
            </label>
            <select
              id="status"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="waiting" ${contract.status === 'waiting' ? 'selected' : ''}>계약대기</option>
              <option value="in_progress" ${contract.status === 'in_progress' ? 'selected' : ''}>계약 중</option>
              <option value="signature_pending" ${contract.status === 'signature_pending' ? 'selected' : ''}>서명대기</option>
              <option value="hold" ${contract.status === 'hold' ? 'selected' : ''}>계약보류</option>
              <option value="completed" ${contract.status === 'completed' ? 'selected' : ''}>계약완료</option>
              <option value="cancelled" ${contract.status === 'cancelled' ? 'selected' : ''}>취소</option>
            </select>
          </div>

          <div class="flex items-center space-x-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                id="preInstallation"
                ${contract.pre_installation ? 'checked' : ''}
                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              >
              <span class="ml-2 text-sm text-gray-700">선 설치진행</span>
            </label>
          </div>
        ` : ''}

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            메모
          </label>
          <textarea
            id="notes"
            rows="8"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="메모를 입력하세요"
          >${isEdit && contract ? contract.notes || '' : ''}</textarea>
        </div>

        <div class="flex space-x-3">
          <button
            type="submit"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            <i class="fas fa-check mr-2"></i>
            ${isEdit ? '수정하기' : '등록하기'}
          </button>
          <button
            type="button"
            onclick="loadContractList(${currentContractPage})"
            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
          >
            <i class="fas fa-times mr-2"></i>
            취소
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('mainContent').innerHTML = content;

  document.getElementById('contractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateContractForm(id);
    } else {
      await submitContract();
    }
  });
}

async function submitContract() {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    registration_reason: document.getElementById('registrationReason').value,
    notes: document.getElementById('notes').value
  };

  if (!data.phone) {
    alert('전화번호는 필수입니다.');
    return;
  }

  if (!data.registration_reason) {
    alert('등록사유는 필수입니다.');
    return;
  }

  try {
    await axios.post('/api/contracts', data);
    alert('계약이 등록되었습니다.');
    loadContractList(1);
  } catch (error) {
    console.error('Submit contract error:', error);
    alert(error.response?.data?.error || '계약 등록에 실패했습니다.');
  }
}

async function updateContractForm(id) {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    registration_reason: document.getElementById('registrationReason').value,
    notes: document.getElementById('notes').value,
    status: document.getElementById('status').value,
    pre_installation: document.getElementById('preInstallation').checked
  };

  if (!data.phone) {
    alert('전화번호는 필수입니다.');
    return;
  }

  try {
    await axios.put(`/api/contracts/${id}`, data);
    alert('계약 정보가 수정되었습니다.');
    loadContractList(currentContractPage);
  } catch (error) {
    console.error('Update contract error:', error);
    alert(error.response?.data?.error || '계약 수정에 실패했습니다.');
  }
}

async function deleteContract(id) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  try {
    await axios.delete(`/api/contracts/${id}`);
    alert('계약이 삭제되었습니다.');
    loadContractList(currentContractPage);
  } catch (error) {
    console.error('Delete contract error:', error);
    alert(error.response?.data?.error || '계약 삭제에 실패했습니다.');
  }
}

/**
 * 칸반 보드 조회
 */
async function loadContractKanban() {
  try {
    const response = await axios.get('/api/contracts?page=1&limit=1000');
    const contracts = response.data.contracts || [];

    const grouped = {
      'waiting': [],
      'in_progress': [],
      'signature_pending': [],
      'hold': [],
      'completed': [],
      'cancelled': []
    };

    contracts.forEach(item => {
      if (grouped[item.status]) {
        grouped[item.status].push(item);
      }
    });

    const statusConfig = {
      'waiting': { text: '계약대기', color: 'bg-gray-500', icon: 'fa-clock' },
      'in_progress': { text: '계약 중', color: 'bg-blue-500', icon: 'fa-file-signature' },
      'signature_pending': { text: '서명대기', color: 'bg-purple-500', icon: 'fa-pen' },
      'hold': { text: '계약보류', color: 'bg-yellow-500', icon: 'fa-pause-circle' },
      'completed': { text: '계약완료', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '취소', color: 'bg-red-500', icon: 'fa-times-circle' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-file-contract mr-2 text-green-600"></i>
              계약현황 - 칸반 보드
            </h2>
            <div class="flex space-x-2">
              <button onclick="showContractArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="showMigrateToInstallationModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                설치 이관
              </button>
              <button onclick="toggleContractViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-list mr-2"></i>
                리스트 보기
              </button>
              <button onclick="showContractForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-6 gap-4">
            ${Object.keys(statusConfig).map(status => {
              const config = statusConfig[status];
              const items = grouped[status] || [];
              
              return `
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                      <i class="fas ${config.icon} ${config.color.replace('bg-', 'text-')} mr-2"></i>
                      <h3 class="font-bold text-gray-800 text-sm">${config.text}</h3>
                    </div>
                    <span class="bg-white text-gray-700 text-sm font-semibold px-2 py-1 rounded">${items.length}</span>
                  </div>

                  <div class="contract-kanban-column min-h-[600px] space-y-3" data-status="${status}">
                    ${items.map(item => renderContractKanbanCard(item, config)).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
  } catch (error) {
    console.error('Load contract kanban error:', error);
    alert('칸반 보드를 불러올 수 없습니다.');
  }
}

function renderContractKanbanCard(item, config) {
  return `
    <div class="bg-white p-3 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 ${config.color.replace('bg-', 'border-')}"
         onclick="viewContractDetail(${item.id})">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500">#${item.id}</span>
        <div class="flex space-x-1">
          ${item.pre_installation ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">선설치</span>' : ''}
        </div>
      </div>

      <div class="mb-2">
        <p class="font-semibold text-gray-800 text-sm mb-1">${item.customer_name || '고객명 미입력'}</p>
        <p class="text-xs text-gray-600">
          <i class="fas fa-phone mr-1 text-gray-400"></i>
          ${item.phone}
        </p>
      </div>

      ${item.notes ? `
        <p class="text-xs text-gray-500 mb-2 line-clamp-2">${item.notes}</p>
      ` : ''}

      <div class="text-xs text-gray-400 border-t pt-2 mt-2">
        <p>${formatContractDate(item.created_at)}</p>
      </div>
    </div>
  `;
}

async function showMigrateToInstallationModal() {
  try {
    const response = await axios.get('/api/contracts/stats/completed');
    const { count, ids, completedCount, preInstallCount } = response.data;

    if (count === 0) {
      alert('계약완료 또는 선설치 상태인 계약이 없습니다.');
      return;
    }

    const modal = `
      <div id="migrateToInstallationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'migrateToInstallationModal') closeMigrateToInstallationModal()">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onclick="event.stopPropagation()">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-arrow-right mr-2 text-orange-600"></i>
            설치현황으로 이관
          </h3>
          
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-lg font-semibold text-blue-800 mb-3">
              <i class="fas fa-check-circle mr-2"></i>
              이관 가능: <span class="text-2xl">${count}</span>건
            </p>
            <div class="space-y-1 text-sm text-blue-700">
              ${completedCount > 0 ? `<p>• 계약완료: ${completedCount}건</p>` : ''}
              ${preInstallCount > 0 ? `<p>• 선설치: ${preInstallCount}건</p>` : ''}
            </div>
            <p class="text-sm text-blue-600 mt-3">
              해당 계약 건들을 설치현황 페이지로 이관하시겠습니까?
            </p>
          </div>

          <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p class="text-xs text-yellow-800">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <strong>참고:</strong> 이관 후에도 계약현황 데이터는 유지됩니다.
            </p>
          </div>

          <div class="flex space-x-3">
            <button onclick="migrateToInstallation(${JSON.stringify(ids)})" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-check mr-2"></i>
              이관 확정 (${count}건)
            </button>
            <button onclick="closeMigrateToInstallationModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              취소
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Show migrate to installation modal error:', error);
    alert('이관 정보를 불러올 수 없습니다.');
  }
}

function closeMigrateToInstallationModal() {
  const modal = document.getElementById('migrateToInstallationModal');
  if (modal) modal.remove();
}

async function migrateToInstallation(ids) {
  try {
    const response = await axios.post('/api/installations/migrate', {
      contract_ids: ids
    });

    if (response.status === 200) {
      alert('이관 성공!');
      closeMigrateToInstallationModal();
      
      if (currentContractViewMode === 'list') {
        loadContractList(currentContractPage);
      } else {
        loadContractKanban();
      }
      return;
    }
    
    alert('이관 중 오류가 발생했습니다.');
    closeMigrateToInstallationModal();
  } catch (error) {
    console.error('Migrate to installation error:', error);
    alert('이관 중 오류가 발생했습니다.');
    closeMigrateToInstallationModal();
  }
}

function showContractArchiveSearchModal() {
  alert('이전 기록 검색 기능은 준비 중입니다.');
}

// Window 객체에 함수 바인딩
window.loadContractPage = loadContractPage;
window.loadContractList = loadContractList;
window.handleSort_contract = handleSort_contract;
window.viewContractDetail = viewContractDetail;
window.closeContractDetailModal = closeContractDetailModal;
window.showContractEditModal = showContractEditModal;
window.closeContractEditModal = closeContractEditModal;
window.updateContract = updateContract;
window.showContractForm = showContractForm;
window.submitContract = submitContract;
window.updateContractForm = updateContractForm;
window.deleteContract = deleteContract;
window.loadContractKanban = loadContractKanban;
window.toggleContractViewMode = toggleContractViewMode;
window.renderContractKanbanCard = renderContractKanbanCard;
window.showMigrateToInstallationModal = showMigrateToInstallationModal;
window.closeMigrateToInstallationModal = closeMigrateToInstallationModal;
window.migrateToInstallation = migrateToInstallation;
window.showContractArchiveSearchModal = showContractArchiveSearchModal;
