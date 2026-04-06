import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  Filter, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import NotificationItem from '../components/notifications/NotificationItem';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { useNotificationStore } from '../store/useNotificationStore';
import type { Notification } from '../types/notifications';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotificationStore();

  const { data: notificationData, isLoading } = useQuery({
    queryKey: ['notifications', filter, page],
    queryFn: async () => {
      const res = await api.get('/notifications', { 
        params: { 
          is_read: filter === 'unread' ? false : undefined,
          page,
          limit: 15
        } 
      });
      return res.data; // Assuming { notifications: [], totalPages: number }
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('/notifications'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const notifications = Array.isArray(notificationData) ? notificationData : (notificationData?.notifications || []);
  const totalPages = notificationData?.totalPages || 1;

  return (
    <div className="flex bg-[#0a0a0a] min-h-screen text-zinc-300">
       <Sidebar />
       
       <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 space-y-10 pb-32">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#2e2e2e] relative overflow-hidden pt-10 md:pt-0">
              <div className="flex flex-col gap-3 z-10 transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#F97316]" />
                   <span className="text-xs font-medium text-zinc-500 italic">Sector_Alert_Archive</span>
                </div>
                <h1 className="text-4xl font-semibold text-white italic flex items-center gap-4">
                   Notification_HUB <Bell className="text-zinc-800" size={32} />
                </h1>
              </div>

              <div className="flex gap-4 z-10">
                 <Button 
                   onClick={() => markAllAsRead()} 
                   variant="outline" 
                   className="bg-[#111] border-zinc-800 text-xs font-medium gap-2 rounded-none hover:bg-zinc-900 border-[#6366f1] text-[#6366f1]"
                 >
                    <CheckCircle2 size={14} /> Mark_All_As_Read
                 </Button>
                 <Button 
                   onClick={() => clearAllMutation.mutate()}
                   variant="outline"
                   className="bg-[#111] border-zinc-800 text-xs font-medium gap-2 rounded-none hover:bg-red-950 hover:border-red-500 text-zinc-500 hover:text-red-500"
                 >
                    <Trash2 size={14} /> Purge_Archive
                 </Button>
              </div>
          </header>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
             <Tabs value={filter} onValueChange={(v) => { setFilter(v as any); setPage(1); }}>
                <TabsList className="bg-[#111] border border-zinc-900 rounded-none h-12 p-1 gap-1">
                   <TabsTrigger value="all" className="text-xs font-medium px-8">All_Transmissions</TabsTrigger>
                   <TabsTrigger value="unread" className="text-xs font-medium px-8">Unread_Only</TabsTrigger>
                </TabsList>
             </Tabs>

             <div className="flex items-center gap-3 bg-[#111] border border-zinc-900 p-1">
                <Button 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)} 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 rounded-none text-zinc-500"
                >
                  <ChevronLeft size={18} />
                </Button>
                <span className="text-xs font-medium text-zinc-400 px-4">Cycle_Page 0{page}</span>
                <Button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(page + 1)} 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 rounded-none text-zinc-500"
                >
                  <ChevronRight size={18} />
                </Button>
             </div>
          </div>

          <div className="bg-[#0b0b0b] border border-[#2e2e2e] shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[400px] flex flex-col">
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center p-32"><Loader2 className="animate-spin text-[#F97316]" size={48} /></div>
             ) : notifications.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-32 opacity-20 grayscale grayscale-0 space-y-6">
                   <Inbox size={80} className="text-zinc-800" />
                   <div className="flex flex-col items-center text-center gap-2">
                     <h2 className="text-2xl font-semibold">Archive_Empty</h2>
                     <p className="text-xs font-medium text-[#F97316]">Caught Up on Sector Protocols_</p>
                   </div>
                </div>
             ) : (
                <div className="divide-y divide-zinc-900">
                   {notifications.map((n: Notification) => (
                      <NotificationItem key={n.id} notification={n} />
                   ))}
                </div>
             )}
          </div>
       </main>
    </div>
  );
};

export default NotificationsPage;
