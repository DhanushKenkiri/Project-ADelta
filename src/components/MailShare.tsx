import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { toast } from 'sonner';
import { web3MailService, MailMessage } from '@/services/web3MailService';
import { Camera, ImageIcon, Paperclip, X, Loader2, Trash2, PaperclipIcon, Image, Send, Wallet, Key, LogIn, UserCheck, Shield } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import { getLocalUserId } from '@/services/localStorageService';
import { isScreenPipeAvailable } from '@/lib/screenpipeUtils';
import { stellarService } from '@/lib/stellarService';

// Constants
const STELLAR_KEYPAIR_KEY = 'adelta_stellar_keypair';
const STELLAR_USER_KEY = 'adelta_stellar_user';

// Lazy load custom screen capture components
const MailScreenCapture = lazy(() => import('./custom/MailScreenCapture'));
const MailScreenPipeCapture = lazy(() => import('./custom/MailScreenPipeCapture'));

// Simple test templates that don't rely on any external services
const TEST_TEMPLATES = [
  {
    subject: "Important Update from Our Team",
    content: `<!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #0066cc;">Important Company Update</h2>
      <p>Hello,</p>
      <p>We wanted to reach out with an important update about our services.</p>
      <p>Our team has been working hard to improve your experience, and we're excited to announce several new features:</p>
      <ul style="padding-left: 20px;">
        <li>Enhanced security protocols</li>
        <li>Faster processing times</li>
        <li>New user interface</li>
      </ul>
      <p>Please review these changes and let us know if you have any questions.</p>
      <p>Regards,<br>The Team</p>
    </body>
    </html>`
  },
  {
    subject: "Your Invitation to Exclusive Access",
    content: `<!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #009933;">Exclusive Early Access Invitation</h2>
      <p>Hello,</p>
      <p>You've been selected for exclusive early access to our new platform.</p>
      <p>As one of our valued users, we're giving you a special preview of our upcoming features:</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0; font-weight: bold;">Your exclusive benefits:</p>
        <ul style="padding-left: 20px; margin-top: 10px;">
          <li>Priority support</li>
          <li>Free premium features</li>
          <li>Early access to new tools</li>
        </ul>
      </div>
      <p>Click the link below to get started immediately.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="#" style="background-color: #009933; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">ACTIVATE NOW</a>
      </div>
      <p>Best,<br>The Team</p>
    </body>
    </html>`
  }
];

// Interface for attachments
interface Attachment {
  id: string;
  dataUrl: string;
  type: string;
  name: string;
  size: number;
}

