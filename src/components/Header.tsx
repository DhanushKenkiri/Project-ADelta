
import React from 'react';

const Header = () => {
  return (
    <div className="w-full flex justify-center mb-4 absolute top-6 left-0 right-0">
      <div className="px-4 py-2 rounded-full bg-black/40 text-sm text-gray-300 border border-white/10 backdrop-blur-sm">
        <span>To exit full screen, press and hold</span>
        <span className="mx-2 py-0.5 px-2 bg-white/10 rounded text-xs font-mono">Esc</span>
      </div>
    </div>
  );
};

export default Header;
