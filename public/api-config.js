// Dynamic API Configuration
(function() {
  // Configure API Base URL - ALWAYS use relative path for Azure deployment
  window.API_BASE_URL = '/api';
  
  console.log('API Base URL configured:', window.API_BASE_URL);
  
  // If axios is already loaded, configure it immediately
  if (window.axios) {
    window.axios.defaults.baseURL = window.API_BASE_URL;
    console.log('Axios configured with base URL:', window.API_BASE_URL);
  }
  
  // Override axios defaults when it loads if not already loaded
  const originalAxios = window.axios;
  Object.defineProperty(window, 'axios', {
    configurable: true,
    get: function() {
      return originalAxios;
    },
    set: function(newAxios) {
      if (newAxios && newAxios.defaults) {
        newAxios.defaults.baseURL = window.API_BASE_URL;
        console.log('Axios instance configured with base URL:', window.API_BASE_URL);
      }
      originalAxios = newAxios;
    }
  });
})(); 