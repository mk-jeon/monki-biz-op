// 상담현황 관련 함수

let currentConsultationPage = 1;
let currentViewMode = 'list'; // 'list' or 'kanban'
let inflowSources = []; // 유입경로 목록
let consultationPurposes = []; // 상담목적 목록
let consultationChannels = []; // 상담경로 목록

/**
 * 상담 정렬 처리 함수
 */
function handleSort_consultation(field) {
  window.handleSort(field, 'consultation', () => loadConsultationList(currentConsultationPage));
}

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

/**
 * 상담현황 페이지 로드
 */
async function loadConsultationPage() {
  // 드롭다운 항목 먼저 로드 및 캐시 저장
  await Promise.all([
    loadDropdownItems('inflow_source').then(items => {
      inflowSources = items;
      itemCache['inflow_source'] = items; // 캐시에 저장
    }),
    loadDropdownItems('consultation_purpose').then(items => {
      consultationPurposes = items;
      itemCache['consultation_purpose'] = items;
    }),
    loadDropdownItems('consultation_channel').then(items => {
      consultationChannels = items;
      itemCache['consultation_channel'] = items;
    })
  ]);
  
  // 리스트 모드로 시작
  loadConsultationList();
}

/**
 * 리스트/칸반 모드 전환
 */
function toggleViewMode() {
  currentViewMode = currentViewMode === 'list' ? 'kanban' : 'list';
  
  if (currentViewMode === 'list') {
    loadConsultationList();
  } else {
    loadConsultationKanban();
  }
}

/**
 * 상담현황 리스트 조회
 */
