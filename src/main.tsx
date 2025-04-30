// Import polyfill for Buffer
import './lib/bufferPolyfill';

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// Add console logs for debugging
console.log('Application starting...');
console.log('Environment variables loaded:', {
  groqKey: !!import.meta.env.VITE_GROQ_API_KEY ? 'Present' : 'Missing',
  firebaseKey: !!import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'Missing',
});

// Safely initialize external services
const initializeExternalServices = () => {
  // Initialize ScreenPipe integration if available
  try {
    import('./lib/screenpipeConfig').then(module => {
      try {
        module.initializeScreenPipe();
      } catch (error) {
        console.log('ScreenPipe initialization failed:', error);
      }
    }).catch(error => {
      console.log('ScreenPipe module import failed:', error);
    });
  } catch (error) {
    console.log('ScreenPipe integration skipped');
  }
};

// Initialize services with error handling
initializeExternalServices();

// Render the application
const renderApp = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('React rendered successfully');
  } catch (error) {
    console.error('Error during rendering:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; background: #ffdddd; margin: 20px; border-radius: 8px; font-family: sans-serif;">
        <h2>Application Failed to Load</h2>
        <p>There was an error while starting the application. Please check the console for more details.</p>
        <pre style="background: #f8f8f8; padding: 10px; border-radius: 4px;">${error?.toString()}</pre>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
};

// Start the application
renderApp();
