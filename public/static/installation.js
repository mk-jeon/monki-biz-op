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
              설치현황
            </h2>
            <div class="flex space-x-2">
              <button onclick="showInstallationArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="showMigrateToOperationModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                운영 이관
              </button>
              <button onclick="toggleInstallationViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-${currentInstallationViewMode === 'list' ? 'th-large' : 'list'} mr-2"></i>
                ${currentInstallationViewMode === 'list' ? '칸반 보기' : '리스트 보기'}
              </button>
              <button onclick="showInstallationForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
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
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_installation('id')">
                  <div class="flex items-center">
                    ID
                    ${window.getSortIcon('id', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_installation('status')">
                  <div class="flex items-center">
                    상태
                    ${window.getSortIcon('status', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_installation('customer_name')">
                  <div class="flex items-center">
                    고객명
                    ${window.getSortIcon('customer_name', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_installation('phone')">
                  <div class="flex items-center">
                    전화번호
                    ${window.getSortIcon('phone', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">유입경로</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">옵션</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_installation('created_at')">
                  <div class="flex items-center">
                    등록일
                    ${window.getSortIcon('created_at', sortState.field, sortState.order)}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition" onclick="handleSort_installation('created_by_name')">
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
              ${installations.length === 0 ? `
                <tr>
                  <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>등록된 설치가 없습니다.</p>
                  </td>
                </tr>
              ` : installations.map(item => {
                const status = statusMap[item.status] || statusMap['waiting'];
                return `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="viewInstallationDetail(${item.id})">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.id}</td>
                    <td class="px-4 py-3">
                      <span class="${status.color} text-white text-xs px-2 py-1 rounded">${status.text}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.phone}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.inflow_source || '-'}</td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-1">
                        ${item.contract_signed ? '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">계약서</span>' : ''}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${formatInstallationDate(item.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.created_by_name}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.updated_by_name || '-'}</td>
                    <td class="px-4 py-3 text-center">
                      <button onclick="event.stopPropagation(); showInstallationEditModal(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button onclick="event.stopPropagation(); deleteInstallation(${item.id})" class="text-red-600 hover:text-red-800">
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
              <button onclick="loadInstallationList(${pagination.page - 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-left"></i>
              </button>
            ` : ''}
            
            <span class="px-4 py-2 bg-indigo-600 text-white rounded">
              ${pagination.page} / ${pagination.totalPages}
            </span>
            
            ${pagination.page < pagination.totalPages ? `
              <button onclick="loadInstallationList(${pagination.page + 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-right"></i>
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    currentInstallationPage = page;
  } catch (error) {
    console.error('Load installation list error:', error);
    alert('설치 목록을 불러올 수 없습니다.');
  }
}

/**
 * 설치 상세 보기 (5-Tab 모달 구조)
 */
async function viewInstallationDetail(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const item = response.data;

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
          
          <!-- Tab 1: 기본 정보 -->
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
          <div id="installation-detail-tab-finance" class="installation-detail-tab-content hidden">
            <p class="text-gray-500">금융 정보가 없습니다.</p>
          </div>

          <!-- Tab 3: H/W 정보 -->
          <div id="installation-detail-tab-hardware" class="installation-detail-tab-content hidden">
            <p class="text-gray-500">H/W 정보가 없습니다.</p>
          </div>

          <!-- Tab 4: 관리 정보 -->
          <div id="installation-detail-tab-manage" class="installation-detail-tab-content hidden">
            ${item.memo ? `
              <div>
                <label class="text-sm font-semibold text-gray-600 block mb-2">메모</label>
                <p class="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">${item.memo}</p>
              </div>
            ` : '<p class="text-gray-500">메모가 없습니다.</p>'}
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
                  <input type="checkbox" ${item.contract_signed ? 'checked' : ''} disabled class="w-5 h-5 text-purple-600 border-gray-300 rounded">
                  <span class="text-sm font-medium text-gray-800">
                    <i class="fas fa-file-contract mr-2 text-blue-600"></i>
                    계약서 작성 여부
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- 버튼 영역 -->
          <div class="flex justify-between items-center pt-6 border-t mt-6">
            <button onclick="showInstallationEditModal(${item.id})" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              <i class="fas fa-edit mr-2"></i>
              수정
            </button>
            <button onclick="closeInstallationDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              닫기
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

  } catch (error) {
    console.error('설치 상세 조회 오류:', error);
    alert('상세 정보를 불러올 수 없습니다.');
  }
}

function closeInstallationDetailModal() {
  const modal = document.getElementById('installationDetailModal');
  if (modal) modal.remove();
}

/**
 * 설치 수정 모달 (5-Tab 구조, 50개 컬럼 데이터 매핑)
 */
async function showInstallationEditModal(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const item = response.data;

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
                  <label class="block text-sm font-semibold text-gray-700 mb-2">고객명</label>
                  <input type="text" id="editCustomerName" value="${item.customer_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
                  <input type="tel" id="editPhone" value="${item.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
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
              </div>
            </div>

            <!-- Tab 2: 금융 정보 -->
            <div id="installation-tab-finance" class="installation-tab-content hidden">
              <p class="text-gray-500">설치 단계에서는 금융 정보를 입력하지 않습니다.</p>
            </div>

            <!-- Tab 3: H/W 정보 -->
            <div id="installation-tab-hardware" class="installation-tab-content hidden">
              <p class="text-gray-500">설치 단계에서는 H/W 정보를 입력하지 않습니다.</p>
            </div>

            <!-- Tab 4: 관리 정보 -->
            <div id="installation-tab-manage" class="installation-tab-content hidden">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">메모</label>
                  <textarea id="editMemo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="추가 메모사항을 입력하세요...">${item.memo || ''}</textarea>
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
                    <input type="checkbox" id="editContractSigned" ${item.contract_signed ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-file-contract mr-2 text-blue-600"></i>
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
 * 설치 정보 업데이트 (50개 컬럼 데이터 매핑)
 */
async function updateInstallation(id) {
  try {
    const data = {
      customer_name: document.getElementById('editCustomerName').value,
      phone: document.getElementById('editPhone').value,
      status: document.getElementById('editStatus').value,
      memo: document.getElementById('editMemo').value || null,
      contract_signed: document.getElementById('editContractSigned').checked ? 1 : 0
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
 * 신규 등록 폼 표시 (간략 버전)
 */
async function showInstallationForm(id = null) {
  const isEdit = id !== null;
  let installation = null;

  if (isEdit) {
    try {
      const response = await axios.get(`/api/installations/${id}`);
      installation = response.data;
    } catch (error) {
      alert('설치 정보를 불러올 수 없습니다.');
      return;
    }
  }

  const content = `
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-${isEdit ? 'edit' : 'plus'} mr-2 text-indigo-600"></i>
          ${isEdit ? '설치 정보 수정' : '신규 설치 등록'}
        </h2>
      </div>

      <form id="installationForm" class="p-6 space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              고객명 <span class="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              id="customerName"
              value="${isEdit && installation ? installation.customer_name || '' : ''}"
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
              value="${isEdit && installation ? installation.phone : ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="010-1234-5678"
            >
          </div>
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
              <option value="waiting" ${installation.status === 'waiting' ? 'selected' : ''}>설치대기</option>
              <option value="in_progress" ${installation.status === 'in_progress' ? 'selected' : ''}>설치 중</option>
              <option value="hold" ${installation.status === 'hold' ? 'selected' : ''}>설치보류</option>
              <option value="completed" ${installation.status === 'completed' ? 'selected' : ''}>설치완료</option>
              <option value="cancelled" ${installation.status === 'cancelled' ? 'selected' : ''}>설치취소</option>
            </select>
          </div>

          <div class="flex items-center space-x-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                id="contractSigned"
                ${installation.contract_signed ? 'checked' : ''}
                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              >
              <span class="ml-2 text-sm text-gray-700">계약서 작성 완료</span>
            </label>
          </div>
        ` : ''}

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            메모
          </label>
          <textarea
            id="memo"
            rows="8"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="메모를 입력하세요"
          >${isEdit && installation ? installation.memo || '' : ''}</textarea>
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
            onclick="loadInstallationList(${currentInstallationPage})"
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

  document.getElementById('installationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateInstallationForm(id);
    } else {
      await submitInstallation();
    }
  });
}

async function submitInstallation() {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    memo: document.getElementById('memo').value
  };

  if (!data.phone) {
    alert('전화번호는 필수입니다.');
    return;
  }

  try {
    await axios.post('/api/installations', data);
    alert('설치가 등록되었습니다.');
    loadInstallationList(1);
  } catch (error) {
    console.error('Submit installation error:', error);
    alert(error.response?.data?.error || '설치 등록에 실패했습니다.');
  }
}

async function updateInstallationForm(id) {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    memo: document.getElementById('memo').value,
    status: document.getElementById('status').value,
    contract_signed: document.getElementById('contractSigned').checked
  };

  if (!data.phone) {
    alert('전화번호는 필수입니다.');
    return;
  }

  try {
    await axios.put(`/api/installations/${id}`, data);
    alert('설치 정보가 수정되었습니다.');
    loadInstallationList(currentInstallationPage);
  } catch (error) {
    console.error('Update installation error:', error);
    alert(error.response?.data?.error || '설치 수정에 실패했습니다.');
  }
}

async function deleteInstallation(id) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  try {
    await axios.delete(`/api/installations/${id}`);
    alert('설치가 삭제되었습니다.');
    loadInstallationList(currentInstallationPage);
  } catch (error) {
    console.error('Delete installation error:', error);
    alert(error.response?.data?.error || '설치 삭제에 실패했습니다.');
  }
}

/**
 * 칸반 보드 조회
 */
async function loadInstallationKanban() {
  try {
    const response = await axios.get('/api/installations?page=1&limit=1000');
    const installations = response.data.installations || [];

    const grouped = {
      'waiting': [],
      'in_progress': [],
      'hold': [],
      'completed': [],
      'cancelled': []
    };

    installations.forEach(item => {
      if (grouped[item.status]) {
        grouped[item.status].push(item);
      }
    });

    const statusConfig = {
      'waiting': { text: '설치대기', color: 'bg-gray-500', icon: 'fa-clock' },
      'in_progress': { text: '설치 중', color: 'bg-blue-500', icon: 'fa-spinner' },
      'hold': { text: '설치보류', color: 'bg-yellow-500', icon: 'fa-pause-circle' },
      'completed': { text: '설치완료', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '설치취소', color: 'bg-red-500', icon: 'fa-times-circle' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치현황 - 칸반 보드
            </h2>
            <div class="flex space-x-2">
              <button onclick="showInstallationArchiveSearchModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-search mr-2"></i>
                이전 기록 검색
              </button>
              <button onclick="showMigrateToOperationModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                운영 이관
              </button>
              <button onclick="toggleInstallationViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-list mr-2"></i>
                리스트 보기
              </button>
              <button onclick="showInstallationForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
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
                      <h3 class="font-bold text-gray-800 text-sm">${config.text}</h3>
                    </div>
                    <span class="bg-white text-gray-700 text-sm font-semibold px-2 py-1 rounded">${items.length}</span>
                  </div>

                  <div class="installation-kanban-column min-h-[600px] space-y-3" data-status="${status}">
                    ${items.map(item => renderInstallationKanbanCard(item, config)).join('')}
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
    console.error('Load installation kanban error:', error);
    alert('칸반 보드를 불러올 수 없습니다.');
  }
}

function renderInstallationKanbanCard(item, config) {
  return `
    <div class="bg-white p-3 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 ${config.color.replace('bg-', 'border-')}"
         onclick="viewInstallationDetail(${item.id})">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500">#${item.id}</span>
        <div class="flex space-x-1">
          ${item.contract_signed ? '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">계약서</span>' : ''}
        </div>
      </div>

      <div class="mb-2">
        <p class="font-semibold text-gray-800 text-sm mb-1">${item.customer_name || '고객명 미입력'}</p>
        <p class="text-xs text-gray-600">
          <i class="fas fa-phone mr-1 text-gray-400"></i>
          ${item.phone}
        </p>
      </div>

      ${item.memo ? `
        <p class="text-xs text-gray-500 mb-2 line-clamp-2">${item.memo}</p>
      ` : ''}

      <div class="text-xs text-gray-400 border-t pt-2 mt-2">
        <p>${formatInstallationDate(item.created_at)}</p>
      </div>
    </div>
  `;
}

function showInstallationArchiveSearchModal() {
  alert('이전 기록 검색 기능은 준비 중입니다.');
}

function showMigrateToOperationModal() {
  alert('운영등재 이관 기능은 준비 중입니다.');
}

// Window 객체에 함수 바인딩
window.loadInstallationPage = loadInstallationPage;
window.loadInstallationList = loadInstallationList;
window.handleSort_installation = handleSort_installation;
window.viewInstallationDetail = viewInstallationDetail;
window.closeInstallationDetailModal = closeInstallationDetailModal;
window.showInstallationEditModal = showInstallationEditModal;
window.closeInstallationEditModal = closeInstallationEditModal;
window.updateInstallation = updateInstallation;
window.showInstallationForm = showInstallationForm;
window.submitInstallation = submitInstallation;
window.updateInstallationForm = updateInstallationForm;
window.deleteInstallation = deleteInstallation;
window.loadInstallationKanban = loadInstallationKanban;
window.toggleInstallationViewMode = toggleInstallationViewMode;
window.renderInstallationKanbanCard = renderInstallationKanbanCard;
window.showInstallationArchiveSearchModal = showInstallationArchiveSearchModal;
window.showMigrateToOperationModal = showMigrateToOperationModal;
