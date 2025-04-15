
import React, { useState } from 'react';
import { Mail, Grid, BarChart, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'bg-[#0A0A0F] flex flex-col items-center py-6 border-r border-white/5 transition-all duration-300',
      expanded ? 'w-[200px]' : 'w-[60px]',
      className
    )}>
      <div className="mb-8 flex items-center justify-center">
        <div className="w-8 h-8 flex items-center justify-center font-bold text-xl text-white">
          <span className="text-purple-500">A</span>
          <span className="text-purple-500">δ</span>
        </div>
        {expanded && (
          <span className="ml-2 text-white font-semibold">Project-Aδ</span>
        )}
      </div>
      
      <nav className="flex flex-col space-y-6 items-center w-full">
        <SidebarItem icon={<Mail size={20} />} active expanded={expanded} label="Email" />
        <SidebarItem icon={<Grid size={20} />} expanded={expanded} label="Templates" />
        <SidebarItem icon={<BarChart size={20} />} expanded={expanded} label="Analytics" />
      </nav>
      
      <div className="mt-auto flex flex-col items-center gap-6">
        <SidebarItem icon={<Settings size={20} />} expanded={expanded} label="Settings" />
        <SidebarItem icon={<LogOut size={20} />} expanded={expanded} label="Logout" />
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  active?: boolean;
  expanded?: boolean;
  label?: string;
}

const SidebarItem = ({ icon, active, expanded, label }: SidebarItemProps) => {
  return (
    <button
      className={cn(
        'group flex items-center transition-colors duration-200 w-full',
        expanded ? 'px-5 justify-start' : 'justify-center',
        active ? 'text-white' : 'text-gray-500 hover:text-white'
      )}
    >
      <div className={cn(
        'flex items-center justify-center rounded-md transition-colors duration-200 w-10 h-10',
        active ? 'bg-white/10' : 'group-hover:bg-white/5'
      )}>
        {icon}
      </div>
      {expanded && (
        <span className="ml-3 text-sm">{label}</span>
      )}
    </button>
  );
};

export default Sidebar;
