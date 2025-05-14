import * as StellarSdk from 'stellar-sdk';

/**
 * Stellar Blockchain Service
 * Handles micropayments for email delivery using Stellar blockchain
 * 
 * This is a fully mocked implementation to avoid runtime errors with StellarSdk.Server
 */

// Payment details interface
export interface PaymentDetails {
  amount: string;
  asset: string;
  destination: string;
  memo?: string;
}

// Transaction result interface
export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  stellarSignature: string;
  stellarPublicKey: string;
}

export class StellarService {
  private server: any; // Changed from StellarSdk.Server to any
  private network: string;
  private isTestnet: boolean;
  // Always run in mock mode by default
  private mockMode: boolean = true;

  constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
    this.network = isTestnet ? 'TESTNET' : 'PUBLIC';
    
    // Handle browser environments where StellarSdk.Server might not be available
    try {
      if (typeof StellarSdk.Server === 'function') {
        this.server = new StellarSdk.Server(isTestnet 
          ? 'https://horizon-testnet.stellar.org' 
          : 'https://horizon.stellar.org');
        console.log(`Stellar service initialized in ${isTestnet ? 'testnet' : 'mainnet'} mode`);
      } else {
        console.warn('StellarSdk.Server not available, using mock mode');
        this.mockMode = true;
        this.server = null;
      }
    } catch (error) {
      console.warn('Error initializing Stellar server, using mock mode:', error);
      this.mockMode = true;
      this.server = null;
    }
  }

  /**
   * Initialize Stellar service - does nothing in mock mode
   */
  async initialize(): Promise<void> {
    console.log('Stellar service ready (mock mode)');
    return Promise.resolve();
  }

  /**
   * Create a new keypair for a user - this works with just the Keypair class
   * @returns Object containing public and secret keys
   */
  createKeyPair(): { publicKey: string; secretKey: string } {
    try {
      // Try to use the actual Stellar SDK
      try {
        // This should work even in environments without the full Stellar SDK
        const pair = StellarSdk.Keypair.random();
        return {
          publicKey: pair.publicKey(),
          secretKey: pair.secret(),
        };
      } catch (stellarError) {
        console.warn('Unable to use Stellar SDK for key generation, using fallback:', stellarError);
        
        // Generate a mock keypair that resembles Stellar format
        // Stellar public keys start with 'G', secret keys with 'S'
        return this.mockCreateAccount();
      }
    } catch (error) {
      console.error('Failed to create keypair, using mock:', error);
      return this.mockCreateAccount();
    }
  }

  /**
   * Sign data with a Stellar secret key
   * @param data The data to sign
   * @param secretKey The secret key to sign with
   * @returns Signature as a base64 string
   */
  async signData(data: string, secretKey: string): Promise<string> {
    try {
      if (this.mockMode) {
        return this.mockSignData(data, secretKey);
      }
      
      try {
        const keypair = StellarSdk.Keypair.fromSecret(secretKey);
        const dataBuffer = Buffer.from(data, 'utf8');
        const signature = keypair.sign(dataBuffer);
        return signature.toString('base64');
      } catch (sdkError) {
        console.error('Error using Stellar SDK to sign:', sdkError);
        return this.mockSignData(data, secretKey);
      }
    } catch (error) {
      console.error('Error signing data with Stellar:', error);
      return this.mockSignData(data, secretKey);
    }
  }

  /**
   * Verify a signature against Stellar public key
   * @param data The original data that was signed
   * @param signature The signature as a base64 string
   * @param publicKey The public key that should have created the signature
   * @returns Whether the signature is valid
   */
  async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    try {
      if (this.mockMode) {
        return this.mockVerifySignature();
      }
      
      try {
        const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
        const dataBuffer = Buffer.from(data, 'utf8');
        const signatureBuffer = Buffer.from(signature, 'base64');
        
        return keypair.verify(dataBuffer, signatureBuffer);
      } catch (sdkError) {
        console.error('Error using Stellar SDK to verify:', sdkError);
        return this.mockVerifySignature();
      }
    } catch (error) {
      console.error('Error verifying Stellar signature:', error);
      return false;
    }
  }

  /**
   * Get mock account details
   * @param publicKey Account public key
   * @returns Mocked account details
   */
  async getAccount(publicKey: string): Promise<any> {
    return {
      id: publicKey,
      accountId: publicKey,
      sequence: '12345',
      balances: [
        {
          asset_type: 'native',
          balance: '100.0000000'
        }
      ],
      data_attr: {} // Add empty data attributes
    };
  }

  /**
   * Send a payment using Stellar (mock implementation)
   * @param secretKey Sender's secret key (private key)
   * @param details Payment details
   * @returns Transaction result
   */
  async sendPayment(secretKey: string, details: PaymentDetails): Promise<TransactionResult> {
    return this.mockSendPayment(details);
  }

  /**
   * Get balance of an account (mock implementation)
   * @param publicKey Account public key
   * @returns Balance in XLM
   */
  async getBalance(publicKey: string): Promise<string> {
    return this.mockGetBalance(publicKey);
  }

  /**
   * Create a new account (mock implementation)
   * @returns Key pair (public and secret keys)
   */
  async createAccount(): Promise<{ publicKey: string; secretKey: string }> {
    return this.mockCreateAccount();
  }

  /**
   * Check if an account exists and has a trustline for an asset (mock implementation)
   * @returns Whether the account has a trustline for the asset
   */
  async hasTrustline(publicKey: string, asset: string): Promise<boolean> {
    console.log(`Mock check trustline for: ${publicKey}, asset: ${asset}`);
    return true;
  }

  /**
   * Create a trustline for an asset (mock implementation)
   * @returns Transaction result
   */
  async createTrustline(
    secretKey: string,
    asset: string,
    limit?: string
  ): Promise<TransactionResult> {
    console.log(`Mock create trustline for asset: ${asset}, limit: ${limit || 'unlimited'}`);
    
    return {
      success: true,
      transactionId: 'mock_tx_' + Math.random().toString(36).substring(2, 15)
    };
  }

  /**
   * Get transaction details (mock implementation)
   * @param transactionId Transaction ID
   * @returns Transaction details
   */
  async getTransaction(transactionId: string): Promise<any> {
    console.log(`Mock get transaction details for: ${transactionId}`);
    
    return {
      id: transactionId,
      successful: true,
      created_at: new Date().toISOString(),
      source_account: 'G' + Math.random().toString(36).substring(2, 30).toUpperCase(),
      fee_charged: '100',
      memo_type: 'none'
    };
  }

  /**
   * Switch between testnet and public network (mock implementation)
   * @param useTestnet Whether to use testnet
   */
  switchNetwork(useTestnet: boolean): void {
    this.isTestnet = useTestnet;
    console.log(`Switched to ${useTestnet ? 'testnet' : 'public'} network (mock)`);
  }

  /**
   * Get minimum balance for an account
   * @param numEntries Number of entries (trustlines, offers, etc.)
   * @returns Minimum balance in XLM
   */
  getMinimumBalance(numEntries: number = 0): string {
    // Base reserve is 0.5 XLM, and each entry requires 0.5 XLM
    const baseReserve = 0.5;
    const entryReserve = 0.5;
    
    const minBalance = (2 * baseReserve) + (numEntries * entryReserve);
    return minBalance.toString();
  }

  // ----- MOCK IMPLEMENTATIONS -----

  /**
   * Mock implementation of signData
   */
  private mockSignData(data: string, secretKey: string): string {
    console.log(`MOCK STELLAR SIGNING`);
    console.log('------------------');
    console.log(`Data: ${data.substring(0, 20)}${data.length > 20 ? '...' : ''}`);
    console.log(`Secret Key: [REDACTED]`);
    console.log('------------------');
    
    // Generate a mock signature
    return 'MOCK_SIGNATURE_' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Mock implementation of verifySignature
   */
  private mockVerifySignature(): boolean {
    console.log('MOCK STELLAR SIGNATURE VERIFICATION');
    console.log('----------------------------------');
    console.log('Verification result: true (mocked)');
    console.log('----------------------------------');
    
    // Always return true in mock mode
    return true;
  }

  /**
   * Mock implementation of sendPayment
   */
  private mockSendPayment(details: PaymentDetails): Promise<TransactionResult> {
    console.log('MOCK STELLAR PAYMENT');
    console.log('-------------------');
    console.log(`Amount: ${details.amount} ${details.asset}`);
    console.log(`Destination: ${details.destination}`);
    if (details.memo) {
      console.log(`Memo: ${details.memo}`);
    }
    console.log('-------------------');
    
    // Mock transaction ID
    const txId = 'tx_' + Math.random().toString(36).substring(2, 15);
    
    // Simulate network delay
    return new Promise<TransactionResult>(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: txId
        });
      }, 1000);
    });
  }
  
  /**
   * Mock implementation of getBalance
   */
  private mockGetBalance(publicKey: string): string {
    console.log(`Mock get balance for address: ${publicKey}`);
    
    // Return a random balance between 10 and 100 XLM
    return (10 + Math.random() * 90).toFixed(7);
  }
  
  /**
   * Mock implementation of createAccount
   */
  private mockCreateAccount(): { publicKey: string; secretKey: string } {
    // Generate mock keys
    const publicKey = 'G' + Math.random().toString(36).substring(2, 30).toUpperCase();
    const secretKey = 'S' + Math.random().toString(36).substring(2, 30).toUpperCase();
    
    console.log('Created mock Stellar account:');
    console.log(`Public Key: ${publicKey}`);
    console.log('Secret Key: [REDACTED]');
    
    return { publicKey, secretKey };
  }

  // Initialize account if needed
  async initializeAccount(publicKey: string): Promise<void> {
    // Always use mock implementation in browser
    if (this.mockMode || !this.server) {
      console.log(`Mock initializing account: ${publicKey}`);
      return Promise.resolve();
    }
    
    try {
      // Check if account exists
      await this.server.loadAccount(publicKey);
    } catch (e) {
      if (!this.isTestnet) {
        throw new Error('Account does not exist and cannot be auto-created on mainnet');
      }
      
      // Account doesn't exist, so create a friendbot request to fund it
      try {
        const response = await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
        );
        const responseJSON = await response.json();
        console.log("Friendbot response:", responseJSON);
      } catch (error) {
        console.error('Error funding account:', error);
        throw new Error('Failed to initialize Stellar account');
      }
    }
  }

  // Get emails for a user
  async getEmails(publicKey: string): Promise<Email[]> {
    // Use mock implementation in browser or if server is not available
    if (this.mockMode || !this.server) {
      return this.getMockEmails();
    }
    
    try {
      // Ensure account is initialized
      await this.initializeAccount(publicKey);

      // Query the Stellar Data API (Note: This is a simplified example)
      // In a real implementation, you'd use account data or a custom hosted service
      const account = await this.server.loadAccount(publicKey);
      
      // Check if the account has data entries for emails
      const emails: Email[] = [];
      
      // Parse data entries from the account
      for (const [key, value] of Object.entries(account.data_attr || {})) {
        if (key.startsWith('email_')) {
          try {
            const decodedValue = Buffer.from(value as string, 'base64').toString('utf-8');
            const emailData = JSON.parse(decodedValue);
            emails.push({
              ...emailData,
              timestamp: new Date(emailData.timestamp)
            });
          } catch (err) {
            console.error('Error parsing email data:', err);
          }
        }
      }
      
      // For demo purposes, we'll create some mock emails if none exist
      if (emails.length === 0) {
        return this.getMockEmails();
      }
      
      return emails;
    } catch (error) {
      console.error('Error getting emails:', error);
      return this.getMockEmails(); // Return mock data for demo purposes
    }
  }

  // Mark email as read
  async markAsRead(emailId: string, publicKey: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the email status on Stellar
      console.log(`Marking email ${emailId} as read for ${publicKey}`);
      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  // Toggle star status
  async toggleStar(emailId: string, publicKey: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the star status on Stellar
      console.log(`Toggling star for email ${emailId} for ${publicKey}`);
      return true;
    } catch (error) {
      console.error('Error toggling star:', error);
      return false;
    }
  }

  // Delete an email
  async deleteEmail(emailId: string, publicKey: string): Promise<boolean> {
    try {
      // In a real implementation, this would delete the email on Stellar
      console.log(`Deleting email ${emailId} for ${publicKey}`);
      return true;
    } catch (error) {
      console.error('Error deleting email:', error);
      return false;
    }
  }

  // Share an email with another user via Stellar
  async shareEmail(emailId: string, fromPublicKey: string, toPublicKey: string): Promise<boolean> {
    try {
      // In a real implementation, this would share the email via Stellar
      console.log(`Sharing email ${emailId} from ${fromPublicKey} to ${toPublicKey}`);
      return true;
    } catch (error) {
      console.error('Error sharing email:', error);
      return false;
    }
  }

  // Send a new email via Stellar
  async sendEmail(email: Omit<Email, 'id' | 'timestamp' | 'stellarSignature'>, 
                 fromPublicKey: string, 
                 toPublicKey: string, 
                 privateKey: string): Promise<string> {
    try {
      // Generate ID and timestamp
      const id = this.generateId();
      const timestamp = new Date();
      
      // In browser or mock mode, just log the action
      if (this.mockMode) {
        console.log(`Mock sending email from ${fromPublicKey} to ${toPublicKey}`);
        console.log(`Subject: ${email.subject}`);
        return id;
      }
      
      try {
        // Sign the email content with the sender's private key
        const keypair = StellarSdk.Keypair.fromSecret(privateKey);
        const dataToSign = `${email.subject}:${email.content}:${toPublicKey}:${timestamp.toISOString()}`;
        const dataBuffer = Buffer.from(dataToSign);
        const signature = keypair.sign(dataBuffer).toString('base64');
        
        // In a real implementation, you would store this in Stellar's data entries or a custom service
        console.log(`Sending email from ${fromPublicKey} to ${toPublicKey}`);
        
        return id;
      } catch (sdkError) {
        console.error('Error using Stellar SDK:', sdkError);
        return id; // Return ID anyway for demo
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Still return an ID for demo purposes
      return this.generateId();
    }
  }

  // Generate a random ID
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Get mock emails for demo purposes
  private getMockEmails(): Email[] {
    return [
      {
        id: this.generateId(),
        from: 'stellar@base.xyz',
        subject: 'Welcome to Base Stellar Integration',
        content: 'Thank you for using our Base Stellar integration! This email is secured by blockchain technology, ensuring privacy and authenticity.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false,
        isStarred: false,
        labels: ['important', 'inbox'],
        stellarSignature: 'valid-signature-1',
        stellarPublicKey: 'GDKXYSGK3CLLOKJTFUPIIDPJAT4IWHS6EAKBS2CVLCV3QM6APLCBXXB7'
      },
      {
        id: this.generateId(),
        from: 'team@basenetwork.org',
        subject: 'Your Base Network Update',
        content: 'The Base Network has some exciting updates this month! Check out our latest developments and how they can benefit your decentralized applications.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        isRead: true,
        isStarred: true,
        labels: ['updates', 'inbox'],
        stellarSignature: 'valid-signature-2',
        stellarPublicKey: 'GBIVADXUXTH2YSZX5FJWSMJDKJVJC2TJSDYYDIBCAJIATS4KTS4KHO2Y'
      },
      {
        id: this.generateId(),
        from: 'security@stellaralert.io',
        subject: 'Security Alert: New Login',
        content: 'We detected a new login to your Stellar account from a new device. If this was you, no action is needed. If not, please secure your account immediately.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        isRead: true,
        isStarred: false,
        labels: ['security', 'important'],
        stellarSignature: 'valid-signature-3',
        stellarPublicKey: 'GDSB3DWKLVYWSSYCBVL5OLIURHSIFVPX7WXQZNMKUAKRLSYKSKV6KNF5'
      },
      {
        id: this.generateId(),
        from: 'newsletter@crypto-daily.com',
        subject: 'This Week in Crypto: Stellar Developments',
        content: 'The Stellar network has seen significant adoption this week with multiple financial institutions announcing integration. Read our full analysis of what this means for the ecosystem.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        isRead: false,
        isStarred: true,
        labels: ['newsletter'],
        stellarSignature: '',
        stellarPublicKey: ''
      },
      {
        id: this.generateId(),
        from: 'transactions@stellar-pay.io',
        subject: 'Transaction Receipt: 25 XLM',
        content: 'You have received 25 XLM from account GDKXYSGK3CLLOKJTFUPIIDPJAT4IWHS6EAKBS2CVLCV3QM6APLCBXXB7. Transaction ID: 3a1e454b5a2c...',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
        isRead: true,
        isStarred: false,
        labels: ['transactions'],
        stellarSignature: 'valid-signature-4',
        stellarPublicKey: 'GDKXYSGK3CLLOKJTFUPIIDPJAT4IWHS6EAKBS2CVLCV3QM6APLCBXXB7'
      }
    ];
  }

  // Check if an address exists
  async addressExists(publicKey: string): Promise<boolean> {
    // Always return true in mock mode
    if (this.mockMode || !this.server) {
      return true;
    }
    
    try {
      await this.server.loadAccount(publicKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Convert XLM to USD
  async getXlmToUsdRate(): Promise<number> {
    try {
      // In a real implementation, you'd query an exchange API
      return 0.37; // Mock value
    } catch (error) {
      console.error('Error getting XLM to USD rate:', error);
      return 0.37; // Default mock value
    }
  }
}

// Create a singleton instance
export const stellarService = new StellarService();
export default stellarService; 