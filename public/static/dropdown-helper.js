// 드롭다운 헬퍼 함수

/**
 * 항목 관리 API에서 드롭다운 옵션 로드
 * @param {string} categoryName - 카테고리 이름 (예: 'inflow_source')
 * @returns {Promise<Array>} 항목 목록
 */
async function loadDropdownItems(categoryName) {
  try {
    const response = await axios.get(`/api/items/values/${categoryName}`);
    return response.data.values || [];
  } catch (error) {
    console.error(`Failed to load ${categoryName}:`, error);
    return [];
  }
}

/**
 * 드롭다운 HTML 생성 (항목 관리 버튼 포함)
 * @param {string} id - select element ID
 * @param {string} categoryName - 카테고리 이름
 * @param {Array} items - 항목 목록
 * @param {string} selectedValue - 선택된 값 (옵션)
 * @param {boolean} showManageButton - 항목 관리 버튼 표시 여부 (기본: true)
 * @returns {string} HTML
 */
function createDropdownHTML(id, categoryName, items, selectedValue = '', showManageButton = true) {
  const currentUser = window.currentUser;
  const isMaster = currentUser && currentUser.role === 'master';
  
  const options = items.map(item => `
    <option value="${item.value}" ${selectedValue === item.value ? 'selected' : ''}>
      ${item.label}
    </option>
  `).join('');
  
  const manageButton = (showManageButton && isMaster) ? `
    <button 
      type="button"
      onclick="event.preventDefault(); navigateToItemManagement('${categoryName}')"
      class="mt-2 w-full text-center text-sm text-gray-600 hover:text-indigo-600 transition flex items-center justify-center"
    >
      <i class="fas fa-cog mr-1"></i>
      항목 관리
    </button>
  ` : '';
  
  return `
    <select
      id="${id}"
      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    >
      <option value="">선택하세요</option>
      ${options}
    </select>
    ${manageButton}
  `;
}

/**
 * 항목 관리 페이지로 이동
 * @param {string} categoryName - 카테고리 이름 (옵션)
 */
function navigateToItemManagement(categoryName = null) {
  window.loadPage('item-management');
  
  // 카테고리 탭이 지정되면 해당 탭으로 전환
  if (categoryName) {
    setTimeout(() => {
      const categoryMap = {
        'inflow_source': 'consultation',
        'consultation_purpose': 'consultation',
        'consultation_channel': 'consultation',
        'contract_type': 'contract',
        'installation_type': 'installation',
        'department': 'common',
        'position': 'common'
      };
      
      const page = categoryMap[categoryName] || 'consultation';
      const tabElement = document.querySelector(`[data-page="${page}"]`);
      if (tabElement) {
        tabElement.click();
      }
    }, 100);
  }
}

/**
 * 모든 카테고리의 항목 미리 로드 (캐시)
 */
let itemCache = {};

async function preloadAllItems() {
  const categories = [
    'inflow_source',
    'consultation_purpose', 
    'consultation_channel',
    'contract_type',
    'installation_type',
    'department',
    'position'
  ];
  
  const promises = categories.map(async (category) => {
    const items = await loadDropdownItems(category);
    itemCache[category] = items;
  });
  
  await Promise.all(promises);
}

/**
 * 캐시에서 항목 가져오기
 * @param {string} categoryName - 카테고리 이름
 * @returns {Array} 항목 목록
 */
function getItemsFromCache(categoryName) {
  return itemCache[categoryName] || [];
}
