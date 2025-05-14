import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Send, Copy, Download, Save, RefreshCw, Eye, Code, Sun, Moon, Smartphone, Laptop, Monitor, ChevronDown, Share2, Camera, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getTemplateById } from '@/lib/templateUtils';
import { sendChatMessage, updateTemplateWithChat, resetChatHistory, updateTemplateInChat } from '@/lib/groq';
import HtmlCodeEditor from '@/components/HtmlCodeEditor';
import ShareModal from '@/components/ShareModal';
import ScreenCapture from '@/components/ScreenCapture';
import ScreenPipeCapture from '@/components/ScreenPipeCapture';
import { insertImageIntoHtml, compressImage } from '@/lib/imageUtils';
import { sendTemplateEmail } from '@/lib/emailService';
import PageTitle from '@/components/PageTitle';

// Interface for chat messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// Device types for responsive preview
type DeviceType = 'desktop' | 'tablet' | 'mobile';

const TemplateGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>('Email Template');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false);
  const [isScreenPipeCaptureOpen, setIsScreenPipeCaptureOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  // Extract template ID or template content from query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    const templateParam = queryParams.get('template');
    
    if (templateParam) {
      try {
        // Decode the template content from base64
        const decodedHtml = decodeURIComponent(atob(templateParam));
        console.log('Loading template from URL parameter');
        setTemplateName('Shared Template');
        setHtmlContent(decodedHtml);
        toast.success('Template loaded from shared link!');
      } catch (e) {
        console.error('Error loading template from URL parameter:', e);
        toast.error('Failed to load shared template');
      }
    } else if (id) {
      setTemplateId(id);
      loadTemplate(id);
    }
  }, [location]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Initialize or reset chat when template changes
  useEffect(() => {
    if (htmlContent) {
      resetChatHistory();
      updateTemplateInChat(htmlContent);
      setMessages([
        {
          role: 'system',
          content: 'Template loaded. I can help you customize this email template. What would you like to change?',
          timestamp: Date.now()
        }
      ]);
    }
  }, [htmlContent]);

  // Close options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load template with the given ID
  const loadTemplate = async (id: string) => {
    try {
      setIsLoading(true);
      const template = await getTemplateById(id);
      
      if (template && template.htmlContent) {
        setTemplateName(template.name);
        setHtmlContent(template.htmlContent);
      } else {
        toast.error('Could not load template HTML content');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending the template via email
  const handleSendTemplate = async (recipientEmail: string, options?: { useDecentralized?: boolean; useMicropayment?: boolean; storeOnIPFS?: boolean; web2Delivery?: boolean }): Promise<boolean> => {
    try {
      toast.info('Preparing to send template...');

      // Set share status to prevent realtime connections during sharing process  
      setIsSharing(true);
      
      // Log delivery options for debugging
      console.log('Sending with options:', options);
      
      if (options?.useDecentralized) {
        toast.info('Initializing decentralized delivery...');
      }
      
      // Skip the realtime service for email sharing to avoid WebSocket errors
      const success = await sendTemplateEmail(
        recipientEmail,
        `${templateName} - Email Template`,
        htmlContent,
        options
      );
      
      if (success) {
        if (options?.useDecentralized) {
          toast.success(`Template sent to ${recipientEmail} via decentralized delivery`);
        } else {
          toast.success(`Template sent to ${recipientEmail}`);
        }
        return true;
      } else {
        toast.error('Failed to send template');
        return false;
      }
    } catch (error) {
      console.error('Error sending template:', error);
      toast.error('An error occurred while sending the template');
      return false;
    } finally {
      // Reset sharing status after 2 seconds to allow UI to update
      setTimeout(() => {
        setIsSharing(false);
      }, 2000);
    }
  };

  // Send message to chat
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Check if we should update the template or just get a response
      if (inputMessage.toLowerCase().includes('change') || 
          inputMessage.toLowerCase().includes('update') || 
          inputMessage.toLowerCase().includes('modify') ||
          inputMessage.toLowerCase().includes('make') ||
          inputMessage.toLowerCase().includes('set') ||
          inputMessage.toLowerCase().includes('add')) {
        
        // Update the template
        const { updatedHtml, response } = await updateTemplateWithChat(inputMessage, htmlContent);
        
        // Update the HTML content
        setHtmlContent(updatedHtml);
        
        // Add assistant message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        }]);
      } else {
        // Just get a response without updating the template
        const response = await sendChatMessage(inputMessage, htmlContent);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy HTML to clipboard
  const copyHtmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      toast.success('HTML copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Download HTML file
  const downloadHtml = () => {
    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-template.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('HTML file downloaded');
  };

  // Save template and return to home
  const saveTemplate = () => {
    localStorage.setItem('template-html', htmlContent);
    navigate('/');
    toast.success('Template saved and loaded in editor');
  };

  // Handle input keypress (Send on Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get device frame dimensions
  const getDeviceFrameDimensions = (): { width: string, maxWidth: string, height: string } => {
    switch (deviceType) {
      case 'mobile':
        return { width: '100%', maxWidth: '375px', height: '667px' };
      case 'tablet':
        return { width: '100%', maxWidth: '768px', height: '1024px' };
      case 'desktop':
      default:
        return { width: '100%', maxWidth: '100%', height: '100%' };
    }
  };
  
  // Get device icon
  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone size={18} />;
      case 'tablet':
        return <Laptop size={18} />;
      case 'desktop':
      default:
        return <Monitor size={18} />;
    }
  };

  // Handle screen capture completion
  const handleScreenCapture = async (imageDataUrl: string) => {
    try {
      // Show loading toast
      toast.loading('Processing captured image...');
      
      // Compress the image to reduce size
      const compressedImage = await compressImage(imageDataUrl, 800, 0.85);
      
      // Insert the image into the HTML template
      const updatedHtml = insertImageIntoHtml(htmlContent, compressedImage);
      
      // Update the template
      setHtmlContent(updatedHtml);
      
      // Add system message about image insertion
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Screenshot added to the email template.',
        timestamp: Date.now()
      }]);
      
      // Success notification
      toast.success('Screenshot added to template');
      
      // Update the template in chat context
      updateTemplateInChat(updatedHtml);
      
    } catch (error) {
      console.error('Error processing screenshot:', error);
      toast.error('Failed to add screenshot to template');
    }
  };

  // Handle screen capture from ScreenPipe
  const handleScreenPipeCapture = async (imageDataUrl: string) => {
    try {
      // Show loading toast
      toast.loading('Processing ScreenPipe image...');
      
      // Compress the image to reduce size
      const compressedImage = await compressImage(imageDataUrl, 800, 0.85);
      
      // Insert the image into the HTML template
      const updatedHtml = insertImageIntoHtml(htmlContent, compressedImage);
      
      // Update the template
      setHtmlContent(updatedHtml);
      
      // Add system message about image insertion
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'ScreenPipe screenshot added to the chat.',
        timestamp: Date.now()
      }]);
      
      // Success notification
      toast.success('ScreenPipe screenshot added');
      
      // Update the template in chat context
      updateTemplateInChat(updatedHtml);
      
    } catch (error) {
      console.error('Error processing ScreenPipe screenshot:', error);
      toast.error('Failed to add ScreenPipe screenshot');
    }
  };

  // Render email preview with device frame
  const renderPreview = () => {
    try {
      const dimensions = getDeviceFrameDimensions();
      
      return (
        <div className="flex items-center justify-center w-full h-full bg-neutral-900 overflow-auto">
          <div 
            className={`bg-white overflow-hidden shadow-md transition-all duration-300 ${
              deviceType === 'mobile' 
                ? 'rounded-[8px] border-4 border-neutral-800' 
                : deviceType === 'tablet'
                  ? 'rounded-[8px] border-4 border-neutral-800' 
                  : 'rounded-md'
            }`}
            style={{ 
              width: dimensions.width,
              maxWidth: dimensions.maxWidth,
              height: dimensions.height,
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              title={templateName}
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering iframe:', error);
      return (
        <div className="p-4 text-red-500 bg-red-100 rounded">
          Error displaying template: {String(error)}
        </div>
      );
    }
  };

  // Format code in chat messages
  const formatMessageContent = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract code and language
        const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
        if (codeMatch) {
          const [, language, code] = codeMatch;
          return (
            <pre key={index} className="bg-neutral-900 p-3 rounded my-2 overflow-x-auto">
              <code className="text-sm font-mono text-gray-300">{code.trim()}</code>
            </pre>
          );
        }
      }
      
      // Regular text - process for line breaks
      return part.split('\n').map((line, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Template Generator" />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full bg-neutral-900">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-3">
            <Link to="/templates" className="flex items-center text-neutral-400 hover:text-neutral-200 transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              <span>Back to templates</span>
            </Link>
            
            <div className="h-4 w-px bg-neutral-800 mx-2"></div>
            
            <div className="flex items-center">
              <span className="text-neutral-300 font-medium text-sm">{templateName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-800 rounded-md border border-neutral-700">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center px-3 py-1 rounded-md text-xs ${
                  viewMode === 'preview' 
                    ? 'bg-neutral-700 text-white' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Eye size={14} className="mr-1" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center px-3 py-1 rounded-md text-xs ${
                  viewMode === 'code' 
                    ? 'bg-neutral-700 text-white' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Code size={14} className="mr-1" />
                Code
              </button>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={saveTemplate}
                className="flex items-center bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-neutral-700"
              >
                <Save size={14} className="mr-1" />
                Save
              </button>
              <button
                onClick={copyHtmlToClipboard}
                className="flex items-center bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-neutral-700"
              >
                <Copy size={14} className="mr-1" />
                Copy
              </button>
              <button
                onClick={downloadHtml}
                className="flex items-center bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-neutral-700"
              >
                <Download size={14} className="mr-1" />
                Download
              </button>
              <button
                onClick={() => {
                  // Disable realtime connection before opening share modal
                  setIsSharing(true);
                  setIsShareModalOpen(true);
                }}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-indigo-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share2 mr-1"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main content area - make it responsive */}
          <div className={`${viewMode === 'preview' ? 'w-3/4' : 'w-3/5'} transition-all duration-300 flex flex-col h-full`}>
            {/* Device toolbar */}
            <div className="flex items-center justify-between px-3 py-1 bg-neutral-800 border-b border-neutral-700">
              <div className="flex items-center">
                <span className="text-neutral-400 text-xs mr-2">Device:</span>
                <div className="relative" ref={optionsRef}>
                  <button 
                    className="flex items-center bg-neutral-700 text-white px-2 py-1 rounded text-xs"
                    onClick={() => setShowOptions(!showOptions)}
                  >
                    {getDeviceIcon()}
                    <span className="mx-1">{deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}</span>
                    <ChevronDown size={12} />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-10 min-w-32">
                      <button 
                        className="flex items-center gap-2 w-full px-2 py-1 hover:bg-neutral-700 text-xs text-white text-left"
                        onClick={() => { setDeviceType('desktop'); setShowOptions(false); }}
                      >
                        <Monitor size={14} />
                        <span>Desktop</span>
                      </button>
                      <button 
                        className="flex items-center gap-2 w-full px-2 py-1 hover:bg-neutral-700 text-xs text-white text-left"
                        onClick={() => { setDeviceType('tablet'); setShowOptions(false); }}
                      >
                        <Laptop size={14} />
                        <span>Tablet</span>
                      </button>
                      <button 
                        className="flex items-center gap-2 w-full px-2 py-1 hover:bg-neutral-700 text-xs text-white text-left"
                        onClick={() => { setDeviceType('mobile'); setShowOptions(false); }}
                      >
                        <Smartphone size={14} />
                        <span>Mobile</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`flex items-center px-2 py-1 rounded text-xs ${
                    isDarkMode ? 'text-yellow-400' : 'text-neutral-400'
                  } hover:bg-neutral-700`}
                >
                  {isDarkMode ? <Moon size={14} className="mr-1" /> : <Sun size={14} className="mr-1" />}
                  {isDarkMode ? 'Dark' : 'Light'}
                </button>
                
                <button
                  onClick={() => {
                    if (iframeRef.current) {
                      iframeRef.current.contentWindow?.location.reload();
                    }
                  }}
                  className="flex items-center px-2 py-1 rounded text-xs text-neutral-400 hover:bg-neutral-700"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Email preview or code editor */}
            <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'} border border-neutral-800 rounded-md m-2`}>
              {isLoading && !htmlContent ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={24} className="animate-spin text-neutral-400" />
                </div>
              ) : viewMode === 'preview' ? (
                htmlContent ? renderPreview() : (
                  <div className="flex items-center justify-center h-full text-neutral-400">
                    Select a template to get started
                  </div>
                )
              ) : (
                <HtmlCodeEditor 
                  value={htmlContent} 
                  onChange={setHtmlContent} 
                />
              )}
            </div>
          </div>
          
          {/* Chat Panel - make width responsive */}
          <div className={`${viewMode === 'preview' ? 'w-1/4' : 'w-2/5'} transition-all duration-300 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full`}>
            <div className="p-3 border-b border-neutral-800">
              <h2 className="text-sm font-medium text-white">AI Assistant</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Describe changes for your email template
              </p>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto p-3 space-y-3"
            >
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[90%] rounded px-3 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-neutral-800 text-white' 
                        : msg.role === 'system' 
                          ? 'bg-neutral-700 text-gray-300 italic' 
                          : 'bg-neutral-700 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap max-w-none text-xs">
                      {formatMessageContent(msg.content)}
                    </div>
                    {msg.timestamp && (
                      <div className="text-[9px] text-neutral-400 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded px-3 py-2 bg-neutral-700 text-white animate-pulse">
                    <div className="flex items-center space-x-2">
                      <RefreshCw size={12} className="animate-spin text-neutral-400" />
                      <span className="text-neutral-300 text-xs">Updating template...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-3 border-t border-neutral-800">
              <div className="relative">
                <textarea
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white resize-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 text-xs"
                  placeholder="Describe your changes..."
                  rows={3}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading || !htmlContent}
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={() => setIsScreenCaptureOpen(true)}
                    disabled={isLoading || !htmlContent}
                    title="Capture screenshot to add to template"
                    className="bg-neutral-700 hover:bg-neutral-600 text-white p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera size={14} />
                  </button>
                  
                  <button
                    onClick={() => setIsScreenPipeCaptureOpen(true)}
                    disabled={isLoading || !htmlContent}
                    title="Capture with ScreenPipe"
                    className="bg-green-700 hover:bg-green-600 text-white p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon size={14} />
                  </button>
                  
                  <button 
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim() || !htmlContent}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
              {isLoading && (
                <p className="text-[10px] text-neutral-400 mt-1 animate-pulse">
                  Processing...
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Try: "Change the background color to light blue" or "Add a footer with contact information"
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          // Reset sharing status after 500ms to allow UI to update
          setTimeout(() => {
            setIsSharing(false);
          }, 500);
        }}
        templateName={templateName}
        htmlContent={htmlContent} 
        onSend={handleSendTemplate}
      />
      
      {/* Screen Capture Modal */}
      {isScreenCaptureOpen && (
        <ScreenCapture
          onCapture={handleScreenCapture}
          onClose={() => setIsScreenCaptureOpen(false)}
        />
      )}
      
      {/* ScreenPipe Capture Modal */}
      {isScreenPipeCaptureOpen && (
        <ScreenPipeCapture
          onCapture={handleScreenPipeCapture}
          onClose={() => setIsScreenPipeCaptureOpen(false)}
        />
      )}
    </div>
  );
};

export default TemplateGeneratorPage; 