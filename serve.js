import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Clean up the URL by removing query strings and decoding
    const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
    
    // Get the file path from the URL
    let filePath = join(__dirname, 'dist', cleanUrl === '/' ? 'index.html' : cleanUrl.slice(1));
    
    console.log('Requesting:', cleanUrl);
    console.log('File path:', filePath);
    
    try {
      const data = await readFile(filePath);
      
      // Set the content type based on file extension
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // Set proper headers
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(data);
    } catch (error) {
      console.log('File not found:', filePath);
      // If file not found, serve index.html for client-side routing
      const data = await readFile(join(__dirname, 'dist', 'index.html'));
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end('Server Error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
}); 