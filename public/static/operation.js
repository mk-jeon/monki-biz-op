/**
 * 운영등재 페이지 - 리스트 및 칸반 보드
 */

let currentOperationPage = 1;
let currentOperationMode = 'list'; // 'list' or 'kanban'
let currentSort_operation = { column: null, direction: 'default' };

// 상태 맵핑
const operationStatusMap = {
  'contract_pending': { label: '계약서미진행', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  'install_cert_pending': { label: '설치확인서미진행', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  'install_photo_pending': { label: '설치사진미진행', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  'drive_upload_pending': { label: '드라이브업로드미진행', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  'completed': { label: '운영등재완료', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  'cancelled': { label: '취소', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
};

/**
 * 운영등재 페이지 로드
 */
async function loadOperationPage() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-clipboard-check mr-3"></i>운영등재
          </h1>
          <p class="text-gray-600 mt-2">설치 후 운영 등재 관리</p>
        </div>
        <div class="flex space-x-3">
          <button
            onclick="loadOperationList(1)"
            class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            id="btnOperationList"
          >
            <i class="fas fa-list mr-2"></i>리스트
          </button>
          <button
            onclick="loadOperationKanban()"
            class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            id="btnOperationKanban"
          >
            <i class="fas fa-columns mr-2"></i>칸반
          </button>
          <button
            onclick="showOperationForm()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <i class="fas fa-plus mr-2"></i>신규 등록
          </button>
        </div>
      </div>

      <div id="operationContent"></div>
    </div>
  `;

  // 기본 리스트 모드로 시작
  await loadOperationList(1);
}

/**
 * 운영등재 리스트 로드
 */
async function loadOperationList(page = 1) {
  currentOperationPage = page;
  currentOperationMode = 'list';

  // 버튼 활성화 상태
  document.getElementById('btnOperationList').classList.add('bg-indigo-600', 'text-white');
  document.getElementById('btnOperationList').classList.remove('bg-white', 'border-gray-300');
  document.getElementById('btnOperationKanban').classList.remove('bg-indigo-600', 'text-white');
  document.getElementById('btnOperationKanban').classList.add('bg-white', 'border-gray-300');

  try {
    const response = await axios.get(`/api/operations?page=${page}&limit=50`);
    const { data: operations, pagination } = response.data;

    renderOperationList(operations, pagination);
  } catch (error) {
    console.error('운영등재 목록 로드 오류:', error);
    alert('운영등재 목록을 불러올 수 없습니다.');
  }
}

/**
 * 운영등재 리스트 렌더링
 */
function renderOperationList(operations, pagination) {
  const operationContent = document.getElementById('operationContent');
  
  operationContent.innerHTML = `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              ${createSortableHeader('id', 'ID', 'operation', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
              ${createSortableHeader('status', '상태', 'operation', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
              ${createSortableHeader('customer_name', '고객명', 'operation', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
              ${createSortableHeader('phone', '전화번호', 'operation', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
              ${createSortableHeader('created_at', '등록일', 'operation', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
              ${createSortableHeader('created_by_name', '등록자', 'operation', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${operations.length === 0 ? `
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-inbox text-4xl mb-4"></i>
                  <p>등록된 운영등재가 없습니다.</p>
                </td>
              </tr>
            ` : operations.map(item => {
              const status = operationStatusMap[item.status] || operationStatusMap['contract_pending'];
              return `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.id}</td>
                  <td class="px-4 py-3">
                    <span class="${status.bgColor} ${status.textColor} px-3 py-1 rounded-full text-xs font-semibold">
                      ${status.label}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${item.phone || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${item.created_by_name || '-'}</td>
                  <td class="px-4 py-3 text-center">
                    <button
                      onclick="showOperationDetail(${item.id})"
                      class="text-indigo-600 hover:text-indigo-800 mr-2"
                      title="상세보기"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      onclick="deleteOperation(${item.id})"
                      class="text-red-600 hover:text-red-800"
                      title="삭제"
                    >
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
      ${renderPagination(pagination, 'loadOperationList')}
    </div>
  `;

  // 정렬 이벤트 바인딩
  handleSort_operation = function(column) {
    if (currentSort_operation.column === column) {
      if (currentSort_operation.direction === 'default') {
        currentSort_operation.direction = 'asc';
      } else if (currentSort_operation.direction === 'asc') {
        currentSort_operation.direction = 'desc';
      } else {
        currentSort_operation.direction = 'default';
      }
    } else {
      currentSort_operation.column = column;
      currentSort_operation.direction = 'asc';
    }

    const sorted = sortData(operations, column, currentSort_operation.direction);
    renderOperationList(sorted, pagination);
  };
  window.handleSort_operation = handleSort_operation;
}

/**
 * 운영등재 칸반 로드
 */
async function loadOperationKanban() {
  currentOperationMode = 'kanban';

  document.getElementById('btnOperationKanban').classList.add('bg-indigo-600', 'text-white');
  document.getElementById('btnOperationKanban').classList.remove('bg-white', 'border-gray-300');
  document.getElementById('btnOperationList').classList.remove('bg-indigo-600', 'text-white');
  document.getElementById('btnOperationList').classList.add('bg-white', 'border-gray-300');

  try {
    const response = await axios.get('/api/operations?page=1&limit=1000');
    const { data: operations } = response.data;

    renderOperationKanban(operations);
  } catch (error) {
    console.error('운영등재 칸반 로드 오류:', error);
    alert('운영등재 칸반을 불러올 수 없습니다.');
  }
}

/**
 * 운영등재 칸반 렌더링
 */
function renderOperationKanban(operations) {
  const operationContent = document.getElementById('operationContent');

  // 상태별 그룹화 (완료/취소는 최근 5건만)
  const grouped = {
    'contract_pending': operations.filter(op => op.status === 'contract_pending'),
    'install_cert_pending': operations.filter(op => op.status === 'install_cert_pending'),
    'install_photo_pending': operations.filter(op => op.status === 'install_photo_pending'),
    'drive_upload_pending': operations.filter(op => op.status === 'drive_upload_pending'),
    'completed': operations.filter(op => op.status === 'completed').slice(0, 5),
    'cancelled': operations.filter(op => op.status === 'cancelled').slice(0, 5)
  };

  operationContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      ${Object.keys(grouped).map(status => {
        const statusInfo = operationStatusMap[status];
        const items = grouped[status];

        return `
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold text-gray-800">${statusInfo.label}</h3>
              <span class="${statusInfo.bgColor} ${statusInfo.textColor} px-2 py-1 rounded-full text-xs font-bold">
                ${items.length}
              </span>
            </div>
            <div 
              class="space-y-3 min-h-[200px] kanban-column" 
              data-status="${status}"
              ondrop="dropOperation(event, '${status}')"
              ondragover="allowDrop(event)"
              ondragenter="highlightDropZone(event)"
              ondragleave="unhighlightDropZone(event)"
            >
              ${items.map(item => `
                <div 
                  class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition cursor-move kanban-card"
                  draggable="true"
                  data-id="${item.id}"
                  ondragstart="dragOperation(event, ${item.id})"
                >
                  <p class="font-medium text-gray-900 mb-2">${item.customer_name}</p>
                  <p class="text-sm text-gray-600 mb-2">${item.phone || '-'}</p>
                  <p class="text-xs text-gray-500">${formatDate(item.created_at)}</p>
                  <button
                    onclick="showOperationDetail(${item.id})"
                    class="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    상세보기 <i class="fas fa-arrow-right ml-1"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * 드래그 시작
 */
function dragOperation(event, id) {
  event.dataTransfer.setData('operationId', id);
  event.currentTarget.style.opacity = '0.5';
}

/**
 * 드롭 허용
 */
function allowDrop(event) {
  event.preventDefault();
}

/**
 * 드롭존 하이라이트
 */
function highlightDropZone(event) {
  event.preventDefault();
  event.currentTarget.classList.add('bg-indigo-50', 'border-2', 'border-dashed', 'border-indigo-400');
}

/**
 * 드롭존 하이라이트 제거
 */
function unhighlightDropZone(event) {
  event.currentTarget.classList.remove('bg-indigo-50', 'border-2', 'border-dashed', 'border-indigo-400');
}

/**
 * 드롭
 */
async function dropOperation(event, newStatus) {
  event.preventDefault();
  unhighlightDropZone(event);

  const operationId = event.dataTransfer.getData('operationId');
  if (!operationId) return;

  try {
    await axios.patch(`/api/operations/${operationId}/status`, { status: newStatus });
    await loadOperationKanban();
    
    if (newStatus === 'completed') {
      alert('운영등재가 완료되어 가맹점현황으로 자동 이관되었습니다.');
    }
  } catch (error) {
    console.error('상태 변경 오류:', error);
    alert('상태 변경 중 오류가 발생했습니다.');
  }
}

/**
 * 운영등재 등록 폼 표시
 */
function showOperationForm() {
  // 간단한 등록 폼 구현
  const modal = document.createElement('div');
  modal.id = 'operationFormModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
      <h2 class="text-2xl font-bold mb-4">운영등재 신규 등록</h2>
      <form id="operationForm">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-2">고객명 *</label>
            <input type="text" id="opCustomerName" required class="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">전화번호 *</label>
            <input type="tel" id="opPhone" required class="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">메모</label>
          <textarea id="opMemo" rows="3" class="w-full px-3 py-2 border rounded-lg"></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button type="button" onclick="closeOperationForm()" class="px-4 py-2 border rounded-lg">취소</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">저장</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('operationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveOperation();
  });
}

/**
 * 운영등재 저장
 */
async function saveOperation() {
  const data = {
    customer_name: document.getElementById('opCustomerName').value,
    phone: document.getElementById('opPhone').value,
    memo: document.getElementById('opMemo').value,
    status: 'contract_pending'
  };

  try {
    await axios.post('/api/operations', data);
    alert('운영등재가 등록되었습니다.');
    closeOperationForm();
    
    if (currentOperationMode === 'list') {
      await loadOperationList(currentOperationPage);
    } else {
      await loadOperationKanban();
    }
  } catch (error) {
    console.error('운영등재 저장 오류:', error);
    alert('운영등재 저장 중 오류가 발생했습니다.');
  }
}

/**
 * 운영등재 폼 닫기
 */
function closeOperationForm() {
  const modal = document.getElementById('operationFormModal');
  if (modal) modal.remove();
}

/**
 * 운영등재 삭제
 */
async function deleteOperation(id) {
  if (!confirm('이 운영등재를 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`/api/operations/${id}`);
    alert('운영등재가 삭제되었습니다.');
    
    if (currentOperationMode === 'list') {
      await loadOperationList(currentOperationPage);
    } else {
      await loadOperationKanban();
    }
  } catch (error) {
    console.error('운영등재 삭제 오류:', error);
    alert('운영등재 삭제 중 오류가 발생했습니다.');
  }
}

/**
 * 운영등재 상세 보기 (추후 구현)
 */
function showOperationDetail(id) {
  alert(`운영등재 상세 (ID: ${id}) - 추후 구현 예정`);
}

// 날짜 포맷 함수
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Window에 함수 노출
window.loadOperationPage = loadOperationPage;
window.loadOperationList = loadOperationList;
window.loadOperationKanban = loadOperationKanban;
window.showOperationForm = showOperationForm;
window.closeOperationForm = closeOperationForm;
window.deleteOperation = deleteOperation;
window.showOperationDetail = showOperationDetail;
window.dragOperation = dragOperation;
window.dropOperation = dropOperation;
window.allowDrop = allowDrop;
window.highlightDropZone = highlightDropZone;
window.unhighlightDropZone = unhighlightDropZone;
