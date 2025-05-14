import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EmailBuilder from '@/components/EmailBuilder';
import PageTitle from '@/components/PageTitle';

const Index = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Home" />
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        <EmailBuilder />
      </main>
    </div>
  );
};

export default Index;
