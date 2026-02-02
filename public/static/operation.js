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
    let { data: operations, pagination } = response.data;
    
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  미달 조건
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
                
                // 미달 조건 체크
                const missingItems = [];
                if (!op.contract_document_url) {
                  missingItems.push('<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded mr-1 mb-1 inline-block">계약서 미진행</span>');
                }
                if (!op.install_certificate_url) {
                  missingItems.push('<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded mr-1 mb-1 inline-block">설치확인서 미진행</span>');
                }
                if (!op.install_photo_url) {
                  missingItems.push('<span class="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded mr-1 mb-1 inline-block">설치사진 미진행</span>');
                }
                if (!op.drive_url) {
                  missingItems.push('<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-1 mb-1 inline-block">드라이브 미진행</span>');
                }
                
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
                    <td class="px-6 py-4 text-sm">
                      <div class="flex flex-wrap max-w-xs">
                        ${missingItems.length > 0 ? missingItems.join('') : '<span class="text-green-600">✓ 모두 완료</span>'}
                      </div>
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
                      <button onclick="approveOperation(${op.id})" class="text-green-600 hover:text-green-800 mr-3" title="운영 확정">
                        <i class="fas fa-check-circle"></i>
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
    const { data: operations } = response.data;

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
    const op = response.data.data;

    const statusMap = {
      'contract_pending': '계약서 미진행',
      'install_cert_pending': '설치확인서 미진행',
      'install_photo_pending': '설치사진 미진행',
      'drive_upload_pending': '드라이브 업로드 미진행',
      'completed': '운영등재완료',
      'cancelled': '취소'
    };

    // 모든 조건 완료 여부 확인
    const isAllCompleted = op.contract_document_url && op.install_certificate_url && op.install_photo_url && op.drive_url;
    const canConfirm = isAllCompleted && op.status !== 'completed' && op.status !== 'cancelled';

    const modalHTML = `
      <div id="operationDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-2xl font-bold mb-6 text-gray-800">
            <i class="fas fa-info-circle mr-2 text-orange-600"></i>
            운영등재 상세 정보
          </h3>
          
          <div class="space-y-6">
            <!-- 기본 정보 -->
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

            <!-- 제출 서류 체크리스트 -->
            <div class="border-t pt-4">
              <h4 class="font-semibold text-gray-700 mb-3">
                <i class="fas fa-clipboard-check mr-2"></i>
                제출 서류 체크리스트
              </h4>
              <div class="space-y-2">
                <div class="flex items-center justify-between p-3 rounded-lg ${op.contract_document_url ? 'bg-green-50' : 'bg-red-50'}">
                  <span class="flex items-center">
                    <i class="fas fa-${op.contract_document_url ? 'check-circle text-green-600' : 'times-circle text-red-600'} mr-2"></i>
                    계약서
                  </span>
                  ${op.contract_document_url ? `<a href="${op.contract_document_url}" target="_blank" class="text-blue-600 hover:underline text-sm"><i class="fas fa-external-link-alt"></i> 보기</a>` : '<span class="text-red-600 text-sm">미제출</span>'}
                </div>
                <div class="flex items-center justify-between p-3 rounded-lg ${op.install_certificate_url ? 'bg-green-50' : 'bg-orange-50'}">
                  <span class="flex items-center">
                    <i class="fas fa-${op.install_certificate_url ? 'check-circle text-green-600' : 'times-circle text-orange-600'} mr-2"></i>
                    설치확인서
                  </span>
                  ${op.install_certificate_url ? `<a href="${op.install_certificate_url}" target="_blank" class="text-blue-600 hover:underline text-sm"><i class="fas fa-external-link-alt"></i> 보기</a>` : '<span class="text-orange-600 text-sm">미제출</span>'}
                </div>
                <div class="flex items-center justify-between p-3 rounded-lg ${op.install_photo_url ? 'bg-green-50' : 'bg-yellow-50'}">
                  <span class="flex items-center">
                    <i class="fas fa-${op.install_photo_url ? 'check-circle text-green-600' : 'times-circle text-yellow-600'} mr-2"></i>
                    설치사진
                  </span>
                  ${op.install_photo_url ? `<a href="${op.install_photo_url}" target="_blank" class="text-blue-600 hover:underline text-sm"><i class="fas fa-external-link-alt"></i> 보기</a>` : '<span class="text-yellow-600 text-sm">미제출</span>'}
                </div>
                <div class="flex items-center justify-between p-3 rounded-lg ${op.drive_url ? 'bg-green-50' : 'bg-blue-50'}">
                  <span class="flex items-center">
                    <i class="fas fa-${op.drive_url ? 'check-circle text-green-600' : 'times-circle text-blue-600'} mr-2"></i>
                    드라이브 업로드
                  </span>
                  ${op.drive_url ? `<a href="${op.drive_url}" target="_blank" class="text-blue-600 hover:underline text-sm"><i class="fas fa-external-link-alt"></i> 보기</a>` : '<span class="text-blue-600 text-sm">미제출</span>'}
                </div>
              </div>
            </div>

            ${op.memo ? `
              <div class="border-t pt-4">
                <label class="text-sm font-semibold text-gray-600 block mb-2">메모</label>
                <p class="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">${op.memo}</p>
              </div>
            ` : ''}

            <!-- 등록/수정 정보 -->
            <div class="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label class="font-semibold">등록일</label>
                <p class="text-gray-800">${formatDate(op.created_at)}</p>
              </div>
              <div>
                <label class="font-semibold">등록자</label>
                <p class="text-gray-800">${op.created_by_name || '-'}</p>
              </div>
              ${op.updated_at ? `
                <div>
                  <label class="font-semibold">최종 수정일</label>
                  <p class="text-gray-800">${formatDate(op.updated_at)}</p>
                </div>
                <div>
                  <label class="font-semibold">최종 수정자</label>
                  <p class="text-gray-800">${op.updated_by_name || '-'}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 버튼 영역 -->
          <div class="flex justify-between items-center pt-6 border-t mt-6">
            <button onclick="showOperationEditModal(${op.id})" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              <i class="fas fa-edit mr-2"></i>
              수정
            </button>
            <div class="flex space-x-3">
              ${canConfirm ? `
                <button onclick="confirmOperationComplete(${op.id})" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition animate-pulse">
                  <i class="fas fa-check-double mr-2"></i>
                  운영등재 확정
                </button>
              ` : ''}
              <button onclick="closeOperationDetailModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
                <i class="fas fa-times mr-2"></i>
                닫기
              </button>
            </div>
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
 * 운영등재 수정 모달
 */
