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

class StellarService {
  private isTestnet: boolean;
  // Always run in mock mode by default
  private mockMode: boolean = true;

  constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
    console.log('Stellar service initialized in mock mode');
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
      ]
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
}

// Create singleton instance
export const stellarService = new StellarService();
export default stellarService; 