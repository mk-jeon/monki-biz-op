/**
 * 항목 관리 페이지 (마스터/관리자만)
 */

(function() {
  'use strict';

  let currentPage = 'consultation';
  let currentCategories = [];
  let currentValues = {};

  // DOM 요소 대기 헬퍼 함수 (Retry 로직 포함)
  function waitForElement(selector, maxRetries = 10, interval = 300) {
    return new Promise((resolve, reject) => {
      let retries = 0;
      
      const checkElement = () => {
        const element = document.getElementById(selector);
        
        if (element) {
          console.log(`✅ [item-management.js] 요소 발견: #${selector} (시도 ${retries + 1}/${maxRetries})`);
          resolve(element);
        } else if (retries >= maxRetries) {
          console.error(`❌ [item-management.js] 요소를 찾을 수 없음: #${selector} (최대 ${maxRetries}회 시도)`);
          reject(new Error(`요소를 찾을 수 없습니다: #${selector}`));
        } else {
          retries++;
          console.log(`⏳ [item-management.js] 요소 대기 중: #${selector} (시도 ${retries}/${maxRetries})`);
          setTimeout(checkElement, interval);
        }
      };
      
      checkElement();
    });
  }

  // 페이지 로드
  async function loadItemManagement() {
    console.log('📋 항목 관리 페이지 로드 시작');

    // mainContent 요소를 찾을 때까지 최대 10회 재시도 (총 3초)
    let mainContent;
    try {
      mainContent = await waitForElement('mainContent', 10, 300);
    } catch (error) {
      console.error('❌ mainContent 요소를 찾을 수 없습니다:', error);
      alert('페이지를 로드할 수 없습니다. 새로고침해주세요.');
      return;
    }

    console.log('✅ mainContent 요소 확인 완료');

    mainContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">항목 관리</h2>
        
        <!-- 탭 -->
        <div id="tabs-container" class="flex border-b border-gray-200 mb-6"></div>
        
        <!-- 카테고리 컨테이너 -->
        <div id="categories-container"></div>
      </div>

      <!-- 모달 -->
      <div id="item-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 id="modal-title" class="text-xl font-bold text-gray-900 mb-4"></h3>
          
          <div class="space-y-4">
            <div id="category-select-container"></div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">값 (영문)</label>
              <input type="text" id="item-value" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">표시명 (한글)</label>
              <input type="text" id="item-label" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">정렬순서</label>
              <input type="number" id="item-sort" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="0">
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-6">
            <button onclick="window.itemManagement.closeModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              취소
            </button>
            <button id="modal-save-btn" class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              저장
            </button>
          </div>
        </div>
      </div>
    `;

    console.log('✅ HTML 구조 생성 완료');

    // 모든 카테고리 조회
    try {
      const response = await axios.get('/api/items/categories');
      currentCategories = response.data.categories;

      // 탭 렌더링
      renderTabs();

      // 첫 번째 탭 로드
      await loadPage(currentPage);
      
      console.log('✅ 항목 관리 페이지 로드 완료');
    } catch (error) {
      console.error('카테고리 조회 오류:', error);
      alert('카테고리 조회에 실패했습니다.');
    }
  }

  // 탭 렌더링
  function renderTabs() {
    const pages = [
      { key: 'consultation', label: '상담현황' },
      { key: 'contract', label: '계약현황' },
      { key: 'installation', label: '설치현황' },
      { key: 'common', label: '공통' }
    ];

    const tabsHTML = pages.map(page => `
      <button 
        class="px-6 py-3 font-medium text-sm transition-colors ${
          currentPage === page.key 
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }"
        onclick="window.itemManagement.loadPage('${page.key}')">
        ${page.label}
      </button>
    `).join('');

    document.getElementById('tabs-container').innerHTML = tabsHTML;
  }

  // 페이지별 카테고리 로드
  async function loadPage(page) {
    currentPage = page;
    renderTabs();

    const pageCategories = currentCategories.filter(cat => cat.page === page);

    // 각 카테고리의 항목 조회
    const promises = pageCategories.map(async (category) => {
      const response = await axios.get(`/api/items/categories/${category.id}/values`);
      currentValues[category.id] = response.data.values;
    });

    await Promise.all(promises);

    // 카테고리 리스트 렌더링
    renderCategories(pageCategories);
  }

  // 카테고리 리스트 렌더링
  function renderCategories(categories) {
    const html = categories.map(category => `
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">${category.label}</h3>
            <p class="text-sm text-gray-500 mt-1">${category.description || ''}</p>
          </div>
          <button 
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            onclick="window.itemManagement.showAddModal(${category.id}, '${category.label}')">
            <i class="fas fa-plus mr-2"></i>추가
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">값 (코드)</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">표시명</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정렬순서</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활성화</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${renderValues(category.id)}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');

    document.getElementById('categories-container').innerHTML = html || '<p class="text-gray-500 text-center py-8">항목이 없습니다.</p>';
  }

  // 항목 리스트 렌더링 (테이블 형식)
  function renderValues(categoryId) {
    const values = currentValues[categoryId] || [];

    if (values.length === 0) {
      return '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">등록된 항목이 없습니다.</td></tr>';
    }

    return values.map((value, index) => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${index + 1}</td>
        <td class="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">${value.value}</td>
        <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${value.label}</td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">${value.sort_order}</td>
        <td class="px-4 py-4 whitespace-nowrap">
          ${value.is_active 
            ? '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">활성</span>' 
            : '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">비활성</span>'}
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(value.created_at)}</td>
        <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
          <button 
            class="text-blue-600 hover:text-blue-900 mr-3 transition"
            onclick="window.itemManagement.showEditModal(${categoryId}, ${value.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button 
            class="text-red-600 hover:text-red-900 transition"
            onclick="window.itemManagement.deleteValue(${categoryId}, ${value.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 날짜 포맷
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }

  // 추가 모달 표시 (코드 자동 생성)
  function showAddModal(categoryId, categoryLabel) {
    const modal = document.createElement('div');
    modal.id = 'item-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-gray-900 mb-4">항목 추가 - ${categoryLabel}</h3>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-blue-600 mt-1 mr-2"></i>
            <p class="text-sm text-blue-800">
              <strong>자동 코드 생성:</strong> 한글명만 입력하면 영문 코드가 자동으로 생성됩니다.
            </p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              표시명 (한글) <span class="text-red-500">*</span>
            </label>
            <input type="text" id="item-label" 
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="예: 매장 방문"
                   autofocus>
            <p class="mt-1 text-xs text-gray-500">
              드롭다운에 표시될 한글명을 입력하세요.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
            <input type="number" id="item-sort" 
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   value="0">
            <p class="mt-1 text-xs text-gray-500">
              숫자가 작을수록 먼저 표시됩니다. (기본값: 0)
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button 
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            onclick="window.itemManagement.closeModal()">
            취소
          </button>
          <button 
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            onclick="window.itemManagement.saveNewValue(${categoryId})">
            <i class="fas fa-plus mr-2"></i>추가
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 수정 모달 표시 (코드는 읽기 전용)
  function showEditModal(categoryId, valueId) {
    const values = currentValues[categoryId];
    const value = values.find(v => v.id === valueId);
    
    if (!value) return;

    const modal = document.createElement('div');
    modal.id = 'item-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-gray-900 mb-4">항목 수정</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              값 (영문코드) <span class="text-xs text-gray-500">읽기 전용</span>
            </label>
            <input type="text" id="item-value" 
                   class="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                   value="${value.value}"
                   readonly>
            <p class="mt-1 text-xs text-gray-500">
              자동 생성된 코드는 수정할 수 없습니다.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              표시명 (한글) <span class="text-red-500">*</span>
            </label>
            <input type="text" id="item-label" 
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   value="${value.label}"
                   autofocus>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
            <input type="number" id="item-sort" 
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   value="${value.sort_order}">
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button 
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            onclick="window.itemManagement.closeModal()">
            취소
          </button>
          <button 
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            onclick="window.itemManagement.saveEditValue(${categoryId}, ${valueId})">
            <i class="fas fa-save mr-2"></i>저장
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 모달 닫기
  function closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) modal.remove();
  }

  // 새 항목 저장 (코드 자동 생성)
  async function saveNewValue(categoryId) {
    const label = document.getElementById('item-label').value.trim();
    const sort_order = parseInt(document.getElementById('item-sort').value) || 0;

    if (!label) {
      alert('표시명을 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('/api/items/values', {
        category_id: categoryId,
        label,
        sort_order
      });

      // 서버가 자동 생성한 코드 표시
      const generatedCode = response.data.value;
      alert(`항목이 추가되었습니다.\n자동 생성된 코드: ${generatedCode}`);
      
      closeModal();
      await loadPage(currentPage);
    } catch (error) {
      console.error('항목 추가 오류:', error);
      alert(error.response?.data?.error || '항목 추가에 실패했습니다.');
    }
  }

  // 항목 수정 저장 (코드는 수정 불가)
  async function saveEditValue(categoryId, valueId) {
    const label = document.getElementById('item-label').value.trim();
    const sort_order = parseInt(document.getElementById('item-sort').value) || 0;

    if (!label) {
      alert('표시명을 입력해주세요.');
      return;
    }

    try {
      // 코드(value)는 서버에 전송하지 않음 (읽기 전용)
      await axios.put(`/api/items/values/${valueId}`, {
        label,
        sort_order
      });

      alert('항목이 수정되었습니다.');
      closeModal();
      await loadPage(currentPage);
    } catch (error) {
      console.error('항목 수정 오류:', error);
      alert(error.response?.data?.error || '항목 수정에 실패했습니다.');
    }
  }

  // 항목 삭제 (soft delete)
  async function deleteValue(categoryId, valueId) {
    if (!confirm('이 항목을 삭제하시겠습니까?\n(삭제 시 드롭다운에서 숨겨지며, 기존 데이터는 유지됩니다)')) return;

    try {
      await axios.delete(`/api/items/values/${valueId}`);

      alert('항목이 삭제되었습니다.');
      await loadPage(currentPage);
    } catch (error) {
      console.error('항목 삭제 오류:', error);
      alert(error.response?.data?.error || '항목 삭제에 실패했습니다.');
    }
  }

  // window 객체에 바인딩
  window.itemManagement = {
    loadItemManagement,
    loadPage,
    showAddModal,
    showEditModal,
    closeModal,
    saveNewValue,
    saveEditValue,
    deleteValue
  };

  console.log('✅ 항목 관리 모듈 로드 완료');
})();
