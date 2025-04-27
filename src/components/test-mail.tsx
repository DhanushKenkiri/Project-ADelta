import React, { useState, useEffect } from 'react';
import { web3MailService } from '@/services/web3MailService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader } from 'lucide-react';

const MailTest: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('Test Email');
  const [content, setContent] = useState('This is a test email sent from the mail test component.');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [logOutput, setLogOutput] = useState<string[]>([]);

  // Override console.log to capture logs
  const addLog = (message: string) => {
    setLogOutput(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  useEffect(() => {
    const originalLog = console.log;
    console.log = function(...args) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message);
      originalLog.apply(console, args);
    };

    // Initialize mail service
    initializeMailService();

    return () => {
      console.log = originalLog;
    };
  }, []);

  const initializeMailService = async () => {
    setLoading(true);
    try {
      console.log('Initializing web3 mail service...');
      const result = await web3MailService.initializeWeb3();
      setInitialized(result);
      console.log('Web3 mail service initialized:', result);

      if (result) {
        console.log('Checking if wallet is connected...');
        const isConnected = web3MailService.isWalletConnected();
        console.log('Wallet connected:', isConnected);
        
        if (isConnected) {
          const address = await web3MailService.getWalletAddress();
          setUserAddress(address);
          console.log('Wallet address:', address);
        }

        // Fetch messages for debugging purposes
        refreshMessages();
      }
    } catch (error) {
      console.error('Error initializing mail service:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      console.log('Connecting wallet...');
      const result = await web3MailService.connectWallet();
      console.log('Connect wallet result:', result);
      
      if (result) {
        const address = await web3MailService.getWalletAddress();
        setUserAddress(address);
        console.log('Connected wallet address:', address);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMail = async () => {
    if (!recipient) {
      toast({
        title: "Error",
        description: "Please enter a recipient address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`Sending mail to: ${recipient}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${content}`);

      if (!web3MailService.isWalletConnected()) {
        console.log('Wallet not connected, attempting to connect...');
        await connectWallet();
      }

      // For debugging, dump localStorage content before sending
      dumpLocalStorage();

      // Send the mail
      const result = await web3MailService.sendMail(
        recipient,
        subject,
        content,
        [] // No attachments
      );

      console.log('Send mail result:', result);

      if (result.success) {
        toast({
          title: "Success",
          description: "Mail sent successfully"
        });

        // For debugging, dump localStorage content after sending
        dumpLocalStorage();

        // Refresh messages to see if the new one appears
        setTimeout(() => refreshMessages(), 1000);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send mail",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    setLoading(true);
    try {
      console.log('Fetching messages...');
      const msgs = await web3MailService.getMailMessages();
      console.log('Fetched messages:', msgs);
      setMessages(msgs);
      
      // Debug localStorage
      dumpLocalStorage();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const dumpLocalStorage = () => {
    console.log('========= LocalStorage Debug =========');
    try {
      const web2Messages = localStorage.getItem('web2_messages');
      console.log('web2_messages in localStorage:', web2Messages ? JSON.parse(web2Messages) : 'Not found');
    } catch (error) {
      console.error('Error parsing web2_messages:', error);
    }
    console.log('======================================');
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('web2_messages');
    console.log('Cleared web2_messages from localStorage');
    refreshMessages();
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Mail Service Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2">Service Status: {initialized ? 
              <span className="text-green-500">Initialized</span> : 
              <span className="text-red-500">Not Initialized</span>
            }</p>
            {userAddress && <p className="mb-2">Wallet Address: {userAddress}</p>}
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={initializeMailService} 
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reinitialize Service
              </Button>
              <Button 
                onClick={connectWallet} 
                disabled={loading || !initialized}
                variant="outline"
              >
                {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Connect Wallet
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="recipient" className="block text-sm font-medium">
              Recipient Address
            </label>
            <Input
              id="recipient"
              placeholder="Enter wallet address or email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium">
              Subject
            </label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium">
              Content
            </label>
            <textarea
              id="content"
              className="w-full p-2 border rounded"
              placeholder="Enter email content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={sendTestMail} 
              disabled={loading || !initialized}
            >
              {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Test Email
            </Button>
            <Button 
              onClick={refreshMessages} 
              variant="outline" 
              disabled={loading}
            >
              Refresh Messages
            </Button>
            <Button 
              onClick={clearLocalStorage} 
              variant="destructive" 
              disabled={loading}
            >
              Clear Storage
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages found</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className="p-4 border rounded">
                  <div className="font-bold">{msg.subject}</div>
                  <div className="text-sm">From: {msg.senderEmail || msg.sender}</div>
                  <div className="text-sm">To: {msg.recipient}</div>
                  <div className="text-sm">Sent: {new Date(msg.timestamp).toLocaleString()}</div>
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <pre className="whitespace-pre-wrap text-sm">{msg.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded h-80 overflow-auto font-mono text-sm">
            {logOutput.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MailTest; 