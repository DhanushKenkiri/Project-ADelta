
import React, { useState } from 'react';
import { RefreshCcw, Copy, Expand, Sun, Moon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmailWorkspaceProps {
  emailContent: string;
}

// Define the message type to ensure type safety
type MessageRole = 'user' | 'assistant';
interface Message {
  role: MessageRole;
  content: string;
}

const EmailWorkspace = ({ emailContent }: EmailWorkspaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "I've generated an email template based on your request. Would you like to make any adjustments?" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    // Add user message with the correct type
    const newMessages = [...messages, { role: 'user' as MessageRole, content: inputMessage }];
    setMessages(newMessages);
    setInputMessage('');
    
    // Mock assistant response after a short delay with the correct type
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'assistant' as MessageRole, 
        content: "I've updated the template based on your feedback. Is there anything else you'd like to modify?" 
      }]);
    }, 1000);
  };

  return (
    <div className="flex w-full gap-4 h-[calc(100vh-130px)]">
      {/* Email Preview Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Email Preview</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1A1A1A] rounded-full px-2 py-1">
              <Sun size={14} className="text-gray-500 mr-1" />
              <div className="w-8 h-4 bg-[#0A0A0F] rounded-full flex items-center p-0.5">
                <div className="w-3 h-3 rounded-full bg-white ml-auto"></div>
              </div>
              <Moon size={14} className="text-white ml-1" />
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <RefreshCcw size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Copy size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Expand size={16} />
            </Button>
          </div>
        </div>

        <Card className="border border-white/5 bg-black rounded-lg overflow-hidden h-full">
          <CardContent className="p-0">
            <div className="bg-white rounded-md m-4 p-6 min-h-[calc(100%-2rem)]">
              <div className="flex justify-center mb-6">
                <img 
                  src="/lovable-uploads/d2cb60af-26d8-42aa-bbaf-ec1a70421c1b.png" 
                  alt="University Logo" 
                  className="h-16 object-contain"
                />
              </div>
              
              <h1 className="text-2xl font-bold text-center mb-8 text-black">University Announcement</h1>
              
              <p className="text-black mb-4">Dear [Recipient Name],</p>
              
              <div className="text-black whitespace-pre-line">
                {emailContent || "Your email content will appear here."}
              </div>
              
              <div className="mt-12 pt-4 border-t border-gray-200 text-xs text-center text-gray-600">
                <p>University of Hyderabad</p>
                <p>Prof. C.R. Rao Road, Gachibowli</p>
                <p>Hyderabad - 500 046, Telangana, India</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Chat Section */}
      <div className="w-96">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Chat</h2>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Expand size={16} />
          </Button>
        </div>

        <Card className="border border-white/5 bg-[#0A0A0F] h-full flex flex-col">
          <CardContent className="flex flex-col flex-1 p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#1A1A1A] text-white'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center mb-1">
                        <div className="w-4 h-4 bg-[#333] rounded-full flex items-center justify-center mr-1">
                          <span className="text-[8px] text-white">AI</span>
                        </div>
                        <span className="text-xs text-gray-400">AI Assistant</span>
                      </div>
                    )}
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-l-md px-3 py-2 text-white focus:outline-none"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md"
                >
                  Send
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailWorkspace;
