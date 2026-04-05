import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  User as UserIcon, 
  AlertTriangle, 
  ArrowRight,
  Users,
  Calendar,
  Split,
  Flag,
  CheckCircle2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import type { TaskFlag, TeamMemberAvailability } from '../types/tasks';

const FlagDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'admin';

    // --- Queries ---
    const { data: flags, isLoading } = useQuery<TaskFlag[]>({
        queryKey: ['flags'],
        queryFn: async () => {
            try {
                const res = await api.get('/flags');
                return Array.isArray(res.data) ? res.data : (res.data?.flags || []);
            } catch (e) {
                return [];
            }
        }
    });

    const activeFlags = (flags || []).filter(f => f.status === 'pending_review');
    const resolvedFlags = (flags || []).filter(f => f.status === 'resolved');

    return (
        <div className="flex bg-[#111111] min-h-screen">
          <Sidebar />

          <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
            <PageHeader title="Flags" subtitle="Manage reported issues and blockers" />

            <div className="space-y-12 pb-20 md:pb-0">
                
                {/* Active Flags Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <AlertTriangle className="text-[#F97316]" size={18} />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#F97316]">Reported Issues</h3>
                        <Badge className="bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 text-[10px] h-6 rounded-none font-black italic">{activeFlags.length}</Badge>
                        <div className="flex-1 h-[1px] bg-zinc-900 ml-4 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-zinc-900/50 animate-pulse border border-zinc-900" />)
                        ) : activeFlags.map(flag => (
                            <Card key={flag.id} className="bg-[#1a1a1a] border border-zinc-900 rounded-none group hover:border-[#F97316]/40 transition-all flex flex-col relative overflow-hidden">
                               <div className="p-6 space-y-4 flex-1">
                                  <div className="flex justify-between items-start">
                                     <div className="space-y-1">
                                        <h4 className="text-[12px] font-black uppercase text-white truncate max-w-[150px]">{flag.task.name}</h4>
                                        <div className="text-[9px] text-zinc-600 font-bold uppercase italic">{flag.reporter.name} reported</div>
                                     </div>
                                     <Badge variant="outline" className="border-zinc-800 text-zinc-500 rounded-none text-[8px] h-4 font-black uppercase italic">Pending</Badge>
                                  </div>
                                  
                                  <div className="p-3 bg-[#0d0d0d] border border border-zinc-800 text-[10px] text-zinc-400 font-medium italic min-h-[60px] leading-relaxed">
                                     "{flag.message}"
                                  </div>

                                  <div className="flex items-center gap-4 pt-2 border-t border-zinc-900">
                                     <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Reported</span>
                                        <span className="text-[9px] font-bold text-zinc-500 italic">{formatDistanceToNow(new Date(flag.created_at))} ago</span>
                                     </div>
                                     <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Type</span>
                                        <span className="text-[9px] font-bold text-[#F97316] italic uppercase">{flag.flag_type.replace('_', ' ')}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="bg-[#0d0d0d] p-4 border-t border-zinc-900 flex gap-2">
                                  <Button variant="outline" className="flex-1 h-9 text-[9px] font-black uppercase rounded-none border-zinc-800 hover:bg-zinc-900 transition-all">
                                     Ignore
                                  </Button>
                                  <Button className="flex-1 h-9 bg-[#F97316] hover:bg-[#EA580C] text-black text-[9px] font-black uppercase rounded-none transition-all">
                                     Take Action
                                  </Button>
                               </div>
                            </Card>
                        ))}
                        {activeFlags.length === 0 && (
                            <div className="col-span-full p-20 border-2 border-dashed border-zinc-900 text-center flex flex-col items-center gap-4 opacity-10">
                               <CheckCircle2 size={48} />
                               <h3 className="text-xl font-black uppercase italic tracking-tighter">No Active Flags</h3>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resolved Flags Section */}
                <div className="space-y-6 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3 px-2">
                        <CheckCircle2 className="text-green-500" size={18} />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic text-green-500">Recently Resolved</h3>
                        <div className="flex-1 h-[1px] bg-zinc-900 ml-4 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {resolvedFlags.slice(0, 4).map(flag => (                       
                           <div key={flag.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-none flex flex-col gap-2 relative">
                              <span className="text-[10px] font-black uppercase text-zinc-400 truncate tracking-tight">{flag.task.name}</span>
                              <div className="flex justify-between items-center">
                                 <span className="text-[8px] font-bold text-green-500/50 uppercase italic group-hover:text-green-500 transition-colors">By {flag.resolved_by?.name}</span>
                                 <ChevronRight size={14} className="text-zinc-800" />
                              </div>
                           </div>
                        ))}
                    </div>
                </div>

            </div>
          </main>
        </div>
    );
};

export default FlagDashboard;
