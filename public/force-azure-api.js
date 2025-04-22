// FORCE AZURE API URL
(function() {
  const AZURE_API_URL = 'https://lang-reader-gxdpf7dff2bbbufb.canadacentral-01.azurewebsites.net/api';
  
  // Force axios to always use Azure URL
  function forceAzureUrl() {
    console.log('🔒 FORCING AZURE API URL');
    
    // Set global API URL
    window.API_BASE_URL = AZURE_API_URL;
    
    // Force axios to use Azure API URL
    if (window.axios && window.axios.defaults) {
      window.axios.defaults.baseURL = AZURE_API_URL;
      console.log('✅ Axios configured to use:', AZURE_API_URL);
    }
  }
  
  // Run immediately
  forceAzureUrl();
  
  // Also run after a short delay to catch any late initializations
  setTimeout(forceAzureUrl, 500);
  
  // And periodically check to ensure the URL hasn't been changed
  setInterval(function() {
    if (window.axios && window.axios.defaults && 
        window.axios.defaults.baseURL !== AZURE_API_URL) {
      console.warn('⚠️ Axios baseURL changed - resetting to Azure URL');
      window.axios.defaults.baseURL = AZURE_API_URL;
    }
  }, 2000);
  
  // Monitor window location to ensure we're on the right site
  if (window.location.hostname !== 'lang-reader-gxdpf7dff2bbbufb.canadacentral-01.azurewebsites.net' &&
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1') {
    console.warn('⚠️ Running on unknown hostname:', window.location.hostname);
  }
})(); 