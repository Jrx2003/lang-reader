// ��̬API����
(function() {
  // ��⵱ǰ����
  const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  // ����API����URL
  if (isLocalhost) {
    // ���ػ�����ʹ�ö˿�
    window.API_BASE_URL = window.location.protocol + '//' + window.location.hostname + ':3000/api';
  } else {
    // ����������Codespaces��ʹ�����·��
    window.API_BASE_URL = '/api';
  }
  
  console.log('API Base URL configured:', window.API_BASE_URL);
  
  // ���ҳ���Ѽ���Axios����������
  if (window.axios) {
    window.axios.defaults.baseURL = window.API_BASE_URL;
    console.log('Axios configured with base URL:', window.API_BASE_URL);
  }
})(); 