
import React from 'react';
import { Mail, Grid, BarChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  return (
    <div className={cn('w-[60px] bg-sidebar flex flex-col items-center py-6 border-r border-white/5', className)}>
      <div className="mb-8">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">
          A6
        </div>
      </div>
      
      <nav className="flex flex-col space-y-6 items-center">
        <SidebarItem icon={<Mail size={20} />} active />
        <SidebarItem icon={<Grid size={20} />} />
        <SidebarItem icon={<BarChart size={20} />} />
      </nav>
      
      <div className="mt-auto">
        <SidebarItem icon={<Settings size={20} />} />
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  active?: boolean;
}

const SidebarItem = ({ icon, active }: SidebarItemProps) => {
  return (
    <button
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-200',
        active ? 'text-white bg-white/10' : 'text-gray-500 hover-highlight'
      )}
    >
      {icon}
    </button>
  );
};

export default Sidebar;
