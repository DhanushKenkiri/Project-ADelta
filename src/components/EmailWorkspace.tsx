
import React, { useState } from 'react';
import { RefreshCcw, Copy, Expand, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmailWorkspaceProps {
  emailContent: string;
  onRevert: () => void;
}

// Define the message type to ensure type safety
type MessageRole = 'user' | 'assistant';
interface Message {
  role: MessageRole;
  content: string;
}

const EmailWorkspace = ({ emailContent, onRevert }: EmailWorkspaceProps) => {
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
    <div className="w-full flex gap-4 h-[calc(100vh-130px)]">
      <Button 
        onClick={onRevert}
        variant="ghost" 
        size="icon" 
        className="absolute top-6 left-6 bg-black/30 hover:bg-black/50 text-white border border-white/10 transition-all duration-300 animate-fade-in"
      >
        <ArrowLeft size={18} />
      </Button>

      {/* Email Preview Section - Increased width to 70% */}
      <div className="w-[70%] transition-all duration-500 animate-slide-in-right">
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
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors duration-300">
              <RefreshCcw size={16} className="hover:rotate-180 transition-transform duration-500" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors duration-300">
              <Copy size={16} className="hover:scale-110 transition-transform duration-300" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors duration-300">
              <Expand size={16} className="hover:scale-110 transition-transform duration-300" />
            </Button>
          </div>
        </div>

        <Card className="border border-white/5 bg-black rounded-lg overflow-hidden h-full shadow-lg hover:shadow-xl transition-all duration-500">
          <CardContent className="p-0">
            <div className="bg-white rounded-md m-4 p-6 min-h-[calc(100%-2rem)] transform transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex justify-center mb-6">
                <img 
                  src="/lovable-uploads/d2cb60af-26d8-42aa-bbaf-ec1a70421c1b.png" 
                  alt="University Logo" 
                  className="h-16 object-contain hover:scale-105 transition-transform duration-300"
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
      
      {/* Chat Section - Moved to extreme right */}
      <div className="w-[30%] transition-all duration-500 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Chat</h2>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors duration-300">
            <Expand size={16} className="hover:scale-110 transition-transform duration-300" />
          </Button>
        </div>

        <Card className="border border-white/5 bg-[#0A0A0F] h-full flex flex-col shadow-lg hover:shadow-xl transition-all duration-500">
          <CardContent className="flex flex-col flex-1 p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-lg px-4 py-2 transform transition-all duration-300 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-[#1A1A1A] text-white hover:bg-[#222]'
                    } animate-fade-in`}
                  >
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
                  className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-l-md px-3 py-2 text-white focus:outline-none transition-all duration-300 focus:border-blue-500"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md transition-colors duration-300"
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
