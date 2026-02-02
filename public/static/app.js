// 메뉴 구성
const menuItems = [
  {
    id: 'notice',
    icon: 'fa-bullhorn',
    label: '공지사항',
    page: 'notice',
    roles: ['master', 'admin', 'user']
  },
  {
    id: 'dashboard',
    icon: 'fa-chart-line',
    label: '업무 대시보드',
    page: 'dashboard',
    roles: ['master', 'admin', 'user']
  },
  { divider: true },
  {
    id: 'consulting',
    icon: 'fa-comments',
    label: '상담현황',
    page: 'consulting',
    roles: ['master', 'admin', 'user']
  },
  {
    id: 'contract',
    icon: 'fa-file-contract',
    label: '계약현황',
    page: 'contract',
    roles: ['master', 'admin', 'user']
  },
  {
    id: 'installation',
    icon: 'fa-tools',
    label: '설치현황',
    page: 'installation',
    roles: ['master', 'admin', 'user']
  },
  {
    id: 'operation',
    icon: 'fa-cogs',
    label: '운영등재',
    page: 'operation',
    roles: ['master', 'admin', 'user']
  },
  {
    id: 'franchise',
    icon: 'fa-store',
    label: '가맹점현황',
    page: 'franchise',
    roles: ['master', 'admin', 'user']
  },
  { divider: true },
  {
    id: 'settlement',
    icon: 'fa-calculator',
    label: '정산관리',
    submenu: [
      { id: 'settlement-cms', label: 'CMS 정산', page: 'settlement-cms' },
      { id: 'settlement-crm', label: 'CRM 정산', page: 'settlement-crm' },
      { id: 'settlement-ai', label: 'Ai매출업 정산', page: 'settlement-ai' },
      { id: 'settlement-dashboard', label: '정산 대시보드', page: 'settlement-dashboard' }
    ],
    roles: ['master', 'admin']
  },
  {
    id: 'inventory',
    icon: 'fa-boxes',
    label: '재고관리',
    submenu: [
      { id: 'inventory-status', label: '재고현황', page: 'inventory-status' },
      { id: 'inventory-request', label: '재고요청', page: 'inventory-request' },
      { id: 'inventory-return', label: '반납관리', page: 'inventory-return' },
      { id: 'inventory-rental', label: '대여현황', page: 'inventory-rental' },
      { id: 'inventory-dashboard', label: '재고 대시보드', page: 'inventory-dashboard' }
    ],
    roles: ['master', 'admin', 'user']
  },
  {
    id: 'cs',
    icon: 'fa-headset',
    label: 'CS관리',
    submenu: [
      { id: 'cs-inbound', label: '인바운드 현황', page: 'cs-inbound' },
      { id: 'cs-visit', label: '방문 A/S 현황', page: 'cs-visit' },
      { id: 'cs-qa', label: 'H/W QA', page: 'cs-qa' }
    ],
    roles: ['master', 'admin', 'user']
  },
  { divider: true },
  {
    id: 'admin',
    icon: 'fa-shield-alt',
    label: '관리자 메뉴',
    submenu: [
      { id: 'user-management', label: '사용자 관리', page: 'user-management' },
      { id: 'location-management', label: '로케이션 관리', page: 'location-management' },
      { id: 'page-management', label: '페이지 관리', page: 'page-management' },
      { id: 'item-management', label: '항목 관리', page: 'item-management' },
      { id: 'product-management', label: '품목 관리', page: 'product-management' }
    ],
    roles: ['master', 'admin']
  }
];

