// net.js polyfill for browser
export function isIP(input) {
  if (!input || typeof input !== 'string') return 0;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(input)) {
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
}

// Default export
export default {
  isIP
}; 