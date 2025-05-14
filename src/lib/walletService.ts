import { ethers } from 'ethers';
import { generateEncryptionKey, hash } from './cryptoService';

// Interface for user wallet data
export interface WalletData {
  address: string;
  publicKey?: string;
  stellarPublicKey?: string;
  messageSigningTime?: number;
  chainId?: number;
}

// Supported wallet types
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'phantom';

class WalletService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private currentWallet: WalletData | null = null;
  private walletType: WalletType | null = null;
  private connected: boolean = false;
  private readonly MESSAGE_PREFIX = 'dMail Authentication: ';

  /**
   * Initialize wallet connection
   * @param walletType Type of wallet to connect to
   * @returns Connected wallet data
   */
  async connect(walletType: WalletType = 'metamask'): Promise<WalletData | null> {
    try {
      this.walletType = walletType;
      
      // Wallet specific connection logic
      switch (walletType) {
        case 'metamask':
          // Ensure window.ethereum exists (MetaMask or similar)
          if (!window.ethereum) {
            throw new Error('MetaMask not detected. Please install MetaMask.');
          }
          
          // Request accounts access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create Web3 provider and signer
          this.provider = new ethers.providers.Web3Provider(window.ethereum);
          this.signer = this.provider.getSigner();
          
          // Get wallet address
          const address = await this.signer.getAddress();
          
          // Get connected chain ID
          const network = await this.provider.getNetwork();
          const chainId = network.chainId;
          
          // Create wallet data
          this.currentWallet = {
            address,
            chainId,
            messageSigningTime: Date.now()
          };
          
          this.connected = true;
          return this.currentWallet;
          
        // Other wallet types can be implemented similarly
        case 'walletconnect':
        case 'coinbase':
        case 'phantom':
          throw new Error(`Wallet type ${walletType} not yet implemented`);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.connected = false;
      this.currentWallet = null;
      this.provider = null;
      this.signer = null;
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.connected = false;
    this.currentWallet = null;
    this.provider = null;
    this.signer = null;
    this.walletType = null;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connected && this.currentWallet !== null;
  }

  /**
   * Get current wallet data
   */
  getWallet(): WalletData | null {
    return this.currentWallet;
  }

  /**
   * Get wallet type
   */
  getWalletType(): WalletType | null {
    return this.walletType;
  }

  /**
   * Sign a message with the wallet
   * @param message Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    if (!this.isConnected() || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Prefix message to make it clear it's for authentication
      const prefixedMessage = `${this.MESSAGE_PREFIX}${message}`;
      
      // Sign message
      return await this.signer.signMessage(prefixedMessage);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Generate a unique encryption key from the user's wallet
   * This creates a deterministic key that only the user can regenerate
   * @param salt Optional salt to make the key unique for different contexts
   * @returns Encryption key
   */
  async generateWalletDerivedKey(salt: string = ''): Promise<string> {
    if (!this.isConnected() || !this.signer || !this.currentWallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // Create a unique message based on the wallet address and salt
      const message = `Generate encryption key for ${this.currentWallet.address} with salt: ${salt}`;
      
      // Sign the message to get an unpredictable but deterministic value
      const signature = await this.signMessage(message);
      
      // Hash the signature to get a fixed-length key
      const keyHash = await hash(signature);
      
      return keyHash;
    } catch (error) {
      console.error('Failed to generate wallet-derived key:', error);
      throw new Error('Failed to generate wallet-derived key');
    }
  }

  /**
   * Link a Stellar account to the wallet
   * @param stellarPublicKey Stellar account public key
   */
  linkStellarAccount(stellarPublicKey: string): void {
    if (!this.isConnected() || !this.currentWallet) {
      throw new Error('Wallet not connected');
    }
    
    this.currentWallet.stellarPublicKey = stellarPublicKey;
  }

  /**
   * Verify a signature of a message
   * @param message Original message
   * @param signature Signature to verify
   * @param address Ethereum address that signed the message
   * @returns Whether the signature is valid
   */
  verifySignature(message: string, signature: string, address: string): boolean {
    try {
      // Prefix message the same way it was signed
      const prefixedMessage = `${this.MESSAGE_PREFIX}${message}`;
      
      // Recover signer address from signature
      const recoveredAddress = ethers.utils.verifyMessage(prefixedMessage, signature);
      
      // Check if recovered address matches expected address
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Create authentication token for backend API
   * @returns JWT-like token with signature
   */
  async createAuthToken(): Promise<string> {
    if (!this.isConnected() || !this.currentWallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // Create token payload
      const payload = {
        address: this.currentWallet.address,
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000).toString()
      };
      
      // Stringify payload
      const payloadStr = JSON.stringify(payload);
      
      // Sign payload
      const signature = await this.signMessage(payloadStr);
      
      // Create token
      const token = {
        payload,
        signature
      };
      
      // Encode token as base64
      return btoa(JSON.stringify(token));
    } catch (error) {
      console.error('Failed to create auth token:', error);
      throw new Error('Failed to create auth token');
    }
  }
}

// Create singleton instance
export const walletService = new WalletService();
export default walletService; 