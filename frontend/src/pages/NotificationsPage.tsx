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
import PageHeader from '../components/layout/PageHeader';
import NotificationItem from '../components/notifications/NotificationItem';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { useNotificationStore } from '../store/useNotificationStore';
import type { Notification } from '../types/notifications';
import { cn } from '../lib/utils';

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
      return res.data;
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('/notifications'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const notifications = Array.isArray(notificationData) ? notificationData : (notificationData?.notifications || []);
  const totalPages = notificationData?.totalPages || 1;

  return (
    <div className="flex bg-[#111] min-h-screen">
       <Sidebar />
       
       <main className="flex-1 md:ml-64 p-4 md:p-8 space-y-10 pb-32 w-full max-w-[100vw] overflow-x-hidden">
          <PageHeader title="Notifications" subtitle="Stay updated on your tasks and team activity" />

          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1a1a1a] p-4 border border-[#2e2e2e] rounded-sm">
              <Tabs value={filter} onValueChange={(v) => { setFilter(v as any); setPage(1); }} className="w-full md:w-auto">
                 <TabsList className="bg-[#0d0d0d] border border-zinc-900 rounded-none h-11 p-1 gap-1 w-full md:w-auto">
                    <TabsTrigger value="all" className="flex-1 md:flex-none text-[9px] font-black uppercase italic tracking-widest px-8">All Notifications</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1 md:flex-none text-[9px] font-black uppercase italic tracking-widest px-8">Unread Only</TabsTrigger>
                 </TabsList>
              </Tabs>

              <div className="flex items-center gap-3 w-full md:w-auto">
                 <Button 
                   onClick={() => markAllAsRead()} 
                   variant="outline" 
                   className="flex-1 md:flex-none bg-zinc-900 border-[#2e2e2e] text-[9px] font-black uppercase tracking-widest h-11 gap-2 rounded-none hover:bg-zinc-800 text-zinc-300"
                 >
                    <CheckCircle2 size={14} /> Mark All Read
                 </Button>
                 <Button 
                   onClick={() => clearAllMutation.mutate()}
                   variant="outline"
                   className="flex-1 md:flex-none bg-zinc-900 border-[#2e2e2e] text-[9px] font-black uppercase tracking-widest h-11 gap-2 rounded-none hover:bg-red-950 hover:border-red-500 text-zinc-500 hover:text-red-500"
                 >
                    <Trash2 size={14} /> Clear History
                 </Button>
              </div>
          </div>

          {/* Notifications List */}
          <div className="bg-[#0b0b0b] border border-[#2e2e2e] shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[400px] flex flex-col rounded-none relative">
             <div className="h-1 bg-gradient-to-r from-transparent via-[#F97316]/50 to-transparent absolute top-0 left-0 w-full" />
             
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center p-32 flex flex-col gap-4">
                   <Loader2 className="animate-spin text-[#F97316]" size={48} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Retrieving Updates...</span>
                </div>
             ) : notifications.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-32 opacity-20 space-y-6">
                   <Inbox size={80} className="text-zinc-800" strokeWidth={1} />
                   <div className="flex flex-col items-center text-center gap-2">
                     <h2 className="text-2xl font-black uppercase tracking-widest italic">All Caught Up</h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#F97316]">No new notifications found</p>
                   </div>
                </div>
             ) : (
                <div className="divide-y divide-zinc-900">
                   {notifications.map((n: Notification) => (
                      <NotificationItem key={n.id} notification={n} />
                   ))}
                </div>
             )}

             {/* Pagination */}
             {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-900 flex justify-center items-center gap-6 mt-auto">
                   <Button 
                     disabled={page === 1} 
                     onClick={() => setPage(page - 1)} 
                     variant="ghost" 
                     className="h-9 w-9 rounded-none text-zinc-500 hover:text-white"
                   >
                     <ChevronLeft size={20} />
                   </Button>
                   <span className="text-[10px] font-black uppercase italic text-zinc-400">Page {page} of {totalPages}</span>
                   <Button 
                     disabled={page >= totalPages} 
                     onClick={() => setPage(page + 1)} 
                     variant="ghost" 
                     className="h-9 w-9 rounded-none text-zinc-500 hover:text-white"
                   >
                     <ChevronRight size={20} />
                   </Button>
                </div>
             )}
          </div>
       </main>
    </div>
  );
};

export default NotificationsPage;
