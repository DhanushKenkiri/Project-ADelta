import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

const ScreenCapture: React.FC<ScreenCaptureProps> = ({ onCapture, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const startCapture = async () => {
    try {
      setIsCapturing(true);
      
      // Request screen capture
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      // Get the video track
      const videoTrack = mediaStream.getVideoTracks()[0];
      
      // Create a video element to capture a frame
      const video = document.createElement('video');
      video.srcObject = mediaStream;
      
      // Wait for video to load enough data
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      // Wait a moment to ensure the video is playing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a canvas to draw the video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame on the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
      
      // Stop all tracks
      mediaStream.getTracks().forEach(track => track.stop());
      
      setIsCapturing(false);
    } catch (err) {
      console.error('Error capturing screen:', err);
      toast.error('Failed to capture screen. Please try again.');
      setIsCapturing(false);
    }
  };

  const confirmCapture = () => {
    if (previewUrl) {
      onCapture(previewUrl);
      onClose();
    }
  };

  const cancelCapture = () => {
    setPreviewUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-neutral-900 rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Screen Capture</h3>
          <button 
            onClick={cancelCapture}
            className="text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-neutral-300 mb-4 text-center">
                Capture your screen to insert an image into your email template
              </p>
              <button
                onClick={startCapture}
                disabled={isCapturing}
                className={`px-4 py-2 rounded flex items-center gap-2 
                  ${isCapturing ? 'bg-neutral-700 text-neutral-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Camera size={18} />
                {isCapturing ? 'Capturing...' : 'Capture Screen'}
              </button>
            </div>
          ) : (
            <>
              <div className="border border-neutral-700 rounded overflow-hidden">
                <img 
                  src={previewUrl} 
                  alt="Screen capture preview" 
                  className="max-w-full h-auto"
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="px-4 py-2 rounded bg-neutral-800 text-white hover:bg-neutral-700"
                >
                  Recapture
                </button>
                <button
                  onClick={confirmCapture}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Use Image
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenCapture; 