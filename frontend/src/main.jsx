import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Intercept relative API requests when running inside native mobile shell (Capacitor)
const NATIVE_BACKEND_URL = 'https://india-tour-planner-1.onrender.com';
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  const isCapacitor = window.Capacitor?.isNativePlatform?.() || 
                      window.location.protocol === 'capacitor:' || 
                      (window.location.hostname === 'localhost' && window.Capacitor);
  
  if (isCapacitor && url.startsWith('/api')) {
    url = `${NATIVE_BACKEND_URL}${url}`;
    init.credentials = 'include';
    return originalFetch(url, init);
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
