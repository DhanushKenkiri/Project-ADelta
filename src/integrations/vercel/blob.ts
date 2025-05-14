import { put, list, del, head } from '@vercel/blob';

/**
 * Vercel Blob Storage Integration
 * 
 * Required environment variables:
 * - BLOB_READ_WRITE_TOKEN: Your Vercel Blob storage token
 * 
 * To set up Vercel Blob:
 * 1. Add the BLOB_READ_WRITE_TOKEN to your .env.local file
 * 2. If deploying to Vercel, add the BLOB_READ_WRITE_TOKEN to your project's environment variables
 * 3. You can generate a token in the Vercel dashboard under Storage > Blob section
 * 
 * For more information, see: https://vercel.com/docs/storage/vercel-blob
 */

/**
 * Enumeration of available storage buckets
 */
export enum StorageBucket {
  TEMPLATES = 'templates',
  ASSETS = 'assets',
  USER_FILES = 'user-files',
}

/**
 * Check if Vercel Blob storage is accessible
 */
export const isStorageAccessible = async (): Promise<{ success: boolean; error?: Error }> => {
  try {
    // Try listing files as a connectivity test
    await list();
    return { success: true };
  } catch (error) {
    console.warn('Vercel Blob storage not accessible:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Initialize Vercel Blob storage
 */
export const initializeStorage = async (): Promise<{ success: boolean; error?: Error }> => {
  try {
    const accessibleResult = await isStorageAccessible();
    return accessibleResult;
  } catch (error) {
    console.error('Failed to initialize Vercel Blob storage:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Upload a file to Vercel Blob storage
 * @param file The file to upload
 * @param path The path where to store the file
 * @param bucket The storage bucket
 */
export const uploadFile = async (
  file: File | Blob,
  path: string,
  bucket: StorageBucket = StorageBucket.ASSETS
): Promise<{ url: string; error?: Error }> => {
  try {
    // Construct the path with the bucket included
    const fullPath = `${bucket}/${path}`;
    
    // Upload to Vercel Blob
    const blob = await put(fullPath, file, {
      access: 'public',
    });
    
    return { url: blob.url };
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    return { url: '', error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Download a file from Vercel Blob storage
 * @param path The path of the file to download
 * @param bucket The storage bucket
 */
export const downloadFile = async (
  path: string,
  bucket: StorageBucket = StorageBucket.ASSETS
): Promise<{ data: Blob | null; error?: Error }> => {
  try {
    // Construct the full path
    const fullPath = `${bucket}/${path}`;
    
    // Fetch the blob URL
    const blobInfo = await head(fullPath);
    if (!blobInfo) {
      return { data: null, error: new Error('File not found') };
    }
    
    // Fetch the blob content
    const response = await fetch(blobInfo.url);
    if (!response.ok) {
      return { data: null, error: new Error(`Failed to download file: ${response.statusText}`) };
    }
    
    const data = await response.blob();
    return { data };
  } catch (error) {
    console.error('Error downloading file from Vercel Blob:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Get the public URL for a file
 * @param path The path of the file
 * @param bucket The storage bucket
 */
export const getPublicUrl = async (
  path: string,
  bucket: StorageBucket = StorageBucket.ASSETS
): Promise<string> => {
  try {
    // Construct the full path
    const fullPath = `${bucket}/${path}`;
    
    // Fetch the blob metadata to get the URL
    const blobInfo = await head(fullPath);
    return blobInfo.url;
  } catch (error) {
    console.error('Error getting public URL for file:', error);
    return '';
  }
};

/**
 * List files in a directory
 * @param prefix The directory prefix
 * @param bucket The storage bucket
 */
export const listFiles = async (
  prefix: string = '',
  bucket: StorageBucket = StorageBucket.ASSETS
): Promise<{ data: { name: string; url: string }[]; error?: Error }> => {
  try {
    // Construct the prefix with the bucket
    const fullPrefix = prefix ? `${bucket}/${prefix}` : bucket;
    
    // List files from Vercel Blob
    const { blobs } = await list({ prefix: fullPrefix });
    
    // Map to the expected format
    const files = blobs.map(blob => ({
      name: blob.pathname.replace(`${bucket}/`, ''), // Remove bucket prefix from name
      url: blob.url
    }));
    
    return { data: files };
  } catch (error) {
    console.error('Error listing files from Vercel Blob:', error);
    return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Delete a file from storage
 * @param path The path of the file to delete
 * @param bucket The storage bucket
 */
export const deleteFile = async (
  path: string,
  bucket: StorageBucket = StorageBucket.ASSETS
): Promise<{ success: boolean; error?: Error }> => {
  try {
    // Construct the full path
    const fullPath = `${bucket}/${path}`;
    
    // Delete the file from Vercel Blob
    await del(fullPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from Vercel Blob:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}; 