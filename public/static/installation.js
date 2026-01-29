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
async function loadInstallationKanban() {
  alert('칸반 보드 기능은 준비 중입니다.');
  // TODO: contract.js의 칸반 로직 참고하여 구현
}

// 임시 함수들 (상세 구현은 필요시 추가)
function showInstallationDetail(id) {
  alert(`설치 상세보기: ID ${id}`);
}

function showInstallationForm(id) {
  alert(`설치 수정: ID ${id}`);
}

function deleteInstallation(id) {
  if (confirm('정말 삭제하시겠습니까?')) {
    alert(`설치 삭제: ID ${id}`);
  }
}

function showInstallationArchiveSearchModal() {
  alert('이전 기록 검색 기능은 준비 중입니다.');
}

function showMigrateToOperationModal() {
  alert('운영 이관 기능은 준비 중입니다.');
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
  
  console.log('✅ 설치현황 모듈 로드 완료');
  
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
                    const collected = item[`revisit_${suffix}_collected`];
                    
                    return `
                      <div class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-center space-x-3">
                          <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded">${i}차</span>
                          <span class="text-sm font-semibold">${paid ? '유상' : '무상'}</span>
                          ${cost > 0 ? `<span class="text-sm text-gray-600">${cost.toLocaleString()}원</span>` : ''}
                        </div>
                        ${collected ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">수령완료</span>' : '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">미수령</span>'}
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
            <p class="text-sm font-medium text-gray-700 mb-3">재방문 관리</p>
            <div class="space-y-3">
              ${[1, 2, 3, 4, 5].map(i => {
                const suffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
                const needed = installation?.[`revisit_${suffix}`] || false;
                const paid = installation?.[`revisit_${suffix}_paid`] || false;
                const cost = installation?.[`revisit_${suffix}_cost`] || 0;
                const collected = installation?.[`revisit_${suffix}_collected`] || false;
                
                return `
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <label class="flex items-center space-x-2 cursor-pointer mb-2">
                      <input type="checkbox" name="revisit_${suffix}" ${needed ? 'checked' : ''}
                        onchange="toggleRevisitFields('${suffix}')"
                        class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                      <span class="text-sm font-medium">${i}차 재방문 필요</span>
                    </label>
                    
                    <div id="revisit_${suffix}_fields" class="ml-6 space-y-2 ${needed ? '' : 'hidden'}">
                      <div class="flex items-center space-x-4">
                        <label class="flex items-center space-x-2">
                          <input type="radio" name="revisit_${suffix}_paid" value="0" ${!paid ? 'checked' : ''}
                            class="w-4 h-4 text-purple-600">
                          <span class="text-sm">무상</span>
                        </label>
                        <label class="flex items-center space-x-2">
                          <input type="radio" name="revisit_${suffix}_paid" value="1" ${paid ? 'checked' : ''}
                            class="w-4 h-4 text-purple-600">
                          <span class="text-sm">유상</span>
                        </label>
                      </div>
                      
                      <div class="flex items-center space-x-2">
                        <label class="text-sm text-gray-600 w-20">비용:</label>
                        <input type="number" name="revisit_${suffix}_cost" value="${cost}" min="0" step="1000"
                          class="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-sm">
                        <span class="text-sm text-gray-600">원</span>
                      </div>
                      
                      <label class="flex items-center space-x-2">
                        <input type="checkbox" name="revisit_${suffix}_collected" ${collected ? 'checked' : ''}
                          class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                        <span class="text-sm">비용 수령 완료</span>
                      </label>
                    </div>
                  </div>
                `;
              }).join('')}
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
      // 재방문 필드 토글
      function toggleRevisitFields(suffix) {
        const checkbox = document.querySelector(\`input[name="revisit_\${suffix}"]\`);
        const fields = document.getElementById(\`revisit_\${suffix}_fields\`);
        if (fields) {
          fields.classList.toggle('hidden', !checkbox.checked);
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
          
          // 재방문 (1~5차)
          ${[1, 2, 3, 4, 5].map(i => {
            const suffix = ['1st', '2nd', '3rd', '4th', '5th'][i - 1];
            return `
              revisit_${suffix}: formData.get('revisit_${suffix}') === 'on',
              revisit_${suffix}_paid: parseInt(formData.get('revisit_${suffix}_paid') || '0'),
              revisit_${suffix}_cost: parseInt(formData.get('revisit_${suffix}_cost') || '0'),
              revisit_${suffix}_collected: formData.get('revisit_${suffix}_collected') === 'on',
            `;
          }).join('')}
        };

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
