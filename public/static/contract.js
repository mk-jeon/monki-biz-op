// 계약현황 모듈 - IIFE로 스코프 격리하여 중복 선언 방지
(function() {
  'use strict';
  
  console.log('🔵 contract.js 모듈 로드 시작 (IIFE 스코프)');


/**
 * 날짜 포맷 함수 (notice.js와 동일)
 */
function formatDate(dateString) {
  // UTC 시간을 한국 시간(UTC+9)으로 변환
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

let currentContractPage = 1;
let currentContractViewMode = 'list'; // 'list' or 'kanban'
let inflowSources = []; // 유입경로 목록 (상담에서 가져옴)

/**
 * 계약 정렬 처리 함수
 */
function handleSort_contract(field) {
  window.handleSort(field, 'contract', () => loadContractList(currentContractPage));
}

console.log('🔵 contract.js 시작 - 파일 로딩 중...');

/**
 * 계약현황 페이지 로드
 */
async function loadContractPage() {
  console.log('✅ loadContractPage 함수 호출됨');
  // 유입경로 목록 먼저 로드
  await loadInflowSourcesForContract();
  console.log('✅ loadInflowSourcesForContract 완료');
  
  // 리스트 모드로 시작
  console.log('✅ loadContractList 호출 직전');
  loadContractList();
  console.log('✅ loadContractList 호출 완료');
}
console.log('🟢 loadContractPage 함수 정의 완료');

// 즉시 window에 바인딩
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
  console.log(`✅ loadContractList 실행 (page=${page})`);
  try {
    console.log(`📡 API 호출 시작: /api/contracts?page=${page}&limit=50`);
    const response = await axios.get(`/api/contracts?page=${page}&limit=50`);
    console.log('✅ API 응답 받음:', response.data);
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
                ${createSortableHeader('id', 'ID', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
                ${createSortableHeader('status', '상태', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
                ${createSortableHeader('customer_name', '고객명', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
                ${createSortableHeader('phone', '전화번호', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
                ${createSortableHeader('inflow_source', '유입경로', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">옵션</th>
                ${createSortableHeader('created_at', '등록일', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
                ${createSortableHeader('created_by_name', '등록자', 'contract', 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase')}
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
    console.log('✅ HTML 렌더링 완료');
    currentContractPage = page;
  } catch (error) {
    console.error('❌ Load contract list error:', error);
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


  // ===========================================
  // 전역 객체에 함수 노출 (window.*)
  // ===========================================
  console.log('🟢 계약현황 함수들을 window 객체에 바인딩 중...');
  
  window.loadContractPage = loadContractPage;
  window.loadContractList = loadContractList;
  window.loadContractKanban = loadContractKanban;
  window.toggleContractViewMode = toggleContractViewMode;
  window.showContractForm = showContractForm;
  window.submitContract = submitContract;
  window.updateContract = updateContract;
  window.deleteContract = deleteContract;
  window.showContractDetail = showContractDetail;
  window.closeContractDetailModal = closeContractDetailModal;
  
  // 드래그앤드롭 핸들러 함수들
  window.handleContractDragStart = handleContractDragStart;
  window.handleContractDragEnd = handleContractDragEnd;
  window.handleContractDragOver = handleContractDragOver;
  window.handleContractDragLeave = handleContractDragLeave;
  window.handleContractDrop = handleContractDrop;
  
  // 설치 이관 관련 함수들
  window.showMigrateToInstallationModal = showMigrateToInstallationModal;
  window.closeMigrateToInstallationModal = closeMigrateToInstallationModal;
  window.migrateToInstallation = migrateToInstallation;
  
  console.log('✅ 계약현황 모듈 로드 완료 - 모든 함수가 window 객체에 바인딩됨');
  
})(); // IIFE 즉시 실행

/**
 * 이전 기록 검색 모달 표시 (계약현황)
 */
function showContractArchiveSearchModal() {
  const modal = `
    <div id="contractArchiveSearchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'contractArchiveSearchModal') closeContractArchiveSearchModal()">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden" onclick="event.stopPropagation()">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-search mr-2 text-gray-600"></i>
              이전 기록 검색
            </h3>
            <button onclick="closeContractArchiveSearchModal()" class="text-gray-500 hover:text-gray-700 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 필터 -->
          <div class="mt-4 flex space-x-2">
            <button onclick="filterContractArchive('all')" id="filterContractAll" class="px-4 py-2 bg-indigo-600 text-white rounded-lg transition">
              전체
            </button>
            <button onclick="filterContractArchive('completed')" id="filterContractCompleted" class="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition">
              계약완료
            </button>
            <button onclick="filterContractArchive('cancelled')" id="filterContractCancelled" class="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition">
              취소
            </button>
          </div>
        </div>
        
        <!-- 콘텐츠 -->
        <div id="contractArchiveSearchContent" class="p-6 overflow-y-auto" style="max-height: calc(90vh - 200px);">
          <div class="flex items-center justify-center h-40">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  
  // 초기 데이터 로드
  loadContractArchiveData('all');
}

/**
 * 이전 기록 검색 모달 닫기 (계약현황)
 */
function closeContractArchiveSearchModal() {
  const modal = document.getElementById('contractArchiveSearchModal');
  if (modal) modal.remove();
}

/**
 * 필터 변경 (계약현황)
 */
function filterContractArchive(type) {
  // 버튼 스타일 변경
  ['filterContractAll', 'filterContractCompleted', 'filterContractCancelled'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === `filterContract${type.charAt(0).toUpperCase() + type.slice(1)}` || (type === 'all' && id === 'filterContractAll')) {
        btn.className = 'px-4 py-2 bg-indigo-600 text-white rounded-lg transition';
      } else {
        btn.className = 'px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition';
      }
    }
  });
  
  loadContractArchiveData(type);
}

/**
 * 이전 기록 데이터 로드 (계약현황)
 */
async function loadContractArchiveData(type) {
  try {
    const content = document.getElementById('contractArchiveSearchContent');
    content.innerHTML = '<div class="flex items-center justify-center h-40"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    let url = '/api/contracts?page=1&limit=100&search_archive=true';
    if (type !== 'all') {
      url += `&status=${type}`;
    }
    
    const response = await axios.get(url);
    const contracts = response.data.contracts || [];
    
    if (contracts.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-gray-400 text-5xl mb-4"></i>
          <p class="text-gray-600">검색 결과가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    const statusMap = {
      'completed': { text: '계약완료', color: 'bg-blue-500' },
      'cancelled': { text: '취소', color: 'bg-red-500' }
    };
    
    const tableHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">고객명</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">전화번호</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">유입경로</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">옵션</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">등록일</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${contracts.map(item => `
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">${item.id}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusMap[item.status]?.color || 'bg-gray-500'}">
                    ${statusMap[item.status]?.text || item.status}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${item.phone || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${item.inflow_source || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${item.option || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
                <td class="px-4 py-3">
                  <button onclick="showContractDetail(${item.id})" class="text-indigo-600 hover:text-indigo-800 transition">
                    <i class="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    content.innerHTML = tableHTML;
  } catch (error) {
    console.error('Load contract archive data error:', error);
    const content = document.getElementById('contractArchiveSearchContent');
    content.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <p class="text-red-600">데이터를 불러올 수 없습니다.</p>
      </div>
    `;
  }
}

/**
 * 설치 이관 모달 표시
 */
async function showMigrateToInstallationModal() {
  try {
    console.log('🚀 설치이관 모달 열기 시도...');
    // 계약완료 및 선설치 건수 조회
    const response = await axios.get('/api/contracts/stats/completed');
    const { count, ids, completedCount, preInstallCount } = response.data;
    console.log(`📊 전체 건수: ${count}건 (계약완료: ${completedCount}건, 선설치: ${preInstallCount}건), IDs:`, ids);

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
    console.log('✅ 설치이관 모달 렌더링 완료');
  } catch (error) {
    console.error('❌ Show migrate to installation modal error:', error);
    alert('이관 정보를 불러올 수 없습니다.');
  }
}

/**
 * 설치 이관 모달 닫기
 */
function closeMigrateToInstallationModal() {
  const modal = document.getElementById('migrateToInstallationModal');
  if (modal) modal.remove();
  console.log('✅ 설치이관 모달 닫기 완료');
}

/**
 * 설치현황으로 이관 실행
 */
async function migrateToInstallation(ids) {
  try {
    console.log('🚀 설치이관 실행 시작...', ids);
    
    const response = await axios.post('/api/installations/migrate', {
      contract_ids: ids
    });

    const { successCount, errorCount, errors } = response.data;

    // 성공한 건이 있으면 성공으로 처리
    if (successCount > 0) {
      let message = `이관 완료!\n성공: ${successCount}건`;
      if (errorCount > 0) {
        message += `\n실패: ${errorCount}건`;
        if (errors && errors.length > 0) {
          message += '\n\n에러:\n' + errors.join('\n');
        }
      }
      alert(message);
    } else {
      // 모두 실패한 경우만 에러
      let message = `이관 실패\n실패: ${errorCount}건`;
      if (errors && errors.length > 0) {
        message += '\n\n에러:\n' + errors.join('\n');
      }
      alert(message);
    }
    
    closeMigrateToInstallationModal();
    
    // 리스트 새로고침
    if (currentContractViewMode === 'list') {
      loadContractList(currentContractPage);
    } else {
      loadContractKanban();
    }
  } catch (error) {
    console.error('❌ Migrate to installation error:', error);
    alert(error.response?.data?.error || '이관 중 오류가 발생했습니다.');
  }
}

// Window 바인딩
window.loadContractPage = loadContractPage;
window.loadContractList = loadContractList;
window.handleSort_contract = handleSort;
