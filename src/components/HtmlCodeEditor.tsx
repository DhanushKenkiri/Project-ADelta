import React, { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HtmlCodeEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  height?: string;
}

const HtmlCodeEditor: React.FC<HtmlCodeEditorProps> = ({ 
  value, 
  onChange,
  className = '',
  height = '100%'
}) => {
  const [copied, setCopied] = useState(false);
  const [editorValue, setEditorValue] = useState(value);
  
  // Update internal value when external HTML changes
  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  // Handle code changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditorValue(newValue);
    onChange(newValue);
  };

  // Handle copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Format the HTML code
  const formatCode = () => {
    try {
      // Simple HTML formatting for better readability
      const formatted = editorValue
        .replace(/></g, '>\n<')
        .replace(/>\s*</g, '>\n<')
        .replace(/<\/div>/g, '</div>\n')
        .replace(/<\/p>/g, '</p>\n')
        .replace(/<\/li>/g, '</li>\n')
        .replace(/<li>/g, '\n<li>');
      
      setEditorValue(formatted);
      onChange(formatted);
    } catch (err) {
      console.error('Failed to format HTML: ', err);
    }
  };

  return (
    <div className={`flex flex-col ${className}`} style={{ height }}>
      <div className="flex items-center justify-between p-2 bg-[#1E1E1E] border-b border-[#333]">
        <span className="text-gray-300 text-sm">HTML Editor</span>
        <div className="flex gap-2">
          <button 
            onClick={formatCode}
            className="p-1 text-xs bg-[#333] text-gray-300 rounded hover:bg-[#444] transition-colors"
          >
            Format
          </button>
          <button 
            onClick={copyToClipboard}
            className="p-1 text-xs bg-[#333] text-gray-300 rounded hover:bg-[#444] transition-colors flex items-center gap-1"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <textarea
          value={editorValue}
          onChange={handleChange}
          className="w-full h-full p-4 bg-[#1E1E1E] text-gray-300 font-mono text-sm resize-none outline-none"
          spellCheck="false"
          style={{
            fontSize: 14,
            fontFamily: '"Fira code", "Fira Mono", monospace',
            minHeight: '100%',
            lineHeight: '1.5',
          }}
        />
      </div>
    </div>
  );
};

export default HtmlCodeEditor; 