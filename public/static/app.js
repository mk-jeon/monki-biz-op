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
document.querySelectorAll('.dashboard-card').forEach(card => {
  card.addEventListener('click', () => {
    const page = card.getAttribute('data-page');
    loadPage(page);
  });
});

// 네비게이션 버튼
let history = ['dashboard'];
let historyIndex = 0;

document.getElementById('homeButton').addEventListener('click', () => {
  loadPage('dashboard');
});

document.getElementById('backButton').addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex--;
    loadPage(history[historyIndex], false);
  }
});

document.getElementById('forwardButton').addEventListener('click', () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    loadPage(history[historyIndex], false);
  }
});

// 페이지 로드
function loadPage(page, addToHistory = true) {
  if (addToHistory) {
    // 현재 위치 이후의 히스토리 제거
    history = history.slice(0, historyIndex + 1);
    history.push(page);
    historyIndex = history.length - 1;
  }

  const mainContent = document.getElementById('mainContent');
  const pageTitle = document.getElementById('pageTitle');

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

  // 대시보드인 경우
  if (page === 'dashboard') {
    window.location.reload();
    return;
  }

  // 공지사항인 경우
  if (page === 'notice') {
    loadNoticeList(1);
    return;
  }

  // 상담현황인 경우
  if (page === 'consulting') {
    loadConsultationPage();
    return;
  }

  // 계약현황인 경우
  if (page === 'contract') {
    loadContractPage();
    return;
  }

  // 다른 페이지 (준비중)
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
      // 계약현황 API 없을 경우 무시
      console.log('Contract API not available yet');
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
