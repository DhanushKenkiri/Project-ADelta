import { initializeStorage } from './blob';

/**
 * Initialize Vercel Blob services
 */
export const initializeVercelBlob = async () => {
  console.log('Initializing Vercel Blob services...');
  
  try {
    // Initialize storage
    const storageResult = await initializeStorage();
    
    if (!storageResult.success) {
      console.warn('Vercel Blob storage initialization failed:', storageResult.error?.message);
      return { success: false, error: storageResult.error };
    }
    
    console.log('Vercel Blob storage initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing Vercel Blob:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error initializing Vercel Blob') 
    };
  }
}; 