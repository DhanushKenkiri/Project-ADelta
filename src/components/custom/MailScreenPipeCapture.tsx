import React, { useState, useEffect } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Define ScreenPipe types
declare global {
  interface Window {
    screenpipe?: {
      captureScreen: () => Promise<{ dataUrl: string }>;
      version?: string;
    };
  }
}

interface MailScreenPipeCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

const MailScreenPipeCapture: React.FC<MailScreenPipeCaptureProps> = ({ onCapture, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScreenPipeInstalled, setIsScreenPipeInstalled] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Check if ScreenPipe is available
  useEffect(() => {
    const checkScreenPipe = async () => {
      setIsChecking(true);
      try {
        // Check if the ScreenPipe object exists in window
        const isAvailable = typeof window !== 'undefined' && 
          window.screenpipe && 
          typeof window.screenpipe.captureScreen === 'function';
        
        setIsScreenPipeInstalled(isAvailable);
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
          // Just pass the image
          onCapture(screenpipeResult.dataUrl);
          onClose();
        } else {
          toast({
            title: "Failed to capture screen",
            description: "ScreenPipe didn't return image data",
            variant: "destructive"
          });
          setIsCapturing(false);
        }
      } else {
        toast({
          title: "ScreenPipe not available",
          description: "Please check if ScreenPipe is installed",
          variant: "destructive"
        });
        setIsScreenPipeInstalled(false);
        setIsCapturing(false);
      }
    } catch (err) {
      console.error('Error capturing screen with ScreenPipe:', err);
      toast({
        title: "Failed to capture screen", 
        description: "Please try again",
        variant: "destructive"
      });
      setIsCapturing(false);
    }
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
            <div className="py-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : isScreenPipeInstalled ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-neutral-300 mb-4 text-center">
                Use ScreenPipe to capture your screen and add it as an attachment
              </p>
              <button
                onClick={startCapture}
                disabled={isCapturing}
                className={`px-4 py-2 rounded flex items-center gap-2 
                  ${isCapturing ? 'bg-neutral-700 text-neutral-300' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                <ImageIcon size={18} />
                {isCapturing ? 'Capturing...' : 'Capture with ScreenPipe'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-neutral-300 mb-4 text-center">
                ScreenPipe is not installed or available. Please install ScreenPipe to use this feature.
              </p>
              <a
                href="https://screenpi.pe/download"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Download ScreenPipe
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailScreenPipeCapture; 