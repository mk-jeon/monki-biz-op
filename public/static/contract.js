// 계약현황 관련 함수

let currentContractPage = 1;
let currentContractViewMode = 'list'; // 'list' or 'kanban'
let inflowSources = []; // 유입경로 목록 (상담에서 가져옴)

/**
 * 계약현황 페이지 로드
 */
async function loadContractPage() {
  // 유입경로 목록 먼저 로드
  await loadInflowSourcesForContract();
  
  // 리스트 모드로 시작
  loadContractList();
}

/**
 * 유입경로 목록 로드
 */
async function loadInflowSourcesForContract() {
  try {
    const response = await axios.get('/api/consultations/categories/inflow_source');
    inflowSources = response.data.items;
  } catch (error) {
    console.error('Load inflow sources error:', error);
  }
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
    const { contracts, pagination } = response.data;

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
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">고객명</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">전화번호</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">유입경로</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">옵션</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">등록일</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">등록자</th>
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
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="showContractDetail(${item.id})">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.id}</td>
                    <td class="px-4 py-3">
                      <span class="${status.color} text-white text-xs px-2 py-1 rounded">${status.text}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.phone}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.inflow_source || '-'}</td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-1">
                        ${item.pre_installation ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">선설치</span>' : ''}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.created_by_name}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.updated_by_name || '-'}</td>
                    <td class="px-4 py-3 text-center">
                      <button onclick="event.stopPropagation(); showContractForm(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">
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
 * 계약 등록/수정 폼 표시
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
          <!-- 고객명 -->
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

          <!-- 전화번호 -->
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

        <!-- 유입경로 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            유입경로
          </label>
          <select
            id="inflowSource"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">선택하세요</option>
            ${inflowSources.map(source => `
              <option value="${source.value}" ${isEdit && contract && contract.inflow_source === source.value ? 'selected' : ''}>
                ${source.value}
              </option>
            `).join('')}
          </select>
        </div>

        ${isEdit ? `
          <!-- 진행 상태 -->
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

          <!-- 세부 옵션 -->
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

        <!-- 메모 -->
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

  // 폼 제출 이벤트
  document.getElementById('contractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateContract(id);
    } else {
      await submitContract();
    }
  });
}

/**
 * 계약 등록
 */
async function submitContract() {
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
    await axios.post('/api/contracts', data);
    alert('계약이 등록되었습니다.');
    loadContractList(1);
  } catch (error) {
    console.error('Submit contract error:', error);
    alert(error.response?.data?.error || '계약 등록에 실패했습니다.');
  }
}

/**
 * 계약 수정
 */
async function updateContract(id) {
  const data = {
    customer_name: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    inflow_source: document.getElementById('inflowSource').value,
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

/**
 * 계약 삭제
 */
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
 * 계약 상세 조회
 */
async function showContractDetail(id) {
  try {
    const response = await axios.get(`/api/contracts/${id}`);
    const item = response.data.contract;

    const statusMap = {
      'waiting': { text: '계약대기', color: 'bg-gray-500' },
      'in_progress': { text: '계약 중', color: 'bg-blue-500' },
      'signature_pending': { text: '서명대기', color: 'bg-purple-500' },
      'hold': { text: '계약보류', color: 'bg-yellow-500' },
      'completed': { text: '계약완료', color: 'bg-green-500' },
      'cancelled': { text: '취소', color: 'bg-red-500' }
    };

    const status = statusMap[item.status] || statusMap['waiting'];

    const modal = `
      <div id="detailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'detailModal') closeContractDetailModal()">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              계약 상세 정보
            </h3>
            <button onclick="closeContractDetailModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <span class="${status.color} text-white text-sm px-3 py-1 rounded">${status.text}</span>
              ${item.pre_installation ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">선설치</span>' : ''}
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">고객명</p>
                <p class="font-semibold">${item.customer_name || '-'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">전화번호</p>
                <p class="font-semibold">${item.phone}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">유입경로</p>
                <p class="font-semibold">${item.inflow_source || '-'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">등록일</p>
                <p class="font-semibold">${formatDate(item.created_at)}</p>
              </div>
            </div>

            ${item.notes ? `
              <div>
                <p class="text-sm text-gray-600 mb-2">메모</p>
                <p class="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">${item.notes}</p>
              </div>
            ` : ''}

            <div class="flex space-x-2 pt-4">
              <button onclick="closeContractDetailModal(); showContractForm(${item.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                <i class="fas fa-edit mr-2"></i>
                수정
              </button>
              <button onclick="closeContractDetailModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Load detail error:', error);
    alert('계약 정보를 불러올 수 없습니다.');
  }
}

/**
 * 상세 모달 닫기
 */
function closeContractDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.remove();
}

/**
 * 칸반 보드 조회
 */
async function loadContractKanban() {
  try {
    const response = await axios.get('/api/contracts?page=1&limit=1000');
    const contracts = response.data.contracts || [];

    // 상태별로 그룹화
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
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-file-contract mr-2 text-green-600"></i>
              계약현황 - 칸반 보드
            </h2>
            <div class="flex space-x-2">
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

        <!-- 칸반 보드 -->
        <div class="p-6">
          <div class="grid grid-cols-6 gap-4">
            ${Object.keys(statusConfig).map(status => {
              const config = statusConfig[status];
              const items = grouped[status] || [];
              
              return `
                <div class="bg-gray-50 rounded-lg p-4">
                  <!-- 컬럼 헤더 -->
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                      <i class="fas ${config.icon} ${config.color.replace('bg-', 'text-')} mr-2"></i>
                      <h3 class="font-bold text-gray-800">${config.text}</h3>
                    </div>
                    <span class="bg-white text-gray-700 text-sm font-semibold px-2 py-1 rounded">${items.length}</span>
                  </div>

                  <!-- 드롭존 -->
                  <div 
                    class="contract-kanban-column min-h-[600px] space-y-3" 
                    data-status="${status}"
                    ondrop="handleContractDrop(event)"
                    ondragover="handleContractDragOver(event)"
                    ondragleave="handleContractDragLeave(event)"
                  >
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

/**
 * 칸반 카드 렌더링
 */
function renderContractKanbanCard(item, config) {
  return `
    <div 
      class="contract-kanban-card bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-move border-l-4 ${config.color.replace('bg-', 'border-')}"
      draggable="true"
      data-id="${item.id}"
      ondragstart="handleContractDragStart(event)"
      ondragend="handleContractDragEnd(event)"
      onclick="showContractDetail(${item.id})"
    >
      <!-- 카드 헤더 -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500">#${item.id}</span>
        <div class="flex space-x-1">
          ${item.pre_installation ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">선설치</span>' : ''}
        </div>
      </div>

      <!-- 고객 정보 -->
      <div class="mb-3">
        <p class="font-semibold text-gray-800 mb-1">${item.customer_name || '고객명 미입력'}</p>
        <p class="text-sm text-gray-600">
          <i class="fas fa-phone mr-1 text-gray-400"></i>
          ${item.phone}
        </p>
      </div>

      <!-- 유입경로 -->
      ${item.inflow_source ? `
        <div class="mb-2">
          <span class="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">
            ${item.inflow_source}
          </span>
        </div>
      ` : ''}

      <!-- 메모 미리보기 -->
      ${item.notes ? `
        <p class="text-xs text-gray-500 mb-2 line-clamp-2">${item.notes}</p>
      ` : ''}

      <!-- 등록 정보 -->
      <div class="text-xs text-gray-400 border-t pt-2 mt-2">
        <p>등록: ${item.created_by_name}</p>
        ${item.updated_by_name ? `<p>수정: ${item.updated_by_name}</p>` : ''}
        <p>${formatDate(item.created_at)}</p>
      </div>
    </div>
  `;
}

/**
 * 드래그 시작
 */
let draggedContractElement = null;

function handleContractDragStart(e) {
  draggedContractElement = e.currentTarget;
  e.currentTarget.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

/**
 * 드래그 종료
 */
function handleContractDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  
  document.querySelectorAll('.contract-kanban-column').forEach(col => {
    col.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  });
}

/**
 * 드래그 오버
 */
function handleContractDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  const column = e.currentTarget;
  column.classList.add('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  
  e.dataTransfer.dropEffect = 'move';
  return false;
}

/**
 * 드래그 리브
 */
function handleContractDragLeave(e) {
  const column = e.currentTarget;
  column.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
}

/**
 * 드롭 처리
 */
async function handleContractDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const column = e.currentTarget;
  column.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  
  if (draggedContractElement) {
    const itemId = draggedContractElement.dataset.id;
    const newStatus = column.dataset.status;
    
    try {
      await axios.put(`/api/contracts/${itemId}/status`, { status: newStatus });
      
      loadContractKanban();
    } catch (error) {
      console.error('Update status error:', error);
      alert(error.response?.data?.error || '상태 변경에 실패했습니다.');
    }
  }
  
  return false;
}
