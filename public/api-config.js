// Hardcoded API Configuration for Azure deployment
(function() {
  // HARDCODED AZURE API URL
  window.API_BASE_URL = 'https://lang-reader-gxdpf7dff2bbbufb.canadacentral-01.azurewebsites.net/api';
  
  console.log('Azure API URL configured:', window.API_BASE_URL);
  
  // Force override axios configuration to use Azure URL
  if (window.axios && window.axios.defaults) {
    console.log('Directly setting axios defaults to Azure URL');
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
      console.log('New axios instance detected - forcing Azure URL');
      if (newAxios && newAxios.defaults) {
        // Always override to Azure URL
        newAxios.defaults.baseURL = window.API_BASE_URL;
        console.log('Set axios baseURL to:', newAxios.defaults.baseURL);
      }
      originalAxios = newAxios;
    }
  });
  
  // Additional verification
  setTimeout(function() {
    console.log('Final API URL verification:', window.API_BASE_URL);
    if (window.axios && window.axios.defaults) {
      console.log('Final axios baseURL:', window.axios.defaults.baseURL);
    }
  }, 1000);

  console.log('API configuration complete - HARDCODED to Azure URL');
})(); 