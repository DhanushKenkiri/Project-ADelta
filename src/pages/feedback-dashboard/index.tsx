import React from 'react';
import { Link } from 'react-router-dom';

const FeedbackDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Feedback Dashboard</h1>
        <p className="mb-8 text-muted-foreground">
          View and analyze user feedback
        </p>
        
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
          
          <div className="space-y-4">
            {[1, 2, 3].map((id) => (
              <div key={id} className="p-4 bg-secondary/50 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">User #{id}</span>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
                <p className="text-sm">
                  Sample feedback message {id}. This is placeholder text.
                </p>
                <div className="mt-2 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-500">
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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

export default FeedbackDashboard; 