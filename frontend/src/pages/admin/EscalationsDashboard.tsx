import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Snowflake, 
  Flag, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  UserPlus,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Clock,
  History,
  AlertCircle,
  BarChart,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Separator } from '../../components/ui/Separator';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { cn } from '../../lib/utils';
import type { FrozenTask, UnresolvedFlag, FlagFrequencyPattern, EscalationSummary } from '../../types/escalations';
import type { UserSummary } from '../../types/tasks';

const EscalationsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [isFrozenOpen, setIsFrozenOpen] = useState(true);
  const [isFlagsOpen, setIsFlagsOpen] = useState(true);
  const [isPatternsOpen, setIsPatternsOpen] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<string>('');
  const [closeReason, setCloseReason] = useState<string>('');

  const { data: frozenTasks = [], isLoading: isFrozenLoading } = useQuery<FrozenTask[]>({
    queryKey: ['admin', 'frozen-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks', { params: { is_frozen: true } });
      return Array.isArray(res.data) ? res.data : (res.data?.tasks || []);
    }
  });

  const { data: unresolvedFlags = [], isLoading: isFlagsLoading } = useQuery<UnresolvedFlag[]>({
    queryKey: ['admin', 'unresolved-flags'],
    queryFn: async () => {
      const res = await api.get('/flags', { params: { status: 'expired' } });
      return Array.isArray(res.data) ? res.data : (res.data?.flags || []);
    }
  });

  const { data: flagPatterns = [], isLoading: isPatternsLoading } = useQuery<FlagFrequencyPattern[]>({
    queryKey: ['admin', 'flag-patterns'],
    queryFn: async () => {
      const res = await api.get('/flags/analytics');
      return Array.isArray(res.data) ? res.data : (res.data?.analytics || res.data?.patterns || []);
    }
  });

  return (
    <div className="flex bg-[#111] min-h-screen">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
        <PageHeader title="Escalations" subtitle="System-wide critical issues and bottlenecks" />

        <div className="space-y-12 pb-20 md:pb-0">
          
          {/* Section 1: Frozen Tasks */}
          <div className="space-y-6">
            <button 
              onClick={() => setIsFrozenOpen(!isFrozenOpen)}
              className="w-full flex items-center justify-between p-4 bg-red-950/10 border border-red-900/20 hover:bg-red-950/20 transition-all rounded-sm group"
            >
              <div className="flex items-center gap-4">
                 <Snowflake className="text-red-500 animate-pulse" size={20} />
                 <h2 className="text-sm font-black uppercase tracking-[0.3em] text-red-500">Stuck Tasks</h2>
                 <Badge className="bg-red-500/20 text-red-500 border border-red-500/30 rounded-none text-[10px] h-6 font-black italic">{(frozenTasks || []).length}</Badge>
              </div>
              {isFrozenOpen ? <ChevronUp size={20} className="text-red-500" /> : <ChevronDown size={20} className="text-red-500" />}
            </button>

            {isFrozenOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                {(frozenTasks || []).map(task => (
                  <Card key={task.id} className="bg-[#111] border-red-900/30 rounded-none overflow-hidden hover:border-red-500/50 transition-all relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                       <Snowflake size={64} className="text-red-500" />
                    </div>
                    <CardHeader className="p-5 border-b border-zinc-900">
                      <div className="flex justify-between items-start">
                         <CardTitle className="text-[12px] font-black uppercase text-white truncate max-w-[150px]">{task.name}</CardTitle>
                         <Badge variant="urgent" className="bg-red-500/20 text-red-500 border-none rounded-none text-[8px] h-4 italic px-2">Stuck</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-6 justify-between">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Assigned To</span>
                            <div className="flex -space-x-1 mt-1">
                               {task.assignees.map((a, i) => (
                                 <div key={i} className="w-6 h-6 rounded-full border border-black overflow-hidden bg-zinc-800">
                                   <img src={a.avatar_url} alt={a.name} className="w-full h-full object-cover" />
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Pushed Forward</span>
                            <span className="text-xl font-black text-red-500 italic">×{task.carry_forward_count}</span>
                         </div>
                      </div>
                      
                      <div className="p-3 bg-red-950/20 border border-red-900/20 space-y-1">
                         <span className="text-[9px] font-black text-red-400 uppercase italic">Last Critical Event</span>
                         <p className="text-[10px] text-zinc-500 font-medium italic truncate">Upstream dependency delay reported</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                         <Button className="flex-1 h-9 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase rounded-none border border-zinc-800">
                            Reassign
                         </Button>
                         <Button className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-black text-[9px] font-black uppercase rounded-none">
                            Close Task
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Flag Patterns */}
          <div className="space-y-6">
            <button 
              onClick={() => setIsPatternsOpen(!isPatternsOpen)}
              className="w-full flex items-center justify-between p-4 bg-orange-950/10 border border-orange-900/20 hover:bg-orange-950/20 transition-all rounded-sm"
            >
              <div className="flex items-center gap-4">
                 <BarChart className="text-orange-500" size={20} />
                 <h2 className="text-sm font-black uppercase tracking-[0.3em] text-orange-500">Problem Areas</h2>
                 <Badge className="bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-none text-[10px] h-6 font-black italic">{(flagPatterns || []).length}</Badge>
              </div>
              {isPatternsOpen ? <ChevronUp size={20} className="text-orange-500" /> : <ChevronDown size={20} className="text-orange-500" />}
            </button>

            {isPatternsOpen && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300 text-zinc-400">
                 {(flagPatterns || []).map((pattern, idx) => (
                    <Card key={idx} className="bg-[#111] border-orange-900/30 rounded-none">
                       <CardContent className="p-6 flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                             <div className="p-3 bg-orange-950/30 border border-orange-900/30 text-orange-500 shrink-0">
                                <Flag size={20} />
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-black uppercase text-white truncate">{pattern.task_name || 'System Anomaly'}</span>
                                <span className="text-[9px] font-bold text-zinc-600 uppercase italic">Recent reports: {pattern.total_flags}</span>
                             </div>
                          </div>
                          <div className="text-right shrink-0">
                             <Badge variant="outline" className="bg-orange-950/20 text-orange-500 border-none rounded-none text-[10px] h-6 font-black px-3 italic">Pattern Alert</Badge>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
               </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default EscalationsDashboard;
