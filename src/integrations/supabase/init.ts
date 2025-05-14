import { initializeStorage } from '@/integrations/supabase/storage';
import { supabase } from './client';

/**
 * Initialize Supabase services
 * This should be called when the application starts
 */
export const initializeSupabase = async () => {
  console.log('Initializing Supabase services...');
  
  try {
    // First check if we can connect to Supabase
    let supabaseAvailable = true;
    let authStatus = null;
    
    try {
      // Use a simple authenticated query to check connectivity
      // This handles URL formatting properly through the client
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Supabase authentication check failed:', error.message);
        supabaseAvailable = false;
      } else {
        console.log('Supabase connectivity check successful');
        authStatus = data.session ? 'authenticated' : 'unauthenticated';
      }
    } catch (networkError) {
      console.warn('Network error checking Supabase availability:', networkError);
      supabaseAvailable = false;
    }
    
    if (!supabaseAvailable) {
      console.log('Running application with local storage fallback - Supabase unavailable');
      return { 
        success: true, 
        offline: true,
        message: 'Application running in offline mode with local storage'
      };
    }
    
    // Even if we can connect to Supabase, storage might not be available
    // in the free plan or due to other limitations
    
    // Try to initialize storage, but don't fail the app initialization if it doesn't work
    try {
      const { success: storageInitialized, error: storageError } = await initializeStorage();
      
      if (!storageInitialized) {
        console.log('Storage not available, continuing with local file storage fallback');
        console.warn('Storage initialization error:', storageError?.message);
        // Don't fail the app, continue with local storage
      } else {
        console.log('Supabase storage initialized successfully');
      }
    } catch (storageError) {
      console.warn('Error during storage initialization, using local fallback:', storageError);
      // Continue app initialization despite storage issues
    }
    
    // At this point, authentication is working, storage may or may not be working
    // The application will automatically fall back to local storage when needed
    
    return { 
      success: true, 
      offline: false,
      authStatus
    };
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    console.log('Running application with local storage fallback due to initialization error');
    return { 
      success: true, 
      offline: true,
      error,
      message: 'Application running in offline mode with local storage due to error'
    };
  }
}; 