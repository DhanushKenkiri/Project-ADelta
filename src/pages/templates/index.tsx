import React from 'react';
import { Link } from 'react-router-dom';

const TemplatesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Email Templates</h1>
        <p className="mb-8 text-muted-foreground">
          Browse and manage your email templates
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample template cards */}
          {[1, 2, 3].map((id) => (
            <div key={id} className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-2">Template {id}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sample template description
              </p>
              <Link 
                to={`/template/${id}`}
                className="text-sm text-primary hover:underline"
              >
                View details
              </Link>
            </div>
          ))}
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

export default TemplatesPage; 