async function showOperationEditModal(id) {
  try {
    const response = await axios.get(`/api/operations/${id}`);
    const op = response.data.data;

    const modalHTML = `
      <div id="operationEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- 모달 헤더 -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2 text-blue-600"></i>
              운영등재 수정
            </h3>
            <button onclick="closeOperationEditModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 5-Tab 네비게이션 -->
          <div class="mb-6 border-b">
            <nav class="flex space-x-2">
              <button type="button" onclick="switchOperationTab('basic')" class="operation-tab-btn px-6 py-3 font-semibold text-sm transition border-b-2 border-blue-500 text-blue-600" data-tab="basic">
                <i class="fas fa-user mr-2"></i>기본
              </button>
              <button type="button" onclick="switchOperationTab('finance')" class="operation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="finance">
                <i class="fas fa-won-sign mr-2"></i>금융
              </button>
              <button type="button" onclick="switchOperationTab('hardware')" class="operation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="hardware">
                <i class="fas fa-laptop mr-2"></i>H/W
              </button>
              <button type="button" onclick="switchOperationTab('manage')" class="operation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="manage">
                <i class="fas fa-cog mr-2"></i>관리
              </button>
              <button type="button" onclick="switchOperationTab('evidence')" class="operation-tab-btn px-6 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" data-tab="evidence">
                <i class="fas fa-folder-open mr-2"></i>증빙
              </button>
            </nav>
          </div>
          
          <form id="operationEditForm">
            <!-- Tab 1: 기본 정보 -->
            <div id="operation-tab-basic" class="operation-tab-content">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">고객명 <span class="text-red-500">*</span></label>
                  <input type="text" id="editCustomerName" value="${op.customer_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">전화번호</label>
                  <input type="tel" id="editPhone" value="${op.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">생년월일</label>
                  <input type="date" id="editBirthDate" value="${op.birth_date || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                  <input type="email" id="editEmail" value="${op.email || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">사업자번호</label>
                  <input type="text" id="editBusinessNumber" value="${op.business_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">대표자명</label>
                  <input type="text" id="editRepresentative" value="${op.representative || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">도로명 주소</label>
                  <input type="text" id="editRoadAddress" value="${op.road_address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">상세 주소</label>
                  <input type="text" id="editDetailAddress" value="${op.detail_address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">지역</label>
                  <input type="text" id="editRegion" value="${op.region || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">지역 구분</label>
                  <input type="text" id="editRegionType" value="${op.region_type || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">상태</label>
                  <select id="editStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="contract_pending" ${op.status === 'contract_pending' ? 'selected' : ''}>계약서 미진행</option>
                    <option value="install_cert_pending" ${op.status === 'install_cert_pending' ? 'selected' : ''}>설치확인서 미진행</option>
                    <option value="install_photo_pending" ${op.status === 'install_photo_pending' ? 'selected' : ''}>설치사진 미진행</option>
                    <option value="drive_upload_pending" ${op.status === 'drive_upload_pending' ? 'selected' : ''}>드라이브 업로드 미진행</option>
                    <option value="completed" ${op.status === 'completed' ? 'selected' : ''}>운영등재완료</option>
                    <option value="cancelled" ${op.status === 'cancelled' ? 'selected' : ''}>취소</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tab 2: 금융 정보 -->
            <div id="operation-tab-finance" class="operation-tab-content hidden">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">은행명</label>
                  <input type="text" id="editBankName" value="${op.bank_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계좌번호</label>
                  <input type="text" id="editAccountNumber" value="${op.account_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">예금주</label>
                  <input type="text" id="editAccountHolder" value="${op.account_holder || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계약 유형</label>
                  <input type="text" id="editContractType" value="${op.contract_type || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">출금일</label>
                  <input type="number" id="editWithdrawalDay" value="${op.withdrawal_day || ''}" min="1" max="31" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">월 렌탈료 (원)</label>
                  <input type="number" id="editMonthlyRentalFee" value="${op.monthly_rental_fee || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">보증금 (원)</label>
                  <input type="number" id="editDeposit" value="${op.deposit || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계약일</label>
                  <input type="date" id="editContractDate" value="${op.contract_date || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">계약 번호</label>
                  <input type="text" id="editContractNumber" value="${op.contract_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Tab 3: H/W 정보 -->
            <div id="operation-tab-hardware" class="operation-tab-content hidden">
              <div class="space-y-6">
                <!-- POS 정보 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-desktop mr-2 text-purple-600"></i>
                    POS 정보
                  </h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">POS 대리점</label>
                      <input type="text" id="editPosAgency" value="${op.pos_agency || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">POS 제조사</label>
                      <input type="text" id="editPosVendor" value="${op.pos_vendor || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">POS 모델명</label>
                      <input type="text" id="editPosModel" value="${op.pos_model || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">POS 프로그램</label>
                      <input type="text" id="editPosProgram" value="${op.pos_program || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">ASP ID</label>
                      <input type="text" id="editAspId" value="${op.asp_id || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">ASP 비밀번호</label>
                      <input type="password" id="editAspPassword" value="${op.asp_password || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="col-span-2">
                      <label class="block text-sm font-semibold text-gray-700 mb-2">ASP URL</label>
                      <input type="url" id="editAspUrl" value="${op.asp_url || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                </div>

                <!-- 테이블오더 & 거치대 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-tablet-alt mr-2 text-blue-600"></i>
                    테이블오더 & 거치대
                  </h4>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">테이블오더 수량</label>
                      <input type="number" id="editTableOrderQty" value="${op.table_order_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">거치대 일반</label>
                      <input type="number" id="editStandStandard" value="${op.stand_standard || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">거치대 평판</label>
                      <input type="number" id="editStandFlat" value="${op.stand_flat || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">거치대 확장</label>
                      <input type="number" id="editStandExtended" value="${op.stand_extended || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">충전기</label>
                      <input type="number" id="editChargerQty" value="${op.charger_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">배터리</label>
                      <input type="number" id="editBatteryQty" value="${op.battery_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                </div>

                <!-- 네트워크 & 기타 -->
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-network-wired mr-2 text-green-600"></i>
                    네트워크 & 기타 장비
                  </h4>
                  <div class="grid grid-cols-4 gap-4">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">공유기</label>
                      <input type="number" id="editRouterQty" value="${op.router_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">키오스크</label>
                      <input type="number" id="editKioskQty" value="${op.kiosk_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">주방프린터</label>
                      <input type="number" id="editKitchenPrinterQty" value="${op.kitchen_printer_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">호출벨</label>
                      <input type="number" id="editCallBellQty" value="${op.call_bell_qty || 0}" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 4: 관리 정보 -->
            <div id="operation-tab-manage" class="operation-tab-content hidden">
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <i class="fas fa-cogs mr-2 text-indigo-600"></i>
                    부가 서비스
                  </h4>
                  <div class="grid grid-cols-2 gap-4">
                    <label class="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <input type="checkbox" id="editCrmService" ${op.crm_service ? 'checked' : ''} class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-800">
                        <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                        CRM 서비스
                      </span>
                    </label>
                    <label class="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <input type="checkbox" id="editAiSalesService" ${op.ai_sales_service ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                      <span class="text-sm font-medium text-gray-800">
                        <i class="fas fa-robot mr-2 text-purple-600"></i>
                        AI 매출 분석 서비스
                      </span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">메모</label>
                  <textarea id="editMemo" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="추가 메모사항을 입력하세요...">${op.memo || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- Tab 5: 증빙 자료 -->
            <div id="operation-tab-evidence" class="operation-tab-content hidden">
              <div class="space-y-4 bg-purple-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-folder-open mr-2 text-purple-600"></i>
                  증빙 자료 확인
                </h4>
                <!-- 체크박스 3개 -->
                <div class="space-y-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="editContractChecked" ${op.contract_checked ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-file-signature mr-2 text-red-600"></i>
                      계약서 작성 완료
                    </span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="editCertChecked" ${op.installation_cert_checked ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-clipboard-check mr-2 text-orange-600"></i>
                      설치확인서 확인 완료
                    </span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="editPhotoChecked" ${op.installation_photo_checked ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-800">
                      <i class="fas fa-camera mr-2 text-yellow-600"></i>
                      설치사진 확인 완료
                    </span>
                  </label>
                </div>
                
                <!-- 구글 드라이브 URL -->
                <div class="pt-3 border-t border-purple-200">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-cloud mr-1 text-blue-600"></i>
                    구글 드라이브 URL <span class="text-red-500">*</span>
                  </label>
                  <input type="url" id="editDriveUrl" value="${op.drive_url || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="https://drive.google.com/...">
                  <p class="text-xs text-gray-500 mt-1">
                    <i class="fas fa-info-circle mr-1"></i>
                    모든 증빙 자료가 업로드된 구글 드라이브 폴더 링크를 입력하세요.
                  </p>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button type="button" onclick="closeOperationEditModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
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
      
      <script>
        // Tab 전환 함수
        window.switchOperationTab = function(tabName) {
          // 모든 탭 버튼 스타일 초기화
          document.querySelectorAll('.operation-tab-btn').forEach(btn => {
            btn.classList.remove('text-blue-600', 'border-blue-500');
            btn.classList.add('text-gray-500', 'border-transparent');
          });
          
          // 현재 탭 버튼 활성화
          const activeBtn = document.querySelector(\`.operation-tab-btn[data-tab="\${tabName}"]\`);
          if (activeBtn) {
            activeBtn.classList.remove('text-gray-500', 'border-transparent');
            activeBtn.classList.add('text-blue-600', 'border-blue-500');
          }
          
          // 모든 탭 콘텐츠 숨기기
          document.querySelectorAll('.operation-tab-content').forEach(content => {
            content.classList.add('hidden');
          });
          
          // 현재 탭 콘텐츠 표시
          const activeContent = document.getElementById(\`operation-tab-\${tabName}\`);
          if (activeContent) {
            activeContent.classList.remove('hidden');
          }
        };
      </script>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 폼 제출 이벤트
    document.getElementById('operationEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateOperation(id);
    });

  } catch (error) {
    console.error('운영등재 수정 모달 오류:', error);
    alert('수정 모달을 불러올 수 없습니다.');
  }
}

function closeOperationEditModal() {
  const modal = document.getElementById('operationEditModal');
  if (modal) modal.remove();
}

/**
 * 운영등재 정보 업데이트
 */
async function updateOperation(id) {
  try {
    const data = {
      // 기본 정보
      customer_name: document.getElementById('editCustomerName').value,
      phone: document.getElementById('editPhone').value,
      birth_date: document.getElementById('editBirthDate').value || null,
      email: document.getElementById('editEmail').value || null,
      business_number: document.getElementById('editBusinessNumber').value || null,
      representative: document.getElementById('editRepresentative').value || null,
      road_address: document.getElementById('editRoadAddress').value || null,
      detail_address: document.getElementById('editDetailAddress').value || null,
      region: document.getElementById('editRegion').value || null,
      region_type: document.getElementById('editRegionType').value || null,
      status: document.getElementById('editStatus').value,
      
      // 금융 정보
      bank_name: document.getElementById('editBankName').value || null,
      account_number: document.getElementById('editAccountNumber').value || null,
      account_holder: document.getElementById('editAccountHolder').value || null,
      contract_type: document.getElementById('editContractType').value || null,
      withdrawal_day: document.getElementById('editWithdrawalDay').value || null,
      monthly_rental_fee: document.getElementById('editMonthlyRentalFee').value || null,
      deposit: document.getElementById('editDeposit').value || null,
      contract_date: document.getElementById('editContractDate').value || null,
      contract_number: document.getElementById('editContractNumber').value || null,
      
      // H/W: POS
      pos_agency: document.getElementById('editPosAgency').value || null,
      pos_vendor: document.getElementById('editPosVendor').value || null,
      pos_model: document.getElementById('editPosModel').value || null,
      pos_program: document.getElementById('editPosProgram').value || null,
      asp_id: document.getElementById('editAspId').value || null,
      asp_password: document.getElementById('editAspPassword').value || null,
      asp_url: document.getElementById('editAspUrl').value || null,
      
      // H/W: 테이블오더 & 거치대
      table_order_qty: parseInt(document.getElementById('editTableOrderQty').value) || 0,
      stand_standard: parseInt(document.getElementById('editStandStandard').value) || 0,
      stand_flat: parseInt(document.getElementById('editStandFlat').value) || 0,
      stand_extended: parseInt(document.getElementById('editStandExtended').value) || 0,
      charger_qty: parseInt(document.getElementById('editChargerQty').value) || 0,
      battery_qty: parseInt(document.getElementById('editBatteryQty').value) || 0,
      
      // H/W: 네트워크 & 기타
      router_qty: parseInt(document.getElementById('editRouterQty').value) || 0,
      kiosk_qty: parseInt(document.getElementById('editKioskQty').value) || 0,
      kitchen_printer_qty: parseInt(document.getElementById('editKitchenPrinterQty').value) || 0,
      call_bell_qty: parseInt(document.getElementById('editCallBellQty').value) || 0,
      
      // 관리 정보
      crm_service: document.getElementById('editCrmService').checked ? 1 : 0,
      ai_sales_service: document.getElementById('editAiSalesService').checked ? 1 : 0,
      memo: document.getElementById('editMemo').value || null,
      
      // 증빙 자료
      contract_checked: document.getElementById('editContractChecked').checked ? 1 : 0,
      installation_cert_checked: document.getElementById('editCertChecked').checked ? 1 : 0,
      installation_photo_checked: document.getElementById('editPhotoChecked').checked ? 1 : 0,
      drive_url: document.getElementById('editDriveUrl').value || null
    };

    await axios.put(`/api/operations/${id}`, data);
    
    alert('수정되었습니다.');
    closeOperationEditModal();
    closeOperationDetailModal();
    
    // 리스트 새로고침
    if (currentOperationViewMode === 'list') {
      loadOperationList(currentOperationPage);
    } else {
      loadOperationKanban();
    }
  } catch (error) {
    console.error('운영등재 수정 오류:', error);
    alert(error.response?.data?.error || '수정 중 오류가 발생했습니다.');
  }
}

/**
 * 운영등재 확정 (가맹점현황으로 이관)
 */
async function confirmOperationComplete(id) {
  if (!confirm('운영등재를 확정하시겠습니까?\n\n확정 후 가맹점현황으로 이동됩니다.')) return;

  try {
    // 상태를 completed로 변경
    await axios.put(`/api/operations/${id}`, { status: 'completed' });
    
    alert('✅ 운영등재가 확정되었습니다!\n가맹점현황으로 이동되었습니다.');
    
    closeOperationDetailModal();
    
    // 리스트 새로고침
    if (currentOperationViewMode === 'list') {
      loadOperationList(currentOperationPage);
    } else {
      loadOperationKanban();
    }
  } catch (error) {
    console.error('운영등재 확정 오류:', error);
    alert(error.response?.data?.error || '확정 중 오류가 발생했습니다.');
  }
}

/**
 * 운영등재 승인 (가맹점현황으로 이관)
 */
async function approveOperation(id) {
  if (!confirm('이 운영등재를 승인하여 가맹점현황으로 이관하시겠습니까?\n\n증빙 자료가 모두 완료되어야 승인됩니다.')) {
    return;
  }

  try {
    const response = await axios.post(`/api/operations/${id}/approve`);
    
    alert('✅ ' + response.data.message);
    
    // 리스트 새로고침
    if (currentOperationViewMode === 'list') {
      loadOperationList(currentOperationPage);
    } else {
      loadOperationKanban();
    }
  } catch (error) {
    console.error('운영등재 승인 오류:', error);
    
    // 유효성 검사 에러 상세 표시
    if (error.response?.data?.validationErrors) {
      const errors = error.response.data.validationErrors;
      let errorMessage = '❌ 승인 조건을 충족하지 못했습니다:\n\n';
      errors.forEach((err, idx) => {
        errorMessage += `${idx + 1}. ${err}\n`;
      });
      errorMessage += '\n증빙 자료를 모두 완료한 후 다시 시도해주세요.';
      alert(errorMessage);
    } else {
      alert(error.response?.data?.error || '승인 처리 중 오류가 발생했습니다.');
    }
  }
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
window.showOperationEditModal = showOperationEditModal;
window.closeOperationEditModal = closeOperationEditModal;
window.updateOperation = updateOperation;
window.confirmOperationComplete = confirmOperationComplete;
window.approveOperation = approveOperation;
window.deleteOperation = deleteOperation;
window.handleDragStart_operation = handleDragStart_operation;
window.handleDragEnd_operation = handleDragEnd_operation;

console.log('✅ operation.js 모듈 로드 완료');

})();
