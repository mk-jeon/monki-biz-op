// 운영등재 모듈 - IIFE로 스코프 격리
(function() {
  'use strict';
  
  console.log('🔵 operation.js 모듈 로드 시작');

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

let currentOperationPage = 1;
let currentOperationViewMode = 'list';

/**
 * 운영 정렬 처리 함수
 */
function handleSort_operation(field) {
  window.handleSort(field, 'operation', () => loadOperationList(currentOperationPage));
}

/**
 * 운영등재 페이지 로드
 */
async function loadOperationPage() {
  console.log('✅ loadOperationPage 호출됨');
  loadOperationList();
}

/**
 * 리스트/칸반 모드 전환
 */
function toggleOperationViewMode() {
  currentOperationViewMode = currentOperationViewMode === 'list' ? 'kanban' : 'list';
  
  if (currentOperationViewMode === 'list') {
    loadOperationList();
  } else {
    loadOperationKanban();
  }
}

/**
 * 운영등재 리스트 조회
 */
async function loadOperationList(page = 1) {
  console.log(`✅ loadOperationList 실행 (page=${page})`);
  try {
    const response = await axios.get(`/api/operations?page=${page}&limit=50`);
    let { operations, pagination } = response.data;
    
    // 정렬 적용
    if (window.sortStates && window.sortStates.operation) {
      const sortState = window.sortStates.operation;
      operations = window.sortData(operations, sortState.field, sortState.order, 'operation');
    }

    const statusMap = {
      'contract_pending': { text: '계약서 미진행', color: 'bg-red-500', icon: 'fa-file-signature' },
      'install_cert_pending': { text: '설치확인서 미진행', color: 'bg-orange-500', icon: 'fa-clipboard-check' },
      'install_photo_pending': { text: '설치사진 미진행', color: 'bg-yellow-500', icon: 'fa-camera' },
      'drive_upload_pending': { text: '드라이브 업로드 미진행', color: 'bg-blue-500', icon: 'fa-cloud-upload-alt' },
      'completed': { text: '운영등재완료', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '취소', color: 'bg-gray-500', icon: 'fa-times-circle' }
    };

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
      console.error('mainContent 요소를 찾을 수 없습니다.');
      return;
    }

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-cogs mr-2 text-orange-600"></i>
              운영등재
            </h2>
            <div class="flex space-x-2">
              <button onclick="toggleOperationViewMode()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas ${currentOperationViewMode === 'list' ? 'fa-th' : 'fa-list'} mr-2"></i>
                ${currentOperationViewMode === 'list' ? '칸반 보기' : '리스트 보기'}
              </button>
              <button onclick="showAddOperationModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
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
                <th onclick="handleSort_operation('id')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  ID <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_operation('status')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  상태 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_operation('customer_name')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  고객명 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_operation('phone')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  전화번호 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_operation('created_at')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  등록일 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_operation('created_by_name')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  등록자 <i class="fas fa-sort ml-1"></i>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${operations.length === 0 ? `
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>등록된 운영등재 건이 없습니다.</p>
                    <p class="text-sm mt-2">설치현황에서 "운영 이관" 버튼을 클릭하여 등록하세요.</p>
                  </td>
                </tr>
              ` : operations.map(op => {
                const status = statusMap[op.status] || { text: op.status, color: 'bg-gray-500', icon: 'fa-question' };
                return `
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #${op.id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="${status.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit">
                        <i class="fas ${status.icon} mr-1"></i>
                        ${status.text}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${op.customer_name || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${op.phone || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${formatDate(op.created_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${op.created_by_name || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onclick="viewOperationDetail(${op.id})" class="text-blue-600 hover:text-blue-800 mr-3" title="상세보기">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button onclick="deleteOperation(${op.id})" class="text-red-600 hover:text-red-800" title="삭제">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 페이징 -->
        ${pagination.totalPages > 1 ? `
          <div class="p-4 border-t border-gray-200 flex justify-center items-center space-x-2">
            <button 
              ${pagination.page === 1 ? 'disabled' : ''} 
              onclick="loadOperationList(${pagination.page - 1})"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
              이전
            </button>
            <span class="text-gray-700">
              ${pagination.page} / ${pagination.totalPages}
            </span>
            <button 
              ${pagination.page === pagination.totalPages ? 'disabled' : ''} 
              onclick="loadOperationList(${pagination.page + 1})"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
              다음
            </button>
          </div>
        ` : ''}
      </div>
    `;

    mainContent.innerHTML = content;
    currentOperationPage = page;

  } catch (error) {
    console.error('운영등재 리스트 조회 오류:', error);
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-8 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <h3 class="text-xl font-bold text-gray-800 mb-2">운영등재 목록을 불러올 수 없습니다</h3>
          <p class="text-gray-600 mb-4">${error.response?.data?.error || error.message}</p>
          <button onclick="loadOperationList()" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition">
            다시 시도
          </button>
        </div>
      `;
    }
  }
}

/**
 * 운영등재 칸반 뷰
 */
async function loadOperationKanban() {
  console.log('✅ loadOperationKanban 실행');
  try {
    const response = await axios.get('/api/operations?limit=1000');
    const { operations } = response.data;

    const statusColumns = [
      { key: 'contract_pending', text: '계약서 미진행', color: 'bg-red-100 border-red-300', icon: 'fa-file-signature' },
      { key: 'install_cert_pending', text: '설치확인서 미진행', color: 'bg-orange-100 border-orange-300', icon: 'fa-clipboard-check' },
      { key: 'install_photo_pending', text: '설치사진 미진행', color: 'bg-yellow-100 border-yellow-300', icon: 'fa-camera' },
      { key: 'drive_upload_pending', text: '드라이브 업로드 미진행', color: 'bg-blue-100 border-blue-300', icon: 'fa-cloud-upload-alt' },
      { key: 'completed', text: '운영등재완료', color: 'bg-green-100 border-green-300', icon: 'fa-check-circle' },
      { key: 'cancelled', text: '취소', color: 'bg-gray-100 border-gray-300', icon: 'fa-times-circle' }
    ];

    const groupedOperations = {};
    statusColumns.forEach(col => {
      groupedOperations[col.key] = operations.filter(op => op.status === col.key);
    });

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
      console.error('mainContent 요소를 찾을 수 없습니다.');
      return;
    }

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-cogs mr-2 text-orange-600"></i>
              운영등재 - 칸반 뷰
            </h2>
            <div class="flex space-x-2">
              <button onclick="toggleOperationViewMode()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-list mr-2"></i>
                리스트 보기
              </button>
              <button onclick="showAddOperationModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-plus mr-2"></i>
                신규 등록
              </button>
            </div>
          </div>
        </div>

        <!-- 칸반 보드 -->
        <div class="p-6 overflow-x-auto">
          <div class="flex space-x-4 min-w-max">
            ${statusColumns.map(col => `
              <div class="flex-shrink-0 w-80">
                <div class="${col.color} border-2 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-gray-800 flex items-center">
                      <i class="fas ${col.icon} mr-2"></i>
                      ${col.text}
                    </h3>
                    <span class="bg-white px-3 py-1 rounded-full text-sm font-semibold">
                      ${groupedOperations[col.key].length}
                    </span>
                  </div>
                  <div class="space-y-3 kanban-column" data-status="${col.key}">
                    ${groupedOperations[col.key].length === 0 ? `
                      <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p class="text-sm">항목 없음</p>
                      </div>
                    ` : groupedOperations[col.key].map(op => `
                      <div class="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-move hover:shadow-lg transition kanban-card" 
                           draggable="true" 
                           data-id="${op.id}"
                           ondragstart="handleDragStart_operation(event, ${op.id}, '${op.status}')"
                           ondragend="handleDragEnd_operation(event)">
                        <div class="flex justify-between items-start mb-2">
                          <span class="text-xs font-semibold text-gray-500">#${op.id}</span>
                          <button onclick="deleteOperation(${op.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                        <h4 class="font-bold text-gray-800 mb-2">${op.customer_name || '(고객명 없음)'}</h4>
                        <p class="text-sm text-gray-600 mb-2">
                          <i class="fas fa-phone mr-1"></i>
                          ${op.phone || '-'}
                        </p>
                        <div class="text-xs text-gray-500">
                          <i class="fas fa-clock mr-1"></i>
                          ${formatDate(op.created_at)}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    mainContent.innerHTML = content;

    // 드래그 앤 드롭 이벤트 등록
    document.querySelectorAll('.kanban-column').forEach(column => {
      column.addEventListener('dragover', handleDragOver_operation);
      column.addEventListener('drop', handleDrop_operation);
    });

  } catch (error) {
    console.error('운영등재 칸반 조회 오류:', error);
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-8 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <h3 class="text-xl font-bold text-gray-800 mb-2">운영등재 칸반을 불러올 수 없습니다</h3>
          <p class="text-gray-600 mb-4">${error.response?.data?.error || error.message}</p>
          <button onclick="loadOperationKanban()" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition">
            다시 시도
          </button>
        </div>
      `;
    }
  }
}

/**
 * 드래그 앤 드롭 핸들러
 */
let draggedOperationId = null;
let draggedOperationStatus = null;

function handleDragStart_operation(event, id, status) {
  draggedOperationId = id;
  draggedOperationStatus = status;
  event.target.style.opacity = '0.5';
}

function handleDragEnd_operation(event) {
  event.target.style.opacity = '1';
}

function handleDragOver_operation(event) {
  event.preventDefault();
  const column = event.currentTarget;
  column.classList.add('bg-blue-50');
}

async function handleDrop_operation(event) {
  event.preventDefault();
  const column = event.currentTarget;
  column.classList.remove('bg-blue-50');

  const newStatus = column.dataset.status;
  
  if (draggedOperationId && draggedOperationStatus !== newStatus) {
    try {
      await axios.patch(`/api/operations/${draggedOperationId}/status`, { status: newStatus });
      loadOperationKanban();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  }
  
  draggedOperationId = null;
  draggedOperationStatus = null;
}

/**
 * 신규 운영등재 모달
 */
function showAddOperationModal() {
  const modalHTML = `
    <div id="addOperationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6 text-gray-800">
          <i class="fas fa-plus-circle mr-2 text-orange-600"></i>
          신규 운영등재
        </h3>
        
        <form id="addOperationForm" class="space-y-4">
          <!-- 고객명 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-user mr-1"></i>
              고객명 <span class="text-red-500">*</span>
            </label>
            <input type="text" id="opCustomerName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="홍길동">
          </div>

          <!-- 전화번호 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-phone mr-1"></i>
              전화번호
            </label>
            <input type="tel" id="opPhone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="010-1234-5678">
          </div>

          <!-- 상태 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-flag mr-1"></i>
              상태 <span class="text-red-500">*</span>
            </label>
            <select id="opStatus" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
              <option value="contract_pending">계약서 미진행</option>
              <option value="install_cert_pending">설치확인서 미진행</option>
              <option value="install_photo_pending">설치사진 미진행</option>
              <option value="drive_upload_pending">드라이브 업로드 미진행</option>
              <option value="completed">운영등재완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-sticky-note mr-1"></i>
              메모
            </label>
            <textarea id="opNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="추가 정보 입력"></textarea>
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="closeAddOperationModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              취소
            </button>
            <button type="submit" class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
              <i class="fas fa-check mr-2"></i>
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('addOperationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      customer_name: document.getElementById('opCustomerName').value.trim(),
      phone: document.getElementById('opPhone').value.trim(),
      status: document.getElementById('opStatus').value,
      notes: document.getElementById('opNotes').value.trim()
    };

    try {
      await axios.post('/api/operations', data);
      closeAddOperationModal();
      alert('운영등재가 등록되었습니다.');
      if (currentOperationViewMode === 'list') {
        loadOperationList();
      } else {
        loadOperationKanban();
      }
    } catch (error) {
      console.error('운영등재 등록 오류:', error);
      alert(error.response?.data?.error || '등록 중 오류가 발생했습니다.');
    }
  });
}

function closeAddOperationModal() {
  const modal = document.getElementById('addOperationModal');
  if (modal) modal.remove();
}

/**
 * 운영등재 상세 보기
 */
async function viewOperationDetail(id) {
  try {
    const response = await axios.get(`/api/operations/${id}`);
    const op = response.data;

    const statusMap = {
      'contract_pending': '계약서 미진행',
      'install_cert_pending': '설치확인서 미진행',
      'install_photo_pending': '설치사진 미진행',
      'drive_upload_pending': '드라이브 업로드 미진행',
      'completed': '운영등재완료',
      'cancelled': '취소'
    };

    const modalHTML = `
      <div id="operationDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-2xl font-bold mb-6 text-gray-800">
            <i class="fas fa-info-circle mr-2 text-orange-600"></i>
            운영등재 상세 정보
          </h3>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">ID</label>
                <p class="text-gray-800">#${op.id}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">상태</label>
                <p class="text-gray-800">${statusMap[op.status] || op.status}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">고객명</label>
                <p class="text-gray-800">${op.customer_name || '-'}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">전화번호</label>
                <p class="text-gray-800">${op.phone || '-'}</p>
              </div>
            </div>

            ${op.notes ? `
              <div>
                <label class="text-sm font-semibold text-gray-600">메모</label>
                <p class="text-gray-800 whitespace-pre-wrap">${op.notes}</p>
              </div>
            ` : ''}

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">등록일</label>
                <p class="text-gray-800">${formatDate(op.created_at)}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-600">등록자</label>
                <p class="text-gray-800">${op.created_by_name || '-'}</p>
              </div>
            </div>

            ${op.updated_at ? `
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-semibold text-gray-600">최종 수정일</label>
                  <p class="text-gray-800">${formatDate(op.updated_at)}</p>
                </div>
                <div>
                  <label class="text-sm font-semibold text-gray-600">최종 수정자</label>
                  <p class="text-gray-800">${op.updated_by_name || '-'}</p>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="flex justify-end space-x-3 pt-6">
            <button onclick="closeOperationDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              닫기
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

  } catch (error) {
    console.error('운영등재 상세 조회 오류:', error);
    alert('상세 정보를 불러올 수 없습니다.');
  }
}

function closeOperationDetailModal() {
  const modal = document.getElementById('operationDetailModal');
  if (modal) modal.remove();
}

/**
 * 운영등재 삭제
 */
async function deleteOperation(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`/api/operations/${id}`);
    alert('삭제되었습니다.');
    if (currentOperationViewMode === 'list') {
      loadOperationList(currentOperationPage);
    } else {
      loadOperationKanban();
    }
  } catch (error) {
    console.error('운영등재 삭제 오류:', error);
    alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.');
  }
}

// 전역 함수 노출
window.loadOperationPage = loadOperationPage;
window.toggleOperationViewMode = toggleOperationViewMode;
window.showAddOperationModal = showAddOperationModal;
window.closeAddOperationModal = closeAddOperationModal;
window.viewOperationDetail = viewOperationDetail;
window.closeOperationDetailModal = closeOperationDetailModal;
window.deleteOperation = deleteOperation;
window.handleDragStart_operation = handleDragStart_operation;
window.handleDragEnd_operation = handleDragEnd_operation;

console.log('✅ operation.js 모듈 로드 완료');

})();
