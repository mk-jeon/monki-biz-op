// 로그인 폼 처리
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const loginButton = document.getElementById('loginButton');
  const loginButtonText = document.getElementById('loginButtonText');

  // 에러 메시지 숨기기
  errorMessage.classList.add('hidden');

  // 버튼 비활성화 및 로딩 표시
  loginButton.disabled = true;
  loginButtonText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...';

  try {
    const response = await axios.post('/api/auth/login', {
      username,
      password
    });

    if (response.data.success) {
      // 로그인 성공 - 페이지 새로고침
      window.location.href = '/';
    }
  } catch (error) {
    // 에러 처리
    if (error.response) {
      errorText.textContent = error.response.data.error || '로그인에 실패했습니다.';
    } else {
      errorText.textContent = '서버와 통신할 수 없습니다.';
    }
    errorMessage.classList.remove('hidden');

    // 버튼 활성화
    loginButton.disabled = false;
    loginButtonText.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인';
  }
});

// Enter 키로 로그인
document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
  }
});
