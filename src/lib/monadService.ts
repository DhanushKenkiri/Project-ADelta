/**
 * Monad Blockchain Service
 * Handles storing and retrieving email metadata on Monad blockchain
 */

import { ethers } from 'ethers';
import walletService from './walletService';

// Mock ABI for the EmailMetadata contract
const EMAIL_METADATA_ABI = [
  'function storeMetadata(address recipient, string ipfsHash, bool isPaid) returns (string)',
  'function markAsRead(string ipfsHash) returns (bool)',
  'function getMessagesByRecipient(address recipient) returns (string[])',
  'function getMessagesBySender(address sender) returns (string[])'
];

// Metadata interface for email metadata stored on blockchain
export interface MessageMetadata {
  sender: string;
  recipient: string;
  ipfsHash: string;
  timestamp: number;
  isPaid: boolean;
  isRead: boolean;
  transactionId: string;
}

class MonadService {
  private provider: ethers.providers.Web3Provider | null = null;
  private contract: ethers.Contract | null = null;
  private readonly MOCK_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
  
  // Store message metadata in memory for mock service
  private mockMetadata: MessageMetadata[] = [];
  
  /**
   * Initialize the Monad service
   */
  async initialize(): Promise<void> {
    try {
      // Check if wallet is connected
      if (!walletService.isConnected()) {
        await walletService.connect();
      }
      
      // Get provider from wallet service (in a real implementation)
      // this.provider = walletService.getProvider();
      
      // For development, we'll use a mock provider instead
      this.provider = null;
      
      console.log('Monad service initialized');
    } catch (error) {
      console.error('Failed to initialize Monad service:', error);
      throw error;
    }
  }
  
  /**
   * Store message metadata on blockchain
   * @param recipient Recipient's address
   * @param ipfsHash IPFS hash of the message
   * @param isPaid If the message includes a micropayment
   * @returns Transaction ID
   */
  async sendMessage(
    recipient: string,
    ipfsHash: string,
    isPaid: boolean = false
  ): Promise<string> {
    try {
      // Check if provider and contract are available
      if (this.provider && this.contract) {
        // In a real implementation, call the contract method
        const transaction = await this.contract.storeMetadata(
          recipient,
          ipfsHash,
          isPaid
        );
        
        // Wait for transaction to be mined
        const receipt = await transaction.wait();
        
        return receipt.transactionHash;
      } else {
        // Use mock implementation for development
        return this.mockSendMessage(recipient, ipfsHash, isPaid);
      }
    } catch (error) {
      console.error('Failed to send message metadata to blockchain:', error);
      throw new Error('Failed to send message metadata to blockchain');
    }
  }
  
  /**
   * Mark a message as read on blockchain
   * @param ipfsHash IPFS hash of the message
   * @returns Success status
   */
  async markAsRead(ipfsHash: string): Promise<boolean> {
    try {
      // Check if provider and contract are available
      if (this.provider && this.contract) {
        // In a real implementation, call the contract method
        const transaction = await this.contract.markAsRead(ipfsHash);
        
        // Wait for transaction to be mined
        await transaction.wait();
        
        return true;
      } else {
        // Use mock implementation for development
        return this.mockMarkAsRead(ipfsHash);
      }
    } catch (error) {
      console.error('Failed to mark message as read on blockchain:', error);
      throw new Error('Failed to mark message as read on blockchain');
    }
  }
  
  /**
   * Get messages for a recipient
   * @param recipient Recipient's address
   * @returns Array of IPFS hashes
   */
  async getMessagesByRecipient(recipient: string): Promise<string[]> {
    try {
      // Check if provider and contract are available
      if (this.provider && this.contract) {
        // In a real implementation, call the contract method
        return await this.contract.getMessagesByRecipient(recipient);
      } else {
        // Use mock implementation for development
        return this.mockGetMessagesByRecipient(recipient);
      }
    } catch (error) {
      console.error('Failed to get messages by recipient from blockchain:', error);
      throw new Error('Failed to get messages by recipient from blockchain');
    }
  }
  
  /**
   * Get messages sent by a sender
   * @param sender Sender's address
   * @returns Array of IPFS hashes
   */
  async getMessagesBySender(sender: string): Promise<string[]> {
    try {
      // Check if provider and contract are available
      if (this.provider && this.contract) {
        // In a real implementation, call the contract method
        return await this.contract.getMessagesBySender(sender);
      } else {
        // Use mock implementation for development
        return this.mockGetMessagesBySender(sender);
      }
    } catch (error) {
      console.error('Failed to get messages by sender from blockchain:', error);
      throw new Error('Failed to get messages by sender from blockchain');
    }
  }
  
  /**
   * Mock implementation of sendMessage for development
   */
  private mockSendMessage(
    recipient: string,
    ipfsHash: string,
    isPaid: boolean
  ): string {
    // Get sender from wallet service
    const sender = walletService.getWallet()?.address || 'unknown';
    
    // Create mock transaction ID
    const txId = 'tx_' + Math.random().toString(36).substring(2, 10);
    
    // Store metadata
    this.mockMetadata.push({
      sender,
      recipient,
      ipfsHash,
      timestamp: Date.now(),
      isPaid,
      isRead: false,
      transactionId: txId
    });
    
    console.log('Mock blockchain transaction:', txId);
    
    return txId;
  }
  
  /**
   * Mock implementation of markAsRead for development
   */
  private mockMarkAsRead(ipfsHash: string): boolean {
    // Find the message
    const index = this.mockMetadata.findIndex(meta => meta.ipfsHash === ipfsHash);
    
    if (index >= 0) {
      // Mark as read
      this.mockMetadata[index].isRead = true;
      return true;
    }
    
    return false;
  }
  
  /**
   * Mock implementation of getMessagesByRecipient for development
   */
  private mockGetMessagesByRecipient(recipient: string): string[] {
    // Filter messages by recipient
    return this.mockMetadata
      .filter(meta => meta.recipient.toLowerCase() === recipient.toLowerCase())
      .map(meta => meta.ipfsHash);
  }
  
  /**
   * Mock implementation of getMessagesBySender for development
   */
  private mockGetMessagesBySender(sender: string): string[] {
    // Filter messages by sender
    return this.mockMetadata
      .filter(meta => meta.sender.toLowerCase() === sender.toLowerCase())
      .map(meta => meta.ipfsHash);
  }
}

// Create singleton instance
export const monadService = new MonadService();
export default monadService; 