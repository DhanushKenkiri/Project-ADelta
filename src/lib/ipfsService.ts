/**
 * IPFS Service
 * Handles storing and retrieving content on IPFS
 */

import { encrypt, decrypt } from './cryptoService';
import { create } from 'ipfs-http-client';

// IPFS connection configuration
const IPFS_API_URL = 'https://ipfs.infura.io:5001';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

class IpfsService {
  private client: any;
  
  constructor() {
    // Initialize IPFS client
    try {
      this.client = create({
        url: IPFS_API_URL,
        headers: {
          // Authentication could be added here
        }
      });
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      // Use mock service in case of initialization error
      this.client = null;
    }
  }

  /**
   * Store content on IPFS
   * @param content Content to store
   * @returns IPFS hash (CID)
   */
  async storeContent(content: string): Promise<string> {
    try {
      if (!this.client) {
        return this.mockStore(content);
      }
      
      console.log('Storing content on IPFS, size:', content.length);
      
      // Convert content to Buffer
      const contentBuffer = Buffer.from(content);
      
      // Add to IPFS
      const added = await this.client.add(contentBuffer);
      
      // Return the hash
      return added.cid.toString();
    } catch (error) {
      console.error('Failed to store content on IPFS:', error);
      return this.mockStore(content);
    }
  }

  /**
   * Store encrypted content on IPFS
   * @param content Content to encrypt and store
   * @param encryptionKey Key for encryption
   * @returns IPFS hash (CID)
   */
  async storeEncryptedContent(content: string, encryptionKey: string): Promise<string> {
    try {
      console.log('Encrypting content before storing on IPFS');
      
      // Encrypt the content
      const encryptedContent = await encrypt(content, encryptionKey);
      
      // Store the encrypted content
      return await this.storeContent(encryptedContent);
    } catch (error) {
      console.error('Failed to store encrypted content on IPFS:', error);
      throw new Error('Failed to store encrypted content on IPFS');
    }
  }

  /**
   * Store an HTML template on IPFS
   * @param htmlContent HTML content to store
   * @returns IPFS hash (CID)
   */
  async storeHtmlTemplate(htmlContent: string): Promise<string> {
    try {
      console.log('Storing HTML template on IPFS, size:', htmlContent.length);
      
      // Store the HTML content
      return await this.storeContent(htmlContent);
    } catch (error) {
      console.error('Failed to store HTML template on IPFS:', error);
      throw new Error('Failed to store HTML template on IPFS');
    }
  }

  /**
   * Retrieve content from IPFS
   * @param hash IPFS hash (CID)
   * @returns Content string
   */
  async retrieveContent(hash: string): Promise<string> {
    try {
      if (!this.client) {
        return this.mockRetrieve(hash);
      }
      
      console.log('Retrieving content from IPFS with hash:', hash);
      
      // Get content from IPFS
      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      
      // Combine chunks
      const content = Buffer.concat(chunks).toString();
      
      return content;
    } catch (error) {
      console.error('Failed to retrieve content from IPFS:', error);
      return this.mockRetrieve(hash);
    }
  }

  /**
   * Retrieve and decrypt content from IPFS
   * @param hash IPFS hash (CID)
   * @param decryptionKey Key for decryption
   * @returns Decrypted content
   */
  async retrieveEncryptedContent(hash: string, decryptionKey: string): Promise<string> {
    try {
      console.log('Retrieving and decrypting content from IPFS');
      
      // Retrieve the encrypted content
      const encryptedContent = await this.retrieveContent(hash);
      
      // Decrypt the content
      return await decrypt(encryptedContent, decryptionKey);
    } catch (error) {
      console.error('Failed to retrieve encrypted content from IPFS:', error);
      throw new Error('Failed to retrieve encrypted content from IPFS');
    }
  }

  /**
   * Generate a public gateway URL for an IPFS hash
   * @param hash IPFS hash (CID)
   * @returns Public gateway URL
   */
  getGatewayUrl(hash: string): string {
    return `${IPFS_GATEWAY}${hash}`;
  }

  /**
   * Mock method for storing content (for development or when IPFS unavailable)
   * @param content Content to store
   * @returns Mock IPFS hash
   */
  private mockStore(content: string): string {
    console.log('Using mock IPFS storage');
    
    // Generate a deterministic mock hash based on content
    const contentHash = this.generateMockHash(content);
    
    // Store in localStorage for retrieval
    try {
      localStorage.setItem(`mock-ipfs-${contentHash}`, content);
    } catch (e) {
      console.warn('Failed to store in localStorage, mock retrieval will not work:', e);
    }
    
    return contentHash;
  }

  /**
   * Mock method for retrieving content (for development or when IPFS unavailable)
   * @param hash IPFS hash to retrieve
   * @returns Retrieved content
   */
  private mockRetrieve(hash: string): string {
    console.log('Using mock IPFS retrieval');
    
    // Retrieve from localStorage
    const content = localStorage.getItem(`mock-ipfs-${hash}`);
    
    if (!content) {
      console.warn('Content not found in mock storage');
      return `Mock content for hash: ${hash}`;
    }
    
    return content;
  }

  /**
   * Generate a mock hash for development
   * @param content Content to hash
   * @returns Mock hash
   */
  private generateMockHash(content: string): string {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Convert to base58-like format (similar to IPFS CIDs)
    return 'Qm' + Math.abs(hash).toString(36).padStart(44, '0');
  }
}

// Create singleton instance
export const ipfsService = new IpfsService();
export default ipfsService; 