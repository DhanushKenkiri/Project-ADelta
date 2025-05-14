import ipfsService from './ipfsService';
import monadService, { MessageMetadata } from './monadService';
import stellarService, { PaymentDetails, TransactionResult } from './stellarService';
import walletService from './walletService';
import { generateEncryptionKey } from './cryptoService';

// Email types
export interface EmailContent {
  subject: string;
  body: string;
  htmlContent?: string;
  attachments?: Attachment[];
  sender?: string;
  recipient?: string;
  timestamp?: number;
}

export interface Attachment {
  name: string;
  content: string; // Base64 encoded content
  type: string;
}

// Email delivery options
export interface EmailDeliveryOptions {
  useMicropayment?: boolean;
  paymentAmount?: string;
  paymentAsset?: string;
  encryptionKey?: string;
  isWeb2Delivery?: boolean;
}

// Message info for displaying in UI
export interface MessageInfo {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  timestamp: number;
  read: boolean;
  ipfsHash: string;
  paid: boolean;
  transactionId?: string;
}

class DMailService {
  private readonly API_URL = 'https://api.dmail.io'; // Backend API for Web2 delivery

  /**
   * Send an email through the decentralized system
   * @param content Email content
   * @param recipient Recipient's identifier (email or wallet address)
   * @param options Delivery options
   * @returns Transaction details
   */
  async sendEmail(
    content: EmailContent,
    recipient: string,
    options: EmailDeliveryOptions = {}
  ): Promise<{ 
    success: boolean; 
    ipfsHash?: string; 
    transactionId?: string;
    paymentTransactionId?: string;
    error?: string;
  }> {
    try {
      // Ensure wallet is connected
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Generate encryption key if not provided
      const encryptionKey = options.encryptionKey || generateEncryptionKey();
      
      // Add sender and recipient information to content
      const walletData = walletService.getWallet();
      const fullContent: EmailContent = {
        ...content,
        sender: walletData?.address || 'unknown',
        recipient,
        timestamp: Date.now(),
      };
      
      // Store encrypted content on IPFS
      const ipfsHash = await ipfsService.storeEncryptedContent(
        JSON.stringify(fullContent),
        encryptionKey
      );
      
      // If Html content exists, store it separately
      let htmlIpfsHash;
      if (fullContent.htmlContent) {
        htmlIpfsHash = await ipfsService.storeHtmlTemplate(fullContent.htmlContent);
        console.log(`HTML template stored on IPFS: ${htmlIpfsHash}`);
      }

      // Process micropayment if required
      let paymentResult: TransactionResult | null = null;
      
      if (options.useMicropayment && options.paymentAmount && options.paymentAsset) {
        // Ensure Stellar account is linked
        const stellarPublicKey = walletData?.stellarPublicKey;
        if (!stellarPublicKey) {
          throw new Error('Stellar account not linked to wallet.');
        }
        
        // Get recipient's Stellar account (for demo, we use a predefined one)
        const recipientStellarAccount = ''; // In production, this would be fetched from a service
        
        // Execute payment
        const paymentDetails: PaymentDetails = {
          amount: options.paymentAmount,
          asset: options.paymentAsset,
          destination: recipientStellarAccount,
          memo: `dMail payment for message: ${ipfsHash.substring(0, 8)}`
        };
        
        // This would require the user's Stellar secret key, which should be securely stored
        // For demo purposes, we're skipping the actual payment
        // paymentResult = await stellarService.sendPayment(userSecretKey, paymentDetails);
        
        // Simulate successful payment for demo
        paymentResult = {
          success: true,
          transactionId: `simulated-tx-${Date.now()}`
        };
      }

      // Store metadata on blockchain
      const transactionId = await monadService.sendMessage(
        recipient,
        ipfsHash,
        !!paymentResult?.success
      );
      
      // If Web2 delivery is requested, send via backend API
      if (options.isWeb2Delivery) {
        await this.sendViaWeb2(recipient, ipfsHash, encryptionKey);
      }

      return {
        success: true,
        ipfsHash,
        transactionId,
        paymentTransactionId: paymentResult?.transactionId
      };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Fetch and decrypt an email from IPFS using the hash from blockchain
   * @param ipfsHash IPFS hash of the encrypted email
   * @param decryptionKey Key to decrypt the email
   * @returns Decrypted email content
   */
  async getEmail(ipfsHash: string, decryptionKey: string): Promise<EmailContent> {
    try {
      // Retrieve and decrypt content from IPFS
      const decryptedContent = await ipfsService.retrieveEncryptedContent(
        ipfsHash,
        decryptionKey
      );
      
      // Parse the content
      const emailContent: EmailContent = JSON.parse(decryptedContent);
      
      // Mark as read on blockchain
      try {
        await monadService.markAsRead(ipfsHash);
      } catch (error) {
        console.warn('Failed to mark message as read on blockchain:', error);
        // Continue anyway, this is not critical
      }
      
      return emailContent;
    } catch (error) {
      console.error('Failed to get email:', error);
      throw new Error('Failed to get email');
    }
  }

  /**
   * Get all incoming messages for the current user
   * @returns Array of message info
   */
  async getInbox(): Promise<MessageInfo[]> {
    try {
      // Ensure wallet is connected
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      // Get wallet address
      const walletData = walletService.getWallet();
      if (!walletData) {
        throw new Error('Wallet data not available.');
      }
      
      // Get message hashes from blockchain
      const messageHashes = await monadService.getMessagesByRecipient(walletData.address);
      
      // Create blank array for message info
      const messages: MessageInfo[] = [];
      
      // This would normally fetch and decrypt each message to get subject, etc.
      // For demo purposes, we'll return minimal info
      for (const hash of messageHashes) {
        messages.push({
          id: hash,
          ipfsHash: hash,
          sender: 'unknown', // Would be extracted from decrypted content
          recipient: walletData.address,
          subject: 'Message on blockchain', // Would be extracted from decrypted content
          timestamp: Date.now() - Math.random() * 86400000, // Random time in last 24h
          read: false, // Would check blockchain for read status
          paid: false  // Would check blockchain for payment status
        });
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to get inbox:', error);
      throw new Error('Failed to get inbox');
    }
  }

  /**
   * Get all outgoing messages from the current user
   * @returns Array of message info
   */
  async getSentMessages(): Promise<MessageInfo[]> {
    try {
      // Ensure wallet is connected
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      // Get wallet address
      const walletData = walletService.getWallet();
      if (!walletData) {
        throw new Error('Wallet data not available.');
      }
      
      // Get message hashes from blockchain
      const messageHashes = await monadService.getMessagesBySender(walletData.address);
      
      // Create blank array for message info
      const messages: MessageInfo[] = [];
      
      // This would normally fetch and decrypt each message to get subject, etc.
      // For demo purposes, we'll return minimal info
      for (const hash of messageHashes) {
        messages.push({
          id: hash,
          ipfsHash: hash,
          sender: walletData.address,
          recipient: 'unknown', // Would be extracted from decrypted content
          subject: 'Message on blockchain', // Would be extracted from decrypted content
          timestamp: Date.now() - Math.random() * 86400000, // Random time in last 24h
          read: true, // Sent messages are always read
          paid: false  // Would check blockchain for payment status
        });
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to get sent messages:', error);
      throw new Error('Failed to get sent messages');
    }
  }

  /**
   * Trigger Web2 email delivery via backend API
   * @param recipient Recipient's email address
   * @param ipfsHash IPFS hash of the encrypted message
   * @param encryptionKey Key to decrypt the message
   */
  private async sendViaWeb2(
    recipient: string,
    ipfsHash: string,
    encryptionKey: string
  ): Promise<boolean> {
    try {
      // Ensure wallet is connected for authentication
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      // Generate auth token
      const authToken = await walletService.createAuthToken();
      
      // Call backend API
      const response = await fetch(`${this.API_URL}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipient,
          ipfsHash,
          encryptionKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to send via Web2:', error);
      throw new Error('Failed to send via Web2');
    }
  }

  /**
   * Create a new encryption key for a new message
   * @returns Newly generated encryption key
   */
  generateMessageKey(): string {
    return generateEncryptionKey();
  }

  /**
   * Get public gateway URL for an IPFS hash
   * @param ipfsHash IPFS hash
   * @returns Public gateway URL
   */
  getIpfsPublicUrl(ipfsHash: string): string {
    return ipfsService.getGatewayUrl(ipfsHash);
  }
}

// Create singleton instance
export const dMailService = new DMailService();
export default dMailService; 