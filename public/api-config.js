// Dynamic API Configuration with Request Interception
(function() {
  'use strict';
  
  // Force API base URL to relative path
  window.API_BASE_URL = '/api';
  console.log('API Base URL configured:', window.API_BASE_URL);
  
  // Override fetch API to fix URLs
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('localhost:3000/api')) {
      const newUrl = url.replace('http://localhost:3000/api', '/api');
      console.log(`INTERCEPTED fetch: ${url} -> ${newUrl}`);
      url = newUrl;
    }
    return originalFetch.apply(this, [url, options]);
  };
  console.log('Fetch API intercepted for localhost URLs');
  
  // Wait for axios to load and then patch its instance
  function patchAxios() {
    if (window.axios) {
      // Override axios baseURL
      window.axios.defaults.baseURL = window.API_BASE_URL;
      
      // Add request interceptor to fix URLs in any axios instance
      const originalRequest = window.axios.Axios.prototype.request;
      window.axios.Axios.prototype.request = function(config) {
        if (config && config.url) {
          if (config.url.includes('localhost:3000/api')) {
            config.url = config.url.replace('http://localhost:3000/api', '/api');
            console.log(`INTERCEPTED axios request: ${config.url}`);
          }
        }
        return originalRequest.apply(this, arguments);
      };
      
      // Patch any existing axios instances
      if (window.axios.interceptors && window.axios.interceptors.request) {
        window.axios.interceptors.request.use(function(config) {
          if (config.url && config.url.includes('localhost:3000/api')) {
            config.url = config.url.replace('http://localhost:3000/api', '/api');
            console.log(`INTERCEPTED via interceptor: ${config.url}`);
          }
          return config;
        });
      }
      
      console.log('Axios fully configured and intercepted');
      return true;
    }
    return false;
  }
  
  // Try to patch immediately if axios is already loaded
  if (!patchAxios()) {
    // Set up monitoring for axios to be defined
    console.log('Waiting for axios to load...');
    let checkCount = 0;
    const axiosCheck = setInterval(() => {
      checkCount++;
      if (patchAxios()) {
        clearInterval(axiosCheck);
        console.log('Axios patched after waiting');
      } else if (checkCount > 20) { // Give up after ~2 seconds
        clearInterval(axiosCheck);
        console.warn('Could not patch axios - not loaded in time');
      }
    }, 100);
  }
  
  // Override XMLHttpRequest for complete coverage
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (typeof url === 'string' && url.includes('localhost:3000/api')) {
      const newUrl = url.replace('http://localhost:3000/api', '/api');
      console.log(`INTERCEPTED XHR: ${url} -> ${newUrl}`);
      url = newUrl;
    }
    return originalOpen.apply(this, arguments);
  };
  console.log('XMLHttpRequest intercepted for localhost URLs');
  
  console.log('API configuration complete - All HTTP methods intercepted');
})(); 