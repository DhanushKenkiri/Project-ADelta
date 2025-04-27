import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw, Copy, Sun, Moon, ArrowLeft, Share2, Save, Code, Eye, Loader2, Send, Smartphone, Laptop, Monitor, ChevronDown, Users, X, Camera, ImageIcon } from 'lucide-react';
import HtmlCodeEditor from './HtmlCodeEditor';
import { updateTemplateInChat as updateTemplateChatContext, sendChatMessage } from '@/lib/groq';
import { getMockAIResponse } from '@/lib/mockAIChat';
import realtimeService from '@/lib/realtimeService';
import { saveHtmlFile } from '@/lib/fileUtils';
import { toast } from 'sonner';
import { useFeedbackEvent } from '@/lib/useFeedbackEvent';
import { FeedbackUI } from './FeedbackUI';
import ShareModal from './ShareModal';
import ScreenCapture from './ScreenCapture';
import ScreenPipeCapture from './ScreenPipeCapture';
import { insertImageIntoHtml, compressImage } from '@/lib/imageUtils';
import { ScreenPipeAnalysisResult } from '@/lib/screenpipeUtils';
import ImageAnalysisPrompt from './ImageAnalysisPrompt';

interface EmailWorkspaceProps {
  emailContent: string;
  htmlTemplate: string;
  onRevert: () => void;
  logoUrl?: string | null;
  organization?: string | null;
}

