import React, { useState } from 'react';
import { Mail, Settings, FileText, Folder, Inbox } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from './UserProfile';
import { useAuth } from '@/lib/AuthContext';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [expanded, setExpanded] = useState(false);
  const [devNotice, setDevNotice] = useState<string | null>(null);
  // Get the current path using the useLocation hook
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path);
  };

  const handleInDevFeature = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDevNotice(label);
    setTimeout(() => setDevNotice(null), 3000);
  };

  return (
    <div 
      className={`bg-black flex flex-col items-center py-4 border-r border-neutral-800/50 transition-all duration-300 ${
        expanded ? 'w-[200px]' : 'w-[60px]'
      } ${className}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="mb-6">
        <div className="flex items-center justify-center">
          <Link to="/" className="text-2xl font-bold text-indigo-500">
            A<span className="text-indigo-500">δ</span>
          </Link>
        </div>
      </div>
      
      <nav className="flex flex-col space-y-1 items-center w-full">
        <SidebarItem 
          icon={<Mail size={20} />} 
          active={isActive('/')} 
          expanded={expanded} 
          label="Email" 
          to="/"
        />
        <SidebarItem 
          icon={<Inbox size={20} />} 
          active={isActive('/inbox')} 
          expanded={expanded} 
          label="Inbox" 
          to="/inbox"
        />
        <SidebarItem 
          icon={<FileText size={20} />} 
          active={isActive('/templates')} 
          expanded={expanded} 
          label="Templates" 
          to="/templates"
        />
        {user && (
          <SidebarItem 
            icon={<Folder size={20} />} 
            active={isActive('/my-templates')} 
            expanded={expanded} 
            label="Your Templates" 
            to="/my-templates"
          />
        )}
      </nav>
      
      <div className="mt-auto flex flex-col items-center gap-1">
        <SidebarItem 
          icon={<Settings size={20} />} 
          active={isActive('/settings')} 
          expanded={expanded} 
          label="Settings" 
          to="/settings"
        />
        
        {/* User Profile Component */}
        <div className="w-full flex justify-center py-2 mt-2">
          {user ? (
            <UserProfile />
          ) : (
            <Link to="/login" className="text-neutral-500 hover:text-white">
              <div className="h-8 w-8 rounded-full border border-primary/20 flex items-center justify-center transition-colors hover:border-primary/50">
                <span className="text-xs">?</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  active?: boolean;
  expanded?: boolean;
  label?: string;
  to: string;
}

const SidebarItem = ({ icon, active, expanded, label, to }: SidebarItemProps) => {
  return (
    <Link to={to} className="w-full">
    <button
        className={`group flex items-center transition-colors duration-200 w-full py-2 ${
          expanded ? 'px-4 justify-start' : 'justify-center'
        } ${active ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
      >
        <div className={`flex items-center justify-center min-w-[24px] ${
          active ? 'text-white' : 'text-neutral-500 group-hover:text-white'
        }`}>
        {icon}
      </div>
        {expanded && (
          <span className={`ml-3 text-sm whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}>
        {label}
      </span>
        )}
    </button>
    </Link>
  );
};

export default Sidebar;
