/**
 * Utility functions for ScreenPipe integration
 */

/**
 * Check if ScreenPipe is installed and available
 * @returns Promise resolving to boolean indicating if ScreenPipe is available
 */
export async function isScreenPipeAvailable(): Promise<boolean> {
  // Check if ScreenPipe is available in the window object
  if (typeof window === 'undefined') return false;
  
  // Direct check
  if (window.screenpipe && typeof window.screenpipe.captureScreen === 'function') {
    return true;
  }
  
  // Check if ScreenPipe is pending initialization
  if ('screenpipeInitializing' in window) {
    try {
      // Wait for initialization to complete (max 5 seconds)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('ScreenPipe initialization timeout')), 5000);
        
        const checkInterval = setInterval(() => {
          if (window.screenpipe && typeof window.screenpipe.captureScreen === 'function') {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          } else if (!('screenpipeInitializing' in window)) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            reject(new Error('ScreenPipe initialization failed'));
          }
        }, 200);
      });
      
      return true;
    } catch (error) {
      console.error('Error waiting for ScreenPipe initialization:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Get the ScreenPipe download URL
 * @returns ScreenPipe download URL
 */
export function getScreenPipeDownloadUrl(): string {
  return 'https://screenpi.pe/download';
}

/**
 * Check if ScreenPipe supports image analysis
 * @returns Promise resolving to boolean indicating if image analysis is available
 */
export async function isScreenPipeAnalysisAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check if ScreenPipe is available and has the analyzeImage function
  if (window.screenpipe && typeof window.screenpipe.analyzeImage === 'function') {
    return true;
  }
  
  return false;
}

/**
 * Analyze an image using ScreenPipe's image analysis capability
 * @param imageDataUrl The data URL of the image to analyze
 * @returns Promise resolving to analysis result with description and prompt
 */
export async function analyzeImageWithScreenPipe(imageDataUrl: string): Promise<ScreenPipeAnalysisResult> {
  if (!await isScreenPipeAnalysisAvailable()) {
    throw new Error('ScreenPipe image analysis is not available');
  }
  
  try {
    // Call ScreenPipe's analyzeImage function
    const result = await window.screenpipe.analyzeImage({ 
      dataUrl: imageDataUrl 
    });
    
    return {
      description: result.description || 'No description available',
      prompt: result.prompt || generateDefaultPrompt(result.description || 'image'),
      tags: result.tags || []
    };
  } catch (error) {
    console.error('Error analyzing image with ScreenPipe:', error);
    throw new Error('Failed to analyze image with ScreenPipe');
  }
}

/**
 * Generate a default prompt based on image description
 * @param description The image description
 * @returns A generated prompt for Groq
 */
function generateDefaultPrompt(description: string): string {
  return `Analyze this image showing ${description}. 
Provide insights about what it contains and suggest improvements or changes 
that could make it more effective for use in an email template.`;
}

/**
 * Interface for ScreenPipe analysis result
 */
export interface ScreenPipeAnalysisResult {
  description: string;
  prompt: string;
  tags: string[];
}

// Add TypeScript declaration for ScreenPipe
declare global {
  interface Window {
    screenpipe?: {
      captureScreen: () => Promise<{ dataUrl: string }>;
      analyzeImage?: (options: { dataUrl: string }) => Promise<{
        description?: string;
        prompt?: string;
        tags?: string[];
      }>;
      version?: string;
    };
    screenpipeInitializing?: boolean;
  }
} 