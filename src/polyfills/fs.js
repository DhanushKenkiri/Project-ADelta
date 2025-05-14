// fs.js polyfill for browser
export const statSync = () => null;
export const createReadStream = () => null;
export const promises = {
  readFile: async () => new Uint8Array(),
  writeFile: async () => {}
};

// Default export
export default {
  statSync,
  createReadStream,
  promises
}; 