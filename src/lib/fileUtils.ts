/**
 * Save HTML content to a local file
 * @param htmlContent HTML content to save
 * @param suggestedName Suggested file name
 * @returns Promise that resolves when the file is saved
 */
export async function saveHtmlFile(htmlContent: string, suggestedName: string): Promise<void> {
  try {
    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Check if the File System Access API is available and supported
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${suggestedName}.html`,
          types: [{
            description: 'HTML Files',
            accept: { 'text/html': ['.html'] },
          }],
        });
        
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('File saved using File System Access API');
      } catch (fsApiError) {
        // User might have cancelled the save dialog or browser doesn't support it properly
        console.warn('File System Access API error, falling back to download:', fsApiError);
        downloadFile(blob, suggestedName);
      }
    } else {
      // Fallback for browsers without File System Access API
      console.log('File System Access API not available, using download fallback');
      downloadFile(blob, suggestedName);
    }
  } catch (error) {
    console.error('Error saving HTML file:', error);
    throw new Error('Failed to save HTML file');
  }
}

/**
 * Helper function to download a file
 * @param blob Blob to download
 * @param fileName File name without extension
 */
function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.html`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
} 