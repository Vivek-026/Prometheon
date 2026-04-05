import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotificationStore } from '../../store/useNotificationStore';
import NotificationItem from './NotificationItem';
import { Button } from '../ui/Button';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, isLoading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fetchNotifications]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button 
        onClick={toggleDropdown}
        className={cn(
          "relative p-2 rounded-none transition-all hover:bg-zinc-900 group",
          isOpen && "bg-zinc-900"
        )}
      >
        <Bell 
          size={20} 
          className={cn(
            "text-zinc-500 group-hover:text-[#F97316] transition-colors",
            isOpen && "text-[#F97316]",
            unreadCount > 0 && "animate-pulse"
          )} 
        />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 h-4 w-4 bg-[#F97316] text-black text-[8px] font-black italic flex items-center justify-center shadow-[0_0_8px_rgba(249,115,22,0.5)]">
            {displayCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[500px] bg-[#0a0a0a] border border-[#2e2e2e] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between bg-[#0d0d0d]">
            <h3 className="text-[10px] font-black uppercase italic tracking-[0.2em] text-zinc-500">Alert_Stream_Audit</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[9px] font-black uppercase italic text-[#F97316] hover:text-white transition-colors"
              >
                Mark_All_As_Read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] custom-scrollbar bg-black/40 backdrop-blur-md">
            {isLoading && notifications.length === 0 ? (
               <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-[#F97316]" size={24} /></div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center space-y-3 opacity-20 grayscale grayscale-0">
                <CheckCircle size={32} className="text-zinc-600" />
                <span className="text-[10px] font-black uppercase tracking-widest italic leading-tight">All Sector Protocols_Caught Up 🎉</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onClose={() => setIsOpen(false)} 
                />
              ))
            )}
          </div>

          <div 
            onClick={() => { navigate('/notifications'); setIsOpen(false); }}
            className="p-3 border-t border-[#2e2e2e] text-center bg-[#0d0d0d] hover:bg-[#1a1a1a] transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-black uppercase italic text-zinc-600 group-hover:text-[#F97316]">Analyze_Full_Registry_Archive</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
