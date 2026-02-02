/**
 * 설치현황 수정 모달 - 5-Tab 구조
 * 두레이 드라이브 (사업팀 전용) 연동
 */

window.showInstallationForm = async function(id) {
  const isEdit = id !== null && id !== undefined;
  let installation = null;

  if (isEdit) {
    try {
      const response = await axios.get(`/api/installations/${id}`);
      installation = response.data.installation;
    } catch (error) {
      alert('설치 정보를 불러올 수 없습니다.');
      return;
    }
  }

  const statusOptions = [
    { value: 'waiting', text: '설치대기' },
    { value: 'in_progress', text: '설치 중' },
    { value: 'hold', text: '설치보류' },
    { value: 'completed', text: '설치완료' },
    { value: 'cancelled', text: '설치취소' }
  ];

  const modal = `
    <div id="installationFormModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'installationFormModal') window.closeInstallationFormModal()">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
        <!-- 헤더 -->
        <div class="p-6 border-b flex items-center justify-between bg-purple-50">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-tools mr-2 text-purple-600"></i>
            ${isEdit ? '설치 정보 수정' : '설치 등록'}
          </h3>
          <button onclick="window.closeInstallationFormModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="flex border-b bg-gray-50 px-6">
          <button onclick="window.switchInstallationTab(1)" id="instTab1" class="px-6 py-3 font-semibold text-purple-600 border-b-2 border-purple-600">
            기본 정보
          </button>
          <button onclick="window.switchInstallationTab(2)" id="instTab2" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
            금융 정보
          </button>
          <button onclick="window.switchInstallationTab(3)" id="instTab3" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
            H/W 정보
          </button>
          <button onclick="window.switchInstallationTab(4)" id="instTab4" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
            관리 정보
          </button>
          <button onclick="window.switchInstallationTab(5)" id="instTab5" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
            증빙 자료
          </button>
        </div>

        <!-- 탭 콘텐츠 -->
        <div class="flex-1 overflow-y-auto p-6" style="min-height: 400px; max-height: calc(90vh - 250px);">
          <!-- Tab 1: 기본 정보 -->
          <div id="instTabContent1" class="tab-content">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">고객명 <span class="text-red-500">*</span></label>
                <input type="text" id="instCustomerName" value="${installation?.customer_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">전화번호 <span class="text-red-500">*</span></label>
                <input type="tel" id="instPhone" value="${installation?.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">사업자번호</label>
                <input type="text" id="instBusinessNumber" value="${installation?.business_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">대표자</label>
                <input type="text" id="instRepresentative" value="${installation?.representative || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">도로명 주소</label>
                <input type="text" id="instRoadAddress" value="${installation?.road_address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">상세 주소</label>
                <input type="text" id="instDetailAddress" value="${installation?.detail_address || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">지역</label>
                <input type="text" id="instRegion" value="${installation?.region || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select id="instStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  ${statusOptions.map(opt => `<option value="${opt.value}" ${installation?.status === opt.value ? 'selected' : ''}>${opt.text}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Tab 2: 금융 정보 -->
          <div id="instTabContent2" class="tab-content hidden">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">은행명</label>
                <input type="text" id="instBankName" value="${installation?.bank_name || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                <input type="text" id="instAccountNumber" value="${installation?.account_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">예금주</label>
                <input type="text" id="instAccountHolder" value="${installation?.account_holder || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">출금일</label>
                <input type="number" id="instWithdrawalDay" value="${installation?.withdrawal_day || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="1" max="31">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">월 렌탈료</label>
                <input type="number" id="instMonthlyRentalFee" value="${installation?.monthly_rental_fee || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">보증금</label>
                <input type="number" id="instDeposit" value="${installation?.deposit || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">계약일</label>
                <input type="date" id="instContractDate" value="${installation?.contract_date || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">계약번호</label>
                <input type="text" id="instContractNumber" value="${installation?.contract_number || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>
          </div>

          <!-- Tab 3: H/W 정보 -->
          <div id="instTabContent3" class="tab-content hidden">
            <h4 class="font-semibold text-gray-700 mb-3">POS 정보</h4>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">POS 모델</label>
                <input type="text" id="instPosModel" value="${installation?.pos_model || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">POS 제조사</label>
                <input type="text" id="instPosVendor" value="${installation?.pos_vendor || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>

            <h4 class="font-semibold text-gray-700 mb-3">테이블오더 & 거치대</h4>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">테이블오더 수량</label>
                <input type="number" id="instTableOrderQty" value="${installation?.table_order_qty || 0}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="0">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">일반 거치대</label>
                <input type="number" id="instStandStandard" value="${installation?.stand_standard || 0}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="0">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">충전기</label>
                <input type="number" id="instChargerQty" value="${installation?.charger_qty || 0}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="0">
              </div>
            </div>
          </div>

          <!-- Tab 4: 관리 정보 -->
          <div id="instTabContent4" class="tab-content hidden">
            <div class="space-y-4">
              <div>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" id="instCrmService" ${installation?.crm_service ? 'checked' : ''} class="w-4 h-4 text-purple-600">
                  <span class="text-sm font-medium text-gray-700">CRM 서비스 사용</span>
                </label>
              </div>
              <div>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" id="instAiSalesService" ${installation?.ai_sales_service ? 'checked' : ''} class="w-4 h-4 text-purple-600">
                  <span class="text-sm font-medium text-gray-700">AI 매출 분석 서비스 사용</span>
                </label>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <textarea id="instNotes" rows="8" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${installation?.notes || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- Tab 5: 증빙 자료 -->
          <div id="instTabContent5" class="tab-content hidden">
            <div class="space-y-4">
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm text-blue-800">
                  <i class="fas fa-info-circle mr-2"></i>
                  설치 완료 후 증빙 자료를 체크하고 두레이 드라이브 (사업팀 전용) 링크를 입력하세요.
                </p>
              </div>

              <div>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" id="instContractChecked" ${installation?.has_confirmation_doc ? 'checked' : ''} class="w-4 h-4 text-green-600">
                  <span class="text-sm font-medium text-gray-700">
                    <i class="fas fa-file-alt mr-1 text-green-600"></i>
                    계약서 작성 완료
                  </span>
                </label>
              </div>

              <div>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" id="instCertChecked" ${installation?.has_confirmation_doc ? 'checked' : ''} class="w-4 h-4 text-green-600">
                  <span class="text-sm font-medium text-gray-700">
                    <i class="fas fa-file-signature mr-1 text-green-600"></i>
                    설치확인서 확인 완료
                  </span>
                </label>
              </div>

              <div>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" id="instPhotoChecked" ${installation?.has_photos ? 'checked' : ''} class="w-4 h-4 text-green-600">
                  <span class="text-sm font-medium text-gray-700">
                    <i class="fas fa-camera mr-1 text-green-600"></i>
                    설치사진 촬영 완료
                  </span>
                </label>
              </div>

              <div class="pt-4 border-t">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-cloud mr-1 text-blue-600"></i>
                  두레이 드라이브 (사업팀 전용) URL
                </label>
                <input type="url" id="instDriveUrl" value="${installation?.drive_url || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="https://doo.dooray.com/...">
                <p class="text-xs text-gray-500 mt-1">
                  <i class="fas fa-info-circle mr-1"></i>
                  모든 증빙 자료가 업로드된 두레이 드라이브 (사업팀 전용) 폴더 링크를 입력하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="p-6 border-t flex justify-end space-x-3 bg-gray-50">
          <button type="button" onclick="window.closeInstallationFormModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
            취소
          </button>
          <button type="button" onclick="window.saveInstallationData(${id || 'null'})" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
            <i class="fas fa-save mr-2"></i>
            저장
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
};

// 탭 전환 함수
window.switchInstallationTab = function(tabNumber) {
  // 모든 탭 버튼 비활성화
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(`instTab${i}`);
    const content = document.getElementById(`instTabContent${i}`);
    if (btn && content) {
      if (i === tabNumber) {
        btn.className = 'px-6 py-3 font-semibold text-purple-600 border-b-2 border-purple-600';
        content.classList.remove('hidden');
      } else {
        btn.className = 'px-6 py-3 font-semibold text-gray-600 hover:text-purple-600';
        content.classList.add('hidden');
      }
    }
  }
};

// 저장 함수
window.saveInstallationData = async function(id) {
  const data = {
    // Tab 1: 기본
    customer_name: document.getElementById('instCustomerName').value,
    phone: document.getElementById('instPhone').value,
    business_number: document.getElementById('instBusinessNumber').value || null,
    representative: document.getElementById('instRepresentative').value || null,
    road_address: document.getElementById('instRoadAddress').value || null,
    detail_address: document.getElementById('instDetailAddress').value || null,
    region: document.getElementById('instRegion').value || null,
    status: document.getElementById('instStatus').value,
    
    // Tab 2: 금융
    bank_name: document.getElementById('instBankName').value || null,
    account_number: document.getElementById('instAccountNumber').value || null,
    account_holder: document.getElementById('instAccountHolder').value || null,
    withdrawal_day: parseInt(document.getElementById('instWithdrawalDay').value) || null,
    monthly_rental_fee: parseInt(document.getElementById('instMonthlyRentalFee').value) || null,
    deposit: parseInt(document.getElementById('instDeposit').value) || null,
    contract_date: document.getElementById('instContractDate').value || null,
    contract_number: document.getElementById('instContractNumber').value || null,
    
    // Tab 3: H/W
    pos_model: document.getElementById('instPosModel').value || null,
    pos_vendor: document.getElementById('instPosVendor').value || null,
    table_order_qty: parseInt(document.getElementById('instTableOrderQty').value) || 0,
    stand_standard: parseInt(document.getElementById('instStandStandard').value) || 0,
    charger_qty: parseInt(document.getElementById('instChargerQty').value) || 0,
    
    // Tab 4: 관리
    crm_service: document.getElementById('instCrmService').checked ? 1 : 0,
    ai_sales_service: document.getElementById('instAiSalesService').checked ? 1 : 0,
    notes: document.getElementById('instNotes').value || null,
    
    // Tab 5: 증빙
    has_confirmation_doc: document.getElementById('instContractChecked').checked ? 1 : 0,
    has_photos: document.getElementById('instPhotoChecked').checked ? 1 : 0,
    drive_url: document.getElementById('instDriveUrl').value || null
  };

  try {
    if (id && id !== 'null') {
      await axios.put(`/api/installations/${id}`, data);
      alert('저장완료');
    } else {
      await axios.post('/api/installations', data);
      alert('저장완료');
    }
    
    window.closeInstallationFormModal();
    location.reload();
  } catch (error) {
    console.error('Save error:', error);
    alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.');
  }
};

// 모달 닫기
window.closeInstallationFormModal = function() {
  const modal = document.getElementById('installationFormModal');
  if (modal) modal.remove();
};
