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
      divider.className = 'my-3 border-t border-indigo-800';
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
        <button class="w-full flex items-center justify-between p-3 hover:bg-indigo-800 rounded-lg transition submenu-toggle" data-target="${item.id}-submenu">
          <div class="flex items-center space-x-3">
            <i class="fas ${item.icon}"></i>
            <span class="menu-text">${item.label}</span>
          </div>
          <i class="fas fa-chevron-down menu-text transition-transform submenu-icon"></i>
        </button>
        <div id="${item.id}-submenu" class="submenu ml-4 space-y-1 mt-1">
          ${item.submenu.map(sub => `
            <a href="#${sub.page}" class="block p-2 hover:bg-indigo-800 rounded-lg transition menu-link" data-page="${sub.page}">
              <span class="menu-text text-sm">${sub.label}</span>
            </a>
          `).join('')}
        </div>
      `;
    } else {
      // 일반 메뉴
      menuItem.innerHTML = `
        <a href="#${item.page}" class="flex items-center space-x-3 p-3 hover:bg-indigo-800 rounded-lg transition menu-link" data-page="${item.page}">
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

// 페이지 로드
function loadPage(page, addToHistory = true) {
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
