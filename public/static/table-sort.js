/**
 * 테이블 정렬 유틸리티
 */

// 정렬 상태 저장
const sortStates = {
  consultation: { field: null, order: 0 },
  contract: { field: null, order: 0 },
  installation: { field: null, order: 0 }
};

// 상태 우선순위 (낮을수록 위로)
const statusPriority = {
  'waiting': 1,
  'in_progress': 2,
  'signature_pending': 2,
  'hold': 3,
  'completed': 4,
  'cancelled': 5
};

/**
 * 데이터 정렬 함수
 */
function sortData(data, field, order, type = 'consultation') {
  if (order === 0) {
    // 기본 정렬: 상태 우선순위 + created_at 내림차순
    return data.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 상태면 최신순
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }
  
  return data.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    // null/undefined 처리
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // 숫자 필드
    if (field === 'id') {
      valueA = parseInt(valueA) || 0;
      valueB = parseInt(valueB) || 0;
    }
    
    // 날짜 필드
    if (field === 'created_at' || field === 'updated_at') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }
    
    // 비교
    if (valueA < valueB) return order === 1 ? -1 : 1;
    if (valueA > valueB) return order === 1 ? 1 : -1;
    return 0;
  });
}

/**
 * 정렬 아이콘 HTML 생성
 */
function getSortIcon(field, currentField, currentOrder) {
  if (field !== currentField || currentOrder === 0) {
    return '<i class="fas fa-sort text-gray-400 ml-1"></i>';
  }
  if (currentOrder === 1) {
    return '<i class="fas fa-sort-up text-blue-600 ml-1"></i>';
  }
  return '<i class="fas fa-sort-down text-blue-600 ml-1"></i>';
}

/**
 * 테이블 헤더 생성 (정렬 가능)
 */
function createSortableHeader(label, field, type) {
  const state = sortStates[type];
  const icon = getSortIcon(field, state.field, state.order);
  return `
    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
        onclick="handleSort_${type}('${field}')">
      <div class="flex items-center">
        ${label}
        ${icon}
      </div>
    </th>
  `;
}

/**
 * 정렬 처리 함수
 */
function handleSort(field, type, reloadFunction) {
  const state = sortStates[type];
  
  if (state.field === field) {
    // 같은 필드 클릭: 순환 (0 → 1 → 2 → 0)
    state.order = (state.order + 1) % 3;
  } else {
    // 다른 필드 클릭: 오름차순으로 시작
    state.field = field;
    state.order = 1;
  }
  
  // 리스트 리로드
  reloadFunction();
}

// window 객체에 바인딩
window.sortData = sortData;
window.getSortIcon = getSortIcon;
window.createSortableHeader = createSortableHeader;
window.handleSort = handleSort;
window.sortStates = sortStates;
