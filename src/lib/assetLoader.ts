/**
 * Asset loader utility
 * Helps load assets from the src directory in a Vite-compatible way
 */

/**
 * Get the correct URL for a template HTML file
 * Works in both development and production environments
 */
export function getTemplateUrl(filename: string): string {
  // Remove leading slash if present
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  
  try {
    // In development, use direct import
    // In production, this will be resolved to the correct path
    const url = new URL(`/${cleanFilename}`, window.location.origin).href;
    return url;
  } catch (error) {
    console.error('Error creating template URL:', error);
    return cleanFilename;
  }
}

/**
 * Get the correct URL for a template image
 * Works in both development and production environments
 */
export function getImageUrl(imagePath: string): string {
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  try {
    // In development, use direct import
    // In production, this will be resolved to the correct path
    const url = new URL(`/${cleanPath}`, window.location.origin).href;
    return url;
  } catch (error) {
    console.error('Error creating image URL:', error);
    return cleanPath;
  }
}

/**
 * Preload template assets for better performance
 */
export function preloadTemplateAssets(templatePaths: string[]): void {
  templatePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = getTemplateUrl(path);
    link.as = 'fetch';
    document.head.appendChild(link);
  });
} 
 * Asset loader utility
 * Helps load assets from the src directory in a Vite-compatible way
 */

/**
 * Get the correct URL for a template HTML file
 * Works in both development and production environments
 */
export function getTemplateUrl(filename: string): string {
  // Remove leading slash if present
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  
  try {
    // In development, use direct import
    // In production, this will be resolved to the correct path
    const url = new URL(`/${cleanFilename}`, window.location.origin).href;
    return url;
  } catch (error) {
    console.error('Error creating template URL:', error);
    return cleanFilename;
  }
}

/**
 * Get the correct URL for a template image
 * Works in both development and production environments
 */
export function getImageUrl(imagePath: string): string {
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  try {
    // In development, use direct import
    // In production, this will be resolved to the correct path
    const url = new URL(`/${cleanPath}`, window.location.origin).href;
    return url;
  } catch (error) {
    console.error('Error creating image URL:', error);
    return cleanPath;
  }
}

/**
 * Preload template assets for better performance
 */
export function preloadTemplateAssets(templatePaths: string[]): void {
  templatePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = getTemplateUrl(path);
    link.as = 'fetch';
    document.head.appendChild(link);
  });
} 
 