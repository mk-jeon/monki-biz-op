import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings, Variables } from './types';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import noticeRoutes from './routes/notices';
import consultationRoutes from './routes/consultations';
import contractRoutes from './routes/contracts';
import installationRoutes from './routes/installations';
import operationRoutes from './routes/operations';
import userRoutes from './routes/users';
import departmentRoutes from './routes/departments';
import itemRoutes from './routes/items';
import franchiseRoutes from './routes/franchises';

// 빌드 시점의 버전 (캐시 무효화용)
const BUILD_VERSION = Date.now(); // 🔥 동적 캐시 무효화 (빌드 시마다 변경)

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS 설정
app.use('/api/*', cors());

// 인증 미들웨어 적용
app.use('*', authMiddleware);

// API 라우트
app.route('/api/auth', authRoutes);
app.route('/api/notices', noticeRoutes);
app.route('/api/consultations', consultationRoutes);
app.route('/api/contracts', contractRoutes);
app.route('/api/installations', installationRoutes);
app.route('/api/operations', operationRoutes);
app.route('/api/users', userRoutes);
app.route('/api/departments', departmentRoutes);
app.route('/api/items', itemRoutes);
app.route('/api/franchises', franchiseRoutes);

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }));

// 메인 페이지 (로그인 여부에 따라 다른 페이지 제공)
app.get('/', async (c) => {
  const user = c.get('user');

  // 로그인하지 않은 경우 로그인 페이지
  if (!user) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MONKi Biz Operation - 로그인</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div class="text-center mb-8">
            <div class="inline-block p-4 bg-indigo-600 rounded-full mb-4">
              <i class="fas fa-briefcase text-white text-4xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800">MONKi Biz Operation</h1>
            <p class="text-gray-600 mt-2">디지털사업본부 통합 업무 플랫폼</p>
          </div>

          <form id="loginForm" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-user mr-2"></i>아이디
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                autocomplete="username"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="아이디를 입력하세요"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-lock mr-2"></i>비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autocomplete="current-password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="비밀번호를 입력하세요"
              >
            </div>

            <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <i class="fas fa-exclamation-circle mr-2"></i>
              <span id="errorText"></span>
            </div>

            <button
              type="submit"
              id="loginButton"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <i class="fas fa-sign-in-alt mr-2"></i>
              <span id="loginButtonText">로그인</span>
            </button>
          </form>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/login.js"></script>
      </body>
      </html>
    `);
  }

  // 로그인한 경우 대시보드 페이지
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MONKi Biz Operation - 대시보드</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        .sidebar {
          width: 280px;
          transition: all 0.3s ease;
        }
        .sidebar.collapsed {
          width: 80px;
        }
        .menu-text {
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        .collapsed .menu-text {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }
        .submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .submenu.open {
          max-height: 500px;
        }
        .dashboard-card {
          transition: all 0.3s ease;
        }
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body class="bg-gray-50">
      <div class="flex h-screen overflow-hidden">
        <!-- 좌측 사이드바 -->
        <aside id="sidebar" class="sidebar bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col shadow-2xl">
          <!-- 상단 헤더 -->
          <div class="p-4 border-b border-gray-800 flex items-center justify-between backdrop-blur-sm">
            <div class="flex items-center space-x-3">
              <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
                <i class="fas fa-briefcase text-xl"></i>
              </div>
              <span class="menu-text font-bold text-lg bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">MONKi Biz OP</span>
            </div>
            <button id="toggleSidebar" class="hover:bg-gray-700 p-2 rounded-lg transition duration-200">
              <i class="fas fa-bars"></i>
            </button>
          </div>

          <!-- 사용자 정보 -->
          <div class="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-800 to-gray-900 relative">
            <!-- 권한 뱃지 -->
            ${user.role === 'master' ? `
              <div class="absolute top-2 right-2 flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                <span style="font-size: 14px;">👑</span>
                <span>MASTER</span>
              </div>
            ` : user.role === 'admin' ? `
              <div class="absolute top-2 right-2 flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                <span style="font-size: 14px;">👑</span>
                <span>ADMIN</span>
              </div>
            ` : `
              <div class="absolute top-2 right-2 flex items-center space-x-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                <span style="font-size: 14px;">🛡️</span>
              </div>
            `}
            
            <div class="flex items-center space-x-3">
              <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-full shadow-lg ring-2 ring-indigo-400 ring-opacity-50">
                <i class="fas fa-user"></i>
              </div>
              <div class="menu-text">
                <p class="font-semibold text-white" id="userName">${user.name}</p>
                <p class="text-xs text-indigo-300" id="userRole">${user.role === 'master' ? '마스터' : user.role === 'admin' ? '관리자' : '사용자'}</p>
              </div>
            </div>
          </div>

          <!-- 메뉴 -->
          <nav class="flex-1 overflow-y-auto p-4 space-y-2" id="mainMenu">
            <!-- 메뉴는 JavaScript로 동적 생성 -->
          </nav>

          <!-- 로그아웃 -->
          <div class="p-4 border-t border-gray-800">
            <button
              id="logoutButton"
              class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <i class="fas fa-sign-out-alt mr-2"></i>
              <span class="menu-text">로그아웃</span>
            </button>
          </div>
        </aside>

        <!-- 메인 콘텐츠 -->
        <main class="flex-1 overflow-y-auto">
          <!-- 상단 바 -->
          <header class="bg-white shadow-sm p-4 sticky top-0 z-10">
            <div class="flex items-center justify-between">
              <h1 class="text-xl font-bold text-gray-800" id="pageTitle">대시보드</h1>
              <div class="flex items-center space-x-4">
                <button 
                  onclick="showProfileModal()" 
                  class="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 transition cursor-pointer"
                  title="프로필 수정"
                >
                  <i class="fas fa-user-circle text-xl"></i>
                  <div class="flex flex-col items-start">
                    <span class="font-semibold">${user.name}</span>
                    <span class="text-xs text-gray-500">${user.department || user.role} ${user.position ? '· ' + user.position : ''}</span>
                  </div>
                </button>
                <button id="headerLogoutButton" class="text-red-600 hover:text-red-800 transition">
                  <i class="fas fa-sign-out-alt"></i> 로그아웃
                </button>
              </div>
            </div>
          </header>

          <!-- 콘텐츠 영역 -->
          <div class="p-6" id="mainContent">
            <!-- 대시보드 콘텐츠 -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
              <!-- 상담현황 -->
              <div class="dashboard-card bg-white rounded-lg shadow-md p-6 cursor-pointer" data-page="consulting">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-800">상담현황</h3>
                  <div class="bg-blue-100 p-3 rounded-lg">
                    <i class="fas fa-comments text-blue-600 text-2xl"></i>
                  </div>
                </div>
                <p id="consultingCount" class="text-3xl font-bold text-gray-900 mb-2">
                  <i class="fas fa-spinner fa-spin text-gray-400"></i>
                </p>
                <p class="text-sm text-gray-600">진행중인 상담</p>
              </div>

              <!-- 계약현황 -->
              <div class="dashboard-card bg-white rounded-lg shadow-md p-6 cursor-pointer" data-page="contract">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-800">계약현황</h3>
                  <div class="bg-green-100 p-3 rounded-lg">
                    <i class="fas fa-file-contract text-green-600 text-2xl"></i>
                  </div>
                </div>
                <p id="contractCount" class="text-3xl font-bold text-gray-900 mb-2">
                  <i class="fas fa-spinner fa-spin text-gray-400"></i>
                </p>
                <p class="text-sm text-gray-600">진행중인 계약</p>
              </div>

              <!-- 설치현황 -->
              <div class="dashboard-card bg-white rounded-lg shadow-md p-6 cursor-pointer" data-page="installation">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-800">설치현황</h3>
                  <div class="bg-yellow-100 p-3 rounded-lg">
                    <i class="fas fa-tools text-yellow-600 text-2xl"></i>
                  </div>
                </div>
                <p id="installationCount" class="text-3xl font-bold text-gray-900 mb-2">
                  <i class="fas fa-spinner fa-spin text-gray-400"></i>
                </p>
                <p class="text-sm text-gray-600">진행중인 설치</p>
              </div>

              <!-- 운영등재 -->
              <div class="dashboard-card bg-white rounded-lg shadow-md p-6 cursor-pointer" data-page="operation">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-800">운영등재</h3>
                  <div class="bg-purple-100 p-3 rounded-lg">
                    <i class="fas fa-cogs text-purple-600 text-2xl"></i>
                  </div>
                </div>
                <p id="operationCount" class="text-3xl font-bold text-gray-900 mb-2">
                  <i class="fas fa-spinner fa-spin text-gray-400"></i>
                </p>
                <p class="text-sm text-gray-600">진행중인 운영등재</p>
              </div>
            </div>

            <!-- 추가 정보 -->
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-info-circle mr-2 text-indigo-600"></i>
                시스템 안내
              </h2>
              <p class="text-gray-600">
                통합 업무 플랫폼에 오신 것을 환영합니다.<br>
                좌측 메뉴를 통해 각 기능에 접근하실 수 있습니다.
              </p>
            </div>
          </div>
        </main>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script>
        // 사용자 정보
        window.currentUser = ${JSON.stringify({ 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          nickname: user.nickname,
          phone: user.phone,
          department: user.department,
          position: user.position,
          role: user.role 
        })};
      </script>
      <script src="/static/table-sort.js?v=${BUILD_VERSION}"></script>
      <script src="/static/item-management.js?v=${BUILD_VERSION}"></script>
      <script src="/static/franchise.js?v=${BUILD_VERSION}"></script>
      <script src="/static/dropdown-helper.js?v=${BUILD_VERSION}"></script>
      <script src="/static/notice.js?v=${BUILD_VERSION}"></script>
      <script src="/static/consultation.js?v=${BUILD_VERSION}"></script>
      <script src="/static/contract.js?v=${BUILD_VERSION}"></script>
      <script src="/static/installation.js?v=${BUILD_VERSION}"></script>
      <script src="/static/installation-form.js?v=${BUILD_VERSION}"></script>
      <script src="/static/operation.js?v=${BUILD_VERSION}"></script>
      <script src="/static/user-management.js?v=${BUILD_VERSION}"></script>
      <script src="/static/app.js?v=${BUILD_VERSION}"></script>
    </body>
    </html>
  `);
});

export default app;
