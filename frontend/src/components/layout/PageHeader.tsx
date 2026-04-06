import React from 'react';
import NotificationDropdown from '../notifications/NotificationDropdown';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="mb-6 md:mb-10 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 pl-10 md:pl-0">
          <div className="h-6 md:h-8 w-1 bg-[#F97316] shrink-0" />
          <h1 className="text-xl md:text-3xl font-semibold text-white truncate">
            {title}{subtitle ? <> <span className="hidden sm:inline opacity-40 text-base md:text-xl font-normal">— {subtitle}</span></> : null}
          </h1>
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <NotificationDropdown />
          <div className="hidden md:flex flex-col items-end">
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
