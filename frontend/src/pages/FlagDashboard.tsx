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
  Split
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import type { TaskFlag, TeamMemberAvailability } from '../types/tasks';

// --- Reassignment Modal Component ---
const ReassignmentModal = ({ flag, isOpen, onClose }: { flag: TaskFlag, isOpen: boolean, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);

  const { data: teamAvailability } = useQuery<TeamMemberAvailability[]>({
    queryKey: ['teamAvailability'],
    queryFn: async () => {
       try {
         const res = await api.get('/availability/team');
         return Array.isArray(res.data) ? res.data : (res.data?.availability || []);
       } catch (e) {
         return [];
       }
    },
    enabled: isOpen
  });

  const reassignMutation = useMutation({
    mutationFn: (devId: string) => api.patch(`/flags/${flag.id}/resolve`, { 
      resolution: 'reassign', 
      new_assignee_id: devId 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      onClose();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0d0d0d] border-[#2e2e2e] text-zinc-300 flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-[#2e2e2e]">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 italic text-[#F97316]">
            <Users size={24} /> Reassign Task
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 mt-1 leading-relaxed">
             Reassigning: <span className="text-zinc-300">{flag.task.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-600">Handoff Notes</label>
              <div className="p-4 bg-[#111] border border-dashed border-[#2e2e2e] text-xs text-zinc-400 italic font-sans whitespace-pre-wrap">
                 {flag.handoff_notes || "No handoff notes provided."}
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-medium text-zinc-600">Select Team Member</label>
                 <span className="text-xs text-zinc-700 font-bold italic"></span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.isArray(teamAvailability) && teamAvailability.map(member => {
                    const isOld = new Date().getTime() - new Date(member.updated_at).getTime() > 3 * 24 * 60 * 60 * 1000;
                    return (
                      <button 
                        key={member.user.id}
                        onClick={() => setSelectedDevId(member.user.id)}
                        className={cn(
                          "flex items-center justify-between p-3 border transition-all relative group",
                          selectedDevId === member.user.id ? "bg-[#F97316]/5 border-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.15)]" : "bg-[#111] border-[#2e2e2e] hover:border-zinc-500"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-[#2e2e2e] bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                               {member.user.avatar_url ? <img src={member.user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                            </div>
                            <div className="text-left">
                               <p className="text-xs font-medium text-white">{member.user.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <Badge className={cn(
                                    "text-xs font-medium px-1.5 h-4",
                                    member.band === 'HIGH' ? "bg-green-600 text-white" :
                                    member.band === 'MEDIUM' ? "bg-yellow-600 text-black" :
                                    member.band === 'LOW' ? "bg-orange-600 text-white" : "bg-zinc-700 text-white"
                                  )}>
                                     {member.band} BAND
                                  </Badge>
                                  {isOld && (
                                    <div className="flex items-center gap-1 text-xs text-red-500 font-bold italic">
                                       <Clock size={8} /> stale
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className={cn(
                           "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                           selectedDevId === member.user.id ? "border-[#F97316] bg-[#F97316]/20" : "border-[#2e2e2e]"
                         )}>
                            {selectedDevId === member.user.id && <div className="w-2 h-2 bg-[#F97316] rounded-full" />}
                         </div>
                      </button>
                    )
                  })}
              </div>
           </div>
        </div>

        <DialogFooter className="p-6 bg-[#111] border-t border-[#2e2e2e]">
           <Button variant="outline" onClick={onClose} className="rounded-none border-[#2e2e2e] font-semibold text-xs">Cancel</Button>
           <Button 
             onClick={() => selectedDevId && reassignMutation.mutate(selectedDevId)}
             disabled={!selectedDevId || reassignMutation.isPending}
             className="rounded-none bg-[#F97316] hover:bg-[#F97316]/90 text-black font-semibold text-xs italic px-8"
           >
              {reassignMutation.isPending ? 'Assigning...' : 'Confirm Reassignment'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Main Page Component ---
const FlagDashboard: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>('pending_review');
    
    // Modals state
    const [selectedFlag, setSelectedFlag] = useState<TaskFlag | null>(null);
    const [isReassignOpen, setIsReassignOpen] = useState(false);
    const [isExtendOpen, setIsExtendOpen] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');

    // --- Query ---
    const { data: flags, isLoading } = useQuery<TaskFlag[]>({
        queryKey: ['flags', activeTab],
        queryFn: async () => {
           try {
             const res = await api.get('/flags', { params: { status: activeTab !== 'all' ? activeTab : undefined } });
             return Array.isArray(res.data) ? res.data : (res.data?.flags || []);
           } catch(e) {
             return [];
           }
        }
    });

    // --- Resolve Mutation ---
    const resolveMutation = useMutation({
        mutationFn: (data: { flagId: string, resolution: string, new_deadline?: string }) => 
            api.patch(`/flags/${data.flagId}/resolve`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flags'] });
            setIsExtendOpen(false);
            setNewDeadline('');
            setSelectedFlag(null);
        }
    });

    return (
        <div className="flex bg-[#111111] min-h-screen text-zinc-300">
            <Sidebar />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-10 flex flex-col min-h-screen md:h-screen overflow-auto md:overflow-hidden">
                
                <header className="flex items-center justify-between mb-10 shrink-0">
                    <div className="flex items-center gap-4 md:gap-6 pt-10 md:pt-0">
                        <div className="w-12 h-12 bg-red-600 flex items-center justify-center italic font-semibold text-black text-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                           !
                        </div>
                        <div>
                           <h1 className="text-xl md:text-3xl font-semibold text-white">Flags</h1>
                           <p className="text-xs text-zinc-600 font-bold mt-1 italic">Tasks flagged by team members</p>
                        </div>
                    </div>
                </header>

                <div className="flex items-center justify-between mb-8 shrink-0">
                   <div className="bg-[#1a1a1a] p-1 border border-[#2e2e2e] flex flex-wrap gap-1">
                      {['all', 'pending_review', 'resolved', 'expired'].map(status => (
                         <button 
                            key={status} 
                            onClick={() => setActiveTab(status)}
                            className={cn(
                                "py-2 px-3 md:px-6 text-xs font-medium transition-all rounded-none",
                                activeTab === status ? "bg-[#F97316] text-black" : "text-zinc-500 hover:text-white"
                            )}
                         >
                            {status.replace('_', ' ')}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
                   {isLoading ? (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1,2,3,4].map(i => <div key={i} className="h-64 bg-[#1a1a1a] border border-[#2e2e2e] animate-pulse" />)}
                     </div>
                   ) : !Array.isArray(flags) || flags.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-[#2e2e2e] opacity-20 italic grayscale">
                        <AlertTriangle size={64} className="mb-4" />
                        <p className="text-xl font-semibold">No flags right now</p>
                        <p className="text-xs font-bold mt-2">All clear — no tasks have been flagged yet.</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                        {flags.map(flag => (
                           <Card 
                             key={flag.id} 
                             className={cn(
                               "bg-[#1a1a1a] border-l-4 rounded-none relative transition-all group overflow-hidden",
                               flag.is_late_flag ? "border-l-red-500 border-r border-t border-b border-red-500/20" : 
                               flag.flag_number === 2 ? "border-l-orange-500 border-r border-y border-orange-500/20" : "border-l-yellow-500 border-r border-y border-yellow-500/20"
                             )}
                           >
                              <CardContent className="p-0">
                                 <div className="p-5 border-b border-[#2e2e2e] flex justify-between items-start">
                                    <div className="space-y-2">
                                       <button onClick={() => navigate(`/tasks/${flag.task.id}`)} className="group/link flex items-center gap-2">
                                          <h3 className="text-sm font-semibold group-hover/link:text-[#F97316] transition-colors">{flag.task.name}</h3>
                                          <ArrowRight size={12} className="text-zinc-700 group-hover/link:text-[#F97316]" />
                                       </button>
                                       <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2 px-2 py-1 bg-[#111] border border-[#2e2e2e]">
                                             <div className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center overflow-hidden">
                                                {flag.flagged_by.avatar_url ? <img src={flag.flagged_by.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={12} />}
                                             </div>
                                             <span className="text-xs font-medium text-zinc-400">{flag.flagged_by.name}</span>
                                          </div>
                                          <span className="text-xs font-bold text-zinc-600">{formatDistanceToNow(new Date(flag.created_at))} ago</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                       {flag.is_late_flag && <Badge className="bg-red-600/20 text-red-500 border-red-500/30 text-xs font-medium rounded-none px-2 py-0.5">LATE FLAG</Badge>}
                                       {flag.flag_number === 2 && <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs font-medium rounded-none px-2 py-0.5">⚠️ DOUBLE FLAG</Badge>}
                                       <Badge className="bg-[#111] border-[#2e2e2e] text-zinc-500 text-xs font-medium rounded-none">#{flag.id.slice(0, 8)}</Badge>
                                    </div>
                                 </div>
                                 <div className="p-5 flex gap-10">
                                    <div className="space-y-4 flex-1">
                                       <div className="space-y-1">
                                          <p className="text-xs font-medium text-[#F97316]/60">Reason / Detail</p>
                                          <div className="flex items-center gap-2 mb-2">
                                             <Badge className="bg-zinc-800 text-zinc-400 rounded-none text-xs font-medium">{flag.reason_category}</Badge>
                                          </div>
                                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 italic">{flag.reason_text}</p>
                                       </div>
                                    </div>
                                    <div className="w-32 space-y-4">
                                       <div className="space-y-1">
                                          <p className="text-xs font-medium text-zinc-600">Current Proc.</p>
                                          <Badge className="bg-[#111] border-[#2e2e2e] text-white w-full flex justify-center text-xs font-medium rounded-none">
                                             {flag.progress_status.replace('pct_', '')}% DONE
                                          </Badge>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-xs font-medium text-zinc-600">Est. Rem.</p>
                                          <p className="text-xs font-medium text-white italic">{flag.estimated_hours_remaining || '?' }h</p>
                                       </div>
                                    </div>
                                 </div>
                                 {flag.status === 'pending_review' && (
                                    <div className="p-1 px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                       <Button 
                                         onClick={() => { setSelectedFlag(flag); setIsExtendOpen(true); }}
                                         className="h-9 rounded-none bg-[#1a1a1a] border border-[#2e2e2e] hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white flex gap-2"
                                       >
                                          <Calendar size={12} className="text-[#F97316]" /> Extend
                                       </Button>
                                       <Button 
                                         onClick={() => { setSelectedFlag(flag); setIsReassignOpen(true); }}
                                         className="h-9 rounded-none bg-[#1a1a1a] border border-[#2e2e2e] hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white flex gap-2"
                                       >
                                          <Users size={12} className="text-[#F97316]" /> Reassign
                                       </Button>
                                       <Button 
                                         onClick={() => resolveMutation.mutate({ flagId: flag.id, resolution: 'rescope' })}
                                         className="h-9 rounded-none bg-[#1a1a1a] border border-[#2e2e2e] hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white flex gap-2"
                                       >
                                          <Split size={12} className="text-[#F97316]" /> Rescope
                                       </Button>
                                    </div>
                                 )}
                              </CardContent>
                           </Card>
                        ))}
                     </div>
                   )}
                </div>
            </main>

            {selectedFlag && (
               <ReassignmentModal 
                 flag={selectedFlag} 
                 isOpen={isReassignOpen} 
                 onClose={() => setIsReassignOpen(false)} 
               />
            )}

            <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
               <DialogContent className="max-w-sm bg-[#161616] border-[#2e2e2e] text-zinc-300">
                  <DialogHeader>
                     <DialogTitle className="font-semibold text-[#F97316]">Extend Deadline</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label>New Deadline</Label>
                        <Input 
                          type="datetime-local"
                          value={newDeadline}
                          onChange={(e: any) => setNewDeadline(e.target.value)}
                          className="bg-[#111] border-[#2e2e2e] rounded-none focus-visible:border-[#F97316]"
                        />
                     </div>
                  </div>
                  <DialogFooter>
                     <Button 
                       onClick={() => selectedFlag && resolveMutation.mutate({ flagId: selectedFlag.id, resolution: 'extend', new_deadline: new Date(newDeadline).toISOString() })}
                       disabled={!newDeadline || resolveMutation.isPending}
                       className="w-full bg-[#F97316] text-black font-semibold"
                     >
                        Confirm Extension
                     </Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
        </div>
    );
};

export default FlagDashboard;
