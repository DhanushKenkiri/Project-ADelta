import React from 'react';
import { Link } from 'react-router-dom';

const TemplateGeneratorPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Template Generator</h1>
        <p className="mb-8 text-muted-foreground">
          Generate new email templates using AI
        </p>
        
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate a new template</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Template Type
            </label>
            <select className="w-full p-2 rounded-md bg-secondary text-foreground">
              <option>Welcome Email</option>
              <option>Newsletter</option>
              <option>Promotional</option>
              <option>Announcement</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea 
              className="w-full p-2 rounded-md bg-secondary text-foreground"
              rows={4}
              placeholder="Describe what you want to include in your email template..."
            />
          </div>
          
          <button className="px-4 py-2 gradient-btn text-white rounded-md">
            Generate Template
          </button>
        </div>
        
        <div className="mt-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default TemplateGeneratorPage; 