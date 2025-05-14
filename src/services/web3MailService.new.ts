import { ethers } from 'ethers';
import { create as createIPFS } from 'ipfs-http-client';
import { encrypt, decrypt } from '@/lib/cryptoUtils';
import { getLocalUserId } from './localStorageService';
// Import stellarService instead of direct StellarSdk
import { stellarService } from '@/lib/stellarService';

// This application uses a mock implementation of Stellar SDK to avoid runtime errors
// All Stellar functionality is delegated to stellarService

// Create the IPFS client
const ipfs = createIPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${btoa(`${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`)}`
  }
});

// Load contract ABI
const MAIL_SHARE_ABI = [
  "function sendMail(address _to, string memory _encryptedContent, string memory _encryptedSubject, string memory _ipfsHash, bool _isWeb2Fallback) external",
  "function getMailCount() external view returns (uint256)",
  "function getMail(uint256 _index) external view returns (address sender, string memory encryptedContent, string memory encryptedSubject, uint256 timestamp, string memory ipfsHash, bool isWeb2Fallback)",
  "function setPublicKey(string memory _publicKey) external",
  "function getPublicKey(address _user) external view returns (string memory)",
  "function deleteMail(uint256 _index) external",
  "function setEmailAddress(string memory _emailAddress) external",
  "function getEmailAddress(address _user) external view returns (string memory)",
  "function resolveEmailToAddress(string memory _emailAddress) external view returns (address)"
];

// L2 network configuration
interface NetworkConfig {
  chainId: number;
  name: string;
  contractAddress: string;
  rpcUrl: string;
  domain: string; // Email domain for the network
  gasless: boolean; // Whether this network supports gasless transactions
}

// Contract addresses on different L2 networks
const L2_NETWORKS: Record<string, NetworkConfig> = {
  base: {
    chainId: 8453,
    name: 'Base',
    contractAddress: process.env.BASE_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    domain: 'base',
    gasless: true
  },
  monad: {
    chainId: 1024,
    name: 'Monad',
    contractAddress: process.env.MONAD_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.MONAD_RPC_URL || 'https://rpc.monad.xyz',
    domain: 'monad',
    gasless: true
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    contractAddress: process.env.OPTIMISM_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    domain: 'optimism',
    gasless: false
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    contractAddress: process.env.ARBITRUM_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    domain: 'arbitrum',
    gasless: false
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    contractAddress: process.env.POLYGON_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    domain: 'polygon',
    gasless: false
  }
};

// Default to Base if available (for gasless transactions)
const DEFAULT_NETWORK = 'base';

// Mail interface
export interface MailMessage {
  id: string;
  sender: string;
  senderEmail?: string;
  recipient?: string;
  subject: string;
  content: string;
  timestamp: number;
  web3Tx?: string;
  isWeb2Fallback: boolean;
  networkName?: string;
}

// Local storage for web2 fallback
const WEB2_MAIL_KEY = 'adelta_mail_messages';
const STELLAR_KEYPAIR_KEY = 'adelta_stellar_keypair';
const EMAIL_ADDRESS_KEY = 'adelta_email_address';

class Web3MailService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Wallet | null = null;
  private currentNetwork: string = DEFAULT_NETWORK;
  private walletConnected: boolean = false;
  private stellarKeypair: any = null; // Changed type to any to avoid direct dependency
  private emailAddress: string | null = null;
  private useStellar: boolean = false; // Flag to determine if Stellar features should be used
  
  constructor() {
    // Initialize with preferred network
    this.initializeWeb3();
    this.loadEmailAddress();
    // Don't load Stellar keypair by default - will be loaded on demand
  }
  
  // Initialize Web3 provider and contract
  async initializeWeb3(networkName: string = DEFAULT_NETWORK): Promise<boolean> {
    try {
      const network = L2_NETWORKS[networkName];
      if (!network || !network.contractAddress) {
        console.error(`Network ${networkName} not configured or missing contract address`);
        return false;
      }
      
      this.currentNetwork = networkName;
      
      try {
        console.log(`Attempting to initialize provider with RPC URL: ${network.rpcUrl}`);
        this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
        
        console.log("Provider initialized, creating contract instance");
        // Initialize contract without signer first (read-only mode)
        this.contract = new ethers.Contract(
          network.contractAddress,
          MAIL_SHARE_ABI,
          this.provider
        );
        
        console.log(`Initialized Web3 with ${network.name}`);
        return true;
      } catch (ethersError) {
        console.error('Failed to initialize ethers provider:', ethersError);
        this.provider = null;
        this.contract = null;
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      this.provider = null;
      this.contract = null;
      return false;
    }
  }
  
  // Connect wallet
  async connectWallet(privateKey?: string): Promise<boolean> {
    try {
      if (!this.provider) {
        const initialized = await this.initializeWeb3();
        if (!initialized) return false;
      }
      
      if (privateKey) {
        // Connect with private key
        this.signer = new ethers.Wallet(privateKey, this.provider);
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Connect with browser wallet (MetaMask, etc.)
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }
        
        const signer = await browserProvider.getSigner();
        this.signer = signer as unknown as ethers.Wallet;
      } else {
        throw new Error('No wallet provider available');
      }
      
      // Update contract with signer
      if (this.contract) {
        this.contract = new ethers.Contract(
          this.contract.target,
          MAIL_SHARE_ABI,
          this.signer
        );
      }
      
      // If we have an email address, register it on-chain
      if (this.emailAddress) {
        await this.setEmailAddressOnChain(this.emailAddress);
      }
      
      this.walletConnected = true;
      console.log(`Wallet connected: ${await this.signer.getAddress()}`);
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.signer = null;
      this.walletConnected = false;
      return false;
    }
  }
  
  // Load Stellar keypair from localStorage - called only when needed
  private async enableStellarFeatures(): Promise<boolean> {
    if (this.useStellar) return true; // Already enabled
    
    try {
      // Initialize stellarService if needed
      await stellarService.initialize();
      
      // Try to load existing keypair
      const keypairStr = localStorage.getItem(STELLAR_KEYPAIR_KEY);
      if (keypairStr) {
        try {
          const { publicKey, secretKey } = JSON.parse(keypairStr);
          this.stellarKeypair = { publicKey, secretKey };
          console.log('Stellar keypair loaded from localStorage');
        } catch (parseError) {
          console.error('Error parsing stellar keypair from localStorage:', parseError);
          // Generate a new keypair
          this.stellarKeypair = await this.generateStellarKeypairInternal();
        }
      }
      
      this.useStellar = true;
      return true;
    } catch (error) {
      console.error('Failed to enable Stellar features:', error);
      this.useStellar = false;
      return false;
    }
  }

  // Internal method to generate keypair
  private async generateStellarKeypairInternal(): Promise<any> {
    // Use stellarService to create keypair
    const keypair = stellarService.createKeyPair();
    
    // Store keypair in localStorage
    localStorage.setItem(STELLAR_KEYPAIR_KEY, JSON.stringify(keypair));
    
    return keypair;
  }
  
  // Generate a new Stellar keypair (public method)
  async generateStellarKeypair(): Promise<any> {
    try {
      await this.enableStellarFeatures();
      
      this.stellarKeypair = await this.generateStellarKeypairInternal();
      return this.stellarKeypair;
    } catch (error) {
      console.error('Failed to generate Stellar keypair:', error);
      throw error;
    }
  }
  
  // Load email address from localStorage
  private loadEmailAddress(): void {
    try {
      this.emailAddress = localStorage.getItem(EMAIL_ADDRESS_KEY);
    } catch (error) {
      console.error('Failed to load email address:', error);
    }
  }
  
  // Set email address locally and on chain
  async setEmailAddress(emailAddress: string): Promise<boolean> {
    try {
      // Validate the email format (username@network)
      const emailRegex = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9_-]+)$/;
      const match = emailAddress.match(emailRegex);
      
      if (!match) {
        throw new Error('Invalid email format. Should be username@network');
      }
      
      const domain = match[1].toLowerCase();
      
      // Check if the domain is a valid network
      const validDomains = Object.values(L2_NETWORKS).map(n => n.domain);
      if (!validDomains.includes(domain)) {
        throw new Error(`Invalid network domain. Valid domains are: ${validDomains.join(', ')}`);
      }
      
      // Store the email address locally
      this.emailAddress = emailAddress;
      localStorage.setItem(EMAIL_ADDRESS_KEY, emailAddress);
      
      // Set it on chain if wallet is connected
      if (this.isWalletConnected()) {
        return await this.setEmailAddressOnChain(emailAddress);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set email address:', error);
      return false;
    }
  }
  
  // Set email address on chain
  private async setEmailAddressOnChain(emailAddress: string): Promise<boolean> {
    try {
      if (!this.isWeb3Available() || !this.isWalletConnected()) {
        throw new Error('Web3 not available or wallet not connected');
      }
      
      // Only proceed if we're on a gasless network to avoid fees
      const network = L2_NETWORKS[this.currentNetwork];
      if (network.gasless) {
        const tx = await this.contract!.setEmailAddress(emailAddress);
        await tx.wait();
        console.log('Email address registered on chain');
      } else {
        console.log('Skipping on-chain email registration on non-gasless network');
      }
      
      return true;
    } catch (error) {
      console.error('Error setting email address on chain:', error);
      return false;
    }
  }
  
  // Resolve email address to Ethereum address
  async resolveEmailToAddress(emailAddress: string): Promise<string | null> {
    try {
      if (!this.isWeb3Available()) {
        return null;
      }
      
      // Parse the email domain to determine which network to use
      const emailRegex = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9_-]+)$/;
      const match = emailAddress.match(emailRegex);
      
      if (!match) {
        throw new Error('Invalid email format');
      }
      
      const domain = match[1].toLowerCase();
      
      // Find the network by domain
      const network = Object.values(L2_NETWORKS).find(n => n.domain === domain);
      if (!network) {
        throw new Error(`Unsupported email domain: ${domain}`);
      }
      
      // Switch to the appropriate network if needed
      if (this.currentNetwork !== Object.keys(L2_NETWORKS).find(key => 
        L2_NETWORKS[key].domain === domain)) {
        await this.initializeWeb3(Object.keys(L2_NETWORKS).find(key => 
          L2_NETWORKS[key].domain === domain) || DEFAULT_NETWORK);
      }
      
      // Call the contract to resolve the address
      const address = await this.contract!.resolveEmailToAddress(emailAddress);
      return address || null;
    } catch (error) {
      console.error('Error resolving email to address:', error);
      return null;
    }
  }
  
  // Check if web3 is available and wallet is connected
  isWeb3Available(): boolean {
    return !!this.provider && !!this.contract;
  }
  
  isWalletConnected(): boolean {
    return this.walletConnected && !!this.signer;
  }
  
  // Get current wallet address
  async getWalletAddress(): Promise<string> {
    if (!this.isWalletConnected()) {
      throw new Error('Wallet not connected');
    }
    
    return await this.signer!.getAddress();
  }
  
  // Get user's email address
  async getUserEmailAddress(): Promise<string | null> {
    // If we have it cached, return it
    if (this.emailAddress) {
      return this.emailAddress;
    }
    
    // Try to get it from the chain
    try {
      if (this.isWeb3Available() && this.isWalletConnected()) {
        const address = await this.getWalletAddress();
        const emailAddress = await this.contract!.getEmailAddress(address);
        
        if (emailAddress) {
          this.emailAddress = emailAddress;
          localStorage.setItem(EMAIL_ADDRESS_KEY, emailAddress);
          return emailAddress;
        }
      }
    } catch (error) {
      console.error('Error getting email address from chain:', error);
    }
    
    return null;
  }
  
  // Upload content to IPFS
  private async uploadToIPFS(content: string): Promise<string> {
    try {
      const { cid } = await ipfs.add(content);
      return cid.toString();
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw error;
    }
  }
  
  // Retrieve content from IPFS
  private async retrieveFromIPFS(cid: string): Promise<string> {
    try {
      let content = '';
      for await (const chunk of ipfs.cat(cid)) {
        content += new TextDecoder().decode(chunk);
      }
      return content;
    } catch (error) {
      console.error('Failed to retrieve from IPFS:', error);
      throw error;
    }
  }
  
  // Sign a message with Stellar to prove identity
  async signWithStellar(message: string): Promise<string> {
    await this.enableStellarFeatures();
    
    if (!this.stellarKeypair) {
      await this.generateStellarKeypair();
    }
    
    // Use stellarService to sign the message
    const signature = await stellarService.signData(message, this.stellarKeypair.secretKey);
    return signature;
  }
  
  // Verify a Stellar signature
  async verifyStellarSignature(
    message: string, 
    signature: string, 
    publicKey: string
  ): Promise<boolean> {
    try {
      await this.enableStellarFeatures();
      return stellarService.verifySignature(message, signature, publicKey);
    } catch (error) {
      console.error('Error verifying Stellar signature:', error);
      return false;
    }
  }
  
  // Send mail through web3
  async sendMail(
    recipientAddress: string,
    subject: string,
    content: string,
    options?: {
      recipientPublicKey?: string;
      useStellarSignature?: boolean;
    }
  ): Promise<{ success: boolean; txHash?: string; error?: Error }> {
    try {
      const useStellarSignature = options?.useStellarSignature ?? false;
      const recipientPublicKey = options?.recipientPublicKey;
      
      // Check if recipient is an email address
      const isEmail = recipientAddress.includes('@');
      let ethereumAddress = recipientAddress;
      
      if (isEmail) {
        // Resolve email to Ethereum address
        const resolvedAddress = await this.resolveEmailToAddress(recipientAddress);
        if (!resolvedAddress) {
          throw new Error(`Could not resolve email: ${recipientAddress}`);
        }
        ethereumAddress = resolvedAddress;
      }
      
      // Check if web3 is available, otherwise fall back to web2
      const useWeb3 = this.isWeb3Available() && this.isWalletConnected();
      
      // Enable Stellar if requested and not already enabled
      if (useStellarSignature) {
        await this.enableStellarFeatures();
      }
      
      // Sign the message with Stellar to prove identity (anti-spam) if requested
      let stellarSignature = '';
      if (useStellarSignature && this.useStellar && this.stellarKeypair) {
        const messageToSign = `${subject}:${Date.now()}`;
        stellarSignature = await this.signWithStellar(messageToSign);
        
        // Add signature to the content
        const stellarPublicKey = this.stellarKeypair.publicKey;
        content = JSON.stringify({
          originalContent: content,
          stellarSignature,
          stellarPublicKey,
          timestamp: Date.now()
        });
      }
      
      // Encrypt the content
      let encryptedContent: string;
      let encryptedSubject: string;
      
      if (recipientPublicKey) {
        // Encrypt with recipient's public key
        encryptedContent = await encrypt(content, recipientPublicKey);
        encryptedSubject = await encrypt(subject, recipientPublicKey);
      } else {
        // No public key, use a shared secret approach or base64 encode as fallback
        encryptedContent = btoa(content);
        encryptedSubject = btoa(subject);
      }
      
      // For larger content, use IPFS
      const useIPFS = encryptedContent.length > 1000;
      let ipfsHash = '';
      
      if (useIPFS) {
        ipfsHash = await this.uploadToIPFS(encryptedContent);
        // Store minimal content on-chain
        encryptedContent = '';
      }
      
      if (useWeb3) {
        // Get the current network info for gasless check
        const network = L2_NETWORKS[this.currentNetwork];
        
        // Send via web3 contract
        const tx = await this.contract!.sendMail(
          ethereumAddress,
          encryptedContent,
          encryptedSubject,
          ipfsHash,
          !useWeb3 // isWeb2Fallback flag
        );
        
        const receipt = await tx.wait();
        
        // Get sender email for record-keeping
        const senderEmail = await this.getUserEmailAddress();
        
        return {
          success: true,
          txHash: receipt.hash
        };
      } else {
        // Web2 fallback
        const web2MailId = crypto.randomUUID();
        
        // Get sender email or address
        const senderEmail = await this.getUserEmailAddress() || getLocalUserId();
        
        // Store in local storage as fallback
        const mailData: MailMessage = {
          id: web2MailId,
          sender: getLocalUserId(), // Use local ID as sender
          senderEmail: senderEmail,
          recipient: recipientAddress,
          subject: encryptedSubject,
          content: encryptedContent,
          timestamp: Date.now(),
          isWeb2Fallback: true,
          networkName: this.currentNetwork
        };
        
        // Get existing messages
        const existingMessages = this.getWeb2Messages();
        
        // Add to recipient's inbox
        if (!existingMessages[ethereumAddress]) {
          existingMessages[ethereumAddress] = [];
        }
        
        existingMessages[ethereumAddress].push(mailData);
        
        // Save back to localStorage
        localStorage.setItem(WEB2_MAIL_KEY, JSON.stringify(existingMessages));
        
        return {
          success: true
        };
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
  
  // Get mail messages (combine web3 and web2)
  async getMailMessages(): Promise<MailMessage[]> {
    const messages: MailMessage[] = [];
    
    try {
      // First try to get web3 messages
      if (this.isWeb3Available() && this.isWalletConnected()) {
        const userAddress = await this.getWalletAddress();
        const mailCount = await this.contract!.getMailCount();
        
        for (let i = 0; i < mailCount; i++) {
          const mail = await this.contract!.getMail(i);
          
          let content = mail.encryptedContent;
          
          // If content is stored on IPFS, retrieve it
          if (mail.ipfsHash && mail.ipfsHash !== '') {
            content = await this.retrieveFromIPFS(mail.ipfsHash);
          }
          
          // Try to decrypt
          try {
            content = await decrypt(content);
            mail.encryptedSubject = await decrypt(mail.encryptedSubject);
          } catch (decryptError) {
            // If decryption fails, just use the raw content
            console.warn('Could not decrypt message, using raw content');
          }
          
          // Check if sender has an email address
          let senderEmail = null;
          try {
            senderEmail = await this.contract!.getEmailAddress(mail.sender);
          } catch (e) {
            console.warn('Could not get sender email address', e);
          }
          
          // Check for Stellar signature to verify authenticity
          let parsedContent = content;
          let verifiedSender = false;
          
          try {
            const contentObj = JSON.parse(content);
            if (contentObj.stellarSignature && contentObj.stellarPublicKey) {
              // Only enable Stellar if needed for verification
              await this.enableStellarFeatures();
              
              const messageToVerify = `${mail.encryptedSubject}:${contentObj.timestamp}`;
              verifiedSender = await this.verifyStellarSignature(
                messageToVerify,
                contentObj.stellarSignature,
                contentObj.stellarPublicKey
              );
              
              // Use the original content
              parsedContent = contentObj.originalContent;
            }
          } catch (e) {
            // Not a JSON object with Stellar signature, just use as is
          }
          
          messages.push({
            id: `web3-${i}`,
            sender: mail.sender,
            senderEmail: senderEmail,
            subject: mail.encryptedSubject,
            content: parsedContent,
            timestamp: Number(mail.timestamp) * 1000, // Convert to milliseconds
            web3Tx: 'On-chain',
            isWeb2Fallback: mail.isWeb2Fallback,
            networkName: this.currentNetwork
          });
        }
      }
      
      // Then add web2 fallback messages
      const web2Messages = this.getWeb2Messages();
      const userAddress = this.isWalletConnected() 
        ? await this.getWalletAddress() 
        : getLocalUserId();
      
      const userMessages = web2Messages[userAddress] || [];
      
      messages.push(...userMessages);
      
      // Sort by timestamp (newest first)
      return messages.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting mail messages:', error);
      
      // If web3 fails, at least return web2 messages
      const web2Messages = this.getWeb2Messages();
      const userAddress = getLocalUserId();
      return web2Messages[userAddress] || [];
    }
  }
  
  // Get available networks for email domains
  getAvailableEmailDomains(): string[] {
    return Object.values(L2_NETWORKS).map(network => network.domain);
  }
  
  // Get current network domain
  getCurrentNetworkDomain(): string {
    return L2_NETWORKS[this.currentNetwork].domain;
  }
  
  // Get web2 fallback messages from localStorage
  private getWeb2Messages(): Record<string, MailMessage[]> {
    const messages = localStorage.getItem(WEB2_MAIL_KEY);
    return messages ? JSON.parse(messages) : {};
  }
  
  // Delete a mail message
  async deleteMail(messageId: string): Promise<boolean> {
    try {
      if (messageId.startsWith('web3-')) {
        // Delete web3 message
        if (!this.isWeb3Available() || !this.isWalletConnected()) {
          throw new Error('Web3 not available or wallet not connected');
        }
        
        const index = parseInt(messageId.replace('web3-', ''));
        const tx = await this.contract!.deleteMail(index);
        await tx.wait();
        
        return true;
      } else {
        // Delete web2 message
        const web2Messages = this.getWeb2Messages();
        const userAddress = this.isWalletConnected() 
          ? await this.getWalletAddress() 
          : getLocalUserId();
        
        if (!web2Messages[userAddress]) {
          return false;
        }
        
        const messageIndex = web2Messages[userAddress].findIndex(m => m.id === messageId);
        
        if (messageIndex === -1) {
          return false;
        }
        
        web2Messages[userAddress].splice(messageIndex, 1);
        localStorage.setItem(WEB2_MAIL_KEY, JSON.stringify(web2Messages));
        
        return true;
      }
    } catch (error) {
      console.error('Error deleting mail:', error);
      return false;
    }
  }
  
  // Set user's public key for encryption
  async setPublicKey(publicKey: string): Promise<boolean> {
    try {
      if (!this.isWeb3Available() || !this.isWalletConnected()) {
        throw new Error('Web3 not available or wallet not connected');
      }
      
      // Only proceed if we're on a gasless network to avoid fees
      const network = L2_NETWORKS[this.currentNetwork];
      if (network.gasless) {
        const tx = await this.contract!.setPublicKey(publicKey);
        await tx.wait();
      } else {
        console.log('Skipping on-chain public key registration on non-gasless network');
      }
      
      return true;
    } catch (error) {
      console.error('Error setting public key:', error);
      return false;
    }
  }
  
  // Get a user's public key
  async getPublicKey(address: string): Promise<string | null> {
    try {
      if (!this.isWeb3Available()) {
        return null;
      }
      
      const publicKey = await this.contract!.getPublicKey(address);
      return publicKey || null;
    } catch (error) {
      console.error('Error getting public key:', error);
      return null;
    }
  }
}

// Create singleton instance
export const web3MailService = new Web3MailService();

export default web3MailService; 