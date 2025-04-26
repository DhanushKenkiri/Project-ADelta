import React from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <PageTitle title="Not Found" />
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white gradient-btn"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
