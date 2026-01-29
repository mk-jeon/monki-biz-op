// 사용자 관리 모듈 - IIFE로 스코프 격리
(function() {
  'use strict';
  
  console.log('🔵 user-management.js 모듈 로드 시작');

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

let currentUserPage = 1;

/**
 * 사용자 정렬 처리 함수
 */
function handleSort_user(field) {
  window.handleSort(field, 'user', () => loadUserList(currentUserPage));
}

/**
 * 사용자 관리 페이지 로드
 */
async function loadUserManagementPage() {
  console.log('✅ loadUserManagementPage 호출됨');
  loadUserList();
}

/**
 * 사용자 목록 조회
 */
async function loadUserList(page = 1) {
  console.log(`✅ loadUserList 실행 (page=${page})`);
  try {
    const response = await axios.get(`/api/users?page=${page}&limit=50`);
    let { data: users, pagination } = response.data;
    
    // 정렬 적용
    if (window.sortStates && window.sortStates.user) {
      const sortState = window.sortStates.user;
      users = window.sortData(users, sortState.field, sortState.order, 'user');
    }

    const roleMap = {
      'master': { text: '마스터', color: 'bg-gradient-to-r from-yellow-400 to-orange-500', icon: 'fa-crown' },
      'admin': { text: '관리자', color: 'bg-blue-600', icon: 'fa-user-shield' },
      'user': { text: '사용자', color: 'bg-gray-600', icon: 'fa-user' }
    };

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
      console.error('mainContent 요소를 찾을 수 없습니다.');
      return;
    }

    const content = `
      <div class="bg-white rounded-lg shadow-md">
        <!-- 헤더 -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-users mr-2 text-blue-600"></i>
              사용자 관리
            </h2>
            <div class="flex space-x-2">
              <button onclick="showAddUserModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center">
                <i class="fas fa-user-plus mr-2"></i>
                신규 사용자 추가
              </button>
            </div>
          </div>
        </div>

        <!-- 테이블 -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th onclick="handleSort_user('id')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  ID <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('username')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  아이디 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('name')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  이름 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('nickname')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  닉네임 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('department')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  부서 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('position')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  직책 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('role')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  권한 <i class="fas fa-sort ml-1"></i>
                </th>
                <th onclick="handleSort_user('created_at')" class="sortable-header px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  가입일 <i class="fas fa-sort ml-1"></i>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${users.length === 0 ? `
                <tr>
                  <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-users-slash text-4xl mb-3"></i>
                    <p>등록된 사용자가 없습니다.</p>
                  </td>
                </tr>
              ` : users.map(user => {
                const role = roleMap[user.role] || roleMap['user'];
                return `
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #${user.id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      ${user.username}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${user.name || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${user.nickname || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${user.department || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${user.position || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="${role.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit">
                        <i class="fas ${role.icon} mr-1"></i>
                        ${role.text}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${formatDate(user.created_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-800 mr-3" title="수정">
                        <i class="fas fa-edit"></i>
                      </button>
                      ${user.role !== 'master' ? `
                        <button onclick="deleteUser(${user.id}, '${user.username}')" class="text-red-600 hover:text-red-800" title="삭제">
                          <i class="fas fa-trash"></i>
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 페이징 -->
        ${pagination.totalPages > 1 ? `
          <div class="p-4 border-t border-gray-200 flex justify-center items-center space-x-2">
            <button 
              ${pagination.page === 1 ? 'disabled' : ''} 
              onclick="loadUserList(${pagination.page - 1})"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
              이전
            </button>
            <span class="text-gray-700">
              ${pagination.page} / ${pagination.totalPages}
            </span>
            <button 
              ${pagination.page === pagination.totalPages ? 'disabled' : ''} 
              onclick="loadUserList(${pagination.page + 1})"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
              다음
            </button>
          </div>
        ` : ''}
      </div>
    `;

    mainContent.innerHTML = content;
    currentUserPage = page;

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-8 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <h3 class="text-xl font-bold text-gray-800 mb-2">사용자 목록을 불러올 수 없습니다</h3>
          <p class="text-gray-600 mb-4">${error.response?.data?.error || error.message}</p>
          <button onclick="loadUserList()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
            다시 시도
          </button>
        </div>
      `;
    }
  }
}

/**
 * 신규 사용자 추가 모달
 */
function showAddUserModal() {
  const modalHTML = `
    <div id="addUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6 text-gray-800">
          <i class="fas fa-user-plus mr-2 text-blue-600"></i>
          신규 사용자 추가
        </h3>
        
        <form id="addUserForm" class="space-y-4">
          <!-- 아이디 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-id-card mr-1"></i>
              아이디 <span class="text-red-500">*</span>
            </label>
            <input type="text" id="newUsername" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="사용자 아이디">
          </div>

          <!-- 비밀번호 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-lock mr-1"></i>
              비밀번호 <span class="text-red-500">*</span>
            </label>
            <input type="password" id="newPassword" required autocomplete="new-password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="비밀번호 (8자 이상)">
          </div>

          <!-- 비밀번호 확인 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-lock mr-1"></i>
              비밀번호 확인 <span class="text-red-500">*</span>
            </label>
            <input type="password" id="newPasswordConfirm" required autocomplete="new-password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="비밀번호 확인">
          </div>

          <!-- 이름 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-user mr-1"></i>
              이름 <span class="text-red-500">*</span>
            </label>
            <input type="text" id="newName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="홍길동">
          </div>

          <!-- 닉네임 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-id-badge mr-1"></i>
              닉네임 (영문)
            </label>
            <input type="text" id="newNickname" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="honggildong">
          </div>

          <!-- 연락처 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-phone mr-1"></i>
              연락처
            </label>
            <input type="tel" id="newPhone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="010-1234-5678">
          </div>

          <!-- 부서 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-building mr-1"></i>
              부서명
            </label>
            <input type="text" id="newDepartment" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="영업팀">
          </div>

          <!-- 직책 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-briefcase mr-1"></i>
              직책
            </label>
            <input type="text" id="newPosition" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="팀장">
          </div>

          <!-- 권한 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-shield-alt mr-1"></i>
              권한 <span class="text-red-500">*</span>
            </label>
            <select id="newRole" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="user">사용자</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="closeAddUserModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
              취소
            </button>
            <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              <i class="fas fa-check mr-2"></i>
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('newPassword').value;
    const passwordConfirm = document.getElementById('newPasswordConfirm').value;

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    const data = {
      username: document.getElementById('newUsername').value.trim(),
      password: password,
      name: document.getElementById('newName').value.trim(),
      nickname: document.getElementById('newNickname').value.trim(),
      phone: document.getElementById('newPhone').value.trim(),
      department: document.getElementById('newDepartment').value.trim(),
      position: document.getElementById('newPosition').value.trim(),
      role: document.getElementById('newRole').value
    };

    try {
      await axios.post('/api/users', data);
      closeAddUserModal();
      alert('사용자가 추가되었습니다.');
      loadUserList();
    } catch (error) {
      console.error('사용자 추가 오류:', error);
      alert(error.response?.data?.error || '사용자 추가 중 오류가 발생했습니다.');
    }
  });
}

function closeAddUserModal() {
  const modal = document.getElementById('addUserModal');
  if (modal) modal.remove();
}

/**
 * 사용자 수정
 */
async function editUser(id) {
  try {
    const response = await axios.get(`/api/users/${id}`);
    const user = response.data.data;

    const modalHTML = `
      <div id="editUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-2xl font-bold mb-6 text-gray-800">
            <i class="fas fa-user-edit mr-2 text-blue-600"></i>
            사용자 수정
          </h3>
          
          <form id="editUserForm" class="space-y-4">
            <!-- 아이디 (읽기 전용) -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-id-card mr-1"></i>
                아이디
              </label>
              <input type="text" value="${user.username}" readonly class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" disabled>
            </div>

            <!-- 이름 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-user mr-1"></i>
                이름 <span class="text-red-500">*</span>
              </label>
              <input type="text" id="editName" value="${user.name || ''}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 닉네임 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-id-badge mr-1"></i>
                닉네임 (영문)
              </label>
              <input type="text" id="editNickname" value="${user.nickname || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 연락처 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-phone mr-1"></i>
                연락처
              </label>
              <input type="tel" id="editPhone" value="${user.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 부서 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-building mr-1"></i>
                부서명
              </label>
              <input type="text" id="editDepartment" value="${user.department || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 직책 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-briefcase mr-1"></i>
                직책
              </label>
              <input type="text" id="editPosition" value="${user.position || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 권한 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-shield-alt mr-1"></i>
                권한 <span class="text-red-500">*</span>
              </label>
              <select id="editRole" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${user.role === 'master' ? 'disabled' : ''}>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>사용자</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                ${user.role === 'master' ? '<option value="master" selected>마스터</option>' : ''}
              </select>
            </div>

            <!-- 비밀번호 변경 (선택사항) -->
            <div class="border-t pt-4 mt-4">
              <h4 class="font-semibold text-gray-800 mb-4">비밀번호 변경 (선택사항)</h4>
              
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-lock mr-1"></i>
                    새 비밀번호
                  </label>
                  <input type="password" id="editNewPassword" autocomplete="new-password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="변경하지 않으려면 비워두세요">
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-lock mr-1"></i>
                    새 비밀번호 확인
                  </label>
                  <input type="password" id="editNewPasswordConfirm" autocomplete="new-password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="비밀번호 확인">
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onclick="closeEditUserModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
                취소
              </button>
              <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                <i class="fas fa-check mr-2"></i>
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newPassword = document.getElementById('editNewPassword').value;
      const newPasswordConfirm = document.getElementById('editNewPasswordConfirm').value;

      if (newPassword && newPassword !== newPasswordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }

      if (newPassword && newPassword.length < 8) {
        alert('비밀번호는 8자 이상이어야 합니다.');
        return;
      }

      const data = {
        name: document.getElementById('editName').value.trim(),
        nickname: document.getElementById('editNickname').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        department: document.getElementById('editDepartment').value.trim(),
        position: document.getElementById('editPosition').value.trim(),
        role: document.getElementById('editRole').value
      };

      if (newPassword) {
        data.newPassword = newPassword;
      }

      try {
        await axios.put(`/api/users/${id}`, data);
        closeEditUserModal();
        alert('사용자 정보가 수정되었습니다.');
        loadUserList(currentUserPage);
      } catch (error) {
        console.error('사용자 수정 오류:', error);
        alert(error.response?.data?.error || '사용자 수정 중 오류가 발생했습니다.');
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    alert('사용자 정보를 불러올 수 없습니다.');
  }
}

function closeEditUserModal() {
  const modal = document.getElementById('editUserModal');
  if (modal) modal.remove();
}

/**
 * 사용자 삭제
 */
async function deleteUser(id, username) {
  if (!confirm(`정말 사용자 "${username}"를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
    return;
  }

  try {
    await axios.delete(`/api/users/${id}`);
    alert('사용자가 삭제되었습니다.');
    loadUserList(currentUserPage);
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    alert(error.response?.data?.error || '사용자 삭제 중 오류가 발생했습니다.');
  }
}

// 전역 함수 노출
window.loadUserManagementPage = loadUserManagementPage;
window.showAddUserModal = showAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.editUser = editUser;
window.closeEditUserModal = closeEditUserModal;
window.deleteUser = deleteUser;

console.log('✅ user-management.js 모듈 로드 완료');

})();
