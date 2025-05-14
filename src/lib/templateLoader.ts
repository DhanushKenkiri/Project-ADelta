/**
 * Template loader utility
 * Used to load HTML template content from file paths
 */

/**
 * Loads a template's HTML content from its file path
 * @param filePath Path to the template file
 * @returns Promise with HTML content
 */
export async function loadTemplateContent(filePath: string): Promise<string> {
  try {
    console.log(`Loading template from: ${filePath}`);
    
    // Make sure the path starts with a leading slash for public folder files
    const adjustedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    const response = await fetch(adjustedPath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText} (${response.status})`);
    }
    const content = await response.text();
    console.log(`Loaded template, content length: ${content.length} bytes`);
    return content;
  } catch (error) {
    console.error('Error loading template:', error);
    return '';
  }
}

/**
 * Ensures template thumbnail exists, returns fallback if not
 * @param thumbnailUrl URL to the template thumbnail
 * @returns Promise with valid thumbnail URL
 */
export async function validateThumbnail(thumbnailUrl: string): Promise<string> {
  try {
    // Make sure the path starts with a leading slash for public folder files
    const adjustedPath = thumbnailUrl.startsWith('/') ? thumbnailUrl : `/${thumbnailUrl}`;
    
    const response = await fetch(adjustedPath, { method: 'HEAD' });
    if (response.ok) {
      return thumbnailUrl;
    } else {
      // Return default if thumbnail doesn't exist
      return '/templates/images/default-template-thumb.png';
    }
  } catch (error) {
    console.error('Error validating thumbnail:', error);
    return '/templates/images/default-template-thumb.png';
  }
}

/**
 * Creates a directory for template thumbnails if it doesn't exist
 * This requires server-side code, so it would be implemented
 * in an API route or during build time
 */
export function ensureTemplateImagesDirectory() {
  // This would be implemented server-side
  console.log('Ensuring template images directory exists');
} 