// 메뉴 렌더링
function renderMenu() {
  const mainMenu = document.getElementById('mainMenu');
  mainMenu.innerHTML = '';

  menuItems.forEach(item => {
    // 구분선 처리
    if (item.divider) {
      const divider = document.createElement('div');
      divider.className = 'my-3 border-t border-gray-800';
      mainMenu.appendChild(divider);
      return;
    }
    
    // 권한 체크
    if (!item.roles.includes(currentUser.role)) {
      return;
    }

    const menuItem = document.createElement('div');
    
    if (item.submenu) {
      // 서브메뉴가 있는 경우
      menuItem.className = 'menu-item';
      menuItem.innerHTML = `
        <button class="w-full flex items-center justify-between p-3 hover:bg-gray-700 hover:bg-opacity-70 rounded-lg transition duration-200 submenu-toggle relative group" data-target="${item.id}-submenu">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <div class="flex items-center space-x-3">
            <i class="fas ${item.icon}"></i>
            <span class="menu-text">${item.label}</span>
          </div>
          <i class="fas fa-chevron-down menu-text transition-transform submenu-icon"></i>
        </button>
        <div id="${item.id}-submenu" class="submenu ml-4 space-y-1 mt-1">
          ${item.submenu.map(sub => `
            <a href="#${sub.page}" class="block p-2 pl-4 hover:bg-gray-700 hover:bg-opacity-70 rounded-lg transition duration-200 menu-link relative group" data-page="${sub.page}">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 menu-active-indicator transition-opacity duration-200"></div>
              <span class="menu-text text-sm text-gray-300 hover:text-white">${sub.label}</span>
            </a>
          `).join('')}
        </div>
      `;
    } else {
      // 일반 메뉴
      menuItem.innerHTML = `
        <a href="#${item.page}" class="flex items-center space-x-3 p-3 hover:bg-gray-700 hover:bg-opacity-70 rounded-lg transition duration-200 menu-link relative group" data-page="${item.page}">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 menu-active-indicator transition-opacity duration-200"></div>
          <i class="fas ${item.icon}"></i>
          <span class="menu-text">${item.label}</span>
        </a>
      `;
    }

    mainMenu.appendChild(menuItem);
  });

  // 서브메뉴 토글
  document.querySelectorAll('.submenu-toggle').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = button.getAttribute('data-target');
      const submenu = document.getElementById(target);
      const icon = button.querySelector('.submenu-icon');
      
      submenu.classList.toggle('open');
      icon.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0)';
    });
  });

  // 메뉴 클릭 이벤트
  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      
      // 모든 메뉴의 액티브 표시 제거
      document.querySelectorAll('.menu-active-indicator').forEach(indicator => {
        indicator.style.opacity = '0';
      });
      
      // 클릭한 메뉴의 액티브 표시 활성화
      const indicator = link.querySelector('.menu-active-indicator');
      if (indicator) {
        indicator.style.opacity = '1';
      }
      
      loadPage(page);
    });
  });
}

// 사이드바 토글
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// 대시보드 카드 클릭
console.log('🔍 대시보드 카드 검색 중...');
const dashboardCards = document.querySelectorAll('.dashboard-card');
console.log(`✅ 발견된 대시보드 카드 개수: ${dashboardCards.length}`);

dashboardCards.forEach((card, index) => {
  const page = card.getAttribute('data-page');
  console.log(`  - 카드 ${index + 1}: data-page="${page}"`);
  
  card.addEventListener('click', () => {
    console.log(`🖱️ 카드 클릭됨: ${page}`);
    loadPage(page);
  });
});

// 네비게이션 버튼
let history = ['dashboard'];
let historyIndex = 0;

// localStorage에서 히스토리 복구 (페이지 reload 후에도 유지)
try {
  const savedHistory = localStorage.getItem('navigationHistory');
  const savedIndex = localStorage.getItem('navigationIndex');
  if (savedHistory && savedIndex) {
    history = JSON.parse(savedHistory);
    historyIndex = parseInt(savedIndex);
    console.log('📚 히스토리 복구됨:', history, 'index:', historyIndex);
    // 복구 후 localStorage 클리어
    localStorage.removeItem('navigationHistory');
    localStorage.removeItem('navigationIndex');
  }
} catch (error) {
  console.error('히스토리 복구 실패:', error);
}

console.log('🧭 네비게이션 버튼 초기화');

// DOM 요소가 완전히 렌더링될 때까지 기다리는 헬퍼 함수
function waitForElement(selector, maxRetries = 10, interval = 100) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const checkElement = () => {
      const element = document.getElementById(selector);
      
      if (element) {
        console.log(`✅ 요소 발견: #${selector} (시도 ${retries + 1}/${maxRetries})`);
        resolve(element);
      } else if (retries >= maxRetries) {
        console.error(`❌ 요소를 찾을 수 없음: #${selector} (최대 ${maxRetries}회 시도)`);
        reject(new Error(`요소를 찾을 수 없습니다: #${selector}`));
      } else {
        retries++;
        console.log(`⏳ 요소 대기 중: #${selector} (시도 ${retries}/${maxRetries})`);
        setTimeout(checkElement, interval);
      }
    };
    
    checkElement();
  });
}

