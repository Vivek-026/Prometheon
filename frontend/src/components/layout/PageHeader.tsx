import React from 'react';
import NotificationDropdown from '../notifications/NotificationDropdown';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="mb-10 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-[#F97316]" />
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            {title} / <span className="opacity-40 italic">{subtitle}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <NotificationDropdown />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-zinc-500 leading-none">Established_Uplink</span>
            <span className="text-[10px] font-bold text-zinc-700 italic">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-[#2e2e2e]" />
      </div>
    </header>
  );
};

export default PageHeader;