async function loadConsultationList(page = 1) {
  try {
    const response = await axios.get(`/api/consultations?page=${page}&limit=50`);
    let { consultations, pagination } = response.data;
    
    // 정렬 적용
    const sortState = window.sortStates.consultation;
    consultations = window.sortData(consultations, sortState.field, sortState.order, 'consultation');

    const statusMap = {
      'waiting': { text: '상담대기', color: 'bg-gray-500' },
      'in_progress': { text: '상담중', color: 'bg-blue-500' },
      'hold': { text: '보류', color: 'bg-yellow-500' },
      'completed': { text: '계약확정', color: 'bg-green-500' },
      'cancelled': { text: '취소', color: 'bg-red-500' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-comments mr-2 text-blue-600"></i>
              상담현황
            </h2>
            <div class="flex space-x-2">
              <button onclick="showArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="showMigrateToContractModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                계약 이관
              </button>
              <button onclick="toggleViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-${currentViewMode === 'list' ? 'th-large' : 'list'} mr-2"></i>
                ${currentViewMode === 'list' ? '칸반 보기' : '리스트 보기'}
              </button>
              <button onclick="downloadExcelTemplate()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-file-excel mr-2"></i>
                엑셀 빈양식
              </button>
              <button onclick="showBulkUploadModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-upload mr-2"></i>
                일괄 업로드
              </button>
              <button onclick="showConsultationForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
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
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('id')">
                  <div class="flex items-center">
                    ID
                    ${window.getSortIcon('id', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('status')">
                  <div class="flex items-center">
                    상태
                    ${window.getSortIcon('status', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('customer_name')">
                  <div class="flex items-center">
                    고객명
                    ${window.getSortIcon('customer_name', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('phone')">
                  <div class="flex items-center">
                    전화번호
                    ${window.getSortIcon('phone', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('inflow_source')">
                  <div class="flex items-center">
                    유입경로
                    ${window.getSortIcon('inflow_source', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">옵션</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('created_at')">
                  <div class="flex items-center">
                    등록일
                    ${window.getSortIcon('created_at', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_consultation('created_by_name')">
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
              ${consultations.length === 0 ? `
                <tr>
                  <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>등록된 상담이 없습니다.</p>
                  </td>
                </tr>
              ` : consultations.map(item => {
                const status = statusMap[item.status] || statusMap['waiting'];
                return `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="viewConsultationDetail(${item.id})">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.id}</td>
                    <td class="px-4 py-3">
                      <span class="${status.color} text-white text-xs px-2 py-1 rounded">${status.text}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.phone}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${getLabelByValue('inflow_source', item.inflow_source)}</td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-1">
                        ${item.is_visit_consultation ? '<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">방문</span>' : ''}
                        ${item.has_quotation ? '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">견적</span>' : ''}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.created_by_name}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.updated_by_name || '-'}</td>
                    <td class="px-4 py-3 text-center">
                      <button onclick="event.stopPropagation(); showConsultationEditModal(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button onclick="event.stopPropagation(); deleteConsultation(${item.id})" class="text-red-600 hover:text-red-800">
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
              <button onclick="loadConsultationList(${pagination.page - 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-left"></i>
              </button>
            ` : ''}
            
            <span class="px-4 py-2 bg-indigo-600 text-white rounded">
              ${pagination.page} / ${pagination.totalPages}
            </span>
            
            ${pagination.page < pagination.totalPages ? `
              <button onclick="loadConsultationList(${pagination.page + 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-right"></i>
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    currentConsultationPage = page;
  } catch (error) {
    console.error('Load consultation list error:', error);
    alert('상담 목록을 불러올 수 없습니다.');
  }
}

/**
 * 상담 상세 보기 (operation.js와 동일한 5-Tab 모달 구조)
 */
async function viewConsultationDetail(id) {
  try {
    const response = await axios.get(`/api/consultations/${id}`);
    const item = response.data.consultation;

    const statusMap = {
      'waiting': '상담대기',
      'in_progress': '상담중',
      'hold': '보류',
      'completed': '계약확정',
      'cancelled': '취소'
    };

    const modalHTML = `
      <div id="consultationDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-info-circle mr-2 text-blue-600"></i>
              상담 상세 정보
            </h3>
            <button onclick="closeConsultationDetailModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchConsultationDetailTab('basic')" class="consultation-detail-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-blue-500 text-blue-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchConsultationDetailTab('finance')" class="consultation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchConsultationDetailTab('hardware')" class="consultation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchConsultationDetailTab('manage')" class="consultation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchConsultationDetailTab('evidence')" class="consultation-detail-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <!-- Tab 1: 기본 정보 -->
          <div id="consultation-detail-tab-basic" class="consultation-detail-tab-content">
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
                <label class="text-sm font-semibold text-gray-600">유입경로</label>
                <p class="text-gray-800">${item.inflow_source || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tab 2: 금융 정보 -->
          <div id="consultation-detail-tab-finance" class="consultation-detail-tab-content hidden">
            <p class="text-gray-500">금융 정보가 없습니다.</p>
          </div>

          <!-- Tab 3: H/W 정보 -->
          <div id="consultation-detail-tab-hardware" class="consultation-detail-tab-content hidden">
            <p class="text-gray-500">H/W 정보가 없습니다.</p>
          </div>

          <!-- Tab 4: 관리 정보 -->
          <div id="consultation-detail-tab-manage" class="consultation-detail-tab-content hidden">
            ${item.notes ? `
              <div>
                <label class="text-sm font-semibold text-gray-600 block mb-2">메모</label>
                <p class="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">${item.notes}</p>
              </div>
            ` : '<p class="text-gray-500">메모가 없습니다.</p>'}
          </div>

          <!-- Tab 5: 증빙 자료 (상담 특화: 견적서 체크박스만) -->
          <div id="consultation-detail-tab-evidence" class="consultation-detail-tab-content hidden">
            <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                증빙 자료 확인
              </h4>
              <div class="space-y-3">
                <label class="flex items-center space-x-3">
                  <input type="checkbox" ${item.has_quotation ? 'checked' : ''} disabled class="w-5 h-5 text-purple-600 border-gray-300 rounded">
                  <span class="text-sm font-medium text-gray-800">
                    <i class="fas fa-file-invoice mr-2 text-blue-600"></i>
                    견적서 작성 여부
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- 버튼 영역 -->
          <div class="flex justify-between items-center pt-6 border-t mt-6">
            <button onclick="showConsultationEditModal(${item.id})" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              <i class="fas fa-edit mr-2"></i>
              수정
            </button>
            <button onclick="closeConsultationDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              닫기
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

  } catch (error) {
    console.error('상담 상세 조회 오류:', error);
    alert('상세 정보를 불러올 수 없습니다.');
  }
}

function closeConsultationDetailModal() {
  const modal = document.getElementById('consultationDetailModal');
  if (modal) modal.remove();
}

/**
 * 상담 수정 모달 (operation.js와 동일한 5-Tab 구조)
 */
async function showConsultationEditModal(id) {
  try {
    const response = await axios.get(`/api/consultations/${id}`);
    const item = response.data.consultation;

    const modalHTML = `
      <div id="consultationEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2 text-blue-600"></i>
              상담 수정
            </h3>
            <button onclick="closeConsultationEditModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchConsultationTab('basic')" class="consultation-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-blue-500 text-blue-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchConsultationTab('finance')" class="consultation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchConsultationTab('hardware')" class="consultation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchConsultationTab('manage')" class="consultation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchConsultationTab('evidence')" class="consultation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <form id="consultationEditForm">
            <!-- Tab 1: 기본 정보 -->
            <div id="consultation-tab-basic" class="consultation-tab-content">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">고객명</label>
                  <input type="text" id="editCustomerName" value="${item.customer_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
                  <input type="tel" id="editPhone" value="${item.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">상태</label>
                  <select id="editStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="waiting" ${item.status === 'waiting' ? 'selected' : ''}>상담대기</option>
                    <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>상담중</option>
                    <option value="hold" ${item.status === 'hold' ? 'selected' : ''}>보류</option>
                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>계약확정</option>
                    <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>취소</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tab 2: 금융 정보 -->
            <div id="consultation-tab-finance" class="consultation-tab-content hidden">
              <p class="text-gray-500">상담 단계에서는 금융 정보를 입력하지 않습니다.</p>
            </div>

            <!-- Tab 3: H/W 정보 -->
            <div id="consultation-tab-hardware" class="consultation-tab-content hidden">
              <p class="text-gray-500">상담 단계에서는 H/W 정보를 입력하지 않습니다.</p>
            </div>

            <!-- Tab 4: 관리 정보 -->
            <div id="consultation-tab-manage" class="consultation-tab-content hidden">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">메모</label>
                  <textarea id="editMemo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="추가 메모사항을 입력하세요...">${item.notes || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- Tab 5: 증빙 자료 (상담 특화: 견적서 체크박스만) -->
            <div id="consultation-tab-evidence" class="consultation-tab-content hidden">
              <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                  증빙 자료 확인
                </h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="editHasQuotation" ${item.has_quotation ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-file-invoice mr-2 text-blue-600"></i>
                      견적서 작성 여부
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button type="button" onclick="closeConsultationEditModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
                <i class="fas fa-times mr-2"></i>
                취소
              </button>
              <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
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
    window.switchConsultationTab = function(tabName) {
      document.querySelectorAll('.consultation-tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-blue-500');
        btn.classList.add('text-gray-500', 'border-transparent');
      });
      
      const activeBtn = document.querySelector(`.consultation-tab-btn[data-tab="${tabName}"]`);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-blue-600', 'border-blue-500');
      }
      
      document.querySelectorAll('.consultation-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const activeContent = document.getElementById(`consultation-tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    };

    // Tab 전환 함수 등록 (상세보기용)
    window.switchConsultationDetailTab = function(tabName) {
      document.querySelectorAll('.consultation-detail-tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-blue-500');
        btn.classList.add('text-gray-500', 'border-transparent');
      });
      
      const activeBtn = document.querySelector(`.consultation-detail-tab-btn[data-tab="${tabName}"]`);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-blue-600', 'border-blue-500');
      }
      
      document.querySelectorAll('.consultation-detail-tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      
      const activeContent = document.getElementById(`consultation-detail-tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    };

    // 폼 제출 이벤트
    document.getElementById('consultationEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateConsultation(id);
    });

  } catch (error) {
    console.error('상담 수정 모달 오류:', error);
    alert('수정 모달을 불러올 수 없습니다.');
  }
}

function closeConsultationEditModal() {
  const modal = document.getElementById('consultationEditModal');
  if (modal) modal.remove();
}

/**
 * 상담 정보 업데이트
 */
async function updateConsultation(id) {
  try {
    const data = {
      customer_name: document.getElementById('editCustomerName').value,
      phone: document.getElementById('editPhone').value,
      status: document.getElementById('editStatus').value,
      notes: document.getElementById('editMemo').value || null,
      has_quotation: document.getElementById('editHasQuotation').checked ? 1 : 0
    };

    await axios.put(`/api/consultations/${id}`, data);
    
    alert('수정되었습니다.');
    closeConsultationEditModal();
    closeConsultationDetailModal();
    
    // 리스트 새로고침
    if (currentViewMode === 'list') {
      loadConsultationList(currentConsultationPage);
    } else {
      loadConsultationKanban();
    }
  } catch (error) {
    console.error('상담 수정 오류:', error);
    alert(error.response?.data?.error || '수정 중 오류가 발생했습니다.');
  }
}

/**
 * 엑셀 빈양식 다운로드
 */
function downloadExcelTemplate() {
  const headers = ['고객명', '전화번호', '유입경로', '요청사항'];
  const inflowSourceOptions = inflowSources.map(s => s.value).join(' / ');
  const sampleRow = ['', '', `(선택: ${inflowSourceOptions})`, ''];
  
  const csv = [
    headers.join(','),
    sampleRow.join(',')
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', '상담현황_빈양식.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 일괄 업로드 모달 표시
 */
function showBulkUploadModal() {
  const modal = `
    <div id="bulkUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'bulkUploadModal') closeBulkUploadModal()">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onclick="event.stopPropagation()">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-upload mr-2 text-purple-600"></i>
          엑셀 일괄 업로드
        </h3>
        
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>업로드 방법:</strong><br>
            1. "엑셀 빈양식" 버튼으로 양식 다운로드<br>
            2. 양식에 데이터 작성 (전화번호는 필수)<br>
            3. 저장 후 아래에서 파일 선택하여 업로드
          </p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            CSV 파일 선택
          </label>
          <input type="file" id="csvFile" accept=".csv" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
        </div>

        <div class="flex space-x-3">
          <button onclick="uploadCSV()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition">
            <i class="fas fa-upload mr-2"></i>
            업로드
          </button>
          <button onclick="closeBulkUploadModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
            취소
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

function closeBulkUploadModal() {
  const modal = document.getElementById('bulkUploadModal');
  if (modal) modal.remove();
}

async function uploadCSV() {
  const fileInput = document.getElementById('csvFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('파일을 선택해주세요.');
    return;
  }

  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      alert('데이터가 없습니다.');
      return;
    }

    const dataLines = lines.slice(1);
    const data = [];

    for (const line of dataLines) {
      const cols = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      let inflowSource = cols[2] || '';
      if (inflowSource.includes('(선택:')) {
        inflowSource = '';
      }

      data.push({
        customer_name: cols[0] || '',
        phone: cols[1] || '',
        inflow_source: inflowSource,
        notes: cols[3] || ''
      });
    }

    const response = await axios.post('/api/consultations/bulk', { data });

    alert(`업로드 완료!\n성공: ${response.data.successCount}건\n실패: ${response.data.errorCount}건`);
    
    if (response.data.errors && response.data.errors.length > 0) {
      console.log('Errors:', response.data.errors);
    }

    closeBulkUploadModal();
    loadConsultationList(1);
  } catch (error) {
    console.error('CSV upload error:', error);
    alert(error.response?.data?.error || 'CSV 업로드에 실패했습니다.');
  }
}

/**
 * 신규 등록 폼 표시
 */
async function showConsultationForm(id = null) {
  const isEdit = id !== null;
  let consultation = null;

  if (isEdit) {
    try {
      const response = await axios.get(`/api/consultations/${id}`);
      consultation = response.data.consultation;
    } catch (error) {
      alert('상담 정보를 불러올 수 없습니다.');
      return;
    }
  }

  const content = `
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-${isEdit ? 'edit' : 'plus'} mr-2 text-indigo-600"></i>
          ${isEdit ? '상담 정보 수정' : '신규 상담 등록'}
        </h2>
      </div>

      <form id="consultationForm" class="p-6 space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              고객명 <span class="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              id="customerName"
              value="${isEdit && consultation ? consultation.customer_name || '' : ''}"
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
              value="${isEdit && consultation ? consultation.phone : ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="010-1234-5678"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            유입경로
          </label>
          ${createDropdownHTML('inflowSource', 'inflow_source', inflowSources, isEdit && consultation ? consultation.inflow_source : '')}
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
              <option value="waiting" ${consultation.status === 'waiting' ? 'selected' : ''}>상담대기</option>
              <option value="in_progress" ${consultation.status === 'in_progress' ? 'selected' : ''}>상담중</option>
              <option value="hold" ${consultation.status === 'hold' ? 'selected' : ''}>보류</option>
              <option value="completed" ${consultation.status === 'completed' ? 'selected' : ''}>계약확정</option>
              <option value="cancelled" ${consultation.status === 'cancelled' ? 'selected' : ''}>취소</option>
            </select>
          </div>

          <div class="flex items-center space-x-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                id="isVisit"
                ${consultation.is_visit_consultation ? 'checked' : ''}
                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              >
              <span class="ml-2 text-sm text-gray-700">방문상담</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                id="hasQuotation"
                ${consultation.has_quotation ? 'checked' : ''}
                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              >
              <span class="ml-2 text-sm text-gray-700">견적서 발송</span>
            </label>
          </div>
        ` : ''}

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            요청사항 / 메모
          </label>
          <textarea
            id="notes"
            rows="8"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="요청사항이나 메모를 입력하세요"
          >${isEdit && consultation ? consultation.notes || '' : ''}</textarea>
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
            onclick="loadConsultationList(${currentConsultationPage})"
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

  document.getElementById('consultationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateConsultationForm(id);
    } else {
      await submitConsultation();
    }
  });
}

async function submitConsultation() {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    inflow_source: document.getElementById('inflowSource').value,
    notes: document.getElementById('notes').value
  };

  if (!data.phone) {
    alert('전화번호는 필수입니다.');
    return;
  }

  try {
    await axios.post('/api/consultations', data);
    alert('상담이 등록되었습니다.');
    loadConsultationList(1);
  } catch (error) {
    console.error('Submit consultation error:', error);
    alert(error.response?.data?.error || '상담 등록에 실패했습니다.');
  }
}

async function updateConsultationForm(id) {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    inflow_source: document.getElementById('inflowSource').value,
    notes: document.getElementById('notes').value,
    status: document.getElementById('status').value,
    is_visit_consultation: document.getElementById('isVisit').checked,
    has_quotation: document.getElementById('hasQuotation').checked
  };

  if (!data.phone) {
    alert('전화번호는 필수입니다.');
    return;
  }

  try {
    await axios.put(`/api/consultations/${id}`, data);
    alert('상담 정보가 수정되었습니다.');
    loadConsultationList(currentConsultationPage);
  } catch (error) {
    console.error('Update consultation error:', error);
    alert(error.response?.data?.error || '상담 수정에 실패했습니다.');
  }
}

async function deleteConsultation(id) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  try {
    await axios.delete(`/api/consultations/${id}`);
    alert('상담이 삭제되었습니다.');
    loadConsultationList(currentConsultationPage);
  } catch (error) {
    console.error('Delete consultation error:', error);
    alert(error.response?.data?.error || '상담 삭제에 실패했습니다.');
  }
}

/**
 * 칸반 보드 조회
 */
async function loadConsultationKanban() {
  try {
    const response = await axios.get('/api/consultations?page=1&limit=1000');
    const consultations = response.data.consultations || [];

    const grouped = {
      'waiting': [],
      'in_progress': [],
      'hold': [],
      'completed': [],
      'cancelled': []
    };

    consultations.forEach(item => {
      if (grouped[item.status]) {
        grouped[item.status].push(item);
      }
    });

    const statusConfig = {
      'waiting': { text: '상담대기', color: 'bg-gray-500', icon: 'fa-clock' },
      'in_progress': { text: '상담중', color: 'bg-blue-500', icon: 'fa-comments' },
      'hold': { text: '보류', color: 'bg-yellow-500', icon: 'fa-pause-circle' },
      'completed': { text: '계약확정', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '취소', color: 'bg-red-500', icon: 'fa-times-circle' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-comments mr-2 text-blue-600"></i>
              상담현황 - 칸반 보드
            </h2>
            <div class="flex space-x-2">
              <button onclick="showArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="showMigrateToContractModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                계약 이관
              </button>
              <button onclick="toggleViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-list mr-2"></i>
                리스트 보기
              </button>
              <button onclick="downloadExcelTemplate()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-file-excel mr-2"></i>
                엑셀 빈양식
              </button>
              <button onclick="showBulkUploadModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-upload mr-2"></i>
                일괄 업로드
              </button>
              <button onclick="showConsultationForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-5 gap-4">
            ${Object.keys(statusConfig).map(status => {
              const config = statusConfig[status];
              const items = grouped[status] || [];
              
              return `
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                      <i class="fas ${config.icon} ${config.color.replace('bg-', 'text-')} mr-2"></i>
                      <h3 class="font-bold text-gray-800">${config.text}</h3>
                    </div>
                    <span class="bg-white text-gray-700 text-sm font-semibold px-2 py-1 rounded">${items.length}</span>
                  </div>

                  <div 
                    class="kanban-column min-h-[600px] space-y-3" 
                    data-status="${status}"
                    ondrop="handleDrop(event)"
                    ondragover="handleDragOver(event)"
                    ondragleave="handleDragLeave(event)"
                  >
                    ${items.map(item => renderKanbanCard(item, config)).join('')}
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
    console.error('Load kanban error:', error);
    alert('칸반 보드를 불러올 수 없습니다.');
  }
}

function renderKanbanCard(item, config) {
  return `
    <div 
      class="kanban-card bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-move border-l-4 ${config.color.replace('bg-', 'border-')}"
      draggable="true"
      data-id="${item.id}"
      ondragstart="handleDragStart(event)"
      ondragend="handleDragEnd(event)"
      onclick="viewConsultationDetail(${item.id})"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500">#${item.id}</span>
        <div class="flex space-x-1">
          ${item.is_visit_consultation ? '<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">방문</span>' : ''}
          ${item.has_quotation ? '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">견적</span>' : ''}
        </div>
      </div>

      <div class="mb-3">
        <p class="font-semibold text-gray-800 mb-1">${item.customer_name || '고객명 미입력'}</p>
        <p class="text-sm text-gray-600">
          <i class="fas fa-phone mr-1 text-gray-400"></i>
          ${item.phone}
        </p>
      </div>

      ${item.inflow_source ? `
        <div class="mb-2">
          <span class="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">
            ${item.inflow_source}
          </span>
        </div>
      ` : ''}

      ${item.notes ? `
        <p class="text-xs text-gray-500 mb-2 line-clamp-2">${item.notes}</p>
      ` : ''}

      <div class="text-xs text-gray-400 border-t pt-2 mt-2">
        <p>등록: ${item.created_by_name}</p>
        ${item.updated_by_name ? `<p>수정: ${item.updated_by_name}</p>` : ''}
        <p>${formatDate(item.created_at)}</p>
      </div>
    </div>
  `;
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  e.currentTarget.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  const column = e.currentTarget;
  column.classList.add('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragLeave(e) {
  const column = e.currentTarget;
  column.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
}

async function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const column = e.currentTarget;
  column.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  
  if (draggedElement) {
    const itemId = draggedElement.dataset.id;
    const newStatus = column.dataset.status;
    
    try {
      await axios.put(`/api/consultations/${itemId}/status`, { status: newStatus });
      loadConsultationKanban();
    } catch (error) {
      console.error('Update status error:', error);
      alert(error.response?.data?.error || '상태 변경에 실패했습니다.');
    }
  }
  
  return false;
}

async function showMigrateToContractModal() {
  try {
    const response = await axios.get('/api/consultations/stats/completed');
    const { count, ids } = response.data;

    if (count === 0) {
      alert('계약확정 상태인 상담이 없습니다.');
      return;
    }

    const modal = `
      <div id="migrateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'migrateModal') closeMigrateModal()">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onclick="event.stopPropagation()">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-arrow-right mr-2 text-orange-600"></i>
            계약현황으로 이관
          </h3>
          
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-lg font-semibold text-blue-800 mb-2">
              <i class="fas fa-check-circle mr-2"></i>
              계약확정 상태: <span class="text-2xl">${count}</span>건
            </p>
            <p class="text-sm text-blue-600">
              해당 상담 건들을 계약현황 페이지로 이관하시겠습니까?
            </p>
          </div>

          <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p class="text-xs text-yellow-800">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <strong>참고:</strong> 이관 후에도 상담현황 데이터는 유지됩니다.
            </p>
          </div>

          <div class="flex space-x-3">
            <button onclick="migrateToContract(${JSON.stringify(ids)})" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-check mr-2"></i>
              이관 확정 (${count}건)
            </button>
            <button onclick="closeMigrateModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              취소
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Show migrate modal error:', error);
    alert('이관 정보를 불러올 수 없습니다.');
  }
}

function closeMigrateModal() {
  const modal = document.getElementById('migrateModal');
  if (modal) modal.remove();
}

async function migrateToContract(ids) {
  try {
    const response = await axios.post('/api/contracts/migrate', {
      consultation_ids: ids
    });

    const { successCount, errorCount, errors } = response.data;

    let message = `이관 완료!\n성공: ${successCount}건`;
    if (errorCount > 0) {
      message += `\n실패: ${errorCount}건`;
      if (errors && errors.length > 0) {
        message += '\n\n에러:\n' + errors.join('\n');
      }
    }

    alert(message);
    closeMigrateModal();
    
    if (currentViewMode === 'list') {
      loadConsultationList(currentConsultationPage);
    } else {
      loadConsultationKanban();
    }
  } catch (error) {
    console.error('Migrate error:', error);
    alert(error.response?.data?.error || '이관 중 오류가 발생했습니다.');
  }
}

function showArchiveSearchModal() {
  alert('이전 기록 검색 기능은 준비 중입니다.');
}

// Window 객체에 함수 바인딩
window.loadConsultationPage = loadConsultationPage;
window.loadConsultationList = loadConsultationList;
window.handleSort_consultation = handleSort_consultation;
window.viewConsultationDetail = viewConsultationDetail;
window.closeConsultationDetailModal = closeConsultationDetailModal;
window.showConsultationEditModal = showConsultationEditModal;
window.closeConsultationEditModal = closeConsultationEditModal;
window.updateConsultation = updateConsultation;
