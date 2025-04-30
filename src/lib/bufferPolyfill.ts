/**
 * Simple Buffer polyfill for browser environments
 * This will only be used if the global Buffer is not available
 */

export class BufferPolyfill {
  static from(data: string, encoding?: string): Uint8Array {
    if (encoding === 'base64') {
      return this.fromBase64(data);
    }
    
    // Default to UTF-8
    const encoder = new TextEncoder();
    return encoder.encode(data);
  }

  static fromBase64(base64: string): Uint8Array {
    const binString = atob(base64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
  }

  static toString(buffer: Uint8Array, encoding?: string): string {
    if (encoding === 'base64') {
      return this.toBase64(buffer);
    }
    
    // Default to UTF-8
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  }

  static toBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// If Buffer is not defined globally, set up our polyfill
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = BufferPolyfill;
  console.log('Buffer polyfill installed for browser environment');
} 