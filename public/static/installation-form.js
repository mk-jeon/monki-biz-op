/**
 * 설치현황 저장 함수
 */
window.saveInstallation = async function() {
  const form = document.getElementById('installationForm');
  if (!form) {
    console.error('Form not found');
    return;
  }

  const formData = new FormData(form);
  const data = {
    customer_name: formData.get('customer_name'),
    phone: formData.get('phone'),
    inflow_source: formData.get('inflow_source'),
    status: formData.get('status'),
    notes: formData.get('notes'),
    
    // 체크박스
    contract_completed: formData.get('contract_completed') === 'on',
    has_confirmation_doc: formData.get('has_confirmation_doc') === 'on',
    has_photos: formData.get('has_photos') === 'on',
    has_drive_upload: formData.get('has_drive_upload') === 'on',
  };
  
  // 재방문 데이터 (1~5차)
  const suffixes = ['1st', '2nd', '3rd', '4th', '5th'];
  for (let i = 0; i < 5; i++) {
    const suffix = suffixes[i];
    const isNeeded = formData.get(`revisit_${suffix}`) === 'on';
    
    data[`revisit_${suffix}`] = isNeeded;
    
    if (isNeeded) {
      const isPaid = parseInt(formData.get(`revisit_${suffix}_paid`) || '0');
      data[`revisit_${suffix}_paid`] = isPaid;
      
      if (isPaid) {
        const cost = parseInt(formData.get(`revisit_${suffix}_cost`) || '0');
        const paymentStatus = formData.get(`revisit_${suffix}_payment_status`) || 'pending';
        const paymentNote = formData.get(`revisit_${suffix}_payment_note`) || '';
        
        data[`revisit_${suffix}_cost`] = cost;
        data[`revisit_${suffix}_payment_status`] = paymentStatus;
        data[`revisit_${suffix}_payment_note`] = paymentNote;
        
        // 입금거부 시 비고 필수 검증 (2글자 이상)
        if (paymentStatus === 'rejected' && paymentNote.trim().length < 2) {
          alert(`${i + 1}차 재방문: 입금거부 시 비고를 2글자 이상 입력해야 합니다.`);
          return;
        }
      } else {
        data[`revisit_${suffix}_cost`] = 0;
        data[`revisit_${suffix}_payment_status`] = 'pending';
        data[`revisit_${suffix}_payment_note`] = '';
      }
    } else {
      data[`revisit_${suffix}_paid`] = 0;
      data[`revisit_${suffix}_cost`] = 0;
      data[`revisit_${suffix}_payment_status`] = 'pending';
      data[`revisit_${suffix}_payment_note`] = '';
    }
  }

  const installationId = form.dataset.installationId;
  const isEdit = installationId && installationId !== 'null' && installationId !== 'undefined';

  try {
    if (isEdit) {
      await axios.put(`/api/installations/${installationId}`, data);
      alert('저장완료');
    } else {
      await axios.post('/api/installations', data);
      alert('저장완료');
    }
    
    closeInstallationFormModal();
    location.reload();
  } catch (error) {
    console.error('Save installation error:', error);
    alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.');
  }
};
