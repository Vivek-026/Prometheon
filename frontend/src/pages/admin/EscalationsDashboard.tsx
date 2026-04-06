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
  AlertCircle
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

// --- MOCK DATA ---
const MOCK_SUMMARY: EscalationSummary = {
  total_frozen: 4,
  total_unresolved_flags: 7,
  total_pattern_alerts: 3
};

const EscalationsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Section states
  const [isFrozenOpen, setIsFrozenOpen] = useState(true);
  const [isFlagsOpen, setIsFlagsOpen] = useState(true);
  const [isPatternsOpen, setIsPatternsOpen] = useState(true);
  
  // Action states
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<string>('');
  const [closeReason, setCloseReason] = useState<string>('');

  // --- QUERIES ---
  const { data: frozenTasks = [], isLoading: isFrozenLoading } = useQuery<FrozenTask[]>({
    queryKey: ['admin', 'frozen-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks', { params: { is_frozen: true } });
      return Array.isArray(res.data) ? res.data : (res.data?.tasks || []);
    },
    refetchInterval: 60000
  });

  const { data: unresolvedFlags = [], isLoading: isFlagsLoading } = useQuery<UnresolvedFlag[]>({
    queryKey: ['admin', 'unresolved-flags'],
    queryFn: async () => {
      const res = await api.get('/flags', { params: { status: 'expired' } });
      return Array.isArray(res.data) ? res.data : (res.data?.flags || []);
    },
    refetchInterval: 60000
  });

  const { data: flagPatterns = [], isLoading: isPatternsLoading } = useQuery<FlagFrequencyPattern[]>({
    queryKey: ['admin', 'flag-patterns'],
    queryFn: async () => {
      const res = await api.get('/flags/analytics');
      return Array.isArray(res.data) ? res.data : (res.data?.analytics || res.data?.patterns || []);
    },
    refetchInterval: 60000
  });

  const { data: teamMembers = [] } = useQuery<UserSummary[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return Array.isArray(res.data) ? res.data : (res.data?.users || []);
    }
  });

  // --- MUTATIONS ---
  const reassignMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      return api.patch(`/tasks/${taskId}`, { assignee_ids: [userId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setIsReassignModalOpen(false);
    }
  });

  const closeTaskMutation = useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      return api.patch(`/tasks/${taskId}/status`, { status: 'completed', close_reason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setIsCloseModalOpen(false);
    }
  });

  // --- RENDERING HELPERS ---
  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    count, 
    isOpen, 
    toggle, 
    variant = 'red' 
  }: any) => {
    const variants: Record<string, string> = {
      red: 'border-red-900/50 text-red-500 bg-red-950/10',
      orange: 'border-[#F97316]/50 text-[#F97316] bg-[#F97316]/5',
      yellow: 'border-yellow-900/50 text-yellow-500 bg-yellow-950/10'
    };
    
    return (
      <div 
        onClick={toggle}
        className={cn(
          "flex items-center justify-between p-5 border cursor-pointer transition-all hover:bg-zinc-900",
          variants[variant]
        )}
      >
        <div className="flex items-center gap-4">
          <Icon size={20} className={isOpen ? "animate-pulse" : ""} />
          <h2 className="text-sm font-semibold">{title}</h2>
          <Badge className={cn("rounded-none font-semibold text-xs px-2 py-0.5", 
            variant === 'red' ? "bg-red-500 text-black" : 
            variant === 'orange' ? "bg-[#F97316] text-black" : "bg-yellow-500 text-black")}>
            {count || 0} alerts
          </Badge>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
    );
  };

  return (
    <div className="flex bg-[#0a0a0a] min-h-screen text-zinc-300">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 space-y-10 pb-32">
        <PageHeader title="Escalations" subtitle="Tasks and flags that need immediate attention" />

        {/* SUMMARY BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-[#0b0b0b] border-zinc-900 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-600 leading-none">Stuck Tasks</p>
                    <span className="text-4xl font-semibold text-red-500 italic">{(frozenTasks || []).length}</span>
                 </div>
                 <Snowflake className="text-red-900/40" size={40} />
              </CardContent>
           </Card>
           <Card className="bg-[#0b0b0b] border-zinc-900 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-600 leading-none">Unresolved Flags</p>
                    <span className="text-4xl font-semibold text-[#F97316] italic">{(unresolvedFlags || []).length}</span>
                 </div>
                 <Flag className="text-[#F97316]/20" size={40} />
              </CardContent>
           </Card>
           <Card className="bg-[#0b0b0b] border-zinc-900 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-600 leading-none">Flagging Patterns</p>
                    <span className="text-4xl font-semibold text-yellow-500 italic">{(flagPatterns || []).length}</span>
                 </div>
                 <TrendingUp className="text-yellow-900/30" size={40} />
              </CardContent>
           </Card>
        </div>

        {/* SECTION 1: FROZEN TASKS */}
        <section className="space-y-4">
           <SectionHeader 
             title="Stuck Tasks (pushed forward 3+ times)" 
             icon={Snowflake} 
             count={(frozenTasks || []).length} 
             isOpen={isFrozenOpen} 
             toggle={() => setIsFrozenOpen(!isFrozenOpen)}
             variant="red"
           />
           
           {isFrozenOpen && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                 {isFrozenLoading ? (
                    <div className="flex items-center justify-center p-20 opacity-20 italic font-semibold">Loading...</div>
                 ) : (frozenTasks || []).length === 0 ? (
                    <div className="p-10 border border-zinc-900 text-center opacity-20 font-semibold">No stuck tasks right now</div>
                 ) : (frozenTasks || []).map(task => (
                    <Card key={task.id} className="bg-[#0d0d0d] border border-red-900/30 rounded-none group hover:border-red-500/50 transition-all">
                       <CardContent className="p-6 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                          <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-3">
                                <Badge className="bg-red-500 text-black rounded-none h-5 px-1.5 font-semibold text-xs italic">{task.carry_forward_count}× Stalled</Badge>
                                <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">{task.name}</h3>
                             </div>
                             
                             <div className="flex gap-6 items-center">
                                <div className="flex -space-x-3">
                                   {(task.assignees || []).map(a => (
                                      <div key={a.id} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] overflow-hidden" title={a.name}>
                                         <img src={a.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.name}`} className="w-full h-full object-cover" />
                                      </div>
                                   ))}
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-xs font-medium text-zinc-600 leading-none">Original Deadline</p>
                                   <p className="text-xs font-medium text-red-400 italic">{task.original_deadline} <span className="opacity-40 italic">({task.days_overdue}D OVERDUE)</span></p>
                                </div>
                             </div>

                             <details className="group/detail">
                                <summary className="text-xs font-medium text-zinc-500 cursor-pointer hover:text-red-500 transition-colors flex items-center gap-2 pb-2">
                                   Carry Forward Log <ChevronDown size={10} className="group-open/detail:rotate-180 transition-transform" />
                                </summary>
                                <div className="space-y-2 border-l border-zinc-900 pl-4 py-2 mt-2">
                                   {(task.carry_forward_log || []).map((log, i) => (
                                      <div key={i} className="text-xs space-y-1">
                                         <div className="flex items-center gap-2">
                                            <span className="text-zinc-600 font-bold">{log.date}</span>
                                            <div className="h-[1px] w-4 bg-zinc-900" />
                                            <span className="text-red-900 font-semibold">Pushed</span>
                                         </div>
                                         <p className="text-zinc-500 leading-tight italic">"{log.reason}"</p>
                                      </div>
                                   ))}
                                </div>
                             </details>
                          </div>

                          <div className="flex flex-col gap-2 w-full md:w-48">
                             <Button 
                               onClick={() => { setSelectedTask(task.id); setIsReassignModalOpen(true); }}
                               className="bg-transparent border border-zinc-800 text-zinc-500 rounded-none h-10 px-4 font-semibold text-xs italic hover:bg-zinc-900 hover:text-white flex items-center justify-between"
                             >
                               Reassign <UserPlus size={14} />
                             </Button>
                             <Button 
                               onClick={() => { setSelectedTask(task.id); setIsCloseModalOpen(true); }}
                               className="bg-transparent border border-red-900 text-red-500 rounded-none h-10 px-4 font-semibold text-xs italic hover:bg-red-500 hover:text-black flex items-center justify-between"
                             >
                               Close Task <CheckCircle2 size={14} />
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </section>

        {/* SECTION 2: UNRESOLVED FLAGS */}
        <section className="space-y-4">
           <SectionHeader 
             title="Flags with no manager action yet" 
             icon={Flag} 
             count={(unresolvedFlags || []).length} 
             isOpen={isFlagsOpen} 
             toggle={() => setIsFlagsOpen(!isFlagsOpen)}
             variant="orange"
           />
           
           {isFlagsOpen && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                 {isFlagsLoading ? (
                    <div className="flex items-center justify-center p-20 opacity-20 italic font-semibold">Loading...</div>
                 ) : (unresolvedFlags || []).length === 0 ? (
                    <div className="p-10 border border-zinc-900 text-center opacity-20 font-semibold">No unresolved flags</div>
                 ) : (unresolvedFlags || []).map(flag => (
                    <Card key={flag.id} className="bg-[#0d0d0d] border border-[#F97316]/20 rounded-none group hover:border-[#F97316]/50 transition-all">
                       <CardContent className="p-6 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                          <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-3">
                                <Badge className="bg-[#F97316] text-black rounded-none h-5 px-1.5 font-semibold text-xs italic">{flag.reason_category}</Badge>
                                <h3 className="text-lg font-semibold text-white group-hover:text-[#F97316] transition-colors">{flag.task_name}</h3>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full overflow-hidden border border-zinc-800">
                                         <img src={flag.raised_by.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${flag.raised_by.name}`} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-xs font-medium text-zinc-500 italic leading-none">{flag.raised_by.name} reported:</span>
                                   </div>
                                   <p className="text-xs text-zinc-400 italic">"{flag.reason_text}"</p>
                                </div>

                                <div className="space-y-3 p-3 bg-black/40 border border-zinc-900 rounded-none">
                                   <div className="flex items-center gap-2">
                                      <Clock size={12} className={flag.unmasked_duration_hours > 4 ? "text-red-500 animate-pulse" : "text-zinc-600"} />
                                      <span className="text-xs font-medium text-zinc-400">Response Time</span>
                                   </div>
                                   <div className="flex flex-col leading-none">
                                      <span className={cn("text-xl font-semibold", flag.unmasked_duration_hours > 4 ? "text-red-500" : "text-zinc-500")}>{flag.unmasked_duration_hours}h waiting</span>
                                      <span className="text-xs font-medium text-zinc-700 mt-1 italic"></span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex gap-2 w-full md:w-auto">
                             <Button 
                               onClick={() => navigate(`/flags`)}
                               className="bg-[#F97316] text-black rounded-none h-10 px-6 font-semibold text-xs italic hover:bg-[#F97316]/80 flex items-center gap-2"
                             >
                               View Details <ExternalLink size={14} />
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </section>

        {/* SECTION 3: PATTERN ALERTS */}
        <section className="space-y-4">
           <SectionHeader 
             title="Flagging Patterns" 
             icon={TrendingUp} 
             count={(flagPatterns || []).filter(p => p.flag_rate_30d > 0.3).length} 
             isOpen={isPatternsOpen} 
             toggle={() => setIsPatternsOpen(!isPatternsOpen)}
             variant="yellow"
           />
           
           {isPatternsOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                 {isPatternsLoading ? (
                    <div className="col-span-full flex items-center justify-center p-20 opacity-20 italic font-semibold">Loading...</div>
                 ) : (flagPatterns || []).filter(p => p.flag_rate_30d > 0.3).length === 0 ? (
                    <div className="col-span-full p-10 border border-zinc-900 text-center opacity-20 font-semibold">No unusual patterns detected</div>
                 ) : (flagPatterns || []).filter(p => p.flag_rate_30d > 0.3).map(pattern => (
                    <Card key={pattern.user.id} className="bg-[#0b0b0b] border border-yellow-900/20 rounded-none hover:border-yellow-500/50 transition-all flex flex-col">
                       <CardContent className="p-6 flex flex-col flex-1 gap-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full border-2 border-yellow-900/50 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                <img src={pattern.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pattern.user.name}`} className="w-full h-full object-cover" />
                             </div>
                             <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-white leading-none">{pattern.user.name}</h4>
                                <div className="flex items-center gap-2">
                                   <Badge className="bg-yellow-500 text-black text-xs h-4 rounded-none font-semibold">{(pattern.flag_rate_30d * 100).toFixed(0)}% flag rate</Badge>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-4 flex-1">
                             <div className="space-y-1.5 p-3 bg-black/50 border border-zinc-900">
                                <div className="flex justify-between items-center text-xs font-medium text-zinc-500 italic">
                                   <span>30-Day Summary</span>
                                   <span className="text-zinc-600">30D Cycle</span>
                                </div>
                                <div className="flex gap-4">
                                   <div className="flex flex-col">
                                      <span className="text-lg font-semibold text-white italic">{pattern.total_flagged_30d}</span>
                                      <span className="text-xs font-medium text-yellow-900 leading-none">Flags Raised</span>
                                   </div>
                                   <div className="h-8 w-[1px] bg-zinc-900 self-center" />
                                   <div className="flex flex-col">
                                      <span className="text-lg font-semibold text-white italic">{pattern.total_assigned_30d}</span>
                                      <span className="text-xs font-medium text-zinc-700 leading-none">Tasks Assigned</span>
                                   </div>
                                </div>
                             </div>

                             <div className="flex gap-2 p-3 bg-yellow-950/10 border-l border-yellow-600">
                                <AlertCircle size={14} className="text-yellow-600 shrink-0" />
                                <p className="text-xs text-yellow-600 font-semibold leading-tight">This person flags tasks more than average. This may indicate overallocation or external blockers.</p>
                             </div>
                          </div>

                          <Button 
                            onClick={() => navigate(`/tasks?assignee=${pattern.user.id}`)}
                            className="w-full bg-[#111] border border-zinc-900 text-zinc-500 rounded-none h-10 font-semibold text-xs italic hover:bg-[#F97316] hover:text-black hover:border-transparent transition-all mt-auto"
                          >
                             View Tasks
                          </Button>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </section>

        {/* --- MODALS --- */}
        
        {/* REASSIGN MODAL */}
        <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
            <DialogContent className="bg-[#0b0b0b] border-zinc-800 text-zinc-300 rounded-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Reassign Task</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-zinc-600">Assign this task to a different team member</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-6">
                   <div className="space-y-3">
                      <Label className="text-xs font-medium text-zinc-500">Team Member</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                         {teamMembers?.map(user => (
                            <button 
                              key={user.id}
                              onClick={() => setTargetUser(user.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 border transition-all text-left",
                                targetUser === user.id ? "bg-[#F97316] border-transparent text-black" : "bg-[#111] border-zinc-900 text-zinc-500 hover:bg-zinc-900"
                              )}
                            >
                               <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                                  <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
                               </div>
                               <span className="text-xs font-medium truncate">{user.name}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <DialogFooter className="pt-6">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsReassignModalOpen(false)}
                      className="text-zinc-600 font-bold text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => reassignMutation.mutate({ taskId: selectedTask!, userId: targetUser })}
                      disabled={!targetUser || reassignMutation.isPending}
                      className="bg-[#F97316] text-black rounded-none font-semibold text-xs px-8 italic"
                    >
                      {reassignMutation.isPending ? "Reassigning..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* CLOSE TASK MODAL */}
        <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
            <DialogContent className="bg-[#0b0b0b] border-red-900/30 text-zinc-300 rounded-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-red-500">Close Task</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-zinc-600">Mark this task as completed with a reason</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-6">
                   <div className="space-y-2">
                      <Label className="text-xs font-medium text-zinc-500 italic">Reason for closing</Label>
                      <Textarea 
                         placeholder="Why is this task being closed?"
                         value={closeReason}
                         onChange={(e) => setCloseReason(e.target.value)}
                         className="bg-[#0a0a0a] border border-red-900/30 text-xs font-medium min-h-[120px] focus-visible:border-red-500 rounded-none p-4 placeholder:opacity-20"
                      />
                   </div>
                </div>

                <DialogFooter className="pt-6">
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsCloseModalOpen(false)}
                      className="text-zinc-600 font-bold text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => closeTaskMutation.mutate({ taskId: selectedTask!, reason: closeReason })}
                      disabled={!closeReason || closeTaskMutation.isPending}
                      className="bg-red-500 text-black rounded-none font-semibold text-xs px-8 italic"
                    >
                      {closeTaskMutation.isPending ? "Closing..." : "Close Task"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default EscalationsDashboard;
