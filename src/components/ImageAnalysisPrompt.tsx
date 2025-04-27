import React, { useState } from 'react';
import { X, Send, Edit, Lightbulb } from 'lucide-react';
import { ScreenPipeAnalysisResult } from '@/lib/screenpipeUtils';

interface ImageAnalysisPromptProps {
  analysis: ScreenPipeAnalysisResult;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
}

const ImageAnalysisPrompt: React.FC<ImageAnalysisPromptProps> = ({ 
  analysis, 
  onSubmit, 
  onCancel 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(analysis.prompt);

  const handleSubmit = () => {
    onSubmit(customPrompt);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-neutral-900 rounded-lg p-6 max-w-xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Lightbulb className="mr-2 text-yellow-500" size={20} />
            ScreenPipe Analysis
          </h3>
          <button 
            onClick={onCancel}
            className="text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-neutral-800 p-4 rounded-md">
            <h4 className="text-sm font-medium text-neutral-300 mb-2">Image Description:</h4>
            <p className="text-white text-sm">{analysis.description}</p>
            
            {analysis.tags?.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-neutral-300 mb-2">Detected Elements:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-neutral-800 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-neutral-300">Groq Prompt:</h4>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
              >
                <Edit size={14} className="mr-1" />
                {isEditing ? 'Done Editing' : 'Edit Prompt'}
              </button>
            </div>
            
            {isEditing ? (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-32 p-3 bg-neutral-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Edit the prompt for Groq..."
              />
            ) : (
              <p className="text-white text-sm whitespace-pre-wrap bg-neutral-700 p-3 rounded-md">
                {customPrompt}
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors flex items-center"
            >
              <Send size={16} className="mr-2" />
              Send to Groq
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisPrompt; 