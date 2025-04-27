import React, { useState } from 'react';
import { MailInbox } from '@/components/MailShare';
import Helmet from 'react-helmet';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const MailInboxPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // We'll just simulate a refresh since MailInbox component handles its own data
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Helmet>
        <title>Inbox | Project ADelta</title>
        <meta name="description" content="View encrypted messages from Ethereum L2 networks and Web2" />
      </Helmet>
      
      <PageTitle title="Inbox" />
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold gradient-text">Inbox</h1>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 text-gray-200 hover:text-white" 
                onClick={handleRefresh}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Link to="/compose">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Compose</span>
                </Button>
              </Link>
              
              <Link to="/settings">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1 text-gray-200 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-lg overflow-hidden">
            <div className="text-gray-100">
              <MailInbox className="p-4" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MailInboxPage; 