// Define the message type for the chat
type MessageRole = 'user' | 'assistant';
interface Message {
  role: MessageRole;
  content: string;
  timestamp?: number;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const EmailWorkspace: React.FC<EmailWorkspaceProps> = ({ 
  emailContent, 
  htmlTemplate, 
  onRevert, 
  logoUrl,
  organization
}) => {
  // State for template and views
  const [currentHtml, setCurrentHtml] = useState<string>(htmlTemplate);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [showOptions, setShowOptions] = useState(false);
  
  // State for chat and collaboration
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "I've generated an email template based on your request. You can ask me to make any changes including:\n\n• Styling changes (colors, fonts, spacing)\n• Layout adjustments (sections, columns, arrangement)\n• Content updates (text, links, buttons)\n• Theme changes (professional, casual, modern, etc.)\n• Visual elements (dividers, icons, backgrounds)\n\nSimply describe what you want to change and I'll update the template for you.", 
      timestamp: Date.now()
    }
  ]);
  const [userMessage, setUserMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState('');
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  // Add a state for storing chat history
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([
    { 
      role: 'system', 
      content: 'You are an email template assistant. Help the user modify their email template by providing HTML code updates.'
    }
  ]);
  
  // Add a reference to track when template is first loaded
  const initialTemplateRef = useRef(htmlTemplate);
  
  // Integration with feedback system
  const { eventId, logInput, logOutput } = useFeedbackEvent();
  
  // Add the collaboration URL state and modal state
  const [collaborationUrl, setCollaborationUrl] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Add state for the local sharing approach
  const [localSharingUrl, setLocalSharingUrl] = useState<string>('');
  
  // Add a state to manage loading for the send operation
  const [isSending, setIsSending] = useState(false);
  
  // Add state for the send modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("Email Template");
  
  // Add state for screen capture
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false);
  const [isScreenPipeCaptureOpen, setIsScreenPipeCaptureOpen] = useState(false);
  
  // Add state for image analysis and prompt
  const [imageAnalysis, setImageAnalysis] = useState<ScreenPipeAnalysisResult | null>(null);
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false);
  
  // Generate a session ID on mount
  useEffect(() => {
    const newSessionId = `email-template-${Date.now()}`;
    setSessionId(newSessionId);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Update template in chat context when HTML changes
  useEffect(() => {
    updateTemplateChatContext(currentHtml);
  }, [currentHtml]);
  
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
  
  // Set up real-time collaboration
  const setupRealtime = () => {
    if (!sessionId || isSharing) {
      // Don't attempt to connect if already sharing or in sharing mode
      toast.info("Sharing is already in progress. Please try again later.");
      return;
    }
    
    setIsSharing(true);
    toast.info("Initializing real-time sharing...");
    
    try {
      // Connect to real-time service
      realtimeService.connect(sessionId);
      
      // Set up event listeners
      realtimeService.on('connected', () => {
        // Create collaboration URL based on the current URL and session ID
        const baseUrl = window.location.origin + window.location.pathname;
        const url = `${baseUrl}?session=${sessionId}`;
        setCollaborationUrl(url);
        
        toast.success("Real-time sharing enabled!");
        setIsSharing(false);
      });
      
      realtimeService.on('template_updated', (update) => {
        setCurrentHtml(update.html);
        toast.info("Template updated by another user");
      });
      
      realtimeService.on('user_joined', (user) => {
        setActiveSessions(prev => [...prev, user.id]);
        toast.info(`${user.name} joined the session`);
      });
      
      realtimeService.on('user_left', (user) => {
        setActiveSessions(prev => prev.filter(id => id !== user.id));
        toast.info(`${user.name} left the session`);
      });
      
      realtimeService.on('error', () => {
        toast.error("Error in real-time collaboration");
        setIsSharing(false);
      });
      
      realtimeService.on('connection_error', (error) => {
        console.error('Realtime connection error:', error);
        toast.error("Could not connect to sharing service. Using local mode instead.");
        setIsSharing(false);
      });
      
      // Send initial template
      realtimeService.updateTemplate(currentHtml);
      
      // Set a timeout to detect if connection takes too long
      setTimeout(() => {
        if (isSharing && !realtimeService.isConnectedToServer()) {
          toast.error("Connection timed out. Using local mode instead.");
          setIsSharing(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to set up real-time sharing:', error);
      toast.error("Failed to set up real-time sharing. Using local mode instead.");
      setIsSharing(false);
    }
  };
  
  // Disconnect from real-time service on component unmount
  useEffect(() => {
    return () => {
      realtimeService.disconnect();
    };
  }, []);
  
  // Handle HTML changes and sync with real-time service
  const handleHtmlChange = (html: string) => {
    setCurrentHtml(html);
    
    // Sync changes with real-time service if connected
    if (realtimeService.isConnectedToServer()) {
      realtimeService.updateTemplate(html);
    }
  };
  
  // Handle sending chat messages to Groq via proxy
  const handleSendMessage = async (useDecentralized: boolean, prompt: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter a message first');
      return;
    }

    // Store the original HTML in case of error
    const originalHtml = currentHtml;

    // Add user message to the chat
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      }
    ]);

    setIsProcessing(true);
    try {
      const updatedHtml = await sendChatMessage(prompt, currentHtml);
      
      // Validate the HTML response - check if it's empty or too short to be valid
      if (!updatedHtml || updatedHtml.trim().length < 50 || 
          !updatedHtml.includes('<') || !updatedHtml.includes('>')) {
        throw new Error('Invalid HTML received from the AI. Response may be incomplete.');
      }
      
      // Make sure we have at least some basic structure to avoid template corruption
      if (!updatedHtml.includes('<body') && !updatedHtml.includes('<html') && 
          !updatedHtml.includes('<table') && !updatedHtml.includes('<div')) {
        throw new Error('The response is missing required HTML structure.');
      }
      
      // Update the HTML only if it passes validation
      setCurrentHtml(updatedHtml);
      
      // Add AI response to the chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I\'ve updated the template based on your request.',
          timestamp: Date.now()
        }
      ]);
      
      setUserMessage('');
      toast.success('Template updated!');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error(error.message || 'Failed to update template. Please try again.');
      
      // Revert to the original HTML to avoid corrupting the template
      setCurrentHtml(originalHtml);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error while updating the template: ${error.message || 'Please try again with simpler instructions.'}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle keyboard events for the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid newline
      if (!isProcessing && userMessage.trim()) {
        handleSendMessage(false, userMessage);
      }
    }
    // Allow Shift+Enter for newline
  };
  
  // Handle template saving
  const handleSaveTemplate = async () => {
    setIsSaving(true);
    
    try {
      // Save locally
      await saveHtmlFile(currentHtml, `email-template-${Date.now()}`);
      
      toast.success("Template saved successfully!");
      
      // Add save confirmation to chat
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Template saved successfully! You can access it in your downloads folder.`, 
          timestamp: Date.now() 
        }
      ]);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Copy HTML to clipboard
  const copyHtmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentHtml);
      toast.success("HTML copied to clipboard");
    } catch (error) {
      console.error('Failed to copy HTML:', error);
      toast.error("Failed to copy HTML to clipboard");
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
  
  // Render iframe for preview mode
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
              srcDoc={currentHtml}
              title="Email Template Preview"
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
  
  // Log initial content and generated template when first loaded
  useEffect(() => {
    if (initialTemplateRef.current) {
      // Log the original prompt and generated template
      const inputId = logInput(emailContent);
      logOutput(initialTemplateRef.current);
    }
  }, []);

  const [showPreview, setShowPreview] = useState(true);

  // Handle share action
  const handleShare = () => {
    // Generate a shareable link
    generateShareableLink();
    setIsShareModalOpen(true);
  };
  
  // Create a function to generate a shareable link with template content
  const generateShareableLink = () => {
    try {
      // Simple compression using base64 for compatibility
      const compressedHtml = btoa(encodeURIComponent(currentHtml));
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/template-generator?template=${compressedHtml}`;
      setLocalSharingUrl(shareUrl);
      console.log("Shareable link generated:", shareUrl.substring(0, 50) + "...");
      toast.success("Shareable link generated!");
      return shareUrl;
    } catch (error) {
      console.error('Error generating shareable link:', error);
      toast.error("Failed to generate shareable link");
      return '';
    }
  };
  
  // Function to copy the shareable link
  const copyShareableLink = async () => {
    try {
      if (!localSharingUrl) {
        generateShareableLink();
      }
      
      await navigator.clipboard.writeText(localSharingUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error("Failed to copy link to clipboard");
    }
  };

  // Check on mount if there's a template param in the URL
  useEffect(() => {
    try {
      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const templateParam = urlParams.get('template');
      
      // If we have a template parameter, decode and apply it
      if (templateParam) {
        try {
          const decodedHtml = decodeURIComponent(atob(templateParam));
          setCurrentHtml(decodedHtml);
          toast.success("Template loaded from shared link!");
        } catch (e) {
          console.error('Error loading template from URL:', e);
          toast.error("Failed to load shared template");
        }
      }
    } catch (error) {
      console.error('Error checking for template in URL:', error);
    }
  }, []);

  // Modify the handleSendTemplate function to open the share modal
  const handleSendTemplate = async () => {
    // Open the send modal instead of copying to clipboard
    setIsSendModalOpen(true);
  };
  
  // New function to handle the actual email sending
  const handleSendEmail = async (email: string, options?: { useDecentralized?: boolean; useMicropayment?: boolean; storeOnIPFS?: boolean; web2Delivery?: boolean }): Promise<boolean> => {
    try {
      // Generate a shareable link
      const shareUrl = generateShareableLink();
      
      // Here we would integrate with an email service
      toast.success(`Email would be sent to ${email} with template link: ${shareUrl.substring(0, 15)}...`);
      
      // For now, we'll simulate a successful operation
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("Failed to send email");
      return false;
    }
  };

  // Handle screen capture from ScreenPipe
  const handleScreenPipeCapture = async (imageDataUrl: string, analysis?: ScreenPipeAnalysisResult) => {
    try {
      // Show loading toast
      toast.loading('Processing ScreenPipe image...');
      
      // Compress the image to reduce size
      const compressedImage = await compressImage(imageDataUrl, 800, 0.85);
      
      // Insert the image into the HTML template
      const updatedHtml = insertImageIntoHtml(currentHtml, compressedImage);
      
      // Update the template
      setCurrentHtml(updatedHtml);
      
      // If we have image analysis, show the analysis prompt
      if (analysis) {
        // Add system message showing the analysis
        setMessages(prev => [...prev, {
          role: 'assistant', 
          content: `ScreenPipe analyzed your screenshot and identified: ${analysis.description}`,
          timestamp: Date.now()
        }]);
        
        // Store the analysis and show the prompt
        setImageAnalysis(analysis);
        setShowAnalysisPrompt(true);
        
        // Success notification for the image
        toast.success('ScreenPipe screenshot added and analyzed');
      } else {
        // Add system message about image insertion without analysis
        setMessages(prev => [...prev, {
          role: 'assistant', 
          content: 'ScreenPipe screenshot added to the email template.',
          timestamp: Date.now()
        }]);
        
        // Success notification
        toast.success('ScreenPipe screenshot added');
      }
      
      // Update the template in chat context
      updateTemplateChatContext(updatedHtml);
      
    } catch (error) {
      console.error('Error processing ScreenPipe screenshot:', error);
      toast.error('Failed to add ScreenPipe screenshot');
    }
  };
  
  // Handle regular screen capture
  const handleScreenCapture = async (imageDataUrl: string) => {
    try {
      // Show loading toast
      toast.loading('Processing captured image...');
      
      // Compress the image to reduce size
      const compressedImage = await compressImage(imageDataUrl, 800, 0.85);
      
      // Insert the image into the HTML template
      const updatedHtml = insertImageIntoHtml(currentHtml, compressedImage);
      
      // Update the template
      setCurrentHtml(updatedHtml);
      
      // Add system message about image insertion
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: 'Screenshot added to the email template.',
        timestamp: Date.now()
      }]);
      
      // Success notification
      toast.success('Screenshot added to template');
      
      // Update the template in chat context
      updateTemplateChatContext(updatedHtml);
      
    } catch (error) {
      console.error('Error processing screenshot:', error);
      toast.error('Failed to add screenshot to template');
    }
  };

  // Add a handler for the analysis prompt submission
  const handleAnalysisPromptSubmit = (prompt: string) => {
    // Set the user message to the prompt
    setUserMessage(prompt);
    
    // Close the analysis prompt
    setShowAnalysisPrompt(false);
    setImageAnalysis(null);
    
    // Send the message to Groq
    handleSendMessage(false, prompt);
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-3">
          <button
        onClick={onRevert}
            className="flex items-center text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            <span>Back</span>
          </button>
          
          <div className="h-4 w-px bg-neutral-800 mx-2"></div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 bg-neutral-800 rounded-sm flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xs">Aδ</span>
            </div>
            <span className="text-neutral-300 font-medium text-sm">Email Designer</span>
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
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="flex items-center bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-neutral-700"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
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
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Generating link...
                </>
              ) : (
                <>
                  <Users size={14} className="mr-1" />
                  Collaboration
                </>
              )}
            </button>
            <button
              onClick={handleSendTemplate}
              disabled={isSending}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md transition-all text-xs border border-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Preparing...
                </>
              ) : (
                <>
                  <Send size={14} className="mr-1" />
                  Send
                </>
              )}
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
                <RefreshCcw size={14} className="mr-1" />
                Refresh
              </button>
            </div>
      </div>
      
          {/* Email preview or code editor - ensure it fills the space */}
          <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'} border border-neutral-800 rounded-md m-2`}>
            {viewMode === 'preview' ? (
              renderPreview()
            ) : (
              <HtmlCodeEditor 
                value={currentHtml} 
                onChange={handleHtmlChange}
                className="w-full h-full"
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
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 border-b border-neutral-800"
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
                      : 'bg-neutral-700 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap max-w-none text-xs">
                    {msg.content}
                        </div>
                  {msg.timestamp && (
                    <div className="text-[9px] text-neutral-400 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="rounded px-3 py-2 bg-neutral-700 text-white animate-pulse">
                  <div className="flex items-center space-x-2">
                    <Loader2 size={12} className="animate-spin text-neutral-400" />
                    <span className="text-neutral-300 text-xs">Updating template...</span>
                  </div>
                </div>
              </div>
            )}
            </div>
            
          <div className="p-3 border-t border-neutral-800">
            <div className="relative">
              <textarea
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white resize-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 text-xs"
                placeholder="Describe your changes... (Press Enter to send, Shift+Enter for new line)"
                rows={3}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
              />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  onClick={() => setIsScreenCaptureOpen(true)}
                  disabled={isProcessing}
                  title="Capture screenshot to add to template"
                  className="bg-neutral-700 hover:bg-neutral-600 text-white p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={14} />
                </button>
                
                <button
                  onClick={() => setIsScreenPipeCaptureOpen(true)}
                  disabled={isProcessing}
                  title="Capture with ScreenPipe"
                  className="bg-green-700 hover:bg-green-600 text-white p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon size={14} />
                </button>
                
                <button 
                  onClick={() => handleSendMessage(false, userMessage)}
                  disabled={isProcessing || !userMessage.trim()}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
            {isProcessing && (
              <p className="text-[10px] text-neutral-400 mt-1 animate-pulse">
                Processing...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Feedback UI */}
      {eventId && (
        <div className="p-3 border-t border-neutral-800">
          <FeedbackUI 
            eventId={eventId} 
            className="w-full" 
          />
        </div>
      )}

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
      
      {/* Collaboration Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70" onClick={() => setIsShareModalOpen(false)}>
          <div 
            className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-neutral-700 transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Collaborate on Template</h2>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-5">
              <p className="text-neutral-400 text-sm mb-4">
                Share this link with others to collaborate on this template in real-time:
              </p>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  value={localSharingUrl}
                  readOnly
                  className="w-full pl-4 pr-10 py-3 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-neutral-500 font-mono text-xs truncate"
                />
                <button
                  onClick={copyShareableLink}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-700/50 transition-colors"
                  title="Copy link"
                >
                  <Copy size={18} />
                </button>
              </div>
              
              <div className="text-xs text-neutral-500 mt-3">
                <p>When someone opens this link, they'll be able to see and edit the current state of the template.</p>
                <p className="mt-1">Changes made by collaborators will appear in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Send Email Modal */}
      <ShareModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        templateName={templateName}
        onSend={handleSendEmail}
      />

      {/* Image Analysis Prompt Modal */}
      {showAnalysisPrompt && imageAnalysis && (
        <ImageAnalysisPrompt
          analysis={imageAnalysis}
          onSubmit={handleAnalysisPromptSubmit}
          onCancel={() => {
            setShowAnalysisPrompt(false);
            setImageAnalysis(null);
          }}
        />
      )}
    </div>
  );
};

export default EmailWorkspace;

