// Dynamic API Configuration
(function() {
  // Configure API Base URL - Use absolute URL for Azure deployment
  const isProduction = window.location.hostname !== 'localhost';
  window.API_BASE_URL = isProduction 
    ? `${window.location.origin}/api` 
    : '/api';
  
  console.log('API Base URL configured:', window.API_BASE_URL);
  
  // Override axios instance configuration if it exists
  if (window.axios && window.axios.defaults) {
    console.log('Directly modifying axios defaults');
    window.axios.defaults.baseURL = window.API_BASE_URL;
  }
  
  // Special handling for Vue instances that might load axios later
  // Monitor window.axios property to catch when it's set by framework
  let originalAxios = window.axios;
  Object.defineProperty(window, 'axios', {
    configurable: true,
    get: function() {
      return originalAxios;
    },
    set: function(newAxios) {
      console.log('Axios instance detected and configured');
      if (newAxios && newAxios.defaults) {
        newAxios.defaults.baseURL = window.API_BASE_URL;
      }
      originalAxios = newAxios;
    }
  });
  
  console.log('API configuration complete - URL will be:', window.API_BASE_URL);
})(); 