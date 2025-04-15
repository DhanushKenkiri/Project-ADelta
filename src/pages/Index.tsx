
import React from 'react';
import Sidebar from '@/components/Sidebar';
import EmailBuilder from '@/components/EmailBuilder';

const Index = () => {
  return (
    <div className="flex h-screen bg-[#0A0A0F] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-6 relative overflow-y-auto">
        <div className="flex-1 flex items-center justify-center">
          <EmailBuilder />
        </div>
      </main>
    </div>
  );
};

export default Index;