// Add this component before MailComposer
export const StellarLogin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChallenge, setAuthChallenge] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginType, setLoginType] = useState<'keypair' | 'wallet'>('keypair');

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Check if we have stored user data
        const storedUser = localStorage.getItem(STELLAR_USER_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setPublicKey(userData.publicKey);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, []);

  // Generate a random challenge for authentication
  const generateAuthChallenge = () => {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    
    // Convert to hex string
    const challenge = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    setAuthChallenge(challenge);
    return challenge;
  };

  // Handle login with Stellar keypair
  const handleKeypairLogin = async () => {
    try {
      setLoading(true);
      
      // Check if there's an existing keypair
      const keypairStr = localStorage.getItem(STELLAR_KEYPAIR_KEY);
      if (!keypairStr) {
        toast.error('No Stellar keypair found. Please generate one first.');
        return;
      }
      
      // Parse the keypair
      const keypair = JSON.parse(keypairStr);
      
      // Generate a challenge
      const challenge = generateAuthChallenge();
      
      // Sign the challenge with Stellar
      const signature = await stellarService.signData(challenge, keypair.secretKey);
      
      // Verify the signature
      const isValid = await stellarService.verifySignature(challenge, signature, keypair.publicKey);
      
      if (isValid) {
        // Store the login info
        const userData = {
          publicKey: keypair.publicKey,
          loginTime: Date.now(),
          loginMethod: 'keypair'
        };
        
        localStorage.setItem(STELLAR_USER_KEY, JSON.stringify(userData));
        
        setPublicKey(keypair.publicKey);
        setIsLoggedIn(true);
        setShowLoginForm(false);
        
        toast.success('Successfully logged in with Stellar keypair!');
      } else {
        toast.error('Signature verification failed');
      }
    } catch (error) {
      console.error('Error logging in with keypair:', error);
      toast.error('Failed to log in with Stellar keypair');
    } finally {
      setLoading(false);
    }
  };

  // Handle login with wallet
  const handleWalletLogin = async () => {
    try {
      setLoading(true);
      
      // Connect wallet first
      const connected = await web3MailService.connectWallet();
      if (!connected) {
        toast.error('Failed to connect wallet');
        return;
      }
      
      // Generate an auth challenge
      const challenge = generateAuthChallenge();
      
      // Get wallet address
      const walletAddress = await web3MailService.getWalletAddress();
      
      // In a real implementation, we would:
      // 1. Ask the wallet to sign the challenge
      // 2. Verify the signature
      // Here we'll simulate successful authentication
      
      // Store the login info
      const userData = {
        publicKey: walletAddress, // Use wallet address as public key
        loginTime: Date.now(),
        loginMethod: 'wallet'
      };
      
      localStorage.setItem(STELLAR_USER_KEY, JSON.stringify(userData));
      
      setPublicKey(walletAddress);
      setIsLoggedIn(true);
      setShowLoginForm(false);
      
      toast.success('Successfully logged in with wallet!');
    } catch (error) {
      console.error('Error logging in with wallet:', error);
      toast.error('Failed to log in with wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STELLAR_USER_KEY);
    setIsLoggedIn(false);
    setPublicKey(null);
    toast.info('Logged out successfully');
  };

  const formatPublicKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md mb-6">
      <h3 className="text-white text-lg font-medium mb-3 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Stellar Authentication
      </h3>
      
      {isLoggedIn ? (
        <div className="flex flex-col">
          <div className="bg-gray-700 p-3 rounded mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserCheck className="w-5 h-5 text-green-400 mr-2" />
                <div>
                  <div className="text-green-400 font-medium">Authenticated</div>
                  <div className="text-gray-300 text-sm">
                    Stellar ID: {formatPublicKey(publicKey || '')}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-500 text-white text-sm py-1 px-3 rounded"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-300">
            You are now logged in with Stellar. You can securely send and receive authenticated emails.
          </p>
        </div>
      ) : showLoginForm ? (
        <div>
          <div className="flex mb-4 border-b border-gray-700">
            <button
              onClick={() => setLoginType('keypair')}
              className={`py-2 px-4 text-sm font-medium ${loginType === 'keypair' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
            >
              <Key className="w-4 h-4 inline-block mr-1" />
              Stellar Keypair
            </button>
            <button
              onClick={() => setLoginType('wallet')}
              className={`py-2 px-4 text-sm font-medium ${loginType === 'wallet' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
            >
              <Wallet className="w-4 h-4 inline-block mr-1" />
              Wallet
            </button>
          </div>
          
          {loginType === 'keypair' ? (
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-4">
                Login with your Stellar keypair for secure message signing. Make sure you have generated a keypair first.
              </p>
              <button
                onClick={handleKeypairLogin}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Login with Stellar Keypair
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-4">
                Connect your wallet to login. This will allow you to sign messages using your wallet credentials.
              </p>
              <button
                onClick={handleWalletLogin}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet to Login
                  </>
                )}
              </button>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowLoginForm(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-300 mb-4">
            Authenticate with Stellar to sign your emails and verify their authenticity.
            This ensures recipients can verify that messages truly came from you.
          </p>
          <button
            onClick={() => setShowLoginForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full flex justify-center items-center"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login with Stellar
          </button>
        </div>
      )}
    </div>
  );
};

export const MailComposer: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [testMessageSent, setTestMessageSent] = useState(false);
  
  // ScreenPipe and capture states
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false);
  const [isScreenPipeCaptureOpen, setIsScreenPipeCaptureOpen] = useState(false);
  
  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Chat messages for storing screenshots
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'text' | 'image';
    content: string;
    timestamp: number;
  }>>([]);

  // Check if mail service is available
  useEffect(() => {
    console.log('Initializing mail service in MailComposer');
    web3MailService.initializeWeb3()
      .then(initialized => {
        console.log('Mail service initialized result:', initialized);
        setServiceInitialized(initialized);
        if (!initialized) {
          console.warn('Mail service initialization failed');
        } else {
          // Get current network for inbox suggestions
          const network = web3MailService.getCurrentNetworkDomain();
          console.log('Current network domain:', network);
          setCurrentNetwork(network);
        }
      })
      .catch(error => {
        console.error('Error initializing mail service:', error);
        setServiceInitialized(false);
      });
  }, []);

  // Get a random template
  const getRandomTemplate = () => {
    const randomIndex = Math.floor(Math.random() * TEST_TEMPLATES.length);
    return TEST_TEMPLATES[randomIndex];
  };

  // Handle screen capture - ONLY adds to attachments, NEVER modifies the template
  const handleScreenCapture = async (imageDataUrl: string) => {
    try {
      // Show loading toast
      toast({
        title: "Processing captured image...",
        description: "Preparing screenshot for use in mail",
      });
      
      // Compress the image to reduce size
      const compressedImage = await compressImage(imageDataUrl, 800, 0.85);
      
      // Create unique ID for this attachment
      const attachmentId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create attachment
      const newAttachment: Attachment = {
        id: attachmentId,
        dataUrl: compressedImage,
        type: 'image/png',
        name: `Screenshot-${new Date().toISOString().slice(0, 10)}.png`,
        size: compressedImage.length * 0.75, // Rough estimate of size in bytes
      };
      
      // Add to attachments state
      setAttachments(prev => [...prev, newAttachment]);
      
      // Add to chat messages
      setChatMessages(prev => [...prev, {
        id: attachmentId,
        type: 'image',
        content: compressedImage,
        timestamp: Date.now(),
      }]);
      
      // Success notification
      toast({
        title: "Screenshot captured",
        description: "Image will be attached when you send the email",
      });
      
    } catch (error) {
      console.error('Error processing screenshot:', error);
      toast({
        title: "Error capturing screenshot",
        description: "Failed to process the image",
        variant: "destructive",
      });
    }
  };

  // Handle ScreenPipe capture - ONLY adds to attachments, NEVER modifies the template
  const handleScreenPipeCapture = async (imageDataUrl: string) => {
    try {
      // Show loading toast
      toast({
        title: "Processing ScreenPipe image...",
        description: "Preparing for use in mail",
      });
      
      // Compress the image to reduce size
      const compressedImage = await compressImage(imageDataUrl, 800, 0.85);
      
      // Create unique ID for this attachment
      const attachmentId = `screenpipe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create attachment
      const newAttachment: Attachment = {
        id: attachmentId,
        dataUrl: compressedImage,
        type: 'image/png',
        name: `ScreenPipe-${new Date().toISOString().slice(0, 10)}.png`,
        size: compressedImage.length * 0.75, // Rough estimate of size in bytes
      };
      
      // Add to attachments state
      setAttachments(prev => [...prev, newAttachment]);
      
      // Add to chat messages
      setChatMessages(prev => [...prev, {
        id: attachmentId,
        type: 'image',
        content: compressedImage,
        timestamp: Date.now(),
      }]);
      
      // Success notification
      toast({
        title: "ScreenPipe image captured",
        description: "Image will be attached when you send the email",
      });
      
    } catch (error) {
      console.error('Error processing ScreenPipe capture:', error);
      toast({
        title: "Error capturing ScreenPipe image",
        description: "Failed to process the image",
        variant: "destructive",
      });
    }
  };

  // Remove an attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
    setChatMessages(prev => prev.filter(message => message.id !== id));
    
    toast({
      title: "Attachment removed",
      description: "The image has been removed from your message",
    });
  };

  // Prepare attachments for sending
  const prepareAttachmentsForSending = () => {
    return attachments.map(attachment => {
      // Remove the data:image/png;base64, prefix
      const base64Data = attachment.dataUrl.split(',')[1];
      return base64Data;
    });
  };

  // Send a test email
  const sendTestEmail = async () => {
    if (!recipient) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient address",
        variant: "destructive",
      });
      return;
    }

    console.log('Sending test email to:', recipient);
    setIsSending(true);

    try {
      // Connect wallet if needed
      if (!web3MailService.isWalletConnected()) {
        console.log('Wallet not connected, attempting connection');
        const connected = await web3MailService.connectWallet();
        console.log('Wallet connection result:', connected);
        
        if (!connected) {
          throw new Error("Wallet connection failed");
        }
      }

      // Get a test template
      const template = getRandomTemplate();
      
      // Use original template content - do NOT modify with attachments
      let emailContent = template.content;
      
      // Prepare attachments array (just the base64 data) for sending as separate attachments
      const attachmentDataArray = prepareAttachmentsForSending();
      
      console.log('Sending mail with template and attachments:', {
        template: template.subject,
        attachmentsCount: attachments.length
      });
      
      // Ensure attachments is always an array
      const safeAttachmentData = Array.isArray(attachmentDataArray) ? attachmentDataArray : [];
      
      // Send the mail with properly formatted attachments
      const result = await web3MailService.sendMail(
        recipient,
        template.subject,
        emailContent,
        safeAttachmentData // Send attachments as separate array, not embedded in HTML
      );
      
      console.log('Mail sending result:', result);
      
      if (result.success) {
        toast({
          title: "Test message sent!",
          description: "Check the recipient's inbox to verify",
        });
        setTestMessageSent(true);
        
        // Clear attachments and chat after successful send
        setAttachments([]);
        setChatMessages([]);
      } else {
        throw new Error(result.error || "Failed to send test message");
      }
    } catch (error) {
      console.error('Test email sending failed:', error);
      toast({
        title: "Error sending test message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Send Test Email</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Recipient Address
          </label>
          <input
            type="text"
            id="recipient"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Address (0x...) or email@network"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isSending}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter wallet address or network email (e.g., user@base)
          </p>
        </div>
        
        {/* Chat display for attachments - Always shown but empty when no attachments */}
        <div className="mt-2 border dark:border-gray-700 rounded-md p-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message Attachments ({attachments.length})
          </h3>
          {chatMessages.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chatMessages.map(message => (
                <div key={message.id} className="flex items-start gap-2">
                  {message.type === 'image' && (
                    <div className="relative group">
                      <img 
                        src={message.content} 
                        alt="Screenshot" 
                        className="max-w-full h-auto max-h-32 rounded border dark:border-gray-700" 
                      />
                      <button
                        onClick={() => removeAttachment(message.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove attachment"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 py-2 text-center italic">
              No attachments. Use the buttons below to add screenshots.
            </div>
          )}
        </div>
        
        {/* Attachment controls */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsScreenCaptureOpen(true)}
              disabled={isSending}
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white flex items-center gap-1"
              title="Take a screenshot"
            >
              <Camera size={16} />
              <span className="text-xs">Screenshot</span>
            </button>
            
            <button
              onClick={() => setIsScreenPipeCaptureOpen(true)}
              disabled={isSending}
              className="p-2 rounded-md bg-green-600 hover:bg-green-500 text-white flex items-center gap-1"
              title="Capture with ScreenPipe"
            >
              <ImageIcon size={16} />
              <span className="text-xs">ScreenPipe</span>
            </button>
          </div>
          
          <button
            type="button"
            className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none ${
              isSending || !serviceInitialized
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            }`}
            onClick={sendTestEmail}
            disabled={isSending || !serviceInitialized}
          >
            {isSending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <span className="flex items-center">
                {attachments.length > 0 && (
                  <Paperclip size={16} className="mr-1" />
                )}
                Send Email {attachments.length > 0 && `(${attachments.length} attachments)`}
              </span>
            )}
          </button>
        </div>
        
        {!serviceInitialized && (
          <div className="text-sm text-red-500 dark:text-red-400">
            Mail service is not available. Please check your wallet connection.
          </div>
        )}
        
        {testMessageSent && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md text-sm">
            <p className="font-medium">Test message sent successfully!</p>
            <p className="mt-1">The recipient should now be able to view this message in their inbox.</p>
          </div>
        )}
      </div>
      
      {/* Screen Capture Modal */}
      {isScreenCaptureOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <p className="text-white">Loading screen capture...</p>
            </div>
          </div>
        }>
          <MailScreenCapture
            onCapture={(imgData) => {
              setIsScreenCaptureOpen(false);
              handleScreenCapture(imgData);
            }}
            onClose={() => setIsScreenCaptureOpen(false)}
          />
        </Suspense>
      )}
      
      {/* ScreenPipe Capture Modal */}
      {isScreenPipeCaptureOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 size={40} className="animate-spin text-green-500 mb-4" />
              <p className="text-white">Loading ScreenPipe integration...</p>
            </div>
          </div>
        }>
          <MailScreenPipeCapture
            onCapture={(imgData) => {
              setIsScreenPipeCaptureOpen(false);
              handleScreenPipeCapture(imgData);
            }}
            onClose={() => setIsScreenPipeCaptureOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

interface MailInboxProps {
  className?: string;
}

export const MailInbox: React.FC<MailInboxProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      
      try {
        // Initialize mail service
        const initialized = await web3MailService.initializeWeb3();
        setServiceInitialized(initialized);
        
        if (initialized) {
          // Get messages
          const mailMessages = await web3MailService.getMailMessages();
          console.log("Fetched messages:", mailMessages);
          setMessages(mailMessages);
        } else {
          console.warn('Mail service not initialized, cannot fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, []);
  
  // Refresh messages function
  const refreshMessages = async () => {
    setLoading(true);
    try {
      // Debug: Check localStorage for messages
      const storageMessages = localStorage.getItem('web2_messages');
      console.log('======= DEBUG: LOCALSTORAGE MESSAGES =======');
      console.log('Raw localStorage data:', storageMessages);
      if (storageMessages) {
        const parsedMessages = JSON.parse(storageMessages);
        console.log('Parsed message structure:', parsedMessages);
        console.log('Available recipient buckets:', Object.keys(parsedMessages));
        
        // Check if current user has any messages
        const userAddress = await web3MailService.getWalletAddress();
        console.log('Current user address:', userAddress);
        if (parsedMessages[userAddress]) {
          console.log(`Found ${parsedMessages[userAddress].length} messages for current user`);
        } else {
          console.log('No messages found for current user in localStorage');
        }
      } else {
        console.log('No messages found in localStorage');
      }
      console.log('=========================================');
      
      const mailMessages = await web3MailService.getMailMessages();
      console.log("Refreshed messages:", mailMessages);
      setMessages(mailMessages);
      toast({
        title: "Inbox refreshed",
        description: `Found ${mailMessages.length} messages`,
      });
    } catch (error) {
      console.error('Error refreshing messages:', error);
      toast({
        title: "Error",
        description: "Failed to refresh messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const success = await web3MailService.deleteMail(messageId);
      
      if (success) {
        // Update the messages list
        setMessages(messages.filter(m => m.id !== messageId));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        
        toast({
          title: "Message deleted",
          description: "The message has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className={`mail-inbox ${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Your Messages</h2>
        <button 
          onClick={refreshMessages}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : !serviceInitialized ? (
        <div className="p-6 text-center">
          <div className="text-xl font-medium mb-2">Mail Service Unavailable</div>
          <p className="text-gray-300">
            Unable to initialize the mail service. Please check your wallet connection and network settings.
          </p>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-xl font-medium mb-2">Your inbox is empty</div>
          <p className="text-gray-300">
            No messages found. When you receive messages, they will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row">
          {/* Messages list */}
          <div className="w-full md:w-1/3 border-r border-neutral-800">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`p-4 border-b border-neutral-800 cursor-pointer hover:bg-neutral-800 transition-colors ${
                  selectedMessage?.id === message.id ? 'bg-neutral-800' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium truncate">{message.subject}</div>
                  <div className="text-xs text-gray-400">{formatDate(message.timestamp)}</div>
                </div>
                <div className="text-sm text-gray-400 truncate">
                  From: {message.senderEmail || message.sender}
                </div>
                <div className="text-xs mt-1 text-gray-500 truncate">
                  {message.content.startsWith('<!DOCTYPE') || message.content.startsWith('<html') 
                    ? "HTML Message"
                    : message.content}
                </div>
              </div>
            ))}
          </div>
          
          {/* Message detail */}
          {selectedMessage && (
            <div className="w-full md:w-2/3 p-4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-medium">{selectedMessage.subject}</h2>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  From: {selectedMessage.senderEmail || selectedMessage.sender}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  Date: {formatDate(selectedMessage.timestamp)}
                </div>
              </div>
              
              <div className="px-2 py-4 rounded bg-neutral-800 min-h-[200px]">
                {selectedMessage.content.startsWith('<!DOCTYPE') || selectedMessage.content.startsWith('<html') ? (
                  <iframe 
                    srcDoc={selectedMessage.content}
                    className="w-full h-[400px] border-0"
                    title="Email Content"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
                )}
              </div>
              
              {selectedMessage.txHash && (
                <div className="mt-4 text-xs text-gray-400">
                  Transaction: {selectedMessage.txHash}
                </div>
              )}
              
              {selectedMessage.networkName && (
                <div className="mt-1 text-xs text-gray-400">
                  Network: {selectedMessage.networkName}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ImageAnalysisPrompt: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-md mb-6">
      <h3 className="text-white text-lg font-medium mb-3">Image Analysis Prompt</h3>
      <div className="p-3 bg-gray-700 rounded text-white">
        <p className="text-sm mb-2 font-medium">The following prompt will be sent to Google Vision AI &amp; Groq:</p>
        <div className="bg-gray-900 p-3 rounded text-sm whitespace-pre-wrap font-mono">
{`// To Google Vision AI
Analyze this screenshot and identify the following:
1. Main subject or theme
2. Key text content
3. Visual elements (charts, graphics, etc.)
4. Color palette and style
5. Brand elements if present

// To Groq
Based on the Google Vision analysis, generate an HTML email that:
1. Creates a professional responsive email template
2. Incorporates the key theme and message from the screenshot
3. Uses similar styling and colors
4. Is optimized for both desktop and mobile
5. Includes appropriate CTAs based on the content
6. Maintains accessibility standards`}
        </div>
      </div>
    </div>
  );
};

// Add Google Vision AI mock function (replace with actual implementation later)
const analyzeImageWithVisionAI = async (imageDataUrl: string): Promise<{
  description: string;
  labels: string[];
  text: string;
  colors: string[];
}> => {
  // This is a mock function for the demo
  // In a real implementation, this would call Google Cloud Vision API
  console.log('Analyzing image with mock Vision AI...');
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock analysis
  return {
    description: "A screenshot of a user interface with data visualization elements",
    labels: ["user interface", "dashboard", "visualization", "chart", "data", "screen"],
    text: "Sample detected text from the image",
    colors: ["#3B82F6", "#1E293B", "#F9FAFB", "#000000"]
  };
};

// Replace the entire SendTestEmail component with this fixed version
export const SendTestEmail = () => {
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isScreenPipeReady, setIsScreenPipeReady] = useState(false);
  
  // Stellar specific states
  const [stellarInitialized, setStellarInitialized] = useState(false);
  const [stellarKeypair, setStellarKeypair] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [useStellar, setUseStellar] = useState(false);
  const [creatingKeypair, setCreatingKeypair] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem(STELLAR_USER_KEY);
        setIsLoggedIn(!!authData);
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };
    
    checkAuth();
    
    // Add event listener for storage changes to detect login/logout
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STELLAR_USER_KEY) {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initialize Stellar
  useEffect(() => {
    const initializeStellar = async () => {
      try {
        console.log('Checking for existing Stellar setup...');
        
        // Set initialized to true regardless - we'll handle errors at usage time
        setStellarInitialized(true);
        
        // Attempt to fetch the existing keypair if available
        try {
          const existingKeypair = localStorage.getItem(STELLAR_KEYPAIR_KEY);
          if (existingKeypair) {
            const keypair = JSON.parse(existingKeypair);
            setStellarKeypair(keypair);
            setUseStellar(true);
            console.log('Using existing Stellar keypair');
          }
        } catch (e) {
          console.warn('Could not load existing Stellar keypair:', e);
        }
      } catch (error) {
        console.error('Failed to initialize Stellar:', error);
        setStellarInitialized(false);
      }
    };
    
    initializeStellar();
  }, []);

  // Check if ScreenPipe is available
  useEffect(() => {
    const checkScreenPipe = async () => {
      try {
        const available = await isScreenPipeAvailable();
        setIsScreenPipeReady(available);
        if (!available) {
          console.log('ScreenPipe is not available');
        } else {
          console.log('ScreenPipe is ready');
        }
      } catch (error) {
        console.error('Error checking ScreenPipe availability:', error);
        setIsScreenPipeReady(false);
      }
    };
    
    checkScreenPipe();
  }, []);

  const captureScreenshot = async () => {
    try {
      if (!isScreenPipeReady) {
        toast.error('ScreenPipe is not available. Please install it first.');
        return;
      }
      
      toast.info('Capturing screenshot...');
      
      // Use ScreenPipe to capture screen
      const result = await window.screenpipe?.captureScreen();
      
      if (result && result.dataUrl) {
        setScreenshotDataUrl(result.dataUrl);
        toast.success('Screenshot captured successfully!');
        
        // Auto-analyze the image
        analyzeScreenshot(result.dataUrl);
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Failed to capture screenshot');
    }
  };

  const analyzeScreenshot = async (dataUrl: string) => {
    try {
      setIsAnalyzing(true);
      
      toast.info('Analyzing screenshot with Google Vision AI...');
      
      // Call Vision AI analysis (mock for now)
      const analysis = await analyzeImageWithVisionAI(dataUrl);
      
      setAnalysisResult(analysis);
      toast.success('Screenshot analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      toast.error('Failed to analyze screenshot');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearScreenshot = () => {
    setScreenshotDataUrl(null);
    setAnalysisResult(null);
  };

  // Generate a new Stellar keypair
  const generateStellarKeypair = async () => {
    try {
      setCreatingKeypair(true);
      
      const keypair = stellarService.createKeyPair();
      console.log('Generated Stellar keypair', keypair);
      
      // Store in localStorage
      localStorage.setItem(STELLAR_KEYPAIR_KEY, JSON.stringify(keypair));
      
      setStellarKeypair(keypair);
      setUseStellar(true);
      
      toast.success('New Stellar keypair generated!');
    } catch (error) {
      console.error('Error generating Stellar keypair:', error);
      toast.error('Failed to generate Stellar keypair');
    } finally {
      setCreatingKeypair(false);
    }
  };

  // Clear Stellar keypair
  const clearStellarKeypair = () => {
    localStorage.removeItem(STELLAR_KEYPAIR_KEY);
    setStellarKeypair(null);
    setUseStellar(false);
    toast.info('Stellar keypair cleared');
  };

  // Update handle send test to check for authentication
  const handleSendTest = async () => {
    // Check if logged in with Stellar auth
    if (!isLoggedIn) {
      toast.error('Please login with Stellar authentication first');
      return;
    }

    if (!recipient) {
      toast.error('Please enter a recipient address');
      return;
    }

    try {
      setSending(true);
      setResult(null);
      
      console.log('Sending test email to:', recipient);
      
      // Create test content with screenshot analysis
      const subject = 'Test Email from Project ADelta';
      
      // Generate content based on analysis
      let emailContent = '';
      
      if (screenshotDataUrl && analysisResult) {
        emailContent = `This is a test email sent at ${new Date().toLocaleString()}.

I have attached a screenshot that was analyzed by Google Vision AI:

Analysis Results:
- Description: ${analysisResult.description}
- Detected labels: ${analysisResult.labels.join(', ')}
- Text detected: ${analysisResult.text}
- Main colors: ${analysisResult.colors.join(', ')}

This analysis would be used by Groq to generate a personalized HTML email based on the content detected in the image.

Kind regards,
Project ADelta Team`;
      } else {
        emailContent = `This is a test email sent at ${new Date().toLocaleString()}.
      
Testing mail functionality to ensure delivery is working correctly.
      
Kind regards,
Project ADelta Team`;
      }

      // Create attachments array with the screenshot if available
      const attachments = screenshotDataUrl ? [screenshotDataUrl.split(',')[1]] : [];
      
      // If Stellar is enabled, sign the message
      if (useStellar && stellarKeypair) {
        try {
          console.log('Signing email with Stellar...');
          
          // Data to sign (subject + timestamp for uniqueness)
          const timestamp = Date.now().toString();
          const dataToSign = `${subject}:${timestamp}`;
          
          // Sign with Stellar directly
          const signature = await stellarService.signData(dataToSign, stellarKeypair.secretKey);
          
          // Wrap the content with Stellar signature information
          emailContent = JSON.stringify({
            originalContent: emailContent,
            stellarSignature: signature,
            stellarPublicKey: stellarKeypair.publicKey,
            timestamp: timestamp
          });
          
          console.log('Email signed with Stellar');
        } catch (error) {
          console.error('Error signing with Stellar:', error);
          toast.error('Failed to sign email with Stellar');
        }
      }
      
      // Connect wallet before sending
      if (!web3MailService.isWalletConnected()) {
        console.log('Connecting wallet...');
        await web3MailService.connectWallet();
      }
      
      // Send the mail
      const response = await web3MailService.sendMail(
        recipient,
        subject,
        emailContent,
        attachments
      );
      
      if (response.success) {
        toast.success('Test email sent successfully!');
        let resultText = `Email sent successfully with transaction: ${response.txHash}`;
        
        if (screenshotDataUrl) {
          resultText += '\nScreenshot attached and analyzed by Google Vision AI for generating personalized content.';
        }
        
        if (useStellar && stellarKeypair) {
          resultText += '\nEmail signed with Stellar blockchain for authenticity verification.';
        }
        
        setResult(resultText);
      } else {
        toast.error(`Failed to send email: ${response.error}`);
        setResult(`Failed to send email: ${response.error}`);
      }
    } catch (error) {
      console.error('Error in test email send:', error);
      toast.error('Error sending test email');
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md mb-6">
      <h3 className="text-white text-lg font-medium mb-3">Send Test Email with Screenshot Analysis</h3>
      
      {!isLoggedIn && (
        <div className="bg-yellow-900/30 border border-yellow-800 rounded p-3 mb-4 flex items-start">
          <Shield className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
          <div>
            <p className="text-yellow-500 font-medium">Authentication Required</p>
            <p className="text-gray-300 text-sm">
              Please log in with Stellar authentication above to send emails.
            </p>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Recipient Address or Email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      
      <div className="mb-4 flex items-center">
        <button 
          onClick={captureScreenshot}
          disabled={!isScreenPipeReady || isAnalyzing}
          className={`mr-2 px-3 py-2 rounded ${!isScreenPipeReady ? 'bg-gray-600 opacity-50' : 'bg-green-600 hover:bg-green-500'} text-white`}
        >
          <Camera className="w-4 h-4 inline-block mr-1" />
          Capture Screenshot
        </button>
        
        {!isScreenPipeReady && (
          <span className="text-sm text-red-300">
            ScreenPipe not available. <a href="https://screenpi.pe/download" target="_blank" rel="noopener noreferrer" className="underline">Install it</a>
          </span>
        )}
      </div>
      
      {/* Screenshot Preview */}
      {screenshotDataUrl && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-white font-medium">Screenshot Preview</h4>
            <button 
              onClick={clearScreenshot}
              className="text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
          <div className="relative mb-2">
            <img 
              src={screenshotDataUrl} 
              alt="Captured screenshot" 
              className="max-h-64 rounded border border-gray-600 object-contain w-full" 
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <span className="text-white text-sm">Analyzing with Google Vision AI...</span>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="text-sm text-white">
              <h5 className="font-medium mb-1">Analysis Results:</h5>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                <li>Description: {analysisResult.description}</li>
                <li>Labels: {analysisResult.labels.join(', ')}</li>
                <li>Text detected: {analysisResult.text}</li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={handleSendTest}
        disabled={sending || !isLoggedIn}
        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {!isLoggedIn ? 'Login Required' : 'Send Test Email'}
          </>
        )}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-sm text-white">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default function MailShare() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Stellar Mail System</h1>
      
      {/* Stellar Login Component */}
      <StellarLogin />
      
      {/* Test email component */}
      <SendTestEmail />
      
      {/* Image Analysis Prompt */}
      <ImageAnalysisPrompt />
      
      {/* Standard mail components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Compose Message</h2>
          <MailComposer />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Inbox</h2>
          <MailInbox />
        </div>
      </div>
    </div>
  );
} 