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
          ` : notices.map(notice => {
            // 분류 표시
            const categoryMap = {
              'update': { text: '업데이트', color: 'bg-blue-600' },
              'info': { text: '정보공유', color: 'bg-green-600' },
              'general': { text: '일반', color: 'bg-gray-600' }
            };
            const category = categoryMap[notice.category] || categoryMap['general'];
            
            // 채널 파싱
            const channels = notice.channels ? notice.channels.split(',').filter(c => c) : [];
            
            // 채널 뱃지 색상 매핑
            const channelColors = {
              '사장님사이트': 'bg-purple-100 text-purple-700',
              '테이블오더App': 'bg-blue-100 text-blue-700',
              'OKPOS': 'bg-green-100 text-green-700',
              'EasyPOS': 'bg-yellow-100 text-yellow-700',
              '엑스퍼트포스': 'bg-red-100 text-red-700',
              '유니온': 'bg-indigo-100 text-indigo-700'
            };
            
            // 내용 일부 (100자까지)
            const contentPreview = notice.content.substring(0, 100) + (notice.content.length > 100 ? '...' : '');
            
            return `
            <div class="p-4 hover:bg-gray-50 cursor-pointer transition" onclick="loadNoticeDetail(${notice.id})">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- 상단: 고정/중요/분류 -->
                  <div class="flex items-center space-x-2 mb-2">
                    ${notice.is_pinned ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-thumbtack mr-1"></i>고정</span>' : ''}
                    ${notice.is_important ? '<span class="bg-orange-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-exclamation-circle mr-1"></i>중요</span>' : ''}
                    <span class="${category.color} text-white text-xs font-bold px-2 py-1 rounded">${category.text}</span>
                  </div>
                  
                  <!-- 제목 -->
                  <h3 class="text-lg font-semibold text-gray-800 hover:text-indigo-600 mb-2">${notice.title}</h3>
                  
                  <!-- 연관채널 -->
                  ${channels.length > 0 ? `
                    <div class="flex items-center space-x-2 mb-2">
                      ${channels.map(ch => `
                        <span class="${channelColors[ch] || 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded-full">
                          ${ch}
                        </span>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  <!-- 내용 일부 -->
                  <p class="text-sm text-gray-600 mb-2">${contentPreview}</p>
                  
                  <!-- 메타정보 -->
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span><i class="fas fa-user mr-1"></i>${notice.author_name}</span>
                    <span><i class="fas fa-calendar mr-1"></i>${formatDate(notice.created_at)}</span>
                    <span><i class="fas fa-eye mr-1"></i>${notice.views}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
          }).join('')}
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

    // 분류 표시
    const categoryMap = {
      'update': { text: '업데이트', color: 'bg-blue-600' },
      'info': { text: '정보공유', color: 'bg-green-600' },
      'general': { text: '일반', color: 'bg-gray-600' }
    };
    const category = categoryMap[notice.category] || categoryMap['general'];
    
    // 채널 파싱
    const channels = notice.channels ? notice.channels.split(',').filter(c => c) : [];
    
    // 채널 뱃지 색상 매핑
    const channelColors = {
      '사장님사이트': 'bg-purple-100 text-purple-700',
      '테이블오더App': 'bg-blue-100 text-blue-700',
      'OKPOS': 'bg-green-100 text-green-700',
      'EasyPOS': 'bg-yellow-100 text-yellow-700',
      '엑스퍼트포스': 'bg-red-100 text-red-700',
      '유니온': 'bg-indigo-100 text-indigo-700'
    };

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
          
          <!-- 상단: 고정/중요/분류 -->
          <div class="flex items-center space-x-2 mb-3">
            ${notice.is_pinned ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-thumbtack mr-1"></i>고정</span>' : ''}
            ${notice.is_important ? '<span class="bg-orange-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-exclamation-circle mr-1"></i>중요</span>' : ''}
            <span class="${category.color} text-white text-xs font-bold px-2 py-1 rounded">${category.text}</span>
          </div>
          
          <!-- 제목 -->
          <h2 class="text-2xl font-bold text-gray-800 mb-3">${notice.title}</h2>
          
          <!-- 연관채널 -->
          ${channels.length > 0 ? `
            <div class="flex items-center space-x-2 mb-3">
              <span class="text-sm text-gray-600 font-medium">연관채널:</span>
              ${channels.map(ch => `
                <span class="${channelColors[ch] || 'bg-gray-100 text-gray-700'} text-xs px-3 py-1 rounded-full font-medium">
                  ${ch}
                </span>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- 메타정보 -->
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
  const channels = ['사장님사이트', '테이블오더App', 'OKPOS', 'EasyPOS', '엑스퍼트포스', '유니온'];
  const selectedChannels = [];

  const content = `
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-pen mr-2 text-indigo-600"></i>
          공지사항 작성
        </h2>
      </div>

      <form id="noticeForm" class="p-6 space-y-6">
        <!-- 분류 선택 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            분류 <span class="text-red-500">*</span>
          </label>
          <div class="flex space-x-3">
            <label class="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
              <input type="radio" name="category" value="update" class="mr-2" checked>
              <span class="text-sm font-medium">업데이트</span>
            </label>
            <label class="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition">
              <input type="radio" name="category" value="info" class="mr-2">
              <span class="text-sm font-medium">정보공유</span>
            </label>
            <label class="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition">
              <input type="radio" name="category" value="general" class="mr-2">
              <span class="text-sm font-medium">일반</span>
            </label>
          </div>
        </div>

        <!-- 중요 여부 -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <input
              type="checkbox"
              id="noticeImportant"
              class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            >
            <label for="noticeImportant" class="ml-2 text-sm text-gray-700">
              <i class="fas fa-exclamation-circle mr-1 text-orange-500"></i>
              중요 공지
            </label>
          </div>
          <div class="flex items-center">
            <input
              type="checkbox"
              id="noticePinned"
              class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            >
            <label for="noticePinned" class="ml-2 text-sm text-gray-700">
              <i class="fas fa-thumbtack mr-1 text-red-500"></i>
              상단 고정
            </label>
          </div>
        </div>

        <!-- 제목 -->
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

        <!-- 연관채널 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            연관채널 (다중 선택 가능)
          </label>
          <div class="flex flex-wrap gap-2" id="channelBadges">
            ${channels.map(ch => `
              <button
                type="button"
                class="channel-badge px-4 py-2 border-2 border-gray-300 bg-gray-50 text-gray-600 rounded-lg text-sm transition hover:border-gray-400"
                data-channel="${ch}"
                onclick="toggleChannel(this)"
              >
                ${ch}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 내용 -->
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
    
    const channels = ['사장님사이트', '테이블오더App', 'OKPOS', 'EasyPOS', '엑스퍼트포스', '유니온'];
    const selectedChannels = notice.channels ? notice.channels.split(',').filter(c => c) : [];

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-edit mr-2 text-blue-600"></i>
            공지사항 수정
          </h2>
        </div>

        <form id="noticeEditForm" class="p-6 space-y-6">
          <!-- 분류 선택 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              분류 <span class="text-red-500">*</span>
            </label>
            <div class="flex space-x-3">
              <label class="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input type="radio" name="category" value="update" class="mr-2" ${notice.category === 'update' ? 'checked' : ''}>
                <span class="text-sm font-medium">업데이트</span>
              </label>
              <label class="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition">
                <input type="radio" name="category" value="info" class="mr-2" ${notice.category === 'info' ? 'checked' : ''}>
                <span class="text-sm font-medium">정보공유</span>
              </label>
              <label class="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition">
                <input type="radio" name="category" value="general" class="mr-2" ${notice.category === 'general' || !notice.category ? 'checked' : ''}>
                <span class="text-sm font-medium">일반</span>
              </label>
            </div>
          </div>

          <!-- 중요 여부 -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <input
                type="checkbox"
                id="noticeImportant"
                ${notice.is_important ? 'checked' : ''}
                class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              >
              <label for="noticeImportant" class="ml-2 text-sm text-gray-700">
                <i class="fas fa-exclamation-circle mr-1 text-orange-500"></i>
                중요 공지
              </label>
            </div>
            <div class="flex items-center">
              <input
                type="checkbox"
                id="noticePinned"
                ${notice.is_pinned ? 'checked' : ''}
                class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              >
              <label for="noticePinned" class="ml-2 text-sm text-gray-700">
                <i class="fas fa-thumbtack mr-1 text-red-500"></i>
                상단 고정
              </label>
            </div>
          </div>

          <!-- 제목 -->
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

          <!-- 연관채널 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              연관채널 (다중 선택 가능)
            </label>
            <div class="flex flex-wrap gap-2" id="channelBadges">
              ${channels.map(ch => {
                const isSelected = selectedChannels.includes(ch);
                return `
                  <button
                    type="button"
                    class="channel-badge px-4 py-2 border-2 ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-300 bg-gray-50 text-gray-600'} rounded-lg text-sm transition hover:border-gray-400"
                    data-channel="${ch}"
                    onclick="toggleChannel(this)"
                  >
                    ${ch}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 내용 -->
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
 * 채널 토글 (선택/해제)
 */
function toggleChannel(button) {
  if (button.classList.contains('border-indigo-600')) {
    // 선택 해제
    button.classList.remove('border-indigo-600', 'bg-indigo-50', 'text-indigo-700', 'font-semibold');
    button.classList.add('border-gray-300', 'bg-gray-50', 'text-gray-600');
  } else {
    // 선택
    button.classList.remove('border-gray-300', 'bg-gray-50', 'text-gray-600');
    button.classList.add('border-indigo-600', 'bg-indigo-50', 'text-indigo-700', 'font-semibold');
  }
}

/**
 * 선택된 채널 가져오기
 */
function getSelectedChannels() {
  const badges = document.querySelectorAll('.channel-badge');
  const selected = [];
  badges.forEach(badge => {
    if (badge.classList.contains('border-indigo-600')) {
      selected.push(badge.getAttribute('data-channel'));
    }
  });
  return selected;
}

/**
 * 공지사항 작성 제출
 */
async function submitNotice() {
  const title = document.getElementById('noticeTitle').value;
  const content = document.getElementById('noticeContent').value;
  const is_pinned = document.getElementById('noticePinned').checked;
  const is_important = document.getElementById('noticeImportant').checked;
  const category = document.querySelector('input[name="category"]:checked').value;
  const channels = getSelectedChannels();

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  try {
    await axios.post('/api/notices', {
      title,
      content,
      is_pinned,
      is_important,
      category,
      channels
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
  const is_important = document.getElementById('noticeImportant').checked;
  const category = document.querySelector('input[name="category"]:checked').value;
  const channels = getSelectedChannels();

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  try {
    await axios.put(`/api/notices/${id}`, {
      title,
      content,
      is_pinned,
      is_important,
      category,
      channels
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
 * 날짜 포맷팅 (한국 시간 기준)
 */
function formatDate(dateString) {
  // UTC 시간을 한국 시간(UTC+9)으로 변환
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
