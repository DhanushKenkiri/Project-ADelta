const fs = require('fs');
const path = require('path');

// Path to the file we need to patch
const filePath = path.resolve(__dirname, 'node_modules/fetch-blob/from.js');
console.log(`Patching file: ${filePath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');

// Replace the problematic import
const originalImport = `import { statSync, createReadStream, promises as fs } from 'node:fs'`;
const newContent = `// Patched import for browser compatibility
const statSync = () => {};
const createReadStream = () => {};
const fs = { readFile: async () => new Uint8Array() };`;

fileContent = fileContent.replace(originalImport, newContent);

// Write the file back
fs.writeFileSync(filePath, fileContent);
console.log('Patch applied successfully!');

// Now patch node-fetch
const referrerPath = path.resolve(__dirname, 'node_modules/node-fetch/src/utils/referrer.js');

if (fs.existsSync(referrerPath)) {
  console.log(`Patching file: ${referrerPath}`);
  let referrerContent = fs.readFileSync(referrerPath, 'utf8');
  
  // Replace the problematic import
  const originalNetImport = `import {isIP} from 'node:net';`;
  const newNetImport = `// Patched import for browser compatibility
const isIP = input => {
  if (!input || typeof input !== 'string') return 0;
  if (/^(\\d{1,3}\\.){3}\\d{1,3}$/.test(input)) {
    const parts = input.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    }) ? 4 : 0;
  }
  if (input.includes(':')) {
    const parts = input.split(':');
    if (parts.length > 8) return 0;
    return parts.every(part => part === '' || /^[0-9a-fA-F]{1,4}$/.test(part)) ? 6 : 0;
  }
  return 0;
};`;

  referrerContent = referrerContent.replace(originalNetImport, newNetImport);

  // Write the file back
  fs.writeFileSync(referrerPath, referrerContent);
  console.log('Node-fetch patch applied successfully!');
} else {
  console.log('Cannot find node-fetch/src/utils/referrer.js to patch.');
} 