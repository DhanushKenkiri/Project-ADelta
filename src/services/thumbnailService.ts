/**
 * Service for generating thumbnails from template HTML content
 * This is a simplified version without puppeteer since it's client-side
 */

/**
 * Creates a thumbnail image from HTML content
 * Returns a data URL string representation of the image
 */
export const generateThumbnail = async (
  html: string,
  width = 800,
  height = 450
): Promise<string> => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.opacity = '0';
    iframe.width = `${width}px`;
    iframe.height = `${height}px`;
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      cleanupIframe();
      resolve('');
      return;
    }
    
    iframeWindow.document.open();
    iframeWindow.document.write(html);
    iframeWindow.document.close();
    
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        renderWithSVG(html, width, height, ctx, canvas, cleanupIframe, resolve);
      } catch (err) {
        console.warn('Error in thumbnail generation:', err);
        fallbackRendering(html, width, height, cleanupIframe, resolve);
      }
    }, 300);
    
    function cleanupIframe() {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }
  });
};

// Helper functions
function renderWithSVG(
  html: string, 
  width: number, 
  height: number, 
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  cleanup: () => void,
  resolve: (value: string) => void
) {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;
  
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    URL.revokeObjectURL(url);
    cleanup();
    
    resolve(dataUrl);
  };
  
  img.onerror = () => {
    URL.revokeObjectURL(url);
    fallbackRendering(html, width, height, cleanup, resolve);
  };
  
  img.src = url;
}

function fallbackRendering(
  html: string,
  width: number,
  height: number,
  cleanup: () => void,
  resolve: (value: string) => void
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    cleanup();
    resolve('');
    return;
  }
  
  let title = extractTitleFromHtml(html);
  
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#4338ca');
  gradient.addColorStop(1, '#6366f1');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  drawEmailIcon(ctx, width / 2, height / 2 - 40, 40);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, height / 2 + 40);
  
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText('Email Template', width / 2, height / 2 + 70);
  
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  
  cleanup();
  resolve(dataUrl);
}

function extractTitleFromHtml(html: string): string {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1];
  }
  
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return h1Match[1].replace(/<[^>]*>/g, '');
  }
  
  return 'Email Template';
}

function drawEmailIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.rect(x - size/1.5, y - size/2, size*1.3, size);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x - size/1.5, y - size/2);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size/1.5, y - size/2);
  ctx.stroke();
}

/**
 * Converts a data URL to a File object
 */
export const dataUrlToFile = (
  dataUrl: string,
  filename: string = 'thumbnail.jpg'
): File => {
  const [meta, data] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
  
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new File([array], filename, { type: mime });
}; 