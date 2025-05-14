/**
 * Utility functions for image handling in email templates
 */

/**
 * Insert an image into HTML content at the cursor position
 * @param htmlContent Current HTML content of the template
 * @param imageDataUrl Base64 data URL of the image
 * @param position Optional position to insert (defaults to end of body)
 * @returns Updated HTML content with the image inserted
 */
export function insertImageIntoHtml(
  htmlContent: string, 
  imageDataUrl: string,
  position?: { tag: string; index: number }
): string {
  // Create image element
  const imgElement = `<img src="${imageDataUrl}" alt="Captured screenshot" style="max-width: 100%; height: auto; margin: 10px 0; display: block;" />`;
  
  // Default behavior: append to the end of the body
  if (!position) {
    // Check if body tag exists
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${imgElement}</body>`);
    } else {
      // If no body tag, add it at the end
      return htmlContent + imgElement;
    }
  }
  
  // Insert at specific position
  const { tag, index } = position;
  const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
  
  let count = 0;
  return htmlContent.replace(closeTagRegex, (match) => {
    count++;
    if (count === index) {
      return `${imgElement}${match}`;
    }
    return match;
  });
}

/**
 * Generate a unique filename for an uploaded image
 */
export function generateImageFilename(): string {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `image_${timestamp}_${random}.png`;
}

/**
 * Convert a data URL to a Blob
 * @param dataUrl The data URL string
 * @returns Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  if (arr.length < 2) {
    throw new Error('Invalid data URL format');
  }
  
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Compress an image data URL to reduce its size
 * @param dataUrl Original data URL
 * @param maxWidth Maximum width in pixels
 * @param quality JPEG quality (0-1)
 * @returns Promise resolving to compressed data URL
 */
export async function compressImage(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Scale down if needed
      if (width > maxWidth) {
        height = Math.floor(height * (maxWidth / width));
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with compression
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = dataUrl;
  });
} 