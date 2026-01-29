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
