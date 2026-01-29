/**
 * 운영등재 페이지 (준비중)
 */

async function loadOperationPage() {
  const content = document.getElementById('mainContent');
  if (!content) {
    console.error('mainContent 요소를 찾을 수 없습니다.');
    return;
  }

  content.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="inline-block p-8 bg-indigo-100 rounded-full mb-6">
          <i class="fas fa-clipboard-check text-indigo-600 text-6xl"></i>
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-4">운영등재</h2>
        <p class="text-xl text-gray-600 mb-8">현재 개발 중입니다.</p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 class="font-semibold text-blue-800 mb-2">💡 알림</h3>
          <p class="text-blue-700">
            설치현황에서 "운영 이관"을 통해 이관된 데이터는<br>
            <strong>자동으로 숨김 처리</strong>되어 목록에서 제외됩니다.
          </p>
        </div>
        <button
          onclick="loadPage('installation')"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg transition text-lg"
        >
          <i class="fas fa-arrow-left mr-2"></i>설치현황으로 돌아가기
        </button>
      </div>
    </div>
  `;
}

// Window에 함수 노출
window.loadOperationPage = loadOperationPage;
