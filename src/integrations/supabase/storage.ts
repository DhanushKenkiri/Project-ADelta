import { supabase } from './client';

export enum StorageBucket {
  TEMPLATES = 'templates',
  ASSETS = 'assets',
  PROFILE_IMAGES = 'profile-images',
}

// Add flag to check if storage is even available
let isStorageSupported = true;

export const initializeStorage = async () => {
  try {
    // First check if the storage API is supported in this project plan
    try {
      // Test if the storage API exists and is accessible
      if (!supabase.storage) {
        console.warn('Supabase storage API not available in this project plan. Using fallback storage.');
        isStorageSupported = false;
        return { success: false, error: new Error('Supabase storage not supported in current plan') };
      }
      
      // Try to list buckets instead of getting a specific bucket that might not exist
      const { error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.warn('Supabase storage not accessible, using fallback storage.', error.message);
        isStorageSupported = false;
        return { success: false, error: new Error('Supabase storage not accessible') };
      }
    } catch (connectionError) {
      console.warn('Network error connecting to Supabase storage:', connectionError);
      isStorageSupported = false;
      return { success: false, error: connectionError };
    }
    
    // If we got here, storage is available - try to create buckets
    for (const bucket of Object.values(StorageBucket)) {
      try {
        // First check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === bucket);
        
        if (!bucketExists) {
          console.log(`Creating bucket: ${bucket}`);
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: bucket === StorageBucket.TEMPLATES,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
          });
          
          if (createError) {
            console.error(`Failed to create bucket ${bucket}:`, createError);
          } else {
            console.log(`Created bucket: ${bucket}`);
          }
        } else {
          console.log(`Bucket exists: ${bucket}`);
        }
      } catch (bucketError) {
        console.error(`Error with bucket ${bucket}:`, bucketError);
        // Continue to next bucket rather than aborting
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing storage:', error);
    isStorageSupported = false;
    return { success: false, error };
  }
};

export const uploadFile = async (
  bucket: StorageBucket,
  path: string,
  file: File,
  options?: {
    upsert?: boolean;
    cacheControl?: string;
  }
) => {
  if (!isStorageSupported) {
    console.warn('Supabase storage not supported, skipping file upload');
    return { success: false, error: new Error('Storage not supported') };
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options?.upsert ?? true,
        cacheControl: options?.cacheControl ?? '3600',
      });
      
    if (error) throw error;
    
    return { data, success: true };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error };
  }
};

// Utility function to check if storage is accessible
export const isStorageAccessible = async (): Promise<boolean> => {
  if (!isStorageSupported) {
    return false;
  }
  
  try {
    const { error } = await supabase.storage.listBuckets();
    return !error;
  } catch (error) {
    console.warn('Supabase storage not accessible:', error);
    return false;
  }
};

export const getPublicUrl = (bucket: StorageBucket, path: string) => {
  if (!isStorageSupported) {
    return '/images/default-template-thumbnail.jpg'; // Fallback image
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const downloadFile = async (bucket: StorageBucket, path: string) => {
  if (!isStorageSupported) {
    return { success: false, error: new Error('Storage not supported') };
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
      
    if (error) throw error;
    
    return { data, success: true };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { success: false, error };
  }
};

export const listFiles = async (
  bucket: StorageBucket,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  }
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path || '', {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy,
      });
      
    if (error) throw error;
    
    return { data, success: true };
  } catch (error) {
    console.error('Error listing files:', error);
    return { success: false, error };
  }
};

export const deleteFile = async (bucket: StorageBucket, path: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error };
  }
};

export const deleteFiles = async (bucket: StorageBucket, paths: string[]) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting files:', error);
    return { success: false, error };
  }
};

export const moveFile = async (
  bucket: StorageBucket,
  fromPath: string,
  toPath: string
) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error moving file:', error);
    return { success: false, error };
  }
};

export const createSignedUrl = async (
  bucket: StorageBucket,
  path: string,
  expiresIn = 60
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
      
    if (error) throw error;
    
    return { data, success: true };
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return { success: false, error };
  }
};