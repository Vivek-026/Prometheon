import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useSidebarStore } from '../../store/useSidebarStore';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  const { toggle } = useSidebarStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="mb-8 flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggle}
            className="p-2 -ml-2 text-zinc-500 hover:text-white md:hidden"
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden md:block h-8 w-1 bg-[#F97316]" />
          
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white">
            {title} <span className="opacity-40 italic font-medium lowercase tracking-normal">/ {subtitle}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden sm:flex flex-col items-end mr-2 md:mr-0">
            <span className="text-[10px] font-bold text-zinc-500 italic uppercase tracking-widest">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <NotificationDropdown />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-[#2e2e2e]" />
      </div>
    </header>
  );
};

export default PageHeader;
