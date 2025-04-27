import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Check, ArrowLeft, Send } from 'lucide-react';
import { web3MailService } from '@/services/web3MailService';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';

const SendTemplatePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [serviceInitialized, setServiceInitialized] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [autoAddress, setAutoAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  
  // Get template data from location state
  const templateHtml = location.state?.templateHtml || '<div style="padding: 20px; font-family: Arial;">No template content available. Please select a template first.</div>';
  const templateName = location.state?.templateName || 'Untitled Template';
  
  useEffect(() => {
    // Initialize web3 service
    web3MailService.initializeWeb3()
      .then(initialized => {
        setServiceInitialized(initialized);
        if (initialized) {
          const network = web3MailService.getCurrentNetworkDomain();
          setCurrentNetwork(network);
          
          // Check if wallet is connected
          setWalletConnected(web3MailService.isWalletConnected());
          
          // Get auto-generated inbox address
          const address = web3MailService.getAutoInboxAddress();
          setAutoAddress(address);
          
          // If no template data, redirect to templates page
          if (!location.state?.templateHtml) {
            toast({
              title: "No template selected",
              description: "Please select a template to send",
              variant: "destructive",
            });
            navigate('/templates');
          }
        }
      })
      .catch(error => {
        console.error('Error initializing service:', error);
        setServiceInitialized(false);
      });
  }, [location.state, navigate, toast]);
  
  // Handle recipient change
  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
  };
  
  // Format recipient address if needed
  const getFormattedRecipient = () => {
    if (recipient && !recipient.includes('@') && !recipient.startsWith('0x') && currentNetwork) {
      return `${recipient}@${currentNetwork}`;
    }
    return recipient;
  };
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      const connected = await web3MailService.connectWallet();
      setWalletConnected(connected);
      
      if (connected) {
        toast({
          title: "Wallet connected",
          description: "Your wallet has been connected successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };
  
  // Handle send template
  const sendTemplate = async () => {
    if (!recipient) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient address",
        variant: "destructive",
      });
      return;
    }
    
    const formattedRecipient = getFormattedRecipient();
    
    setIsSending(true);
    try {
      // Connect wallet if not connected
      if (!walletConnected) {
        const connected = await web3MailService.connectWallet();
        if (!connected) {
          throw new Error("You need to connect your wallet to send messages");
        }
        setWalletConnected(true);
      }
      
      // Send template
      const result = await web3MailService.sendMail(
        formattedRecipient,
        templateName,
        templateHtml,
        {}
      );
      
      if (result.success) {
        toast({
          title: "Template sent",
          description: "Your template has been sent successfully",
        });
        
        // Redirect back to templates page
        setTimeout(() => {
          navigate('/templates');
        }, 1500);
      } else {
        throw result.error || new Error("Failed to send template");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send template",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Copy auto-generated address to clipboard
  const copyAddress = () => {
    if (autoAddress) {
      navigator.clipboard.writeText(autoAddress);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "Address copied to clipboard",
      });
    }
  };
  
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Send Template" />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/templates')}
              className="mr-4"
            >
              <ArrowLeft size={18} className="mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold">{templateName}</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Preview */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden h-[calc(100vh-220px)]">
                <CardContent className="p-0">
                  <div className="bg-white w-full h-full">
                    <iframe
                      srcDoc={templateHtml}
                      title={templateName}
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Send Form */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-neutral-900 to-neutral-950">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Send Template</h2>
                    <p className="text-sm text-neutral-400">Send this template to another user</p>
                  </div>
                  
                  {!serviceInitialized && (
                    <div className="bg-yellow-50/10 border border-yellow-400/20 rounded-md p-3 text-yellow-400 text-sm">
                      <p className="font-semibold flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        Service Offline
                      </p>
                      <p className="mt-1 text-xs opacity-80">
                        The mail service is currently unavailable.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="recipient" className="text-sm font-medium block mb-1.5">Recipient Address</Label>
                      <div className="relative">
                        <Input
                          id="recipient"
                          placeholder="username, wallet or email address"
                          value={recipient}
                          onChange={handleRecipientChange}
                          className="bg-black/40 border-neutral-800 focus:border-indigo-500 py-5 pl-4 pr-12 rounded-lg transition-colors"
                          disabled={isSending}
                        />
                        {!recipient.includes('@') && !recipient.startsWith('0x') && currentNetwork && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm">
                            @{currentNetwork}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {autoAddress && (
                      <div className="bg-neutral-800/50 rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">Your Inbox Address</h3>
                        <div className="flex items-center justify-between bg-black/40 py-2 px-3 rounded border border-neutral-700">
                          <p className="text-xs text-neutral-300 truncate mr-2 font-mono">
                            {autoAddress}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={copyAddress}
                            className="h-7 w-7 p-0"
                          >
                            {showCopied ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          Share this address to receive messages
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      {!walletConnected ? (
                        <Button 
                          onClick={connectWallet}
                          className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 transition-colors"
                          disabled={!serviceInitialized}
                        >
                          Connect Wallet to Send
                        </Button>
                      ) : (
                        <Button 
                          onClick={sendTemplate}
                          className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 transition-colors"
                          disabled={isSending || !serviceInitialized}
                        >
                          {isSending ? (
                            <div className="flex items-center justify-center">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span className="ml-2">Sending...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="mr-2">Send Template</span>
                              <Send size={16} />
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SendTemplatePage; 