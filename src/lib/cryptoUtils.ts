/**
 * Crypto utilities for mail encryption/decryption
 */

// Generate a key pair for asymmetric encryption
export const generateKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  try {
    // Generate an RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    // Export the public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    
    // Export the private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );
    
    // Convert to base64
    const publicKey = arrayBufferToBase64(publicKeyBuffer);
    const privateKey = arrayBufferToBase64(privateKeyBuffer);
    
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
};

// Import a public key from base64 string
export const importPublicKey = async (
  publicKeyBase64: string
): Promise<CryptoKey> => {
  try {
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
    
    return publicKey;
  } catch (error) {
    console.error('Error importing public key:', error);
    throw error;
  }
};

// Import a private key from base64 string
export const importPrivateKey = async (
  privateKeyBase64: string
): Promise<CryptoKey> => {
  try {
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
    
    return privateKey;
  } catch (error) {
    console.error('Error importing private key:', error);
    throw error;
  }
};

// Encrypt a message with a recipient's public key
export const encrypt = async (
  message: string,
  recipientPublicKeyBase64: string
): Promise<string> => {
  try {
    // Import the recipient's public key
    const publicKey = await importPublicKey(recipientPublicKeyBase64);
    
    // Encode the message
    const messageBuffer = new TextEncoder().encode(message);
    
    // Encrypt the message
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      messageBuffer
    );
    
    // Convert to base64
    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
};

// Decrypt a message with user's private key
export const decrypt = async (
  encryptedMessage: string,
  privateKeyBase64?: string
): Promise<string> => {
  try {
    // If no private key is provided, try to get it from localStorage
    if (!privateKeyBase64) {
      privateKeyBase64 = localStorage.getItem('adelta_private_key') || '';
      if (!privateKeyBase64) {
        throw new Error('No private key available for decryption');
      }
    }
    
    // Import the private key
    const privateKey = await importPrivateKey(privateKeyBase64);
    
    // Convert base64 to array buffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
    
    // Decrypt the message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedBuffer
    );
    
    // Decode the message
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
};

// Helper function to convert ArrayBuffer to Base64
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
};

// Helper function to convert Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};

// Store keys securely in localStorage
export const storeKeys = (publicKey: string, privateKey: string): void => {
  localStorage.setItem('adelta_public_key', publicKey);
  localStorage.setItem('adelta_private_key', privateKey);
};

// Retrieve public key from localStorage
export const getPublicKey = (): string | null => {
  return localStorage.getItem('adelta_public_key');
};

// Retrieve private key from localStorage
export const getPrivateKey = (): string | null => {
  return localStorage.getItem('adelta_private_key');
};

// Generate and store a new key pair
export const generateAndStoreKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  const keyPair = await generateKeyPair();
  storeKeys(keyPair.publicKey, keyPair.privateKey);
  return keyPair;
}; 