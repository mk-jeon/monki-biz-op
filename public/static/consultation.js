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
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>등록된 상담이 없습니다.</p>
                  </td>
                </tr>
              ` : consultations.map(item => {
                const status = statusMap[item.status] || statusMap['waiting'];
                return `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="showConsultationDetail(${item.id})">
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
                      <button onclick="event.stopPropagation(); showConsultationForm(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">
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
 * 엑셀 빈양식 다운로드
 */
function downloadExcelTemplate() {
  // CSV 형식으로 빈양식 생성
  const headers = ['고객명', '전화번호', '유입경로', '요청사항'];
  
  // 유입경로 옵션 (첫 번째 데이터 행에 주석으로 추가)
  const inflowSourceOptions = inflowSources.map(s => s.value).join(' / ');
  const sampleRow = ['', '', `(선택: ${inflowSourceOptions})`, ''];
  
  const csv = [
    headers.join(','),
    sampleRow.join(',')
  ].join('\n');

  // BOM 추가 (엑셀에서 한글 깨짐 방지)
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

/**
 * 일괄 업로드 모달 닫기
 */
function closeBulkUploadModal() {
  const modal = document.getElementById('bulkUploadModal');
  if (modal) modal.remove();
}

/**
 * CSV 파일 업로드
 */
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

    // 헤더 제거
    const dataLines = lines.slice(1);
    const data = [];

    for (const line of dataLines) {
      const cols = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      // 유입경로에서 주석 제거
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

// formatDate 함수는 notice.js에 정의되어 있으므로 재사용

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
          <!-- 고객명 -->
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

          <!-- 전화번호 -->
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

        <!-- 유입경로 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            유입경로
          </label>
          ${createDropdownHTML('inflowSource', 'inflow_source', inflowSources, isEdit && consultation ? consultation.inflow_source : '')}
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
              <option value="waiting" ${consultation.status === 'waiting' ? 'selected' : ''}>상담대기</option>
              <option value="in_progress" ${consultation.status === 'in_progress' ? 'selected' : ''}>상담중</option>
              <option value="hold" ${consultation.status === 'hold' ? 'selected' : ''}>보류</option>
              <option value="completed" ${consultation.status === 'completed' ? 'selected' : ''}>계약확정</option>
              <option value="cancelled" ${consultation.status === 'cancelled' ? 'selected' : ''}>취소</option>
            </select>
          </div>

          <!-- 세부 옵션 -->
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

        <!-- 요청사항/메모 -->
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

  // 폼 제출 이벤트
  document.getElementById('consultationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateConsultation(id);
    } else {
      await submitConsultation();
    }
  });
}

/**
 * 상담 등록
 */
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

/**
 * 상담 수정
 */
async function updateConsultation(id) {
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

/**
 * 상담 삭제
 */
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
 * 상담 상세 조회 (간단한 모달)
 */
async function showConsultationDetail(id) {
  try {
    const response = await axios.get(`/api/consultations/${id}`);
    const item = response.data.consultation;

    const statusMap = {
      'waiting': { text: '상담대기', color: 'bg-gray-500' },
      'in_progress': { text: '상담중', color: 'bg-blue-500' },
      'hold': { text: '보류', color: 'bg-yellow-500' },
      'completed': { text: '계약확정', color: 'bg-green-500' },
      'cancelled': { text: '취소', color: 'bg-red-500' }
    };

    const status = statusMap[item.status] || statusMap['waiting'];

    const modal = `
      <div id="detailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'detailModal') closeDetailModal()">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              상담 상세 정보
            </h3>
            <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <span class="${status.color} text-white text-sm px-3 py-1 rounded">${status.text}</span>
              ${item.is_visit_consultation ? '<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">방문상담</span>' : ''}
              ${item.has_quotation ? '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">견적서</span>' : ''}
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
                <p class="font-semibold">${getLabelByValue('inflow_source', item.inflow_source)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">등록일</p>
                <p class="font-semibold">${formatDate(item.created_at)}</p>
              </div>
            </div>

            ${item.notes ? `
              <div>
                <p class="text-sm text-gray-600 mb-2">요청사항 / 메모</p>
                <p class="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">${item.notes}</p>
              </div>
            ` : ''}

            <div class="flex space-x-2 pt-4">
              <button onclick="closeDetailModal(); showConsultationForm(${item.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                <i class="fas fa-edit mr-2"></i>
                수정
              </button>
              <button onclick="closeDetailModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition">
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
    alert('상담 정보를 불러올 수 없습니다.');
  }
}

/**
 * 상세 모달 닫기
 */
function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.remove();
}

/**
 * 칸반 보드 조회
 */
async function loadConsultationKanban() {
  try {
    // 모든 상태별 데이터 조회
    const response = await axios.get('/api/consultations?page=1&limit=1000');
    const consultations = response.data.consultations || [];

    // 상태별로 그룹화
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
        <!-- 헤더 -->
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

        <!-- 칸반 보드 -->
        <div class="p-6">
          <div class="grid grid-cols-5 gap-4">
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

/**
 * 칸반 카드 렌더링
 */
function renderKanbanCard(item, config) {
  return `
    <div 
      class="kanban-card bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-move border-l-4 ${config.color.replace('bg-', 'border-')}"
      draggable="true"
      data-id="${item.id}"
      ondragstart="handleDragStart(event)"
      ondragend="handleDragEnd(event)"
      onclick="showConsultationDetail(${item.id})"
    >
      <!-- 카드 헤더 -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500">#${item.id}</span>
        <div class="flex space-x-1">
          ${item.is_visit_consultation ? '<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">방문</span>' : ''}
          ${item.has_quotation ? '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">견적</span>' : ''}
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
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  e.currentTarget.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

/**
 * 드래그 종료
 */
function handleDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  
  // 모든 드롭존 하이라이트 제거
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  });
}

