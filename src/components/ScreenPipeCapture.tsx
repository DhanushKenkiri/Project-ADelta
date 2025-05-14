import React, { useState, useEffect } from 'react';
import { Camera, X, ExternalLink, AlertCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { 
  isScreenPipeAvailable, 
  getScreenPipeDownloadUrl, 
  isScreenPipeAnalysisAvailable,
  analyzeImageWithScreenPipe,
  ScreenPipeAnalysisResult
} from '@/lib/screenpipeUtils';

interface ScreenPipeCaptureProps {
  onCapture: (imageDataUrl: string, analysis?: ScreenPipeAnalysisResult) => void;
  onClose: () => void;
}

const ScreenPipeCapture: React.FC<ScreenPipeCaptureProps> = ({ onCapture, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScreenPipeInstalled, setIsScreenPipeInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAnalysisAvailable, setIsAnalysisAvailable] = useState(false);
  const [enableAnalysis, setEnableAnalysis] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Check if ScreenPipe is installed when component mounts
  useEffect(() => {
    const checkScreenPipe = async () => {
      try {
        const available = await isScreenPipeAvailable();
        setIsScreenPipeInstalled(available);
        
        if (available) {
          // Check if analysis feature is available
          const analysisAvailable = await isScreenPipeAnalysisAvailable();
          setIsAnalysisAvailable(analysisAvailable);
        }
      } catch (error) {
        console.error('Error checking ScreenPipe availability:', error);
        setIsScreenPipeInstalled(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkScreenPipe();
  }, []);

  const startCapture = async () => {
    try {
      setIsCapturing(true);
      
      // Use the ScreenPipe API to capture the screen
      if (window.screenpipe && typeof window.screenpipe.captureScreen === 'function') {
        const screenpipeResult = await window.screenpipe.captureScreen();
        
        if (screenpipeResult && screenpipeResult.dataUrl) {
          // If analysis is enabled and available, analyze the image
          if (enableAnalysis && isAnalysisAvailable) {
            try {
              setIsAnalyzing(true);
              toast.loading('Analyzing image with ScreenPipe...');
              
              const analysis = await analyzeImageWithScreenPipe(screenpipeResult.dataUrl);
              
              // Pass both the image and analysis to the callback
              onCapture(screenpipeResult.dataUrl, analysis);
              toast.success('Image analyzed successfully');
            } catch (analysisError) {
              console.error('Error analyzing image:', analysisError);
              toast.error('Image analysis failed, but capture succeeded');
              
              // Still provide the image without analysis
              onCapture(screenpipeResult.dataUrl);
            } finally {
              setIsAnalyzing(false);
            }
          } else {
            // Just pass the image without analysis
            onCapture(screenpipeResult.dataUrl);
          }
          
          onClose();
        } else {
          toast.error('Failed to capture screen with ScreenPipe');
          setIsCapturing(false);
        }
      } else {
        toast.error('ScreenPipe is not available');
        setIsScreenPipeInstalled(false);
        setIsCapturing(false);
      }
    } catch (err) {
      console.error('Error capturing screen with ScreenPipe:', err);
      toast.error('Failed to capture screen. Please try again.');
      setIsCapturing(false);
    }
  };

  const handleInstallScreenPipe = () => {
    // Open ScreenPipe website or installation page
    window.open(getScreenPipeDownloadUrl(), '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-neutral-900 rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">ScreenPipe Capture</h3>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {isChecking ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-neutral-300 mb-4 text-center">
                Checking for ScreenPipe installation...
              </p>
              <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-transparent rounded-full"></div>
            </div>
          ) : isScreenPipeInstalled ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-neutral-300 mb-4 text-center">
                Use ScreenPipe to capture your screen and add it to the chat
              </p>
              
              {isAnalysisAvailable && (
                <div className="flex items-center mb-4 bg-neutral-800 p-3 rounded-md">
                  <div className="mr-3 text-yellow-500">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-300">
                      ScreenPipe image analysis will generate a prompt for Groq based on your screenshot
                    </p>
                    <div className="flex items-center mt-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={enableAnalysis} 
                          onChange={e => setEnableAnalysis(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-2 text-sm font-medium text-neutral-300">
                          {enableAnalysis ? 'Analysis enabled' : 'Analysis disabled'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {!isAnalysisAvailable && (
                <div className="flex items-center mb-4 bg-neutral-800 p-3 rounded-md">
                  <div className="mr-3 text-yellow-500">
                    <AlertCircle size={20} />
                  </div>
                  <p className="text-sm text-neutral-300">
                    Your ScreenPipe version doesn't support image analysis. Consider upgrading for enhanced features.
                  </p>
                </div>
              )}
              
              <button
                onClick={startCapture}
                disabled={isCapturing || isAnalyzing}
                className={`px-4 py-2 rounded flex items-center gap-2 
                  ${(isCapturing || isAnalyzing) ? 'bg-neutral-700 text-neutral-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Camera size={18} />
                {isCapturing ? 'Capturing...' : isAnalyzing ? 'Analyzing...' : 'Capture Screen with ScreenPipe'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-neutral-300 mb-4 text-center">
                ScreenPipe doesn't seem to be installed or accessible.
              </p>
              <button
                onClick={handleInstallScreenPipe}
                className="px-4 py-2 rounded flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink size={18} />
                Install ScreenPipe from screenpi.pe
              </button>
              <p className="text-neutral-400 mt-4 text-sm text-center">
                After installation, please refresh this page and try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add TypeScript declaration for ScreenPipe
declare global {
  interface Window {
    screenpipe?: {
      captureScreen: () => Promise<{ dataUrl: string }>;
      version?: string;
    };
  }
}

export default ScreenPipeCapture; 