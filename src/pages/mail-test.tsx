import React from 'react';
import MailTest from '@/components/test-mail';

export default function MailTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Mail System Test
        </h1>
        <MailTest />
      </div>
    </div>
  );
} 