/**
 * 드래그 오버
 */
function handleDragOver(e) {
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
function handleDragLeave(e) {
  const column = e.currentTarget;
  column.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
}

/**
 * 드롭 처리
 */
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
      
      // 칸반 보드 새로고침
      loadConsultationKanban();
    } catch (error) {
      console.error('Update status error:', error);
      alert(error.response?.data?.error || '상태 변경에 실패했습니다.');
    }
  }
  
  return false;
}

/**
 * 계약 이관 모달 표시
 */
async function showMigrateToContractModal() {
  try {
    // 계약확정 상태 건수 조회
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

/**
 * 계약 이관 모달 닫기
 */
function closeMigrateModal() {
  const modal = document.getElementById('migrateModal');
  if (modal) modal.remove();
}

/**
 * 계약현황으로 이관 실행
 */
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
    
    // 리스트 새로고침
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

/**
 * 이전 기록 검색 모달 표시
 */
function showArchiveSearchModal() {
  const modal = `
    <div id="archiveSearchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'archiveSearchModal') closeArchiveSearchModal()">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden" onclick="event.stopPropagation()">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-search mr-2 text-gray-600"></i>
              이전 기록 검색
            </h3>
            <button onclick="closeArchiveSearchModal()" class="text-gray-500 hover:text-gray-700 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 필터 -->
          <div class="mt-4 flex space-x-2">
            <button onclick="filterArchive('all')" id="filterAll" class="px-4 py-2 bg-indigo-600 text-white rounded-lg transition">
              전체
            </button>
            <button onclick="filterArchive('completed')" id="filterCompleted" class="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition">
              계약확정
            </button>
            <button onclick="filterArchive('cancelled')" id="filterCancelled" class="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition">
              취소
            </button>
          </div>
        </div>
        
        <!-- 콘텐츠 -->
        <div id="archiveSearchContent" class="p-6 overflow-y-auto" style="max-height: calc(90vh - 200px);">
          <div class="flex items-center justify-center h-40">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  
  // 초기 데이터 로드
  loadArchiveData('all');
}

/**
 * 이전 기록 검색 모달 닫기
 */
function closeArchiveSearchModal() {
  const modal = document.getElementById('archiveSearchModal');
  if (modal) modal.remove();
}

/**
 * 필터 변경
 */
function filterArchive(type) {
  // 버튼 스타일 변경
  ['filterAll', 'filterCompleted', 'filterCancelled'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === `filter${type.charAt(0).toUpperCase() + type.slice(1)}` || (type === 'all' && id === 'filterAll')) {
        btn.className = 'px-4 py-2 bg-indigo-600 text-white rounded-lg transition';
      } else {
        btn.className = 'px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition';
      }
    }
  });
  
  loadArchiveData(type);
}

/**
 * 이전 기록 데이터 로드
 */
async function loadArchiveData(type) {
  try {
    const content = document.getElementById('archiveSearchContent');
    content.innerHTML = '<div class="flex items-center justify-center h-40"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    let url = '/api/consultations?page=1&limit=100&search_archive=true';
    if (type !== 'all') {
      url += `&status=${type}`;
    }
    
    const response = await axios.get(url);
    const consultations = response.data.consultations || [];
    
    if (consultations.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-gray-400 text-5xl mb-4"></i>
          <p class="text-gray-600">검색 결과가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    const statusMap = {
      'completed': { text: '계약확정', color: 'bg-green-500' },
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
            ${consultations.map(item => `
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
                  <button onclick="showConsultationDetail(${item.id})" class="text-indigo-600 hover:text-indigo-800 transition">
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
    console.error('Load archive data error:', error);
    const content = document.getElementById('archiveSearchContent');
    content.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <p class="text-red-600">데이터를 불러올 수 없습니다.</p>
      </div>
    `;
  }
}

// Window 객체에 함수 바인딩
window.loadConsultationPage = loadConsultationPage;
window.loadConsultationList = loadConsultationList;
window.handleSort_consultation = handleSort_consultation;
