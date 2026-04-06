import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  User as UserIcon, 
  Trash2, 
  Plus, 
  AlertTriangle,
  Lock,
  ChevronRight,
  Save,
  Loader2,
  Info
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { Separator } from '../components/ui/Separator';
import { cn } from '../lib/utils';
import type { UserAvailability, DaySlot, TeamMemberAvailability, BlockedSlot, TeamBand } from '../types/tasks';

// --- MOCK CONSTANTS ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const REASON_CATEGORIES = [
  { id: 'college', label: 'College Lecture' },
  { id: 'exam', label: 'Exam Prep' },
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'External Work' },
  { id: 'other', label: 'Other' }
];

const getBandColor = (band: TeamBand) => {
  switch (band) {
    case 'HIGH': return 'bg-green-600 text-white';
    case 'MEDIUM': return 'bg-yellow-600 text-black';
    case 'LOW': return 'bg-orange-600 text-white';
    case 'BLOCKED': return 'bg-red-600 text-white';
    default: return 'bg-zinc-700 text-white';
  }
};

const getBandBg = (band: TeamBand) => {
  switch (band) {
    case 'HIGH': return 'bg-green-950/20 border-green-500/30';
    case 'MEDIUM': return 'bg-yellow-950/20 border-yellow-500/30';
    case 'LOW': return 'bg-orange-950/20 border-orange-500/30';
    case 'BLOCKED': return 'bg-red-950/20 border-red-500/30';
    default: return 'bg-zinc-900 border-zinc-800';
  }
};

// --- Helper Functions ---
const calculateAvailability = (baseUnavailable: number, blockedSlots: BlockedSlot[]) => {
  let totalBlockedMinutes = 0;
  (blockedSlots || []).forEach(slot => {
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    if (end > start) totalBlockedMinutes += (end - start);
  });
  
  const blockedHours = totalBlockedMinutes / 60;
  const availableHours = 24 - baseUnavailable - blockedHours;
  
  let band: TeamBand = 'BLOCKED';
  if (availableHours >= 8) band = 'HIGH';
  else if (availableHours >= 5) band = 'MEDIUM';
  else if (availableHours > 0) band = 'LOW';
  
  return { availableHours: Math.max(0, availableHours), band };
};

