/**
 * ScreenPipe Integration Configuration
 * 
 * This file contains configuration and initialization for ScreenPipe.
 * ScreenPipe is a third-party app that allows capturing screenshots.
 * 
 * For more information, visit https://screenpi.pe
 */

/**
 * Initialize ScreenPipe integration when the app loads
 */
export function initializeScreenPipe(): void {
  if (typeof window === 'undefined') return;
  
  // Set a flag to indicate ScreenPipe is initializing
  (window as any).screenpipeInitializing = true;
  
  // Load ScreenPipe script dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.screenpi.pe/js/screenpipe-sdk.min.js'; // Replace with actual SDK URL
  script.async = true;
  
  script.onload = () => {
    // Initialize ScreenPipe (replace with actual initialization code)
    if (typeof (window as any).ScreenPipe !== 'undefined') {
      (window as any).ScreenPipe.init({
        apiKey: process.env.SCREENPIPE_API_KEY || 'demo-key', // Replace with your API key
        appId: 'project-adelta',
      }).then(() => {
        console.log('ScreenPipe initialized successfully');
        (window as any).screenpipeInitializing = false;
      }).catch((error: any) => {
        console.error('Failed to initialize ScreenPipe:', error);
        (window as any).screenpipeInitializing = false;
      });
    } else {
      console.error('ScreenPipe not available after script loaded');
      (window as any).screenpipeInitializing = false;
    }
  };
  
  script.onerror = () => {
    console.error('Failed to load ScreenPipe script');
    (window as any).screenpipeInitializing = false;
  };
  
  document.head.appendChild(script);
}

/**
 * ScreenPipe API configuration options
 */
export const screenpipeConfig = {
  defaultOptions: {
    format: 'png',
    quality: 0.9,
    width: 1920,
    height: 1080,
  }
}; 