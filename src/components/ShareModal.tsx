import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, Database, Wallet, CreditCard, Globe } from 'lucide-react';
import { toast } from 'sonner';
import walletService from '@/lib/walletService';
import { MailComposer } from './MailShare';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  htmlContent: string;
  onSend: (email: string, options?: { useDecentralized?: boolean; useMicropayment?: boolean; storeOnIPFS?: boolean; web2Delivery?: boolean }) => Promise<boolean>;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  templateName,
  htmlContent,
  onSend 
}) => {
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMailSent = () => {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          onClose();
        }, 2000);
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
          >
            <X size={20} />
          </button>
        </div>
        
        {isSent ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Template Sent!</h3>
            <p className="text-neutral-400 text-sm">
              Your template has been sent successfully
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
          <MailComposer 
            htmlContent={htmlContent}
            defaultSubject={`${templateName} - Shared Template`}
            onMailSent={handleMailSent}
          />
        )}
      </div>
    </div>
  );
};

export default ShareModal; 