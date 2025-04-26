/**
 * Cryptography service for encrypting and decrypting email content
 * Uses AES-GCM for encryption
 */

// Helper to convert string to buffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length * 2);
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Helper to convert buffer to string
function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint16Array(buf)));
}

// Derive encryption key from password or key string
async function deriveKey(keyMaterial: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
  // Create a key from the password
  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive a key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using AES-GCM with the provided key
 * @param text Text to encrypt
 * @param keyMaterial Key or password for encryption
 * @returns Encrypted data as base64 string with salt and IV
 */
export async function encrypt(text: string, keyMaterial: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a random salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Derive the key
    const key = await deriveKey(keyMaterial, salt);
    
    // Encrypt the data
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Combine the salt, iv, and encrypted data
    const encryptedBuffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    encryptedBuffer.set(salt, 0);
    encryptedBuffer.set(iv, salt.byteLength);
    encryptedBuffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode.apply(null, Array.from(encryptedBuffer)));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text using AES-GCM with the provided key
 * @param encryptedData Encrypted data as base64 string with salt and IV
 * @param keyMaterial Key or password for decryption
 * @returns Decrypted text
 */
export async function decrypt(encryptedData: string, keyMaterial: string): Promise<string> {
  try {
    // Convert from base64
    const encryptedBuffer = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract the salt, iv, and encrypted data
    const salt = encryptedBuffer.slice(0, 16);
    const iv = encryptedBuffer.slice(16, 16 + 12);
    const data = encryptedBuffer.slice(16 + 12);
    
    // Derive the key
    const key = await deriveKey(keyMaterial, salt);
    
    // Decrypt the data
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Decode the data
    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key
 * @returns Random encryption key as base64 string
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * Hash a string using SHA-256
 * @param data String to hash
 * @returns Hash as hex string
 */
export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
} 