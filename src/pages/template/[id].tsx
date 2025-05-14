import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Copy, Download, Edit, Eye, Code, Loader2 } from 'lucide-react';
import HtmlCodeEditor from '@/components/HtmlCodeEditor';
import { toast } from 'sonner';
import { getTemplateById, Template } from '@/lib/templateUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';

// Template interface is now imported from templateUtils
// interface Template {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   thumbnailUrl: string;
//   htmlContent?: string;
// }

// Sample templates are no longer needed as we use getTemplateById
// const sampleTemplates: Template[] = [
//   // ... sample templates would be here
// ];

const TemplateDetailPage = () => {
  // Get template ID from URL params
  const { id: templateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch template data
  useEffect(() => {
    async function loadTemplate() {
      if (!templateId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching template with ID: ${templateId}`);
        const foundTemplate = await getTemplateById(templateId);
        console.log('Template fetch result:', foundTemplate);
        
        if (foundTemplate) {
          setTemplate(foundTemplate);
          if (foundTemplate.htmlContent) {
            console.log(`Setting HTML content, length: ${foundTemplate.htmlContent.length}`);
            setHtmlContent(foundTemplate.htmlContent);
          } else {
            console.error('No HTML content found in template');
            setError('Template HTML content could not be loaded');
          }
        } else {
          setError('Template not found');
        }
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    }
    
    loadTemplate();
  }, [templateId]);

  // Handle HTML content changes
  const handleHtmlChange = (newHtml: string) => {
    setHtmlContent(newHtml);
  };

  // Copy HTML to clipboard
  const copyHtmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      toast.success('HTML copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error("Failed to copy to clipboard");
    }
  };

  // Download HTML file
  const downloadHtml = () => {
    if (!template) return;
    
    const element = document.createElement('a');
    const file = new Blob([htmlContent], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('HTML file downloaded');
  };

  // Use template (redirect to EmailBuilder with the template)
  const useTemplate = () => {
    // Here you would save the template to localStorage and redirect to the EmailBuilder
    localStorage.setItem('template-html', htmlContent);
    navigate('/');
    toast.success("Template loaded in editor");
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title={template ? template.name : 'Template Details'} />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : error || !template ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-medium text-gray-200">
              {error || 'Template not found'}
            </h2>
            <Link to="/templates" className="mt-4 text-indigo-400 hover:underline">
              Return to templates
            </Link>
          </div>
        ) : (
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            <div className="mb-4">
              <Link to="/templates" className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200">
                <ArrowLeft size={16} className="mr-1" />
                Back to templates
              </Link>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{template.name}</h1>
                <p className="text-gray-400 mt-1">{template.description}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  className="inline-flex items-center px-3 py-2 bg-neutral-800 text-gray-200 text-sm rounded-md hover:bg-neutral-700"
                  onClick={copyHtmlToClipboard}
                >
                  <Copy size={16} className="mr-2" />
                  Copy HTML
                </button>
                <button
                  className="inline-flex items-center px-3 py-2 bg-neutral-800 text-gray-200 text-sm rounded-md hover:bg-neutral-700"
                  onClick={downloadHtml}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>
                <button
                  className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                  onClick={useTemplate}
                >
                  <Edit size={16} className="mr-2" />
                  Use Template
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
              <div className="flex items-center px-4 py-2 border-b border-neutral-700">
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 text-sm rounded-md ${viewMode === 'preview' ? 'bg-neutral-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setViewMode('preview')}
                  >
                    <Eye size={16} className="inline mr-1" />
                    Preview
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-md ${viewMode === 'code' ? 'bg-neutral-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setViewMode('code')}
                  >
                    <Code size={16} className="inline mr-1" />
                    HTML
                  </button>
                </div>
              </div>
              
              <div className="h-[70vh]">
                {viewMode === 'preview' ? (
                  <iframe
                    srcDoc={htmlContent}
                    title={template.name}
                    className="w-full h-full bg-white"
                    sandbox="allow-same-origin"
                    loading="lazy"
                  />
                ) : (
                  <HtmlCodeEditor 
                    value={htmlContent} 
                    onChange={handleHtmlChange} 
                    language="html" 
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TemplateDetailPage; 