
import React from 'react';
import { ArrowRight } from 'lucide-react';

const Header = () => {
  return (
    <div className="w-full flex justify-center mb-4">
      <button className="px-4 py-2 rounded-full bg-black/40 text-sm text-gray-300 hover:bg-black/60 transition-colors duration-200 backdrop-blur-md border border-white/10 flex items-center gap-2">
        Turn Text Into Email Templates in Minutes
        <ArrowRight size={16} className="ml-1" />
      </button>
    </div>
  );
};

export default Header;
