import React, { useState, useRef } from 'react';
import { useTemplateStorage } from '@/hooks/useTemplateStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Demo component for template storage
 */
const TemplateStorageDemo: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [htmlContent, setHtmlContent] = useState('<h1>Hello World</h1>');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    loading,
    error,
    template,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplate
  } = useTemplateStorage({
    onSuccess: (template) => {
      console.log('Operation succeeded:', template);
    },
    onError: (error) => {
      console.error('Operation failed:', error);
    }
  });

  const handleSave = async () => {
    const thumbnailFile = fileInputRef.current?.files?.[0];
    await saveTemplate(name, htmlContent, description, category, thumbnailFile);
  };

  const handleFetch = async () => {
    if (template?.id) {
      await fetchTemplate(template.id);
    }
  };

  const handleUpdate = async () => {
    if (template?.id) {
      const thumbnailFile = fileInputRef.current?.files?.[0];
      await updateTemplate(template.id, {
        name,
        description,
        category,
        htmlContent,
        thumbnailImage: thumbnailFile
      });
    }
  };

  const handleDelete = async () => {
    if (template?.id && confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(template.id);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Template Storage Demo</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {template && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Current Template</h2>
          <p>ID: {template.id}</p>
          <p>Name: {template.name}</p>
          <p>Category: {template.category}</p>
          {template.thumbnailUrl && (
            <img 
              src={template.thumbnailUrl} 
              alt={template.name}
              className="w-24 h-24 object-cover mt-2 rounded"
            />
          )}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter template description"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="general">General</option>
            <option value="onboarding">Onboarding</option>
            <option value="notifications">Notifications</option>
            <option value="ecommerce">E-Commerce</option>
            <option value="security">Security</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="htmlContent">HTML Content</Label>
          <Textarea
            id="htmlContent"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={6}
            placeholder="Enter HTML content"
            className="font-mono"
          />
        </div>
        
        <div>
          <Label htmlFor="thumbnail">Thumbnail Image</Label>
          <Input
            id="thumbnail"
            type="file"
            ref={fileInputRef}
            accept="image/*"
          />
        </div>
        
        <div className="flex gap-3 pt-3">
          <Button 
            onClick={handleSave}
            disabled={loading || !name || !htmlContent}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
          
          {template && (
            <>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Updating...' : 'Update Template'}
              </Button>
              
              <Button
                onClick={handleFetch}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Refresh
              </Button>
              
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      {template?.htmlContent && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Preview</h2>
          <div className="border p-4 bg-white rounded">
            <iframe
              srcDoc={template.htmlContent}
              title="Template Preview"
              className="w-full h-96 border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateStorageDemo; 