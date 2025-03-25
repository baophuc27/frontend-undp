import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Load environment variables script if available
const loadEnvScript = () => {
  if (process.env.NODE_ENV === 'production') {
    const script = document.createElement('script');
    script.src = '/env-config.js';
    script.async = false;
    document.head.appendChild(script);
    
    return new Promise<void>((resolve) => {
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load environment config, using defaults');
        resolve();
      };
    });
  }
  return Promise.resolve();
};

// Initialize app after environment is loaded
const initApp = async () => {
  await loadEnvScript();
  
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
};

initApp();