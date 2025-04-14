
import React, { useState } from 'react';
import { toast } from "sonner";

const EmailBuilder = () => {
  const [emailContent, setEmailContent] = useState('');

  const handleGenerateTemplate = () => {
    if (!emailContent.trim()) {
      toast.error("Please enter some email content first");
      return;
    }
    
    toast.success("Email template generated successfully");
    // In a real application, this would call an API for AI generation
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Email Template in Minutes.
        </h1>
        <p className="text-gray-300 text-lg mb-8">
          Project-A6 helps your email ideas come to life, and generates them using AI.
        </p>
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-xs text-white">AI</span>
          </div>
          <span className="text-gray-400 text-sm">Powered by Claude</span>
        </div>
      </div>

      <div className="glass-card p-1">
        <textarea 
          className="w-full rounded-lg bg-[#1a1a1a] border-0 p-4 text-gray-300 focus:ring-0 min-h-[150px]"
          placeholder="Enter your email content here..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        />
        <div className="p-2">
          <button 
            onClick={handleGenerateTemplate}
            className="w-full gradient-btn text-white py-3 rounded-md font-medium"
          >
            Generate Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailBuilder;