// --- Component: Availability Editor ---
const AvailabilityEditor = ({ initialData, onSave, isPending }: { initialData?: UserAvailability, onSave: (data: Partial<UserAvailability>) => void, isPending: boolean }) => {
  const [baseHours, setBaseHours] = useState(initialData?.base_unavailable_hours || 11);
  const [weeklySlots, setWeeklySlots] = useState<DaySlot[]>(initialData?.weekly_slots || DAYS.map(day => ({ 
    day, 
    blocked_slots: [], 
    available_hours: 13, 
    band: 'HIGH' 
  })));

  // Add Slot local state
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<Partial<BlockedSlot>>({ start_time: '09:00', end_time: '12:00', reason_category: 'college', reason_text: '' });

  // Sync with initial data
  useEffect(() => {
    if (initialData) {
      setBaseHours(initialData.base_unavailable_hours ?? 11);
      setWeeklySlots(initialData.weekly_slots || []);
    }
  }, [initialData]);

  const handleRemoveSlot = (day: string, index: number) => {
    const next = [...weeklySlots];
    const daySlot = next.find(s => s.day === day);
    if (daySlot) {
      daySlot.blocked_slots.splice(index, 1);
      const { availableHours, band } = calculateAvailability(baseHours, daySlot.blocked_slots);
      daySlot.available_hours = availableHours;
      daySlot.band = band;
      setWeeklySlots(next);
    }
  };

  const handleAddSlot = (day: string) => {
    if (!newSlot.start_time || !newSlot.end_time) return;
    
    const next = [...weeklySlots];
    const daySlot = next.find(s => s.day === day);
    if (daySlot) {
      daySlot.blocked_slots.push({
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        reason_category: newSlot.reason_category as any,
        reason_text: newSlot.reason_text || ''
      });
      const { availableHours, band } = calculateAvailability(baseHours, daySlot.blocked_slots);
      daySlot.available_hours = availableHours;
      daySlot.band = band;
      setWeeklySlots(next);
      setAddingToDay(null);
      setNewSlot({ start_time: '09:00', end_time: '12:00', reason_category: 'college', reason_text: '' });
    }
  };

  const updateAllBands = (newValue: number) => {
    const next = weeklySlots.map(slot => {
       const { availableHours, band } = calculateAvailability(newValue, slot.blocked_slots);
       return { ...slot, available_hours: availableHours, band };
    });
    setWeeklySlots(next);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Global Baseline Card */}
       <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#F97316]" />
          <CardHeader className="pb-2 border-b border-[#2e2e2e]/50">
             <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                <span>Daily Non-Work Hours</span>
                <Info size={14} className="text-zinc-700" />
             </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                <div className="space-y-2 max-w-sm">
                   <Label className="text-lg font-semibold text-white flex items-center gap-2">
                       <Clock className="text-[#F97316]" size={20} /> Hours unavailable each day
                   </Label>
                   <p className="text-xs text-zinc-500 font-bold leading-relaxed">
                      How many hours per day are you unavailable? (e.g. sleep, commute, chores). Default is 11 hours.
                   </p>
                </div>
                <div className="flex items-center gap-4">
                   <Input 
                     type="number" 
                     min={0} max={20}
                     value={baseHours} 
                     onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBaseHours(val);
                        updateAllBands(val);
                     }}
                     className="w-24 h-14 bg-[#111] border-[#2e2e2e] rounded-none text-2xl font-semibold text-center text-[#F97316] outline-none focus-visible:border-[#F97316]"
                   />
                   <span className="text-xl font-semibold text-zinc-700">HOURS / DAY</span>
                </div>
             </div>
          </CardContent>
       </Card>

       {/* Weekly Grid */}
       <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {Array.isArray(weeklySlots) && weeklySlots.map(slot => (
             <Card key={slot.day} className={cn("bg-[#1a1a1a] border rounded-none transition-all", getBandBg(slot.band))}>
                <div className="p-3 border-b border-inherit flex flex-col items-center gap-1">
                   <span className="text-xs font-medium text-zinc-400">{slot.day}</span>
                   <Badge className={cn("text-xs font-medium h-5", getBandColor(slot.band))}>{slot.band}</Badge>
                </div>
                <div className="p-3 space-y-4">
                   {/* Slots List */}
                   <div className="space-y-2 min-h-[100px]">
                      {!Array.isArray(slot.blocked_slots) || slot.blocked_slots.length === 0 ? (
                         <p className="text-xs text-zinc-700 font-bold italic text-center py-4">No blockages reported</p>
                      ) : (
                         slot.blocked_slots.map((block, idx) => (
                            <div key={idx} className="group relative bg-[#0d0d0d]/80 border border-[#2e2e2e] p-2 flex flex-col gap-1 transition-all hover:border-[#F97316]/40">
                               <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-[#F97316] italic">{block.start_time} - {block.end_time}</span>
                                  <button onClick={() => handleRemoveSlot(slot.day, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-500">
                                     <Trash2 size={10} />
                                  </button>
                               </div>
                               <span className="text-xs font-medium truncate text-zinc-400">{block.reason_category}</span>
                            </div>
                         ))
                      )}
                   </div>

                   {/* Add Button */}
                   {addingToDay === slot.day ? (
                      <div className="bg-[#111] p-2 border border-[#F97316]/50 space-y-2 animate-in zoom-in-95 duration-200">
                         <div className="grid grid-cols-2 gap-1">
                            <Input 
                              type="time" 
                              value={newSlot.start_time} 
                              onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                              className="h-6 text-xs p-1 bg-[#0d0d0d] border-[#2e2e2e] rounded-none"
                            />
                            <Input 
                              type="time" 
                              value={newSlot.end_time} 
                              onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                              className="h-6 text-xs p-1 bg-[#0d0d0d] border-[#2e2e2e] rounded-none"
                            />
                         </div>
                         <select 
                           value={newSlot.reason_category}
                           onChange={(e) => setNewSlot({...newSlot, reason_category: e.target.value as any})}
                           className="w-full h-6 text-xs bg-[#0d0d0d] border-[#2e2e2e] text-zinc-400 outline-none p-0.5"
                         >
                            {REASON_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                         </select>
                         <Input 
                           placeholder="DETAILS..."
                           value={newSlot.reason_text}
                           onChange={(e) => setNewSlot({...newSlot, reason_text: e.target.value})}
                           className="h-6 text-xs p-1 bg-[#0d0d0d] border-[#2e2e2e] rounded-none"
                         />
                         <div className="flex gap-1 pt-1">
                            <Button size="sm" onClick={() => handleAddSlot(slot.day)} className="flex-1 h-5 text-xs font-medium bg-[#F97316] text-black">ADD</Button>
                            <Button size="sm" variant="outline" onClick={() => setAddingToDay(null)} className="h-5 text-xs font-medium border-[#2e2e2e]">X</Button>
                         </div>
                      </div>
                   ) : (
                      <button 
                        onClick={() => setAddingToDay(slot.day)}
                        className="w-full py-2 border border-dashed border-[#2e2e2e] hover:border-zinc-500 text-zinc-600 hover:text-zinc-400 transition-all flex items-center justify-center gap-1"
                      >
                         <Plus size={12} /> <span className="text-xs font-medium">Add Block</span>
                      </button>
                   )}

                   <div className="pt-2 border-t border-inherit flex justify-between items-center">
                      <span className="text-xs font-medium text-zinc-500">AVAILABLE</span>
                      <span className="text-xs font-medium text-zinc-300">{slot.available_hours.toFixed(1)}H</span>
                   </div>
                </div>
             </Card>
          ))}
       </div>

       {/* Footer Action */}
       <div className="flex justify-end pt-4">
           <Button 
             onClick={() => onSave({ base_unavailable_hours: baseHours, weekly_slots: weeklySlots })}
             disabled={isPending}
             className="h-12 px-12 bg-[#F97316] hover:bg-[#F97316]/90 text-black font-semibold rounded-none shadow-[0_0_20px_rgba(249,115,22,0.2)] flex gap-3"
           >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Availability
           </Button>
       </div>
    </div>
  );
};

// --- Component: Availability Page ---
const AvailabilityPage: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'me' | 'team'>('me');
    const isManager = user?.role === 'admin' || user?.role === 'task_manager';

    // Person Detail State
    const [viewingDevId, setViewingDevId] = useState<string | null>(null);

    // --- Queries ---
    const { data: myData, isLoading: isLoadingMy } = useQuery<UserAvailability>({
        queryKey: ['myAvailability'],
        queryFn: async () => {
          const res = await api.get(`/availability/${user?.id}`);
          return res.data;
        }
    });

    const { data: teamData, isLoading: isLoadingTeam } = useQuery<TeamMemberAvailability[]>({
        queryKey: ['teamAvailability'],
        queryFn: async () => {
          const res = await api.get('/availability/team');
          return Array.isArray(res.data) ? res.data : (res.data?.availability || []);
        },
        enabled: isManager && activeTab === 'team'
    });

    const { data: devDetail, isLoading: isLoadingDetail } = useQuery<UserAvailability>({
       queryKey: ['availabilityDetail', viewingDevId],
       queryFn: async () => {
         const res = await api.get(`/availability/${viewingDevId}`);
         return res.data;
       },
       enabled: !!viewingDevId
    });

    // --- Mutations ---
    const saveMutation = useMutation({
        mutationFn: (data: Partial<UserAvailability>) => api.put('/availability', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
            alert('Availability saved.');
        }
    });

    return (
        <div className="flex bg-[#111111] min-h-screen text-zinc-300">
            <Sidebar />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-10 flex flex-col min-h-screen md:h-screen overflow-auto md:overflow-hidden">
                <header className="flex items-center justify-between mb-10 shrink-0">
                    <div className="flex items-center gap-4 md:gap-6 pt-10 md:pt-0">
                        <div className="w-12 h-12 bg-[#F97316] flex items-center justify-center italic font-semibold text-black text-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                           ⏳
                        </div>
                        <div>
                           <h1 className="text-xl md:text-3xl font-semibold text-white">Availability</h1>
                           <p className="text-xs text-zinc-600 font-bold mt-1 italic">Set your weekly schedule so your manager knows when you're free</p>
                        </div>
                    </div>
                </header>

                <div className="mb-8 shrink-0 flex items-center justify-between">
                   <div className="bg-[#1a1a1a] p-1 border border-[#2e2e2e] flex gap-1">
                      <button 
                        onClick={() => setActiveTab('me')}
                        className={cn(
                          "py-2 px-8 text-xs font-medium transition-all rounded-none",
                          activeTab === 'me' ? "bg-[#F97316] text-black" : "text-zinc-500 hover:text-white"
                        )}
                      >
                        My Availability
                      </button>
                      {isManager && (
                        <button 
                          onClick={() => setActiveTab('team')}
                          className={cn(
                            "py-2 px-8 text-xs font-medium transition-all rounded-none",
                            activeTab === 'team' ? "bg-[#F97316] text-black" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          Team Overview
                        </button>
                      )}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20">
                    {activeTab === 'me' ? (
                       isLoadingMy ? (
                         <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#F97316]" size={48} /></div>
                       ) : (
                         <AvailabilityEditor 
                            initialData={myData} 
                            onSave={(data) => saveMutation.mutate(data)} 
                            isPending={saveMutation.isPending} 
                         />
                       )
                    ) : (
                       <div className="space-y-6">
                          <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none">
                             <CardContent className="p-0 table-scroll-wrapper">
                                <table className="w-full text-left border-collapse">
                                   <thead>
                                      <tr className="border-b border-[#2e2e2e] bg-[#111]">
                                         <th className="p-4 text-xs font-medium text-zinc-500">NAME</th>
                                         {DAYS.map(day => (
                                           <th key={day} className="p-4 text-xs font-medium text-zinc-500 text-center w-28">{day.slice(0,3)}</th>
                                         ))}
                                         <th className="p-4 text-xs font-medium text-zinc-500 text-right">LAST UPDATED</th>
                                      </tr>
                                   </thead>
                                   <tbody>
                                      {isLoadingTeam ? (
                                        [1,2,3].map(i => <tr key={i} className="animate-pulse h-16 border-b border-[#2e2e2e]/50"><td colSpan={9} /></tr>)
                                      ) : teamData?.map(member => {
                                        const isStale = new Date().getTime() - new Date(member.updated_at).getTime() > 3 * 24 * 60 * 60 * 1000;
                                        return (
                                          <tr 
                                            key={member.user.id} 
                                            onClick={() => setViewingDevId(member.user.id)}
                                            className="border-b border-[#2e2e2e]/50 hover:bg-[#F97316]/5 transition-colors cursor-pointer group"
                                          >
                                             <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                   <div className="w-8 h-8 rounded-full border border-[#2e2e2e] bg-[#111] overflow-hidden">
                                                      {member.user.avatar_url ? <img src={member.user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={12} className="m-2" />}
                                                   </div>
                                                   <div>
                                                      <p className="text-xs font-medium text-white">{member.user.name}</p>
                                                      {isStale && <span className="text-xs text-red-500 font-bold italic flex items-center gap-1"><AlertTriangle size={8} /> stale records</span>}
                                                   </div>
                                                </div>
                                             </td>
                                             {/* 
                                               Note: Real impl would need day-by-day bands in team summary. 
                                               Assuming member.bands exist or use a simplified indicator.
                                               Drawing a placeholder grid for now as per requirement visual.
                                             */}
                                             {DAYS.map(day => (
                                               <td key={day} className="p-4">
                                                  <div className={cn(
                                                    "h-5 w-full border border-zinc-800 flex items-center justify-center",
                                                    getBandColor(member.band) // Simplifying: team grid shows current/avg band
                                                  )}>
                                                     <span className="text-xs font-medium">{member.band}</span>
                                                  </div>
                                               </td>
                                             ))}
                                             <td className="p-4 text-right">
                                                <span className="text-xs font-bold text-zinc-600 italic whitespace-nowrap">
                                                   {new Date(member.updated_at).toLocaleDateString()}
                                                </span>
                                                <ChevronRight size={12} className="inline ml-2 text-zinc-800 group-hover:text-[#F97316] group-hover:translate-x-1 transition-all" />
                                             </td>
                                          </tr>
                                        )
                                      })}
                                   </tbody>
                                </table>
                             </CardContent>
                          </Card>
                       </div>
                    )}
                </div>
            </main>

            {/* Operative Detail Dialog (Slide-over Simulation) */}
            <Dialog open={!!viewingDevId} onOpenChange={() => setViewingDevId(null)}>
               <DialogContent className="max-w-5xl bg-[#0d0d0d] border-[#2e2e2e] text-zinc-300 flex flex-col p-0 max-h-[90vh]">
                  <DialogHeader className="p-8 border-b border-[#2e2e2e]">
                     <DialogTitle className="text-2xl font-semibold text-[#F97316] flex items-center gap-3">
                        Availability Details
                     </DialogTitle>
                     <DialogDescription className="text-xs text-zinc-500">
                        Viewing availability for: <span className="text-white">{devDetail?.user_id}</span>
                     </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-8">
                     {isLoadingDetail ? (
                       <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>
                     ) : (
                       <div className="space-y-10">
                          <div className="flex items-center gap-8">
                             <div className="p-6 bg-zinc-900 border border-[#2e2e2e]">
                               <p className="text-xs font-medium text-zinc-500 mb-2">Daily Non-Work Hours</p>
                               <p className="text-4xl font-semibold">{devDetail?.base_unavailable_hours}h</p>
                             </div>
                             <div className="flex-1 space-y-2">
                                <p className="text-xs font-medium text-zinc-500">Last Updated</p>
                                <p className="text-xs font-bold">{devDetail?.updated_at && new Date(devDetail.updated_at).toLocaleString()}</p>
                                <Separator className="bg-[#2e2e2e]" />
                                <span></span>
                             </div>
                          </div>

                          <div className="grid grid-cols-7 gap-3">
                             {devDetail?.weekly_slots.map(slot => (
                               <div key={slot.day} className={cn("border p-3 space-y-3", getBandBg(slot.band))}>
                                  <div className="pb-2 border-b border-inherit space-y-1">
                                     <p className="text-xs font-medium text-center">{slot.day.slice(0,3)}</p>
                                     <Badge className={cn("text-xs font-medium w-full justify-center h-4", getBandColor(slot.band))}>{slot.band}</Badge>
                                  </div>
                                  <div className="space-y-1.5 min-h-[80px]">
                                     {slot.blocked_slots.map((block, i) => (
                                       <div key={i} className="text-xs bg-[#000]/30 p-1.5 border border-inherit">
                                          <p className="font-semibold text-[#F97316]">{block.start_time}-{block.end_time}</p>
                                          <p className="text-zinc-500 truncate">{block.reason_category}</p>
                                       </div>
                                     ))}
                                  </div>
                                  <div className="pt-2 border-t border-inherit text-center">
                                     <p className="text-xs font-medium">{slot.available_hours}H</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     )}
                  </div>
                  <DialogFooter className="p-6 bg-[#111] border-t border-[#2e2e2e]">
                     <Button onClick={() => setViewingDevId(null)} className="rounded-none bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-10">Close</Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
        </div>
    );
};

export default AvailabilityPage;
