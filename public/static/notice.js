// 공지사항 관련 함수

let currentNoticePage = 1;
let currentNoticeId = null;

/**
 * 공지사항 목록 로드
 */
async function loadNoticeList(page = 1) {
  try {
    const response = await axios.get(`/api/notices?page=${page}&limit=10`);
    const { notices, pagination } = response.data;

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-bullhorn mr-2 text-indigo-600"></i>
            공지사항
          </h2>
          <button onclick="showNoticeWriteForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center">
            <i class="fas fa-pen mr-2"></i>
            글쓰기
          </button>
        </div>

        <!-- 공지사항 목록 -->
        <div class="divide-y divide-gray-200">
          ${notices.length === 0 ? `
            <div class="p-8 text-center text-gray-500">
              <i class="fas fa-inbox text-4xl mb-4"></i>
              <p>등록된 공지사항이 없습니다.</p>
            </div>
          ` : notices.map(notice => `
            <div class="p-4 hover:bg-gray-50 cursor-pointer transition" onclick="loadNoticeDetail(${notice.id})">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    ${notice.is_pinned ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-thumbtack mr-1"></i>고정</span>' : ''}
                    <h3 class="text-lg font-semibold text-gray-800 hover:text-indigo-600">${notice.title}</h3>
                  </div>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span><i class="fas fa-user mr-1"></i>${notice.author_name}</span>
                    <span><i class="fas fa-calendar mr-1"></i>${formatDate(notice.created_at)}</span>
                    <span><i class="fas fa-eye mr-1"></i>${notice.views}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 페이지네이션 -->
        ${pagination.totalPages > 1 ? `
          <div class="p-4 border-t border-gray-200 flex justify-center space-x-2">
            ${pagination.page > 1 ? `
              <button onclick="loadNoticeList(${pagination.page - 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-left"></i>
              </button>
            ` : ''}
            
            ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
              .map(p => `
                <button onclick="loadNoticeList(${p})" class="px-4 py-2 ${p === pagination.page ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded transition">
                  ${p}
                </button>
              `).join('')}
            
            ${pagination.page < pagination.totalPages ? `
              <button onclick="loadNoticeList(${pagination.page + 1})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
                <i class="fas fa-chevron-right"></i>
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    currentNoticePage = page;
  } catch (error) {
    console.error('Load notice list error:', error);
    alert('공지사항 목록을 불러올 수 없습니다.');
  }
}

/**
 * 공지사항 상세 조회
 */
async function loadNoticeDetail(id) {
  try {
    const response = await axios.get(`/api/notices/${id}`);
    const { notice } = response.data;

    const canEdit = currentUser.id === notice.author_id || ['master', 'admin'].includes(currentUser.role);

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <button onclick="loadNoticeList(${currentNoticePage})" class="text-gray-600 hover:text-gray-800 transition">
              <i class="fas fa-arrow-left mr-2"></i>목록으로
            </button>
            ${canEdit ? `
              <div class="space-x-2">
                <button onclick="showNoticeEditForm(${notice.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                  <i class="fas fa-edit mr-2"></i>수정
                </button>
                <button onclick="deleteNotice(${notice.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
                  <i class="fas fa-trash mr-2"></i>삭제
                </button>
              </div>
            ` : ''}
          </div>
          <div class="flex items-center space-x-2 mb-2">
            ${notice.is_pinned ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-thumbtack mr-1"></i>고정</span>' : ''}
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${notice.title}</h2>
          <div class="flex items-center space-x-4 text-sm text-gray-500">
            <span><i class="fas fa-user mr-1"></i>${notice.author_name}</span>
            <span><i class="fas fa-calendar mr-1"></i>${formatDate(notice.created_at)}</span>
            <span><i class="fas fa-eye mr-1"></i>${notice.views}</span>
          </div>
        </div>

        <!-- 내용 -->
        <div class="p-6">
          <div class="prose max-w-none" style="white-space: pre-wrap;">${notice.content}</div>
        </div>
      </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    currentNoticeId = id;
  } catch (error) {
    console.error('Load notice detail error:', error);
    alert('공지사항을 불러올 수 없습니다.');
  }
}

/**
 * 공지사항 작성 폼
 */
function showNoticeWriteForm() {
  const content = `
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-pen mr-2 text-indigo-600"></i>
          공지사항 작성
        </h2>
      </div>

      <form id="noticeForm" class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            제목 <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="noticeTitle"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="제목을 입력하세요"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            내용 <span class="text-red-500">*</span>
          </label>
          <textarea
            id="noticeContent"
            required
            rows="15"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="내용을 입력하세요"
          ></textarea>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="noticePinned"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          >
          <label for="noticePinned" class="ml-2 text-sm text-gray-700">
            <i class="fas fa-thumbtack mr-1 text-red-500"></i>
            상단 고정
          </label>
        </div>

        <div class="flex space-x-3">
          <button
            type="submit"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            <i class="fas fa-check mr-2"></i>
            작성하기
          </button>
          <button
            type="button"
            onclick="loadNoticeList(${currentNoticePage})"
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
  document.getElementById('noticeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitNotice();
  });
}

/**
 * 공지사항 수정 폼
 */
async function showNoticeEditForm(id) {
  try {
    const response = await axios.get(`/api/notices/${id}`);
    const { notice } = response.data;

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-edit mr-2 text-blue-600"></i>
            공지사항 수정
          </h2>
        </div>

        <form id="noticeEditForm" class="p-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              제목 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="noticeTitle"
              required
              value="${notice.title}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              내용 <span class="text-red-500">*</span>
            </label>
            <textarea
              id="noticeContent"
              required
              rows="15"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >${notice.content}</textarea>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="noticePinned"
              ${notice.is_pinned ? 'checked' : ''}
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            >
            <label for="noticePinned" class="ml-2 text-sm text-gray-700">
              <i class="fas fa-thumbtack mr-1 text-red-500"></i>
              상단 고정
            </label>
          </div>

          <div class="flex space-x-3">
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <i class="fas fa-check mr-2"></i>
              수정하기
            </button>
            <button
              type="button"
              onclick="loadNoticeDetail(${id})"
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
    document.getElementById('noticeEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateNotice(id);
    });
  } catch (error) {
    console.error('Load notice for edit error:', error);
    alert('공지사항을 불러올 수 없습니다.');
  }
}

/**
 * 공지사항 작성 제출
 */
async function submitNotice() {
  const title = document.getElementById('noticeTitle').value;
  const content = document.getElementById('noticeContent').value;
  const is_pinned = document.getElementById('noticePinned').checked;

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  try {
    await axios.post('/api/notices', {
      title,
      content,
      is_pinned
    });

    alert('공지사항이 작성되었습니다.');
    loadNoticeList(1);
  } catch (error) {
    console.error('Submit notice error:', error);
    alert(error.response?.data?.error || '공지사항 작성에 실패했습니다.');
  }
}

/**
 * 공지사항 수정 제출
 */
async function updateNotice(id) {
  const title = document.getElementById('noticeTitle').value;
  const content = document.getElementById('noticeContent').value;
  const is_pinned = document.getElementById('noticePinned').checked;

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  try {
    await axios.put(`/api/notices/${id}`, {
      title,
      content,
      is_pinned
    });

    alert('공지사항이 수정되었습니다.');
    loadNoticeDetail(id);
  } catch (error) {
    console.error('Update notice error:', error);
    alert(error.response?.data?.error || '공지사항 수정에 실패했습니다.');
  }
}

/**
 * 공지사항 삭제
 */
async function deleteNotice(id) {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  try {
    await axios.delete(`/api/notices/${id}`);
    alert('공지사항이 삭제되었습니다.');
    loadNoticeList(currentNoticePage);
  } catch (error) {
    console.error('Delete notice error:', error);
    alert(error.response?.data?.error || '공지사항 삭제에 실패했습니다.');
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return '방금 전';
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR');
  }
}