// 페이지 로드
async function loadPage(page, addToHistory = true) {
  console.log(`📄 loadPage 호출: page="${page}", addToHistory=${addToHistory}`);
  
  if (addToHistory) {
    // 현재 위치 이후의 히스토리 제거
    history = history.slice(0, historyIndex + 1);
    history.push(page);
    historyIndex = history.length - 1;
    console.log(`   📚 히스토리 업데이트: ${JSON.stringify(history)}, index=${historyIndex}`);
  }

  const mainContent = document.getElementById('mainContent');
  const pageTitle = document.getElementById('pageTitle');
  
  console.log(`   🎯 mainContent 요소: ${mainContent ? '✅ 존재' : '❌ 없음'}`);
  console.log(`   🎯 pageTitle 요소: ${pageTitle ? '✅ 존재' : '❌ 없음'}`);

  // 페이지별 타이틀
  const pageTitles = {
    'dashboard': '대시보드',
    'notice': '공지사항',
    'consulting': '상담현황',
    'contract': '계약현황',
    'installation': '설치현황',
    'operation': '운영등재',
    'franchise': '가맹점현황',
    'settlement-cms': 'CMS 정산',
    'settlement-crm': 'CRM 정산',
    'settlement-ai': 'Ai매출업 정산',
    'settlement-dashboard': '정산 대시보드',
    'inventory-status': '재고현황',
    'inventory-request': '재고요청',
    'inventory-return': '반납관리',
    'inventory-rental': '대여현황',
    'inventory-dashboard': '재고 대시보드',
    'cs-inbound': '인바운드 현황',
    'cs-visit': '방문 A/S 현황',
    'cs-qa': 'H/W QA',
    'user-management': '사용자 관리',
    'location-management': '로케이션 관리',
    'page-management': '페이지 관리',
    'item-management': '항목 관리',
    'product-management': '품목 관리'
  };

  pageTitle.textContent = pageTitles[page] || '페이지';
  console.log(`   📌 페이지 타이틀 설정: "${pageTitle.textContent}"`);

  // 대시보드인 경우
  if (page === 'dashboard') {
    console.log('   🏠 대시보드로 이동');
    
    // 현재 실제로 대시보드 콘텐츠가 표시되어 있는지 확인
    const isDashboardVisible = document.querySelector('.dashboard-card') !== null;
    
    if (isDashboardVisible) {
      console.log('   ✅ 이미 대시보드가 표시되어 있습니다. 데이터만 새로고침합니다.');
      // 대시보드 데이터만 새로고침
      loadDashboardData();
      return;
    }
    
    // 대시보드가 표시되어 있지 않으면 리다이렉트
    console.log('   🔄 대시보드로 리다이렉트');
    // 히스토리를 localStorage에 저장
    try {
      localStorage.setItem('navigationHistory', JSON.stringify(history));
      localStorage.setItem('navigationIndex', historyIndex.toString());
      console.log('   💾 히스토리 저장됨:', history, 'index:', historyIndex);
    } catch (error) {
      console.error('히스토리 저장 실패:', error);
    }
    
    window.location.href = '/';
    return;
  }

  // 공지사항인 경우
  if (page === 'notice') {
    console.log('   📢 공지사항 페이지 로드');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    loadNoticeList(1);
    return;
  }

  // 상담현황인 경우
  if (page === 'consulting') {
    console.log('   💬 상담현황 페이지 로드');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    loadConsultationPage();
    return;
  }

  // 계약현황인 경우
  if (page === 'contract') {
    console.log('   📝 계약현황 페이지 로드');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    // 함수가 정의되어 있는지 확인
    if (typeof window.loadContractPage === 'function') {
      loadContractPage();
    } else {
      console.error('❌ loadContractPage 함수가 아직 로드되지 않았습니다.');
      console.log('   🔄 contract.js 로드 대기 중...');
      
      // 0.5초 후 재시도
      setTimeout(() => {
        if (typeof window.loadContractPage === 'function') {
          console.log('   ✅ contract.js 로드 완료, 함수 실행');
          loadContractPage();
        } else {
          console.error('❌ contract.js 로드 실패 - 수동으로 새로고침해주세요');
          mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
              <p class="text-gray-600 mb-4">계약현황 페이지를 불러올 수 없습니다.</p>
              <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                새로고침
              </button>
            </div>
          `;
        }
      }, 500);
    }
    return;
  }

  // 설치현황인 경우
  if (page === 'installation') {
    console.log('🔧 설치현황 페이지 로드');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    if (typeof window.loadInstallationPage === 'function') {
      loadInstallationPage();
    } else {
      console.error('❌ loadInstallationPage 함수가 아직 로드되지 않았습니다.');
      console.log('🔄 installation.js 로드 대기 중...');
      
      setTimeout(() => {
        if (typeof window.loadInstallationPage === 'function') {
          console.log('✅ installation.js 로드 완료, 함수 실행');
          loadInstallationPage();
        } else {
          console.error('❌ installation.js 로드 실패');
          mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
              <p class="text-gray-600 mb-4">설치현황 페이지를 불러올 수 없습니다.</p>
              <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                새로고침
              </button>
            </div>
          `;
        }
      }, 500);
    }
    return;
  }

  // 운영등재인 경우
  if (page === 'operation') {
    console.log('📋 운영등재 페이지 로드');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    if (typeof window.loadOperationPage === 'function') {
      loadOperationPage();
    } else {
      console.error('❌ loadOperationPage 함수가 아직 로드되지 않았습니다.');
      console.log('🔄 operation.js 로드 대기 중...');
      
      setTimeout(() => {
        if (typeof window.loadOperationPage === 'function') {
          console.log('✅ operation.js 로드 완료, 함수 실행');
          loadOperationPage();
        } else {
          console.error('❌ operation.js 로드 실패');
          mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
              <p class="text-gray-600 mb-4">운영등재 페이지를 불러올 수 없습니다.</p>
              <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                새로고침
              </button>
            </div>
          `;
        }
      }, 500);
    }
    return;
  }

  // 사용자 관리 페이지
  if (page === 'user-management') {
    console.log('👥 사용자 관리 페이지 로드');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    if (typeof window.loadUserManagementPage === 'function') {
      loadUserManagementPage();
    } else {
      console.error('❌ loadUserManagementPage 함수가 아직 로드되지 않았습니다.');
      
      setTimeout(() => {
        if (typeof window.loadUserManagementPage === 'function') {
          console.log('✅ user-management.js 로드 완료, 함수 실행');
          loadUserManagementPage();
        } else {
          console.error('❌ user-management.js 로드 실패');
          mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
              <p class="text-gray-600 mb-4">사용자 관리 페이지를 불러올 수 없습니다.</p>
              <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                새로고침
              </button>
            </div>
          `;
        }
      }, 500);
    }
    return;
  }

  // 항목 관리 페이지
  if (page === 'item-management') {
    console.log('⚙️ 항목 관리 페이지 로드 시작');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    if (typeof window.itemManagement?.loadItemManagement === 'function') {
      console.log('✅ itemManagement.loadItemManagement 함수 발견');
      
      // DOM이 완전히 렌더링될 때까지 기다림
      try {
        await waitForElement('mainContent', 10, 300);
        console.log('✅ mainContent DOM 렌더링 완료, item-management.js 실행');
        await window.itemManagement.loadItemManagement();
      } catch (error) {
        console.error('❌ DOM 렌더링 타임아웃 또는 실행 오류:', error);
        mainContent.innerHTML = `
          <div class="bg-white rounded-lg shadow-md p-8 text-center">
            <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
              <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
            <p class="text-gray-600 mb-4">항목 관리 페이지를 불러올 수 없습니다.</p>
            <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
              새로고침
            </button>
          </div>
        `;
      }
    } else {
      console.error('❌ itemManagement.loadItemManagement 함수가 아직 로드되지 않았습니다.');
      
      setTimeout(async () => {
        if (typeof window.itemManagement?.loadItemManagement === 'function') {
          console.log('✅ item-management.js 로드 완료 (재시도)');
          try {
            await waitForElement('mainContent', 10, 300);
            await window.itemManagement.loadItemManagement();
          } catch (error) {
            console.error('❌ 재시도 후에도 실패:', error);
            mainContent.innerHTML = `
              <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                  <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
                <p class="text-gray-600 mb-4">항목 관리 페이지를 불러올 수 없습니다.</p>
                <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                  새로고침
                </button>
              </div>
            `;
          }
        } else {
          console.error('❌ item-management.js 로드 실패 (재시도 후에도)');
          mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
              <p class="text-gray-600 mb-4">항목 관리 페이지를 불러올 수 없습니다.</p>
              <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                새로고침
              </button>
            </div>
          `;
        }
      }, 500);
    }
    return;
  }

  // 가맹점현황 페이지
  if (page === 'franchise') {
    console.log('🏪 가맹점현황 페이지 로드 시작');
    mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>';
    
    if (typeof window.franchise?.loadFranchisePage === 'function') {
      console.log('✅ franchise.loadFranchisePage 함수 발견');
      
      // DOM이 완전히 렌더링될 때까지 기다림
      try {
        await waitForElement('mainContent', 5, 200);
        console.log('✅ mainContent DOM 렌더링 완료, franchise.js 실행');
        await window.franchise.loadFranchisePage();
      } catch (error) {
        console.error('❌ DOM 렌더링 타임아웃 또는 실행 오류:', error);
        mainContent.innerHTML = `
          <div class="bg-white rounded-lg shadow-md p-8 text-center">
            <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
              <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
            <p class="text-gray-600 mb-4">가맹점현황 페이지를 불러올 수 없습니다.</p>
            <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
              새로고침
            </button>
          </div>
        `;
      }
    } else {
      console.error('❌ franchise.loadFranchisePage 함수가 아직 로드되지 않았습니다.');
      
      setTimeout(async () => {
        if (typeof window.franchise?.loadFranchisePage === 'function') {
          console.log('✅ franchise.js 로드 완료 (재시도)');
          try {
            await waitForElement('mainContent', 5, 200);
            await window.franchise.loadFranchisePage();
          } catch (error) {
            console.error('❌ 재시도 후에도 실패:', error);
            mainContent.innerHTML = `
              <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                  <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
                <p class="text-gray-600 mb-4">가맹점현황 페이지를 불러올 수 없습니다.</p>
                <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                  새로고침
                </button>
              </div>
            `;
          }
        } else {
          console.error('❌ franchise.js 로드 실패 (재시도 후에도)');
          mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <div class="inline-block p-6 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-5xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">페이지 로드 오류</h2>
              <p class="text-gray-600 mb-4">가맹점현황 페이지를 불러올 수 없습니다.</p>
              <button onclick="window.location.reload()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                새로고침
              </button>
            </div>
          `;
        }
      }, 500);
    }
    return;
  }

  // 다른 페이지 (준비중)
  console.log(`🚧 준비중 페이지: ${page}`);
  mainContent.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-8 text-center">
      <div class="inline-block p-6 bg-gray-100 rounded-full mb-4">
        <i class="fas fa-hammer text-gray-400 text-5xl"></i>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">${pageTitles[page]}</h2>
      <p class="text-gray-600">이 페이지는 준비 중입니다.</p>
      <button onclick="loadPage('dashboard')" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
        대시보드로 돌아가기
      </button>
    </div>
  `;
}

// 로그아웃
document.getElementById('logoutButton').addEventListener('click', async () => {
  if (!confirm('로그아웃하시겠습니까?')) {
    return;
  }

  try {
    await axios.post('/api/auth/logout');
    window.location.href = '/';
  } catch (error) {
    alert('로그아웃 처리 중 오류가 발생했습니다.');
  }
});

// 우측 상단 로그아웃 버튼
document.getElementById('headerLogoutButton').addEventListener('click', async () => {
  if (!confirm('로그아웃하시겠습니까?')) {
    return;
  }

  try {
    await axios.post('/api/auth/logout');
    window.location.href = '/';
  } catch (error) {
    alert('로그아웃 처리 중 오류가 발생했습니다.');
  }
});

// 초기화
renderMenu();

/**
 * 대시보드 데이터 로드
 */
async function loadDashboardData() {
  try {
    // 상담현황 건수 조회 (미이관 건만 = 진행중)
    const consultingResponse = await axios.get('/api/consultations?page=1&limit=1');
    const consultingCount = consultingResponse.data.pagination?.total || 0;
    
    const consultingElement = document.getElementById('consultingCount');
    if (consultingElement) {
      consultingElement.textContent = consultingCount;
    }
    
    // 계약현황 건수 조회 (미이관 건만 = 진행중)
    try {
      const contractResponse = await axios.get('/api/contracts?page=1&limit=1');
      const contractCount = contractResponse.data.pagination?.total || 0;
      
      const contractElement = document.getElementById('contractCount');
      if (contractElement) {
        contractElement.textContent = contractCount;
      }
    } catch (error) {
      console.log('Contract API not available yet');
    }
    
    // 설치현황 건수 조회 (미이관 건만 = 진행중)
    try {
      const installationResponse = await axios.get('/api/installations?page=1&limit=1');
      const installationCount = installationResponse.data.pagination?.total || 0;
      
      const installationElement = document.getElementById('installationCount');
      if (installationElement) {
        installationElement.textContent = installationCount;
      }
    } catch (error) {
      console.log('Installation API not available yet');
    }
    
    // 운영등재 건수 조회
    try {
      const operationResponse = await axios.get('/api/operations?page=1&limit=1');
      const operationCount = operationResponse.data.pagination?.total || 0;
      
      const operationElement = document.getElementById('operationCount');
      if (operationElement) {
        operationElement.textContent = operationCount;
      }
    } catch (error) {
      console.log('Operation API not available yet');
      const operationElement = document.getElementById('operationCount');
      if (operationElement) {
        operationElement.textContent = '0';
      }
    }
  } catch (error) {
    console.error('Dashboard data load error:', error);
    const consultingElement = document.getElementById('consultingCount');
    if (consultingElement) {
      consultingElement.textContent = '0';
    }
  }
}

// 페이지 로드 시 대시보드 데이터 로드
if (document.getElementById('consultingCount')) {
  loadDashboardData();
}

/**
 * 프로필 수정 모달 표시
 */
async function showProfileModal() {
  try {
    // 현재 사용자 정보 조회
    const response = await axios.get('/api/auth/me');
    const user = response.data.user;

    const modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-user-edit mr-2 text-indigo-600"></i>프로필 수정
          </h2>
          <button onclick="closeProfileModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <form id="profileForm" class="p-6 space-y-6">
          <!-- 기본 정보 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 이름 (한글) -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-user mr-2"></i>이름 (한글)
              </label>
              <input
                type="text"
                id="profileName"
                value="${user.name || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <!-- 닉네임 (영문) -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-id-badge mr-2"></i>닉네임 (영문)
              </label>
              <input
                type="text"
                id="profileNickname"
                value="${user.nickname || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="honggildong"
              />
            </div>

            <!-- 연락처 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-phone mr-2"></i>연락처
              </label>
              <input
                type="tel"
                id="profilePhone"
                value="${user.phone || ''}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="010-1234-5678"
              />
            </div>

            <!-- 부서명 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-building mr-2"></i>부서명
              </label>
              <select
                id="profileDepartment"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="디지털사업본부" ${user.department === '디지털사업본부' ? 'selected' : ''}>디지털사업본부</option>
                <option value="마케팅팀" ${user.department === '마케팅팀' ? 'selected' : ''}>마케팅팀</option>
                <option value="디지털사업팀" ${user.department === '디지털사업팀' ? 'selected' : ''}>디지털사업팀</option>
                <option value="운영파트" ${user.department === '운영파트' ? 'selected' : ''}>운영파트</option>
              </select>
            </div>

            <!-- 직책 -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-briefcase mr-2"></i>직책
              </label>
              <select
                id="profilePosition"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="스태프" ${user.position === '스태프' ? 'selected' : ''}>스태프</option>
                <option value="시니어" ${user.position === '시니어' ? 'selected' : ''}>시니어</option>
                <option value="프로" ${user.position === '프로' ? 'selected' : ''}>프로</option>
                <option value="매니저" ${user.position === '매니저' ? 'selected' : ''}>매니저</option>
                <option value="파트장" ${user.position === '파트장' ? 'selected' : ''}>파트장</option>
                <option value="팀장" ${user.position === '팀장' ? 'selected' : ''}>팀장</option>
                <option value="그룹장" ${user.position === '그룹장' ? 'selected' : ''}>그룹장</option>
                <option value="본부장" ${user.position === '본부장' ? 'selected' : ''}>본부장</option>
                <option value="CTO" ${user.position === 'CTO' ? 'selected' : ''}>CTO</option>
                <option value="SEVP" ${user.position === 'SEVP' ? 'selected' : ''}>SEVP</option>
                <option value="CEO" ${user.position === 'CEO' ? 'selected' : ''}>CEO</option>
              </select>
            </div>
          </div>

          <!-- 비밀번호 변경 -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              <i class="fas fa-lock mr-2"></i>비밀번호 변경 (선택)
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              * 비밀번호를 변경하려면 아래 두 필드에 새 비밀번호를 입력하세요.<br>
              * 비밀번호를 변경하지 않으려면 비워두세요.<br>
              * 비밀번호를 잊으신 경우 관리자에게 문의하세요.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 새 비밀번호 -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="profileNewPassword"
                  autocomplete="new-password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="새 비밀번호 (선택)"
                />
              </div>

              <!-- 새 비밀번호 확인 -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  id="profileConfirmPassword"
                  autocomplete="new-password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="새 비밀번호 확인 (선택)"
                />
              </div>
            </div>
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onclick="closeProfileModal()"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <i class="fas fa-save mr-2"></i>저장
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 폼 제출 이벤트
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  } catch (error) {
    console.error('프로필 모달 표시 오류:', error);
    alert('프로필 정보를 불러올 수 없습니다.');
  }
}

/**
 * 프로필 수정 모달 닫기
 */
function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * 프로필 업데이트
 */
async function updateProfile() {
  try {
    const name = document.getElementById('profileName').value.trim();
    const nickname = document.getElementById('profileNickname').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const department = document.getElementById('profileDepartment').value;
    const position = document.getElementById('profilePosition').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    const confirmPassword = document.getElementById('profileConfirmPassword').value;

    console.log('=== 프로필 저장 데이터 ===');
    console.log('name:', name);
    console.log('nickname:', nickname);
    console.log('phone:', phone);
    console.log('department:', department);
    console.log('position:', position);
    console.log('newPassword:', newPassword ? '(입력됨)' : '(비어있음)');

    // 비밀번호 변경 시 확인
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    const data = {
      name,
      nickname,
      phone,
      department,
      position
    };

    // 비밀번호 변경 요청이 있는 경우만
    if (newPassword && newPassword.trim() !== '') {
      data.newPassword = newPassword;
      data.confirmPassword = confirmPassword;
    }

    console.log('전송할 데이터:', data);

    const response = await axios.put('/api/auth/profile', data);

    console.log('API 응답:', response.data);

    if (response.data.success) {
      alert('프로필이 수정되었습니다.');
      
      // 사용자 정보 즉시 업데이트
      const updatedResponse = await axios.get('/api/auth/me');
      if (updatedResponse.data.user) {
        window.currentUser = updatedResponse.data.user;
        
        // 좌측 프로필 정보 업데이트
        const profileNameEl = document.getElementById('userName');
        const profileRoleEl = document.getElementById('userRole');
        
        if (profileNameEl) {
          profileNameEl.textContent = window.currentUser.name || window.currentUser.username;
        }
        if (profileRoleEl) {
          const roleText = window.currentUser.role === 'master' ? '마스터' : 
                          window.currentUser.role === 'admin' ? '관리자' : '사용자';
          profileRoleEl.textContent = roleText;
        }
        
        // 우상단 프로필 정보 업데이트 (헤더 내부)
        const headerProfileButton = document.querySelector('header button[onclick="showProfileModal()"]');
        if (headerProfileButton) {
          const nameSpan = headerProfileButton.querySelector('.font-semibold');
          const detailSpan = headerProfileButton.querySelector('.text-xs.text-gray-500');
          
          if (nameSpan) {
            nameSpan.textContent = window.currentUser.name || window.currentUser.username;
          }
          if (detailSpan) {
            const dept = window.currentUser.department || window.currentUser.role;
            const pos = window.currentUser.position ? ' · ' + window.currentUser.position : '';
            detailSpan.textContent = dept + pos;
          }
        }
      }
      
      closeProfileModal();
    }
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    console.error('오류 응답:', error.response?.data);
    alert(error.response?.data?.error || '프로필 수정 중 오류가 발생했습니다.');
  }
}

// Window에 함수 노출
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.updateProfile = updateProfile;
