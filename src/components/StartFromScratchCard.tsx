import React from 'react';
import { PlusCircle } from 'lucide-react';

interface StartFromScratchCardProps {
  onClick: () => void;
}

const StartFromScratchCard: React.FC<StartFromScratchCardProps> = ({ onClick }) => {
  return (
    <div 
      className="bg-neutral-800 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-neutral-700 border-dashed"
      onClick={onClick}
    >
      <div className="h-48 overflow-hidden bg-neutral-900 flex items-center justify-center p-4">
        <PlusCircle className="h-12 w-12 text-indigo-500" />
      </div>
      <div className="p-4">
        <h3 className="text-md font-medium text-gray-200">Start from scratch</h3>
        <p className="text-sm text-gray-400 mt-1">Create a new email template</p>
      </div>
    </div>
  );
};

export default StartFromScratchCard; 
import { PlusCircle } from 'lucide-react';

interface StartFromScratchCardProps {
  onClick: () => void;
}

const StartFromScratchCard: React.FC<StartFromScratchCardProps> = ({ onClick }) => {
  return (
    <div 
      className="bg-neutral-800 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-neutral-700 border-dashed"
      onClick={onClick}
    >
      <div className="h-48 overflow-hidden bg-neutral-900 flex items-center justify-center p-4">
        <PlusCircle className="h-12 w-12 text-indigo-500" />
      </div>
      <div className="p-4">
        <h3 className="text-md font-medium text-gray-200">Start from scratch</h3>
        <p className="text-sm text-gray-400 mt-1">Create a new email template</p>
      </div>
    </div>
  );
};

export default StartFromScratchCard; 
 