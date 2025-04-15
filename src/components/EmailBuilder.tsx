
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
        <h1 className="text-6xl font-bold mb-5 text-white">
          Email Template in Minutes.
        </h1>
        <p className="text-gray-300 text-lg mb-6">
          Project-Aδ helps your email ideas come to life, and generates them using AI.
        </p>
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
            <span className="text-xs text-white">AI</span>
          </div>
          <span className="text-gray-400 text-sm">Powered by Claude</span>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <textarea 
          className="w-full bg-[#1a1a1a] border-0 p-6 text-gray-300 focus:ring-0 min-h-[180px] placeholder-gray-500"
          placeholder="Enter your email content here..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        />
        <div className="p-3">
          <button 
            onClick={handleGenerateTemplate}
            className="w-full bg-gradient-to-r from-blue-700 to-purple-600 text-white py-3 rounded-md font-medium transition-all hover:opacity-90"
          >
            Generate Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailBuilder;
