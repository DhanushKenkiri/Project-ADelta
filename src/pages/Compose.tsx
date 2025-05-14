import React from 'react';
import { MailComposer } from '@/components/MailShare';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ComposePage = () => {
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Compose Mail" />
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white gradient-text">Compose Message</h1>
            <Link to="/mail">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Inbox</span>
              </Button>
            </Link>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-lg overflow-hidden p-6">
            <MailComposer />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComposePage; 