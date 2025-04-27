import React from 'react';
import TemplateStorageDemo from '@/components/TemplateStorageDemo';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';

const StorageDemoPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Storage Demo" />
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-900">
        <div className="container mx-auto py-8">
          <div className="glass-card">
            <h1 className="text-3xl font-bold mb-4 gradient-text">Vercel Blob Storage Demo</h1>
            <p className="text-gray-300 mb-6">
              This demo showcases the Vercel Blob storage functionality for templates.
              You can create, update, and delete templates with this interface.
            </p>
            
            <TemplateStorageDemo />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StorageDemoPage; 