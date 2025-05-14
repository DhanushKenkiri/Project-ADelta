import React, { useEffect, useState } from 'react';
import { Template } from '@/lib/templateUtils';
import { useNavigate } from 'react-router-dom';

interface TemplateCardProps {
  template: Template;
  onClick?: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHtmlPreview = async () => {
      setLoading(true);
      try {
        if (template.htmlContent) {
          // If HTML content is already available in the template
          setHtmlPreview(template.htmlContent);
        } else if (template.filePath) {
          // Otherwise try to load it from the file path
          const response = await fetch(template.filePath);
          if (response.ok) {
            const html = await response.text();
            setHtmlPreview(html);
          }
        }
      } catch (error) {
        console.error('Failed to load HTML preview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHtmlPreview();
  }, [template]);

  // Handle the click on the template card
  const handleClick = () => {
    if (onClick) {
      onClick(template.id);
    } else {
      // Navigate to the template generator page with the template ID
      navigate(`/template-generator?id=${template.id}`);
    }
  };

  // Prepare enhanced HTML with proper scaling for preview
  const getPreviewHtml = () => {
    if (!htmlPreview) return null;
    
    // Add meta viewport and additional styling to make content fit better in preview
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body { 
              margin: 0; 
              padding: 0; 
              height: 100%; 
              width: 100%;
              overflow: hidden;
            }
            body {
              background-color: white !important;
            }
            /* Stretch all content to fill viewport */
            body > * {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
            }
            /* Target common email table layouts */
            table, td, div {
              max-width: 100% !important;
            }
            table {
              width: 100% !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
            }
          </style>
        </head>
        <body>
          ${htmlPreview}
        </body>
      </html>
    `;
  };

  return (
    <div 
      className="bg-neutral-800 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-neutral-700"
      onClick={handleClick}
    >
      <div className="h-48 overflow-hidden bg-neutral-800 relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-indigo-400">Loading preview...</span>
          </div>
        ) : htmlPreview ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 w-full h-full">
              <iframe 
                srcDoc={getPreviewHtml()}
                title={template.name}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
                style={{ 
                  pointerEvents: 'none',
                  background: 'white',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-800 opacity-30 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-neutral-800 to-transparent opacity-40 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-800 to-transparent opacity-70 pointer-events-none"></div>
          </div>
        ) : template.thumbnailUrl ? (
          <img 
            src={template.thumbnailUrl} 
            alt={template.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/250x150?text=Template';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-indigo-400">
            Preview not available
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-md font-medium text-gray-200">{template.name}</h3>
        {template.description && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{template.description}</p>
        )}
      </div>
    </div>
  );
};

export default TemplateCard; 