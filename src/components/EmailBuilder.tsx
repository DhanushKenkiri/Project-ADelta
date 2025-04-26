import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { ArrowRight, Loader2, Eye, Smartphone, Laptop, Monitor, ExternalLink, ZoomIn, ZoomOut, Maximize2, Share2, Copy } from 'lucide-react';
import EmailWorkspace from './EmailWorkspace';
import { resetChatHistory, generateEmailTemplate } from '@/lib/groq';
import { useFeedbackEvent } from '@/lib/useFeedbackEvent';

// Define device type for consistency with EmailWorkspace
type DeviceType = 'desktop' | 'tablet' | 'mobile';

const EmailBuilder = () => {
  const [emailContent, setEmailContent] = useState('');
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedLogo, setDetectedLogo] = useState<string | null>(null);
  const [detectedOrg, setDetectedOrg] = useState<string | null>(null);
  const [previewDeviceType, setPreviewDeviceType] = useState<DeviceType>('desktop');
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  
  // Add state for sharing functionality
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('');

  // Feedback tracking
  const { logInput, logOutput } = useFeedbackEvent();

  // Track whether we've shown the instructions
  const [hasShownInstructions, setHasShownInstructions] = useState(false);

  // For debugging
  useEffect(() => {
    console.log('EmailBuilder component mounted');
  }, []);

  // Show instruction toast when workspace is first displayed
  useEffect(() => {
    if (showWorkspace && !hasShownInstructions) {
      toast.info(
        "You can now edit the HTML or ask the AI to make changes for you",
        { duration: 5000 }
      );
      setHasShownInstructions(true);
    }
  }, [showWorkspace, hasShownInstructions]);

  const handleGenerateTemplate = async () => {
    if (!emailContent.trim()) {
      toast.error("Please enter some email content first");
      return;
    }
    
    setLoading(true);
    setError(null);
    setDetectedLogo(null);
    setDetectedOrg(null);
    
    try {
      console.log('Generating template using Groq...');
      
      // Log the user input
      const inputEventId = logInput(emailContent);
      
      // Use Groq API to generate template with logo detection
      const response = await generateEmailTemplate(emailContent);
      console.log('Template generated successfully');
      
      // Log the AI response
      logOutput(response.html);
      
      // Set HTML content
      setGeneratedHtml(response.html);
      
      // Check if a logo and organization were detected
      if (response.logoUrl && response.organization) {
        setDetectedLogo(response.logoUrl);
        setDetectedOrg(response.organization);
        toast.success(`Email template generated with ${response.organization} logo`);
      } else {
        toast.success("Email template generated successfully");
      }
      
      // Reset chat history for the new template
      resetChatHistory();
      
      setShowWorkspace(true);
    } catch (error) {
      console.error('Error in template generation process:', error);
      setError('Failed to generate template. Please check your API key and try again.');
      toast.error("Failed to generate template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate a shareable link with template content
  const generateShareableLink = () => {
    try {
      // First make sure we have template content
      if (!emailContent.trim()) {
        toast.error("Please enter some email content first");
        return null;
      }
      
      setIsSharing(true);
      
      // Compress the content to make the URL shorter
      const compressedContent = btoa(encodeURIComponent(emailContent));
      
      // Create a URL to the template-generator page with the compressed content
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/template-generator?content=${compressedContent}`;
      
      // Set the URL in state
      setShareableLink(shareUrl);
      
      // Show the modal
      setShowShareModal(true);
      setIsSharing(false);
      
      toast.success("Shareable link generated!");
      return shareUrl;
    } catch (error) {
      console.error('Error generating shareable link:', error);
      toast.error("Failed to generate shareable link");
      setIsSharing(false);
      return null;
    }
  };

  // Function to copy the shareable link
  const copyShareableLink = async () => {
    try {
      if (shareableLink) {
        await navigator.clipboard.writeText(shareableLink);
        toast.success("Link copied to clipboard");
      } else {
        const url = generateShareableLink();
        if (url) {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
        }
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleShare = () => {
    setIsSharing(true);
    toast.info("Generating shareable link...");
    
    setTimeout(() => {
      generateShareableLink();
    }, 500);
  };

  // Shareable Link Modal component
  const ShareableLinkModal = () => {
    if (!showShareModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-white text-lg font-medium mb-3">Share Email Content</h3>
          <p className="text-gray-300 text-sm mb-4">
            Share this link to let others generate an email template based on your content:
          </p>
          
          <div className="flex mb-4">
            <input 
              type="text" 
              readOnly 
              value={shareableLink}
              className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-l border border-gray-600 focus:outline-none overflow-hidden"
            />
            <button 
              onClick={copyShareableLink}
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-r text-sm border border-gray-600"
            >
              <Copy size={16} />
            </button>
          </div>
          
          <div className="bg-gray-700 p-3 rounded mb-4">
            <p className="text-amber-300 text-sm mb-2">Note:</p>
            <p className="text-gray-300 text-sm">
              This link will allow anyone to generate an email template using your content.
              They can modify the content before generating if needed.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => setShowShareModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handlePreviewTemplate = async () => {
    if (!emailContent.trim()) {
      toast.error("Please enter some email content first");
      return;
    }
    
    setIsPreviewLoading(true);
    setError(null);
    
    try {
      console.log('Generating template preview using Groq...');
      
      // Use Groq API to generate template
      const response = await generateEmailTemplate(emailContent);
      console.log('Template preview generated successfully');
      
      // Set preview HTML content
      setPreviewHtml(response.html);
      
      // Reset zoom to 100% for new preview
      setPreviewZoom(100);
      
      // Show the preview
      setShowPreview(true);
      toast.success("Preview generated! Click outside the preview to close.");
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Failed to generate preview. Please try again.');
      toast.error("Failed to generate preview. Please try again.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleContinueToWorkspace = () => {
    // Close the preview
    setShowPreview(false);
    
    // Set the generated HTML to be the preview HTML
    setGeneratedHtml(previewHtml);
    
    // Reset chat history for the new template
    resetChatHistory();
    
    // Show the workspace
    setShowWorkspace(true);
    
    toast.success("Continuing to full editor. You can now make detailed changes.");
  };

  const handleRevert = () => {
    setShowWorkspace(false);
    // Reset states for a fresh start
    setGeneratedHtml('');
    setDetectedLogo(null);
    setDetectedOrg(null);
    resetChatHistory();
    toast("Returned to editor", { description: "Your generated template wasn't saved" });
  };

  // Handle zoom in preview
  const handleZoomIn = () => {
    if (previewZoom < 200) {
      setPreviewZoom(prevZoom => prevZoom + 10);
    }
  };

  // Handle zoom out preview
  const handleZoomOut = () => {
    if (previewZoom > 50) {
      setPreviewZoom(prevZoom => prevZoom - 10);
    }
  };

  // Reset zoom to 100%
  const handleResetZoom = () => {
    setPreviewZoom(100);
  };

  // Get device frame dimensions based on selected device type
  const getDeviceFrameDimensions = (): { width: string, maxWidth: string, height: string } => {
    switch (previewDeviceType) {
      case 'mobile':
        return { width: '100%', maxWidth: '375px', height: '700px' };
      case 'tablet':
        return { width: '100%', maxWidth: '768px', height: '800px' };
      case 'desktop':
      default:
        return { width: '100%', maxWidth: '1000px', height: '800px' };
    }
  };

  // Get device icon based on selected device type
  const getDeviceIcon = () => {
    switch (previewDeviceType) {
      case 'mobile':
        return <Smartphone size={18} />;
      case 'tablet':
        return <Laptop size={18} />;
      case 'desktop':
      default:
        return <Monitor size={18} />;
    }
  };

  return (
    <div className="w-full h-full">
      {showWorkspace ? (
        <EmailWorkspace 
          emailContent={emailContent} 
          htmlTemplate={generatedHtml}
          onRevert={handleRevert} 
          logoUrl={detectedLogo}
          organization={detectedOrg}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center relative px-4">
          {/* Fancy dynamic floating button banner */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-center mt-10">
            <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-950/80 via-black/90 to-indigo-950/80 text-sm text-gray-200 border border-indigo-500/20 backdrop-blur-sm flex items-center justify-center gap-2 hover:border-indigo-500/40 transition-all duration-500 shadow-lg shadow-indigo-900/20 animate-pulse-slow group">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-white group-hover:from-white group-hover:to-indigo-400 transition-all duration-700">Turn Text Into Email Templates in Minutes</span>
              <ArrowRight size={16} className="ml-2 text-indigo-400 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
          
          <div className="text-center mt-32 mb-8 w-full">
            <h1 className="text-6xl font-bold mb-5 text-white">
              Email Template in Minutes.
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Project-Aδ helps your email ideas come to life, and generates them using AI.
            </p>
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                <span className="text-xs text-white">AI</span>
              </div>
              <span className="text-gray-400 text-sm">Powered by Groq</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 mb-6 rounded-lg w-full max-w-3xl">
              <p>{error}</p>
            </div>
          )}

          <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden w-full max-w-3xl shadow-lg">
            <textarea 
              className="w-full bg-[#1a1a1a] border-0 p-6 text-gray-300 focus:ring-0 min-h-[200px] placeholder-gray-500 transition-all duration-300 resize-none rounded-t-xl"
              placeholder="Describe the email you want to create (e.g., 'Write a professional email from Microsoft announcing a new AI feature...')"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              style={{ outline: 'none' }}
            />
            <div className="p-4 bg-[#151515] flex gap-2">
              <button 
                onClick={handlePreviewTemplate}
                disabled={isPreviewLoading}
                className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-4 rounded-md font-medium transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye size={18} className="mr-2" />
                    Preview
                  </>
                )}
              </button>
              <button 
                onClick={handleGenerateTemplate}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-700 to-purple-600 text-white py-3 rounded-md font-medium transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Generating Template...
                  </>
                ) : (
                  'Generate Template'
                )}
              </button>
            </div>
          </div>

          {/* Preview Modal */}
          {showPreview && (
            <div 
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={handleClosePreview}
            >
              <div 
                className="bg-white rounded-lg overflow-hidden max-w-6xl w-[95%] max-h-[95vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-medium text-lg">Email Template Preview</h3>
                  <div className="flex items-center space-x-3">
                    {/* Device selection buttons */}
                    <div className="flex bg-gray-200 rounded-md overflow-hidden">
                      <button
                        onClick={() => setPreviewDeviceType('desktop')}
                        className={`flex items-center px-4 py-2 text-sm ${
                          previewDeviceType === 'desktop' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Monitor size={16} className="mr-2" />
                        <span className="hidden sm:inline">Desktop</span>
                      </button>
                      <button
                        onClick={() => setPreviewDeviceType('tablet')}
                        className={`flex items-center px-4 py-2 text-sm ${
                          previewDeviceType === 'tablet' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Laptop size={16} className="mr-2" />
                        <span className="hidden sm:inline">Tablet</span>
                      </button>
                      <button
                        onClick={() => setPreviewDeviceType('mobile')}
                        className={`flex items-center px-4 py-2 text-sm ${
                          previewDeviceType === 'mobile' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Smartphone size={16} className="mr-2" />
                        <span className="hidden sm:inline">Mobile</span>
                      </button>
                    </div>
                    
                    {/* Zoom controls */}
                    <div className="flex items-center bg-gray-200 rounded-md overflow-hidden">
                      <button
                        onClick={handleZoomOut}
                        disabled={previewZoom <= 50}
                        className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        aria-label="Zoom out"
                        title="Zoom out"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <div className="px-2 py-1 text-sm bg-gray-100 border-x border-gray-300">
                        {previewZoom}%
                      </div>
                      <button
                        onClick={handleZoomIn}
                        disabled={previewZoom >= 200}
                        className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        aria-label="Zoom in"
                        title="Zoom in"
                      >
                        <ZoomIn size={16} />
                      </button>
                      <button
                        onClick={handleResetZoom}
                        className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-300"
                        aria-label="Reset zoom"
                        title="Reset zoom"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                    
                    <button 
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
                      onClick={handleClosePreview}
                      aria-label="Close preview"
                    >
                      <span className="text-xl">✕</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-6">
                  <div 
                    className={`bg-white overflow-hidden shadow-lg transition-all duration-300 ${
                      previewDeviceType === 'mobile' 
                        ? 'rounded-[12px] border-4 border-gray-800' 
                        : previewDeviceType === 'tablet'
                          ? 'rounded-[12px] border-4 border-gray-800' 
                          : 'rounded-md'
                    }`}
                    style={{
                      ...getDeviceFrameDimensions(),
                      minHeight: previewDeviceType === 'desktop' ? '75vh' : undefined,
                      transform: `scale(${previewZoom / 100})`,
                      transformOrigin: 'center top',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  >
                    <iframe
                      srcDoc={previewHtml}
                      title="Email Template Preview"
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-between">
                  <button
                    onClick={handleClosePreview}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleContinueToWorkspace}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-md text-sm font-medium flex items-center hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Continue to Editor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Shareable Link Modal */}
          <ShareableLinkModal />
        </div>
      )}
    </div>
  );
};

export default EmailBuilder;

