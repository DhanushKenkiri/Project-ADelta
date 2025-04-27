import { ethers } from 'ethers';
import { create as createIPFS } from 'ipfs-http-client';
import { encrypt, decrypt } from '@/lib/cryptoUtils';
import { getLocalUserId } from './localStorageService';
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
    contractAddress: process.env.BASE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890', // Default mock address
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    domain: 'base',
    gasless: true
  },
  monad: {
    chainId: 1024,
    name: 'Monad',
    contractAddress: process.env.MONAD_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
    rpcUrl: process.env.MONAD_RPC_URL || 'https://rpc.monad.xyz',
    domain: 'monad',
    gasless: true
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    contractAddress: process.env.OPTIMISM_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    domain: 'optimism',
    gasless: false
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    contractAddress: process.env.ARBITRUM_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    domain: 'arbitrum',
    gasless: false
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    contractAddress: process.env.POLYGON_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
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
  isWeb2Fallback?: boolean;
  networkName?: string;
  txHash?: string;
  attachments: string[]; // Making this required with default empty array
}

// Local storage for web2 fallback
const WEB2_MAIL_KEY = 'adelta_mail_messages';
const STELLAR_KEYPAIR_KEY = 'adelta_stellar_keypair';
const EMAIL_ADDRESS_KEY = 'adelta_email_address';
const INBOX_ADDRESSES_KEY = 'adelta_inbox_addresses';
const AUTO_INBOX_ADDRESS_KEY = 'adelta_auto_inbox_address';

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
      
      // Always simulate a successful connection in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: Using mock Web3 provider for ${network.name}`);
        // Set these to non-null values to make isWeb3Available return true
        this.provider = {} as ethers.JsonRpcProvider;
        this.contract = {
          // Mock contract methods that might be called
          getMailCount: async () => 0,
          getMail: async () => ({}),
          getPublicKey: async () => null,
          resolveEmailToAddress: async (email: string) => this.hashString(email)
        } as unknown as ethers.Contract;
        return true;
      }
      
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
      
      // In development mode, simulate a successful wallet connection
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating wallet connection');
        
        // Create a mock signer with a fake address
        this.signer = {
          address: '0x' + Array(40).fill(0).map(() => 
            Math.floor(Math.random() * 16).toString(16)).join(''),
          getAddress: async () => this.signer?.address || '0xMockAddress'
        } as unknown as ethers.Wallet;
        
        this.walletConnected = true;
        console.log(`Mock wallet connected: ${this.signer.address}`);
        return true;
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
      
      // Update contract with signer, but only in production mode
      // (in development we use a mock contract)
      if (this.contract && process.env.NODE_ENV !== 'development') {
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
  async resolveEmailToAddress(email: string): Promise<string> {
    try {
      console.log(`Attempting to resolve email: ${email}`);
      
      // In development mode, always generate a deterministic mock address
      if (process.env.NODE_ENV === 'development') {
        const emailHash = this.hashString(email);
        const mockAddress = '0x' + emailHash.substring(0, 40);
        console.log(`Development mode: Using mock address for ${email}: ${mockAddress}`);
        return mockAddress;
      }
      
      if (!this.contract) {
        await this.initializeWeb3();
      }
      
      try {
        const resolved = await this.contract.resolveEmailToAddress(email);
        
        if (!resolved || resolved === '0x0000000000000000000000000000000000000000') {
          // Generate a local mock address for testing if no real address is found
          const mockAddress = '0x' + Array(40).fill(0).map(() => 
            Math.floor(Math.random() * 16).toString(16)).join('');
          console.log(`No on-chain address found, using mock address: ${mockAddress}`);
          return mockAddress;
        }
        
        return resolved;
      } catch (error) {
        console.error("Error in contract call to resolveEmailToAddress:", error);
        // Fall back to deterministic mock address
        const emailHash = this.hashString(email);
        const mockAddress = '0x' + emailHash.substring(0, 40);
        console.log(`Using fallback mock address for ${email} due to contract error: ${mockAddress}`);
        return mockAddress;
      }
    } catch (error) {
      console.error("Error resolving email to address:", error);
      
      // For development, generate a consistent mock address based on email hash
      const emailHash = this.hashString(email);
      const mockAddress = '0x' + emailHash.substring(0, 40);
      console.log(`Using fallback mock address for ${email}: ${mockAddress}`);
      
      return mockAddress;
    }
  }
  
  // Helper method to create consistent hash from string
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to hex string and ensure it's 40 chars (160 bits)
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0').repeat(5);
    return hexHash.substring(0, 40);
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
  
  // Get mail messages (combine web3 and web2)
  async getMailMessages(): Promise<MailMessage[]> {
    try {
      let messages: MailMessage[] = [];
      console.log('getMailMessages called');

      // Get all Web2 messages for the current user
      const localMessages = this.getLocalMessages();
      console.log('Local messages retrieved:', localMessages.length);
      messages = [...localMessages];
      
      // If web3 is available, try to fetch on-chain messages as well
      if (this.isWeb3Available() && this.isWalletConnected()) {
        console.log('Web3 available, getting web3 messages');
        const web3Messages = await this.getWeb3Messages();
        console.log('Web3 messages retrieved:', web3Messages.length);
        messages = [...messages, ...web3Messages];
      } else {
        console.log('Wallet not connected or web3 not available, falling back to local messages only');
      }

      // Debug localStorage contents directly
      try {
        const messagesJson = localStorage.getItem('web2_messages');
        if (messagesJson) {
          const allStorageMessages = JSON.parse(messagesJson);
          console.log('All message recipients in storage:', Object.keys(allStorageMessages));
          
          // Get the user's address for debugging
          let userAddress = 'unknown';
          if (this.isWalletConnected() && this.signer) {
            if (typeof this.signer.address === 'string') {
              userAddress = this.signer.address;
            } else if (this.signer.getAddress) {
              try {
                userAddress = await this.signer.getAddress();
              } catch (e) {
                console.log('Error getting address from signer');
              }
            }
          } else {
            userAddress = getLocalUserId();
          }
          
          console.log('User address for message retrieval:', userAddress);
          
          // Check if there are any messages for this user
          if (allStorageMessages[userAddress]) {
            console.log(`Found ${allStorageMessages[userAddress].length} direct messages in storage for user: ${userAddress}`);
          } else {
            console.log(`No direct messages found in storage for user: ${userAddress}`);
          }
        }
      } catch (e) {
        console.log('Error debugging localStorage:', e);
      }

      // Sort by timestamp (most recent first)
      const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);
      console.log(`Returning ${sortedMessages.length} total messages`);
      return sortedMessages;
    } catch (error) {
      console.error('Error getting mail messages:', error);
      return [];
    }
  }
  
  // Helper method to get local messages
  private getLocalMessages(): MailMessage[] {
    // Get web2 fallback messages for wallet or inbox addresses
    const web2MessagesObj = this.getWeb2Messages();
    let userAddress = getLocalUserId();
    
    // Try to get wallet address if connected
    if (this.isWalletConnected() && this.signer) {
      try {
        // Use a direct call to getAddress synchronously if possible
        // This prevents Promise-related type errors
        if (typeof this.signer.address === 'string') {
          userAddress = this.signer.address;
        }
      } catch (e) {
        console.log('Error getting wallet address, using local user ID');
      }
    }
    
    // Get messages directly addressed to user's wallet or local ID
    const directMessages = web2MessagesObj[userAddress] || [];
    console.log(`Found ${directMessages.length} direct messages for user: ${userAddress}`);
    
    // Get inbox messages if we have the address in localStorage
    const inboxMessages: MailMessage[] = [];
    const inboxAddresses = this.getInboxAddresses();
    
    // Auto-generated inbox address
    const autoInboxAddress = this.getAutoInboxAddress();
    if (autoInboxAddress && web2MessagesObj[autoInboxAddress]) {
      console.log(`Found ${web2MessagesObj[autoInboxAddress].length} messages for auto inbox: ${autoInboxAddress}`);
      inboxMessages.push(...web2MessagesObj[autoInboxAddress]);
    }
    
    // For each inbox address, get messages
    Object.entries(inboxAddresses).forEach(([inboxAddress, ownerAddress]) => {
      // Check if this inbox belongs to the current user
      if (ownerAddress === userAddress && web2MessagesObj[inboxAddress]) {
        console.log(`Found ${web2MessagesObj[inboxAddress].length} messages for inbox: ${inboxAddress}`);
        inboxMessages.push(...web2MessagesObj[inboxAddress]);
      }
    });
    
    // Combine all messages
    const allMessages = [...directMessages, ...inboxMessages];
    console.log(`Total local messages: ${allMessages.length}`);
    return allMessages;
  }
  
  // Get available networks for email domains
  getAvailableNetworks(): string[] {
    return Object.values(L2_NETWORKS).map(network => network.domain);
  }
  
  // Get current network domain
  getCurrentNetworkDomain(): string {
    return L2_NETWORKS[this.currentNetwork].domain;
  }
  
  // Get the stored email address
  getEmailAddress(): string | null {
    if (!this.emailAddress) {
      this.loadEmailAddress();
    }
    return this.emailAddress;
  }
  
  // Save a web2 message to local storage
  private saveWeb2Message(message: MailMessage): void {
    try {
      console.log('saveWeb2Message called with:', JSON.stringify(message, null, 2));
      
      // Check if localStorage is available (browser environment)
      if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available in this environment');
        return;
      }
      
      // Try to get existing messages
      const messagesJson = localStorage.getItem('web2_messages');
      console.log('Current web2_messages from localStorage:', messagesJson);
      
      // Initialize messages object structure
      let messages: Record<string, MailMessage[]> = {};
      
      if (messagesJson) {
        try {
          messages = JSON.parse(messagesJson);
          console.log('Successfully parsed existing messages');
        } catch (parseError) {
          console.error('Error parsing existing messages:', parseError);
          // Start with an empty object if parsing fails
          messages = {};
        }
      } else {
        console.log('No existing messages found, starting with empty object');
      }
      
      // Ensure recipient is defined
      if (!message.recipient) {
        console.error('Message has no recipient, cannot save to inbox');
        return;
      }
      
      // Ensure attachments are always an array
      if (!message.attachments) {
        message.attachments = [];
      }
      
      // Save message to recipient's inbox
      const recipient = message.recipient;
      if (!messages[recipient]) {
        messages[recipient] = [];
      }
      messages[recipient].push({...message});
      
      // Also save to sender's sent items if we have a sender
      if (message.sender) {
        // Create a copy of the message for the sender's sent items
        const senderCopy = {...message, id: `sent-${message.id}`};
        
        // Get the current user's address (sender)
        const senderAddress = message.sender;
        
        // Initialize sender's messages array if needed
        if (!messages[senderAddress]) {
          messages[senderAddress] = [];
        }
        
        // Add to sender's array
        messages[senderAddress].push(senderCopy);
        
        console.log(`Also saved copy to sender's sent items: ${senderAddress}`);
      }
      
      // Save back to localStorage
      const updatedJson = JSON.stringify(messages);
      localStorage.setItem('web2_messages', updatedJson);
      
      console.log(`Saved message to local storage for recipient: ${recipient}`);
      console.log('Updated localStorage structure:', Object.keys(messages));
    } catch (error) {
      console.error('Error saving web2 message to local storage:', error);
    }
  }

  // Get web2 messages from local storage
  getWeb2Messages(): Record<string, MailMessage[]> {
    try {
      if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available in this environment');
        return {};
      }
      
      const messagesJson = localStorage.getItem('web2_messages');
      if (!messagesJson) {
        console.log('No web2 messages found in local storage');
        return {};
      }
      
      try {
        const messages = JSON.parse(messagesJson);
        
        // Check if it's an array (old format) or object (new format)
        if (Array.isArray(messages)) {
          console.log('Converting messages from array to object format');
          // Convert to new format
          const convertedMessages: Record<string, MailMessage[]> = {};
          
          // Group by recipient if available
          messages.forEach(message => {
            const recipient = message.recipient || 'unknown';
            if (!convertedMessages[recipient]) {
              convertedMessages[recipient] = [];
            }
            convertedMessages[recipient].push(message);
          });
          
          // Save in new format
          localStorage.setItem('web2_messages', JSON.stringify(convertedMessages));
          return convertedMessages;
        }
        
        console.log(`Retrieved web2 messages from local storage, recipients: ${Object.keys(messages).join(', ')}`);
        return messages;
      } catch (parseError) {
        console.error('Error parsing web2 messages from local storage:', parseError);
        return {};
      }
    } catch (error) {
      console.error('Error getting web2 messages from local storage:', error);
      return {};
    }
  }

  // Delete a web2 message from local storage
  deleteWeb2Message(id: string): boolean {
    try {
      const web2MessagesObj = this.getWeb2Messages();
      let messageFound = false;
      
      // Check each recipient's messages
      for (const [recipient, messages] of Object.entries(web2MessagesObj)) {
        const index = messages.findIndex(m => m.txHash === id);
        if (index !== -1) {
          // Remove message from this recipient's array
          web2MessagesObj[recipient].splice(index, 1);
          messageFound = true;
          
          // If we've removed all messages for this recipient, clean up
          if (web2MessagesObj[recipient].length === 0) {
            delete web2MessagesObj[recipient];
          }
          
          break;
        }
      }
      
      if (messageFound) {
        localStorage.setItem('web2_messages', JSON.stringify(web2MessagesObj));
        console.log(`Deleted message with id ${id} from local storage`);
        return true;
      }
      
      console.log(`Message with id ${id} not found in local storage`);
      return false;
    } catch (error) {
      console.error('Error deleting web2 message from local storage:', error);
      return false;
    }
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
        const web2MessagesObj = this.getWeb2Messages();
        const userAddress = this.isWalletConnected() 
          ? await this.getWalletAddress() 
          : getLocalUserId();
        
        if (!web2MessagesObj[userAddress]) {
          return false;
        }
        
        const messageIndex = web2MessagesObj[userAddress].findIndex(m => m.id === messageId);
        
        if (messageIndex === -1) {
          return false;
        }
        
        web2MessagesObj[userAddress].splice(messageIndex, 1);
        localStorage.setItem('web2_messages', JSON.stringify(web2MessagesObj));
        
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
  
  // Register an inbox address for receiving mail
  async registerInboxAddress(username: string): Promise<boolean> {
    try {
      if (!username || username.trim() === '') {
        throw new Error('Invalid inbox username');
      }
      
      // Format the full address using current network
      const fullAddress = `${username}@${this.getCurrentNetworkDomain()}`;
      
      // Store the address in local storage map of inbox addresses
      const inboxAddresses = this.getInboxAddresses();
      const walletAddress = this.isWalletConnected() ? 
        await this.getWalletAddress() : 
        getLocalUserId();
      
      inboxAddresses[fullAddress] = walletAddress;
      
      localStorage.setItem(INBOX_ADDRESSES_KEY, JSON.stringify(inboxAddresses));
      
      console.log(`Registered inbox address: ${fullAddress} for ${walletAddress}`);
      return true;
    } catch (error) {
      console.error('Error registering inbox address:', error);
      return false;
    }
  }
  
  // Generate a unique inbox address for the current user
  async generateUniqueInboxAddress(): Promise<string> {
    try {
      // Check if user already has an auto-generated address
      const existingAddress = this.getAutoInboxAddress();
      if (existingAddress) {
        return existingAddress;
      }
      
      // Generate a unique username using wallet address or random ID if no wallet
      let uniqueId: string;
      
      if (this.isWalletConnected()) {
        const address = await this.getWalletAddress();
        // Take first 8 chars of wallet address
        uniqueId = `user${address.substring(2, 10).toLowerCase()}`;
      } else {
        // Generate random ID if no wallet
        const randomId = Math.random().toString(36).substring(2, 10);
        uniqueId = `user${randomId}`;
      }
      
      // Ensure uniqueness by adding timestamp if needed
      const timestamp = Date.now().toString(36);
      const username = `${uniqueId}_${timestamp}`;
      
      // Register this address
      const fullAddress = `${username}@${this.getCurrentNetworkDomain()}`;
      await this.registerInboxAddress(username);
      
      // Save as auto-generated address
      localStorage.setItem(AUTO_INBOX_ADDRESS_KEY, fullAddress);
      
      return fullAddress;
    } catch (error) {
      console.error('Error generating unique inbox address:', error);
      return '';
    }
  }
  
  // Get the auto-generated inbox address
  getAutoInboxAddress(): string {
    return localStorage.getItem(AUTO_INBOX_ADDRESS_KEY) || '';
  }
  
  // Get all registered inbox addresses
  getInboxAddresses(): Record<string, string> {
    try {
      const addresses = localStorage.getItem(INBOX_ADDRESSES_KEY);
      return addresses ? JSON.parse(addresses) : {};
    } catch (error) {
      console.error('Error getting inbox addresses:', error);
      return {};
    }
  }
  
  // Resolve an inbox address to a wallet address
  async resolveInboxAddress(inboxAddress: string): Promise<string | null> {
    try {
      // Check local registry first
      const inboxAddresses = this.getInboxAddresses();
      if (inboxAddresses[inboxAddress]) {
        return inboxAddresses[inboxAddress];
      }
      
      // If not found locally, try on-chain resolution
      return await this.resolveEmailToAddress(inboxAddress);
    } catch (error) {
      console.error('Error resolving inbox address:', error);
      return null;
    }
  }

  // Send mail through web3
  async sendMail(
    to: string,
    subject: string,
    content: string,
    attachments: string[] = []
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`Sending mail to: ${to}, subject: ${subject}`);
      
      // Initialize Web3 if not already initialized
      if (!this.contract) {
        await this.initializeWeb3();
      }

      // If in development/testing mode, bypass actual blockchain transaction
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating mail send');
        
        // Auto-connect wallet in development mode if not already connected
        if (!this.isWalletConnected()) {
          console.log('Development mode: Auto-connecting wallet for mail send');
          await this.connectWallet();
        }
        
        const mockTxHash = '0x' + Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('');
        
        // Use current timestamp to ensure message is added correctly
        const timestamp = Date.now();
        
        // Determine sender
        let from = this.isWalletConnected() ? await this.getWalletAddress() : getLocalUserId();
        
        // Try to resolve the recipient email to an address
        let recipientAddress = to;
        try {
          // Only attempt to resolve if it's an email address
          if (to.includes('@')) {
            const resolved = await this.resolveEmailToAddress(to);
            if (resolved) {
              recipientAddress = resolved;
              console.log(`Resolved email ${to} to address ${recipientAddress}`);
            }
          }
        } catch (error) {
          console.warn('Could not resolve recipient address, using raw recipient as key');
        }
        
        // Ensure attachments is always an array
        const safeAttachments = Array.isArray(attachments) ? attachments : [];
        
        // Store message locally for testing
        const message: MailMessage = {
          id: `web2-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: from,
          senderEmail: this.getEmailAddress(),
          recipient: recipientAddress, // Use resolved address or fall back to original input
          subject,
          content,
          timestamp,
          attachments: safeAttachments,
          txHash: mockTxHash,
          isWeb2Fallback: true,
          networkName: this.currentNetwork
        };
        
        // Save to local storage for testing - this stores in recipient's inbox
        this.saveWeb2Message(message);
        
        // Debug log to help with troubleshooting
        console.log(`Message saved to localStorage for recipient: ${recipientAddress}`);
        
        return { 
          success: true, 
          txHash: mockTxHash
        };
      }

      // For production: Resolve the email to an Ethereum address
      const toAddress = await this.resolveEmailToAddress(to);
      if (!toAddress) {
        return { success: false, error: 'Unable to resolve recipient email address' };
      }
      
      console.log(`Resolved ${to} to address: ${toAddress}`);

      // Encrypt the content with the recipient's public key
      let encryptedContent;
      try {
        const recipientPublicKey = await this.getPublicKey(toAddress);
        if (recipientPublicKey) {
          encryptedContent = await encrypt(content, recipientPublicKey);
        } else {
          console.log('No public key found for recipient, sending unencrypted');
          encryptedContent = content;
        }
      } catch (error) {
        console.warn('Error encrypting content, sending unencrypted:', error);
        encryptedContent = content;
      }

      // Upload content to IPFS
      let contentCid;
      try {
        contentCid = await this.uploadToIPFS(encryptedContent);
        console.log(`Content uploaded to IPFS with CID: ${contentCid}`);
      } catch (error) {
        console.error('Error uploading to IPFS:', error);
        return { success: false, error: 'Failed to upload content' };
      }

      // Create the mail data object
      const mailData = {
        to: toAddress,
        subject,
        contentCid,
        attachments
      };

      // Send the mail transaction
      try {
        const tx = await this.contract.sendMail(
          mailData.to,
          mailData.subject,
          mailData.contentCid,
          mailData.attachments
        );
        
        console.log('Mail transaction sent:', tx.hash);
        return { success: true, txHash: tx.hash };
      } catch (error) {
        console.error('Transaction error:', error);
        
        // For testing/development, still return success with mock tx
        if (process.env.NODE_ENV === 'development') {
          const mockTxHash = '0x' + Array(64).fill(0).map(() => 
            Math.floor(Math.random() * 16).toString(16)).join('');
          return { success: true, txHash: mockTxHash };
        }
        
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown transaction error' 
        };
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending mail' 
      };
    }
  }

  // Add getWeb3Messages method
  async getWeb3Messages(): Promise<MailMessage[]> {
    const messages: MailMessage[] = [];
    
    if (!this.isWeb3Available() || !this.isWalletConnected()) {
      console.log('Web3 or wallet not available for fetching messages');
      return messages;
    }
    
    try {
      const userAddress = await this.getWalletAddress();
      const mailCount = await this.contract!.getMailCount();
      
      // Check for mail addressed to user's registered inbox addresses
      const inboxAddresses = this.getInboxAddresses();
      const userInboxAddresses = Object.entries(inboxAddresses)
        .filter(([_, address]) => address === userAddress)
        .map(([inbox, _]) => inbox);
      
      console.log(`Checking mail for inbox addresses: ${userInboxAddresses.join(', ')}`);
      
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
          networkName: this.currentNetwork,
          txHash: `web3-${i}`, // Use the same ID as txHash for web3 messages
          attachments: [] // Add missing required attachments property
        });
      }
      
      return messages;
    } catch (error) {
      console.error('Error fetching on-chain messages:', error);
      return [];
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      // Check if the message exists in local storage as web2 message
      const web2MessagesObj = this.getWeb2Messages();
      
      // Search for message across all recipients
      let messageFound = false;
      
      // Check in each recipient's message array
      for (const [recipient, messages] of Object.entries(web2MessagesObj)) {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          // Remove the message from this recipient's array
          web2MessagesObj[recipient].splice(messageIndex, 1);
          messageFound = true;
          break;
        }
      }
      
      if (messageFound) {
        // Save the updated messages object
        localStorage.setItem('web2_messages', JSON.stringify(web2MessagesObj));
        return true;
      } else if (this.isWeb3Available() && this.isWalletConnected()) {
        // Message might be a web3 message, check if we have a txHash
        const web3Messages = await this.getWeb3Messages();
        const web3Message = web3Messages.find(m => m.id === messageId);
        
        if (web3Message && web3Message.txHash) {
          // For web3 messages, we can't delete from blockchain
          // but we can mark it as deleted in local storage
          const deletedMessagesJson = localStorage.getItem('deleted_messages') || '[]';
          const deletedMessages = JSON.parse(deletedMessagesJson);
          if (!deletedMessages.includes(messageId)) {
            deletedMessages.push(messageId);
            localStorage.setItem('deleted_messages', JSON.stringify(deletedMessages));
          }
          return true;
        }
      }
      
      console.warn(`Message with ID ${messageId} not found locally or on-chain`);
      return false;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
}

// Create singleton instance
export const web3MailService = new Web3MailService();

export default web3MailService; 