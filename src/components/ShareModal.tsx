import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, Database, Wallet, CreditCard, Globe } from 'lucide-react';
import { toast } from 'sonner';
import walletService from '@/lib/walletService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  onSend: (email: string, options?: { useDecentralized?: boolean; useMicropayment?: boolean; storeOnIPFS?: boolean; web2Delivery?: boolean }) => Promise<boolean>;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  templateName,
  onSend 
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useDecentralized, setUseDecentralized] = useState(false);
  const [useMicropayment, setUseMicropayment] = useState(false);
  const [storeOnIPFS, setStoreOnIPFS] = useState(true);
  const [web2Delivery, setWeb2Delivery] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset state
    setError(null);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // If using decentralized mode, make sure wallet is connected
    if (useDecentralized && !walletConnected) {
      try {
        // Try to connect wallet
        setIsLoading(true);
        toast.info('Connecting to wallet...');
        await walletService.connect();
        setWalletConnected(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        toast.error('Failed to connect wallet. Please try again.');
        setError('Failed to connect wallet. Please try again with standard delivery.');
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Set sending options based on user selections
      const options = useDecentralized ? {
        useDecentralized,
        useMicropayment,
        storeOnIPFS,
        web2Delivery
      } : undefined;
      
      // Send email
      const success = await onSend(email, options);
      
      if (success) {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          onClose();
          setEmail('');
        }, 2000);
      } else {
        setError('Failed to send email. The server returned an error.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email. Please try again later.');
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      await walletService.connect();
      setWalletConnected(true);
      toast.success('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div 
        className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-neutral-700 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Send Template</h2>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        {isSent ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Email Sent!</h3>
            <p className="text-neutral-400 text-sm">
              The template has been sent to {email}
            </p>
            {ipfsHash && (
              <div className="mt-4 p-3 bg-indigo-900/20 rounded-md border border-indigo-900/30">
                <p className="text-indigo-400 text-xs">
                  Content stored on IPFS with hash:
                </p>
                <p className="text-xs font-mono text-indigo-300 mt-1 break-all">
                  {ipfsHash}
                </p>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Sharing Failed</h3>
            <p className="text-neutral-400 text-sm mb-4">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 rounded-md font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-neutral-400 text-sm mb-4">
                Send your "{templateName}" template via email:
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter recipient's email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-neutral-500"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
                  >
                    {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
                  </button>
                </div>
                
                {showAdvanced && (
                  <div className="mb-4 p-3 bg-neutral-800/50 rounded-md border border-neutral-700/50">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="useDecentralized"
                        checked={useDecentralized}
                        onChange={() => setUseDecentralized(!useDecentralized)}
                        className="mr-2 h-4 w-4 text-indigo-600 rounded"
                        disabled={isLoading}
                      />
                      <label htmlFor="useDecentralized" className="text-sm text-neutral-300 flex items-center">
                        <Database size={14} className="mr-1 text-indigo-400" />
                        Use decentralized delivery
                      </label>
                    </div>
                    
                    {useDecentralized && (
                      <>
                        <div className="ml-6 mb-3">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="storeOnIPFS"
                              checked={storeOnIPFS}
                              onChange={() => setStoreOnIPFS(!storeOnIPFS)}
                              className="mr-2 h-4 w-4 text-indigo-600 rounded"
                              disabled={isLoading}
                            />
                            <label htmlFor="storeOnIPFS" className="text-sm text-neutral-300 flex items-center">
                              <Globe size={14} className="mr-1 text-indigo-400" />
                              Store content on IPFS
                            </label>
                          </div>
                          
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="web2Delivery"
                              checked={web2Delivery}
                              onChange={() => setWeb2Delivery(!web2Delivery)}
                              className="mr-2 h-4 w-4 text-indigo-600 rounded"
                              disabled={isLoading}
                            />
                            <label htmlFor="web2Delivery" className="text-sm text-neutral-300 flex items-center">
                              <Mail size={14} className="mr-1 text-indigo-400" />
                              Send to traditional email
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="useMicropayment"
                              checked={useMicropayment}
                              onChange={() => setUseMicropayment(!useMicropayment)}
                              className="mr-2 h-4 w-4 text-indigo-600 rounded"
                              disabled={isLoading}
                            />
                            <label htmlFor="useMicropayment" className="text-sm text-neutral-300 flex items-center">
                              <CreditCard size={14} className="mr-1 text-indigo-400" />
                              Include micropayment (0.01 XLM)
                            </label>
                          </div>
                        </div>
                        
                        {!walletConnected && (
                          <button
                            type="button"
                            onClick={connectWallet}
                            className="w-full py-2 mt-2 rounded-md text-xs font-medium bg-indigo-700 hover:bg-indigo-600 text-white transition-all"
                            disabled={isLoading}
                          >
                            <Wallet size={14} className="inline-block mr-1" />
                            Connect Wallet
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || (useDecentralized && !walletConnected)}
                  className={`w-full py-3 rounded-md font-medium transition-all duration-300 flex items-center justify-center
                    ${isLoading ? 'bg-neutral-700 text-neutral-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 active:scale-[0.98]'}`}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Sending...</span>
                      <div className="h-4 w-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    'Send Template'
                  )}
                </button>
              </form>
              
              <div className="mt-4 text-xs text-neutral-500">
                <p>The recipient will receive an email with your template attached.</p>
                {useDecentralized && (
                  <p className="mt-1 text-indigo-500/70">Template content will be encrypted and stored on IPFS.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareModal; 