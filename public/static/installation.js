// 설치현황 모듈 - IIFE로 스코프 격리
(function() {
  'use strict';
  
  console.log('🔵 installation.js 모듈 로드 시작');

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

let currentInstallationPage = 1;
let currentInstallationViewMode = 'list';

/**
 * 설치현황 페이지 로드
 */
async function loadInstallationPage() {
  console.log('✅ loadInstallationPage 호출됨');
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
    const { installations, pagination } = response.data;

    const statusMap = {
      'waiting': { text: '설치대기', color: 'bg-gray-500', icon: 'fa-clock' },
      'in_progress': { text: '설치 중', color: 'bg-blue-500', icon: 'fa-spinner' },
      'hold': { text: '설치보류', color: 'bg-yellow-500', icon: 'fa-pause-circle' },
      'completed': { text: '설치완료', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '설치취소', color: 'bg-red-500', icon: 'fa-times-circle' }
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
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">플래그</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">체크리스트</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">등록일</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">등록자</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${installations.length === 0 ? `
                <tr>
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>등록된 설치가 없습니다.</p>
                  </td>
                </tr>
              ` : installations.map(item => {
                const status = statusMap[item.status] || statusMap['waiting'];
                
                // 플래그 배지
                let flags = [];
                if (item.is_pre_installation && !item.contract_completed) {
                  flags.push('<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">계약서 미진행</span>');
                }
                
                // 체크리스트 아이콘
                let checklist = [];
                if (item.has_confirmation_doc) checklist.push('<i class="fas fa-file-alt text-green-600" title="설치확인서"></i>');
                if (item.has_photos) checklist.push('<i class="fas fa-camera text-blue-600" title="설치사진"></i>');
                if (item.has_drive_upload) checklist.push('<i class="fas fa-cloud-upload-alt text-indigo-600" title="드라이브 업로드"></i>');
                
                return `
                  <tr class="hover:bg-gray-50 cursor-pointer" onclick="showInstallationDetail(${item.id})">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.id}</td>
                    <td class="px-4 py-3">
                      <span class="${status.color} text-white text-xs px-2 py-1 rounded">${status.text}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">${item.phone}</td>
                    <td class="px-4 py-3">
                      <div class="flex flex-col space-y-1">
                        ${flags.join('')}
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex space-x-2">
                        ${checklist.join(' ')}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${item.created_by_name}</td>
                    <td class="px-4 py-3 text-center">
                      <button onclick="event.stopPropagation(); showInstallationForm(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">
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
    console.error('❌ Load installation list error:', error);
    alert('설치 목록을 불러올 수 없습니다.');
  }
}

// 간단한 칸반 보드 (상세 구현은 필요시 추가)
/**
 * 칸반 보드 조회
 */
async function loadInstallationKanban() {
  try {
    const response = await axios.get('/api/installations?page=1&limit=1000');
    const installations = response.data.installations || [];

    // 상태별로 그룹화
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
      'in_progress': { text: '설치 중', color: 'bg-blue-500', icon: 'fa-tools' },
      'hold': { text: '설치보류', color: 'bg-yellow-500', icon: 'fa-pause-circle' },
      'completed': { text: '설치완료', color: 'bg-green-500', icon: 'fa-check-circle' },
      'cancelled': { text: '설치취소', color: 'bg-red-500', icon: 'fa-times-circle' }
    };

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
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
              <button onclick="showMigrateToOperationModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-arrow-right mr-2"></i>
                운영 이관
              </button>
              <button onclick="toggleInstallationViewMode()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-list mr-2"></i>
                리스트 보기
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
                    class="installation-kanban-column min-h-[600px] space-y-3" 
                    data-status="${status}"
                    ondrop="handleInstallationDrop(event)"
                    ondragover="handleInstallationDragOver(event)"
                    ondragleave="handleInstallationDragLeave(event)"
                  >
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

/**
 * 칸반 카드 렌더링
 */
function renderInstallationKanbanCard(item, config) {
  return `
    <div 
      class="installation-kanban-card bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-move border-l-4 ${config.color.replace('bg-', 'border-')}"
      draggable="true"
      data-id="${item.id}"
      ondragstart="handleInstallationDragStart(event)"
      ondragend="handleInstallationDragEnd(event)"
      onclick="showInstallationDetail(${item.id})"
    >
      <!-- 카드 헤더 -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500">#${item.id}</span>
        <div class="flex space-x-1">
          ${item.is_pre_installation && !item.contract_completed ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">계약서 미진행</span>' : ''}
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

      <!-- 체크리스트 아이콘 -->
      <div class="flex space-x-2 mb-2">
        <i class="fas fa-file-alt ${item.has_confirmation_doc ? 'text-green-500' : 'text-gray-300'}" title="설치확인서"></i>
        <i class="fas fa-camera ${item.has_photos ? 'text-green-500' : 'text-gray-300'}" title="설치사진"></i>
        <i class="fas fa-cloud-upload-alt ${item.has_drive_upload ? 'text-green-500' : 'text-gray-300'}" title="드라이브 업로드"></i>
      </div>

      <!-- 재방문 정보 -->
      ${item.revisit_1st || item.revisit_2nd || item.revisit_3rd || item.revisit_4th || item.revisit_5th ? `
        <div class="text-xs text-blue-600 mb-2">
          <i class="fas fa-redo mr-1"></i>
          재방문: ${[item.revisit_1st, item.revisit_2nd, item.revisit_3rd, item.revisit_4th, item.revisit_5th].filter(Boolean).join(', ')}
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
let draggedInstallationElement = null;

function handleInstallationDragStart(e) {
  draggedInstallationElement = e.currentTarget;
  e.currentTarget.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

/**
 * 드래그 종료
 */
function handleInstallationDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  
  document.querySelectorAll('.installation-kanban-column').forEach(col => {
    col.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
  });
}

/**
 * 드래그 오버
 */
function handleInstallationDragOver(e) {
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
function handleInstallationDragLeave(e) {
  const column = e.currentTarget;
  column.classList.remove('bg-blue-100', 'border-2', 'border-blue-400', 'border-dashed');
}

/**
 * 드롭 처리
 */
async function handleInstallationDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (!draggedInstallationElement) return false;
  
  const targetColumn = e.currentTarget;
  const newStatus = targetColumn.dataset.status;
  const installationId = draggedInstallationElement.dataset.id;
  
  // 상태 업데이트
  try {
    await axios.put(`/api/installations/${installationId}/status`, { status: newStatus });
    
    // 칸반 보드 새로고침
    loadInstallationKanban();
  } catch (error) {
    console.error('Update status error:', error);
    alert(error.response?.data?.error || '상태 업데이트에 실패했습니다.');
  }
  
  return false;
}
/**
 * 운영 이관 모달 표시
 */
async function showMigrateToOperationModal() {
  try {
    // 설치완료 상태 건수 조회
    const response = await axios.get('/api/installations/stats/completed');
    const { count, ids } = response.data;

    if (count === 0) {
      alert('설치완료 상태인 설치가 없습니다.');
      return;
    }

    const modal = `
      <div id="migrateToOperationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-2">
              <i class="fas fa-arrow-right mr-2 text-purple-600"></i>
              운영 이관
            </h3>
            <p class="text-gray-600">다음 설치건을 운영등재로 이관합니다</p>
          </div>

          <div class="bg-purple-50 p-4 rounded-lg mb-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">설치완료 상태</p>
                <p class="text-2xl font-bold text-purple-600">${count}건</p>
              </div>
              <div class="text-sm text-gray-500">
                <p>대상 ID: ${ids.join(', ')}</p>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  이관 후에는 설치현황 목록에서 제외됩니다.
                </p>
              </div>
            </div>
          </div>

          <div class="flex space-x-3">
            <button 
              onclick="migrateToOperation([${ids}]); closeMigrateToOperationModal();"
              class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <i class="fas fa-check mr-2"></i>
              이관 확정 (${count}건)
            </button>
            <button 
              onclick="closeMigrateToOperationModal()"
              class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Show migrate to operation modal error:', error);
    alert('이관 정보를 불러올 수 없습니다.');
  }
}

/**
 * 운영 이관 모달 닫기
 */
function closeMigrateToOperationModal() {
  const modal = document.getElementById('migrateToOperationModal');
  if (modal) modal.remove();
}

/**
 * 운영 이관 처리
 */
async function migrateToOperation(ids) {
  try {
    console.log('운영 이관 시작:', ids);
    
    // TODO: 운영등재 API 구현 후 활성화
    // const response = await axios.post('/api/operations/migrate', { installation_ids: ids });
    // const { successCount, errorCount, errors } = response.data;
    
    // 임시: 설치현황에서 이관 플래그만 업데이트
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const id of ids) {
      try {
        await axios.put(`/api/installations/${id}`, { 
          status: 'completed',
          migrated_to_operation: 1,
          migrated_at: new Date().toISOString()
        });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`ID ${id}: ${err.response?.data?.error || '알 수 없는 오류'}`);
      }
    }
    
    let message = `이관 완료!\n\n`;
    message += `✅ 성공: ${successCount}건\n`;
    if (errorCount > 0) {
      message += `❌ 실패: ${errorCount}건\n`;
      if (errors.length > 0) {
        message += `\n실패 내역:\n${errors.join('\n')}`;
      }
    }
    
    alert(message);
    
    // 목록 새로고침
    if (currentInstallationViewMode === 'list') {
      loadInstallationList(currentInstallationPage);
    } else {
      loadInstallationKanban();
    }
  } catch (error) {
    console.error('Migrate to operation error:', error);
    alert(error.response?.data?.error || '운영 이관 중 오류가 발생했습니다.');
  }
}

  // window 객체에 함수 바인딩
  window.loadInstallationPage = loadInstallationPage;
  window.loadInstallationList = loadInstallationList;
  window.loadInstallationKanban = loadInstallationKanban;
  window.toggleInstallationViewMode = toggleInstallationViewMode;
  window.showInstallationDetail = showInstallationDetail;
  window.showInstallationForm = showInstallationForm;
  window.deleteInstallation = deleteInstallation;
  window.showInstallationArchiveSearchModal = showInstallationArchiveSearchModal;
  window.showMigrateToOperationModal = showMigrateToOperationModal;
  window.closeMigrateToOperationModal = closeMigrateToOperationModal;
  window.migrateToOperation = migrateToOperation;
  window.handleInstallationDragStart = handleInstallationDragStart;
  window.handleInstallationDragEnd = handleInstallationDragEnd;
  window.handleInstallationDragOver = handleInstallationDragOver;
  window.handleInstallationDragLeave = handleInstallationDragLeave;
  window.handleInstallationDrop = handleInstallationDrop;
  
  console.log('✅ 설치현황 모듈 로드 완료 - 모든 함수가 window 객체에 바인딩됨');
  
})(); // IIFE 즉시 실행

/**
 * 설치현황 상세보기 모달
 */
async function showInstallationDetail(id) {
  try {
    const response = await axios.get(`/api/installations/${id}`);
    const item = response.data.installation;

    const statusMap = {
      'waiting': { text: '설치대기', color: 'bg-gray-500' },
      'in_progress': { text: '설치 중', color: 'bg-blue-500' },
      'hold': { text: '설치보류', color: 'bg-yellow-500' },
      'completed': { text: '설치완료', color: 'bg-green-500' },
      'cancelled': { text: '설치취소', color: 'bg-red-500' }
    };

    const status = statusMap[item.status] || statusMap['waiting'];

    // 체크리스트 상태
    const checklist = [
      { name: '설치확인서', checked: item.has_confirmation_doc, icon: 'fa-file-alt' },
      { name: '설치사진', checked: item.has_photos, icon: 'fa-camera' },
      { name: '드라이브 업로드', checked: item.has_drive_upload, icon: 'fa-cloud-upload-alt' }
    ];

    const modal = `
      <div id="installationDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'installationDetailModal') closeInstallationDetailModal()">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-tools mr-2 text-purple-600"></i>
              설치 상세 정보
            </h3>
            <button onclick="closeInstallationDetailModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            <!-- 상태 및 플래그 -->
            <div class="flex items-center space-x-2 flex-wrap gap-2">
              <span class="${status.color} text-white text-sm px-3 py-1 rounded">${status.text}</span>
              ${item.is_pre_installation && !item.contract_completed 
                ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">계약서 미진행</span>' 
                : ''}
              ${item.is_pre_installation && item.contract_completed 
                ? '<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">계약완료</span>' 
                : ''}
            </div>

            <!-- 기본 정보 -->
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

            <!-- 체크리스트 -->
            <div class="border-t pt-4">
              <p class="text-sm text-gray-600 mb-3 font-semibold">설치 체크리스트</p>
              <div class="grid grid-cols-3 gap-3">
                ${checklist.map(check => `
                  <div class="flex items-center space-x-2 p-3 rounded-lg ${check.checked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}">
                    <i class="fas ${check.icon} ${check.checked ? 'text-green-600' : 'text-gray-400'} text-lg"></i>
                    <div>
                      <p class="text-xs text-gray-600">${check.name}</p>
                      <p class="text-xs font-semibold ${check.checked ? 'text-green-700' : 'text-gray-500'}">${check.checked ? '완료' : '미완료'}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 재방문 정보 (있는 경우만 표시) -->
            ${(item.revisit_1st || item.revisit_2nd || item.revisit_3rd || item.revisit_4th || item.revisit_5th) ? `
              <div class="border-t pt-4">
                <p class="text-sm text-gray-600 mb-3 font-semibold">재방문 정보</p>
                <div class="space-y-2">
                  ${[1, 2, 3, 4, 5].map(i => {
                    const suffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
                    const needed = item[`revisit_${suffix}`];
                    if (!needed) return '';
                    const paid = item[`revisit_${suffix}_paid`];
                    const cost = item[`revisit_${suffix}_cost`] || 0;
                    const paymentStatus = item[`revisit_${suffix}_payment_status`] || 'pending';
                    const paymentNote = item[`revisit_${suffix}_payment_note`] || '';
                    
                    // 입금상태 표시
                    let paymentBadge = '';
                    if (paid) {
                      if (paymentStatus === 'completed') {
                        paymentBadge = '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">입금완료</span>';
                      } else if (paymentStatus === 'rejected') {
                        paymentBadge = '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">입금거부</span>';
                      } else {
                        paymentBadge = '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">입금대기</span>';
                      }
                    }
                    
                    return `
                      <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex items-center space-x-2">
                            <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded">${i}차</span>
                            <span class="text-sm font-semibold">${paid ? '유상' : '무상'}</span>
                            ${cost > 0 ? `<span class="text-sm text-gray-600">${cost.toLocaleString()}원</span>` : ''}
                          </div>
                          ${paymentBadge}
                        </div>
                        ${paymentStatus === 'rejected' && paymentNote ? `
                          <div class="mt-2 p-2 bg-white rounded border border-red-200">
                            <p class="text-xs text-gray-600 mb-1">입금거부 사유:</p>
                            <p class="text-xs text-red-700">${paymentNote}</p>
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            ${item.notes ? `
              <div class="border-t pt-4">
                <p class="text-sm text-gray-600 mb-2">메모</p>
                <p class="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">${item.notes}</p>
              </div>
            ` : ''}

            <!-- 버튼 -->
            <div class="flex space-x-2 pt-4">
              <button onclick="closeInstallationDetailModal(); showInstallationForm(${item.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                <i class="fas fa-edit mr-2"></i>
                수정
              </button>
              <button onclick="closeInstallationDetailModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Load installation detail error:', error);
    alert('설치 정보를 불러올 수 없습니다.');
  }
}

/**
 * 상세 모달 닫기
 */
function closeInstallationDetailModal() {
  const modal = document.getElementById('installationDetailModal');
  if (modal) modal.remove();
}

/**
 * 설치현황 수정 폼 표시
 */
async function showInstallationForm(id) {
  const isEdit = id !== null && id !== undefined;
  let installation = null;

  if (isEdit) {
    try {
      const response = await axios.get(`/api/installations/${id}`);
      installation = response.data.installation;
    } catch (error) {
      alert('설치 정보를 불러올 수 없습니다.');
      return;
    }
  }

  const statusOptions = [
    { value: 'waiting', text: '설치대기' },
    { value: 'in_progress', text: '설치 중' },
    { value: 'hold', text: '설치보류' },
    { value: 'completed', text: '설치완료' },
    { value: 'cancelled', text: '설치취소' }
  ];

  const modal = `
    <div id="installationFormModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'installationFormModal') closeInstallationFormModal()">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-${isEdit ? 'edit' : 'plus'} mr-2 text-purple-600"></i>
            ${isEdit ? '설치 정보 수정' : '설치 등록'}
          </h3>
          <button onclick="closeInstallationFormModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <form id="installationForm" class="space-y-4">
          <!-- 기본 정보 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">고객명</label>
              <input type="text" name="customer_name" value="${installation?.customer_name || ''}" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
              <input type="tel" name="phone" value="${installation?.phone || ''}" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">유입경로</label>
              <input type="text" name="inflow_source" value="${installation?.inflow_source || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select name="status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                ${statusOptions.map(opt => `
                  <option value="${opt.value}" ${installation?.status === opt.value ? 'selected' : ''}>${opt.text}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- 선설치 관련 (선설치 건인 경우만 표시) -->
          ${installation?.is_pre_installation ? `
            <div class="border-t pt-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="contract_completed" ${installation.contract_completed ? 'checked' : ''}
                  class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <span class="text-sm font-medium text-gray-700">계약 완료</span>
              </label>
              <p class="text-xs text-gray-500 mt-1 ml-6">체크하면 "계약서 미진행" 배지가 사라집니다.</p>
            </div>
          ` : ''}

          <!-- 체크리스트 -->
          <div class="border-t pt-4">
            <p class="text-sm font-medium text-gray-700 mb-3">설치 체크리스트</p>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="has_confirmation_doc" ${installation?.has_confirmation_doc ? 'checked' : ''}
                  class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                <i class="fas fa-file-alt text-green-600"></i>
                <span class="text-sm">설치확인서 작성 완료</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="has_photos" ${installation?.has_photos ? 'checked' : ''}
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <i class="fas fa-camera text-blue-600"></i>
                <span class="text-sm">설치사진 촬영 완료</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="has_drive_upload" ${installation?.has_drive_upload ? 'checked' : ''}
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <i class="fas fa-cloud-upload-alt text-indigo-600"></i>
                <span class="text-sm">드라이브 업로드 완료</span>
              </label>
            </div>
          </div>

          <!-- 재방문 관리 -->
          <div class="border-t pt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">재방문 관리</p>
            <p class="text-xs text-gray-500 mb-3">순차적으로 재방문을 체크할 수 있습니다 (1차 → 2차 → 3차 → 4차 → 5차)</p>
            <div class="space-y-2">
              ${(() => {
                // 현재 체크된 재방문 차수 확인
                let lastChecked = 0;
                for (let i = 1; i <= 5; i++) {
                  const suffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
                  if (installation?.[`revisit_${suffix}`]) {
                    lastChecked = i;
                  }
                }
                
                return [1, 2, 3, 4, 5].map(i => {
                  const suffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
                  const needed = installation?.[`revisit_${suffix}`] || false;
                  const paid = installation?.[`revisit_${suffix}_paid`] || false;
                  const cost = installation?.[`revisit_${suffix}_cost`] || 0;
                  const paymentStatus = installation?.[`revisit_${suffix}_payment_status`] || 'pending';
                  const paymentNote = installation?.[`revisit_${suffix}_payment_note`] || '';
                  
                  // 활성화 조건: 첫 번째(1차)이거나, 이전 차수가 체크되어 있으면 활성화
                  const enabled = (i === 1) || (i === lastChecked + 1);
                  const disabled = !enabled;
                  
                  return `
                    <div class="p-2 ${disabled ? 'bg-gray-100' : 'bg-blue-50'} rounded border ${disabled ? 'border-gray-200' : 'border-blue-200'}">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" 
                          name="revisit_${suffix}" 
                          ${needed ? 'checked' : ''} 
                          ${disabled ? 'disabled' : ''}
                          onchange="toggleRevisitFields_v2('${suffix}', ${i})"
                          class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${disabled ? 'cursor-not-allowed opacity-50' : ''}">
                        <span class="text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}">${i}차 재방문</span>
                        ${disabled ? '<span class="text-xs text-gray-400 ml-2">(이전 차수를 먼저 체크하세요)</span>' : ''}
                      </label>
                      
                      <div id="revisit_${suffix}_fields" class="ml-6 mt-2 space-y-2 ${needed ? '' : 'hidden'}">
                        <!-- 유/무상 선택 -->
                        <div class="flex items-center space-x-4">
                          <label class="flex items-center space-x-2">
                            <input type="radio" 
                              name="revisit_${suffix}_paid" 
                              value="0" 
                              ${!paid ? 'checked' : ''}
                              onchange="togglePaidFields_v2('${suffix}')"
                              class="w-4 h-4 text-purple-600">
                            <span class="text-sm">무상</span>
                          </label>
                          <label class="flex items-center space-x-2">
                            <input type="radio" 
                              name="revisit_${suffix}_paid" 
                              value="1" 
                              ${paid ? 'checked' : ''}
                              onchange="togglePaidFields_v2('${suffix}')"
                              class="w-4 h-4 text-purple-600">
                            <span class="text-sm">유상</span>
                          </label>
                        </div>
                        
                        <!-- 유상인 경우 비용 입력 및 입금상태 -->
                        <div id="revisit_${suffix}_paid_fields" class="space-y-2 ${paid ? '' : 'hidden'}">
                          <div class="flex items-center space-x-2">
                            <label class="text-xs text-gray-600 w-16">비용:</label>
                            <input type="number" 
                              name="revisit_${suffix}_cost" 
                              value="${cost}" 
                              min="0" 
                              step="1000"
                              class="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-sm">
                            <span class="text-xs text-gray-600">원</span>
                          </div>
                          
                          <div>
                            <label class="text-xs text-gray-600 block mb-1">입금상태:</label>
                            <select name="revisit_${suffix}_payment_status"
                              onchange="togglePaymentNote_v2('${suffix}')"
                              class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-sm">
                              <option value="pending" ${paymentStatus === 'pending' ? 'selected' : ''}>입금대기</option>
                              <option value="completed" ${paymentStatus === 'completed' ? 'selected' : ''}>입금완료</option>
                              <option value="rejected" ${paymentStatus === 'rejected' ? 'selected' : ''}>입금거부/비고</option>
                            </select>
                          </div>
                          
                          <!-- 입금거부 시 비고란 -->
                          <div id="revisit_${suffix}_payment_note_field" class="${paymentStatus === 'rejected' ? '' : 'hidden'}">
                            <label class="text-xs text-gray-600 block mb-1">비고 (필수, 2글자 이상):</label>
                            <textarea name="revisit_${suffix}_payment_note"
                              rows="2"
                              class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-sm"
                              placeholder="입금거부 사유를 입력하세요 (최소 2글자)">${paymentNote}</textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('');
              })()}
            </div>
          </div>

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">메모</label>
            <textarea name="notes" rows="4" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">${installation?.notes || ''}</textarea>
          </div>

          <!-- 버튼 -->
          <div class="flex space-x-2 pt-4">
            <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-save mr-2"></i>
              ${isEdit ? '수정' : '등록'}
            </button>
            <button type="button" onclick="closeInstallationFormModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
      // 재방문 필드 토글 (v2 - 순차 활성화 지원)
      function toggleRevisitFields_v2(suffix, order) {
        const checkbox = document.querySelector(\`input[name="revisit_\${suffix}"]\`);
        const fields = document.getElementById(\`revisit_\${suffix}_fields\`);
        
        if (fields) {
          fields.classList.toggle('hidden', !checkbox.checked);
        }
        
        // 체크된 경우: 다음 차수 활성화
        // 체크 해제된 경우: 다음 차수들 비활성화 및 체크 해제
        if (checkbox.checked) {
          // 다음 차수 활성화
          const nextOrder = order + 1;
          if (nextOrder <= 5) {
            const nextSuffix = ['1st', '2nd', '3rd', '4th', '5th'][nextOrder - 1];
            const nextCheckbox = document.querySelector(\`input[name="revisit_\${nextSuffix}"]\`);
            const nextContainer = nextCheckbox?.closest('.p-2');
            if (nextCheckbox && nextContainer) {
              nextCheckbox.disabled = false;
              nextContainer.classList.remove('bg-gray-100', 'opacity-50');
              nextContainer.classList.add('bg-blue-50', 'border-blue-200');
            }
          }
        } else {
          // 현재 차수 이후 모두 비활성화 및 체크 해제
          for (let i = order + 1; i <= 5; i++) {
            const targetSuffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
            const targetCheckbox = document.querySelector(\`input[name="revisit_\${targetSuffix}"]\`);
            const targetFields = document.getElementById(\`revisit_\${targetSuffix}_fields\`);
            const targetContainer = targetCheckbox?.closest('.p-2');
            
            if (targetCheckbox) {
              targetCheckbox.checked = false;
              targetCheckbox.disabled = true;
              if (targetFields) targetFields.classList.add('hidden');
              if (targetContainer) {
                targetContainer.classList.add('bg-gray-100', 'opacity-50');
                targetContainer.classList.remove('bg-blue-50', 'border-blue-200');
              }
            }
          }
        }
      }
      
      // 유상/무상 필드 토글
      function togglePaidFields_v2(suffix) {
        const paidRadio = document.querySelector(\`input[name="revisit_\${suffix}_paid"][value="1"]\`);
        const paidFields = document.getElementById(\`revisit_\${suffix}_paid_fields\`);
        
        if (paidFields) {
          paidFields.classList.toggle('hidden', !paidRadio.checked);
        }
      }
      
      // 입금상태 비고란 토글
      function togglePaymentNote_v2(suffix) {
        const paymentStatus = document.querySelector(\`select[name="revisit_\${suffix}_payment_status"]\`).value;
        const noteField = document.getElementById(\`revisit_\${suffix}_payment_note_field\`);
        
        if (noteField) {
          noteField.classList.toggle('hidden', paymentStatus !== 'rejected');
        }
      }

      // 폼 제출 핸들러
      document.getElementById('installationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
          customer_name: formData.get('customer_name'),
          phone: formData.get('phone'),
          inflow_source: formData.get('inflow_source'),
          status: formData.get('status'),
          notes: formData.get('notes'),
          
          // 체크박스
          contract_completed: formData.get('contract_completed') === 'on',
          has_confirmation_doc: formData.get('has_confirmation_doc') === 'on',
          has_photos: formData.get('has_photos') === 'on',
          has_drive_upload: formData.get('has_drive_upload') === 'on',
        };
        
        // 재방문 데이터 (1~5차)
        const suffixes = ['1st', '2nd', '3rd', '4th', '5th'];
        for (let i = 0; i < 5; i++) {
          const suffix = suffixes[i];
          const isNeeded = formData.get(\`revisit_\${suffix}\`) === 'on';
          
          data[\`revisit_\${suffix}\`] = isNeeded;
          
          if (isNeeded) {
            const isPaid = parseInt(formData.get(\`revisit_\${suffix}_paid\`) || '0');
            data[\`revisit_\${suffix}_paid\`] = isPaid;
            
            if (isPaid) {
              const cost = parseInt(formData.get(\`revisit_\${suffix}_cost\`) || '0');
              const paymentStatus = formData.get(\`revisit_\${suffix}_payment_status\`) || 'pending';
              const paymentNote = formData.get(\`revisit_\${suffix}_payment_note\`) || '';
              
              data[\`revisit_\${suffix}_cost\`] = cost;
              data[\`revisit_\${suffix}_payment_status\`] = paymentStatus;
              data[\`revisit_\${suffix}_payment_note\`] = paymentNote;
              
              // 입금거부 시 비고 필수 검증 (2글자 이상)
              if (paymentStatus === 'rejected' && paymentNote.trim().length < 2) {
                alert(\`\${i + 1}차 재방문: 입금거부 시 비고를 2글자 이상 입력해야 합니다.\`);
                return;
              }
            } else {
              data[\`revisit_\${suffix}_cost\`] = 0;
              data[\`revisit_\${suffix}_payment_status\`] = 'pending';
              data[\`revisit_\${suffix}_payment_note\`] = '';
            }
          } else {
            data[\`revisit_\${suffix}_paid\`] = 0;
            data[\`revisit_\${suffix}_cost\`] = 0;
            data[\`revisit_\${suffix}_payment_status\`] = 'pending';
            data[\`revisit_\${suffix}_payment_note\`] = '';
          }
        }

        try {
          if (${isEdit}) {
            await axios.put('/api/installations/${id}', data);
            alert('설치 정보가 수정되었습니다.');
          } else {
            await axios.post('/api/installations', data);
            alert('설치가 등록되었습니다.');
          }
          
          closeInstallationFormModal();
          loadInstallationList(currentInstallationPage);
        } catch (error) {
          console.error('Save installation error:', error);
          alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.');
        }
      });
    </script>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

/**
 * 수정 폼 모달 닫기
 */
function closeInstallationFormModal() {
  const modal = document.getElementById('installationFormModal');
  if (modal) modal.remove();
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
    console.error('Delete installation error:', error);
    alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.');
  }
}

// window 객체에 추가 함수 바인딩
window.showInstallationDetail = showInstallationDetail;
window.closeInstallationDetailModal = closeInstallationDetailModal;
window.showInstallationForm = showInstallationForm;
window.closeInstallationFormModal = closeInstallationFormModal;
window.deleteInstallation = deleteInstallation;

console.log('✅ 설치현황 상세보기 및 수정 기능 추가됨');

/**
 * 운영 이관 모달 표시
 */
async function showMigrateToOperationModal() {
  try {
    console.log('🚀 운영이관 모달 열기 시도...');
    const response = await axios.get('/api/installations/stats/completed');
    const { count, ids } = response.data;
    console.log(`📊 설치완료 건수: ${count}건, IDs:`, ids);

    if (count === 0) {
      alert('설치완료 상태인 설치가 없습니다.');
      return;
    }

    const modal = `
      <div id="migrateToOperationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'migrateToOperationModal') closeMigrateToOperationModal()">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onclick="event.stopPropagation()">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-arrow-right mr-2 text-orange-600"></i>
            운영현황으로 이관
          </h3>
          
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-lg font-semibold text-blue-800 mb-2">
              <i class="fas fa-check-circle mr-2"></i>
              설치완료 상태: <span class="text-2xl">${count}</span>건
            </p>
            <p class="text-sm text-blue-600">
              해당 설치 건들을 운영현황 페이지로 이관하시겠습니까?
            </p>
          </div>

          <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p class="text-xs text-yellow-800">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <strong>참고:</strong> 이관 후에도 설치현황 데이터는 유지됩니다.
            </p>
          </div>

          <div class="flex space-x-3">
            <button onclick="migrateToOperation(${JSON.stringify(ids)})" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-check mr-2"></i>
              이관 확정 (${count}건)
            </button>
            <button onclick="closeMigrateToOperationModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
              <i class="fas fa-times mr-2"></i>
              취소
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
    console.log('✅ 운영이관 모달 렌더링 완료');
  } catch (error) {
    console.error('❌ Show migrate to operation modal error:', error);
    alert('이관 정보를 불러올 수 없습니다.');
  }
}

/**
 * 운영 이관 모달 닫기
 */
function closeMigrateToOperationModal() {
  const modal = document.getElementById('migrateToOperationModal');
  if (modal) modal.remove();
  console.log('✅ 운영이관 모달 닫기 완료');
}

/**
 * 운영현황으로 이관 실행
 */
async function migrateToOperation(ids) {
  try {
    console.log('🚀 운영이관 실행 시작...', ids);
    
    // TODO: 운영현황 API 구현 시 활성화
    alert(`운영현황 기능은 준비 중입니다.\n설치완료 건 ${ids.length}건이 이관 대기 중입니다.`);
    
    closeMigrateToOperationModal();
    
    // 리스트 새로고침
    if (currentInstallationViewMode === 'list') {
      loadInstallationList(currentInstallationPage);
    } else {
      loadInstallationKanban();
    }
  } catch (error) {
    console.error('❌ Migrate to operation error:', error);
    alert(error.response?.data?.error || '이관 중 오류가 발생했습니다.');
  }
}

// window 객체에 함수 바인딩
window.showMigrateToOperationModal = showMigrateToOperationModal;
window.closeMigrateToOperationModal = closeMigrateToOperationModal;
window.migrateToOperation = migrateToOperation;

console.log('✅ 운영 이관 기능 추가됨');

/**
 * 이전 기록 검색 모달 표시
 */
function showInstallationArchiveSearchModal() {
  const modal = `
    <div id="installationArchiveSearchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'installationArchiveSearchModal') closeInstallationArchiveSearchModal()">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-search mr-2 text-gray-600"></i>
            이전 기록 검색
          </h3>
          <button onclick="closeInstallationArchiveSearchModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- 필터 탭 -->
        <div class="flex space-x-2 mb-4 border-b pb-2">
          <button onclick="filterInstallationArchive('all')" class="archive-filter-btn px-4 py-2 rounded-lg transition bg-indigo-600 text-white" data-filter="all">
            전체
          </button>
          <button onclick="filterInstallationArchive('completed')" class="archive-filter-btn px-4 py-2 rounded-lg transition bg-gray-200 text-gray-700 hover:bg-gray-300" data-filter="completed">
            설치완료
          </button>
          <button onclick="filterInstallationArchive('cancelled')" class="archive-filter-btn px-4 py-2 rounded-lg transition bg-gray-200 text-gray-700 hover:bg-gray-300" data-filter="cancelled">
            설치취소
          </button>
        </div>

        <!-- 검색 결과 영역 -->
        <div id="installationArchiveSearchContent" class="flex-1 overflow-y-auto">
          <div class="flex items-center justify-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
  loadInstallationArchiveData('all');
}

/**
 * 이전 기록 검색 모달 닫기
 */
function closeInstallationArchiveSearchModal() {
  const modal = document.getElementById('installationArchiveSearchModal');
  if (modal) modal.remove();
}

/**
 * 필터 전환
 */
function filterInstallationArchive(status) {
  // 버튼 스타일 업데이트
  document.querySelectorAll('.archive-filter-btn').forEach(btn => {
    if (btn.dataset.filter === status) {
      btn.className = 'archive-filter-btn px-4 py-2 rounded-lg transition bg-indigo-600 text-white';
    } else {
      btn.className = 'archive-filter-btn px-4 py-2 rounded-lg transition bg-gray-200 text-gray-700 hover:bg-gray-300';
    }
  });

  loadInstallationArchiveData(status);
}

/**
 * 이전 기록 데이터 로드
 */
async function loadInstallationArchiveData(status = 'all') {
  try {
    const statusParam = status === 'all' ? '' : `&status=${status}`;
    const response = await axios.get(`/api/installations?page=1&limit=100&search_archive=true${statusParam}`);
    const installations = response.data.installations || [];

    const content = document.getElementById('installationArchiveSearchContent');
    
    if (installations.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
          <p class="text-gray-500 text-lg">검색 결과가 없습니다.</p>
        </div>
      `;
      return;
    }

    const statusMap = {
      'waiting': { text: '설치대기', color: 'bg-gray-500' },
      'in_progress': { text: '설치 중', color: 'bg-blue-500' },
      'hold': { text: '설치보류', color: 'bg-yellow-500' },
      'completed': { text: '설치완료', color: 'bg-green-500' },
      'cancelled': { text: '설치취소', color: 'bg-red-500' }
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
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">플래그</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">등록일</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${installations.map(item => {
              const status = statusMap[item.status] || statusMap['waiting'];
              let flags = [];
              if (item.is_pre_installation && !item.contract_completed) {
                flags.push('<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">계약서 미진행</span>');
              }
              
              return `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-900">${item.id}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${status.color}">
                      ${status.text}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">${item.customer_name || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${item.phone || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${item.inflow_source || '-'}</td>
                  <td class="px-4 py-3">${flags.join(' ')}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
                  <td class="px-4 py-3">
                    <button onclick="showInstallationDetail(${item.id})" class="text-indigo-600 hover:text-indigo-800 transition">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    content.innerHTML = tableHTML;
  } catch (error) {
    console.error('Load installation archive data error:', error);
    const content = document.getElementById('installationArchiveSearchContent');
    content.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <p class="text-red-600">데이터를 불러올 수 없습니다.</p>
      </div>
    `;
  }
}

// window 객체에 함수 바인딩
window.showInstallationArchiveSearchModal = showInstallationArchiveSearchModal;
window.closeInstallationArchiveSearchModal = closeInstallationArchiveSearchModal;
window.filterInstallationArchive = filterInstallationArchive;
window.loadInstallationArchiveData = loadInstallationArchiveData;

console.log('✅ 이전 기록 검색 기능 추가됨');
