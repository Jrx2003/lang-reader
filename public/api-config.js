// 动态API配置
(function() {
  // 检测当前环境
  const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  // 配置API基础URL
  if (isLocalhost) {
    // 本地环境，使用端口
    window.API_BASE_URL = window.location.protocol + '//' + window.location.hostname + ':3000/api';
  } else {
    // 生产环境或Codespaces，使用相对路径
    window.API_BASE_URL = '/api';
  }
  
  console.log('API Base URL configured:', window.API_BASE_URL);
  
  // 如果页面已加载Axios，立即配置
  if (window.axios) {
    window.axios.defaults.baseURL = window.API_BASE_URL;
    console.log('Axios configured with base URL:', window.API_BASE_URL);
  }
})(); 