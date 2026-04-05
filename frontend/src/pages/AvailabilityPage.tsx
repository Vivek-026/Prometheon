import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
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

const AvailabilityPage: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'admin';

    // --- Queries ---
    const { data: myAvailability, isLoading: isLoadingMy } = useQuery<UserAvailability>({
        queryKey: ['availability', 'me'],
        queryFn: async () => {
            try {
                const res = await api.get('/availability/me');
                return res.data;
            } catch (e) {
                return {
                    id: 'me',
                    user_id: user?.id || 'me',
                    base_unavailable_hours: 11,
                    weekly_slots: DAYS.map(day => ({ day, blocked_slots: [], available_hours: 13, band: 'HIGH' }))
                };
            }
        }
    });

    const { data: teamAvailability, isLoading: isLoadingTeam } = useQuery<TeamMemberAvailability[]>({
        queryKey: ['availability', 'team'],
        queryFn: async () => {
            try {
                const res = await api.get('/availability/team');
                return res.data;
            } catch (e) {
                return [];
            }
        },
        enabled: isAdmin
    });

    return (
        <div className="flex bg-[#111111] min-h-screen">
          <Sidebar />

          <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
            <PageHeader title="Your Availability" subtitle="Manage your working hours and capacity" />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20 md:pb-0">
                
                {/* Left Sector: My Availability Grid */}
                <div className="xl:col-span-8 space-y-8">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {DAYS.map(day => {
                            const slot = myAvailability?.weekly_slots.find(s => s.day === day);
                            return (
                                <Card key={day} className="bg-[#1a1a1a] border border-zinc-900 rounded-none group hover:border-[#F97316]/30 transition-all">
                                   <CardHeader className="p-5 border-b border-zinc-900 flex flex-row items-center justify-between">
                                      <CardTitle className="text-[11px] font-black uppercase italic tracking-widest text-white">{day}</CardTitle>
                                      {slot && <Badge className={cn("text-[8px] h-5 rounded-none font-black italic", getBandColor(slot.band))}>{slot.band}</Badge>}
                                   </CardHeader>
                                   <CardContent className="p-5 space-y-4">
                                      <div className="flex items-center justify-between">
                                         <div className="flex flex-col">
                                            <span className="text-[10px] font-black italic text-zinc-600 uppercase tracking-widest">Available</span>
                                            <span className="text-xl font-black text-white italic">{slot?.available_hours}h</span>
                                         </div>
                                         <Clock className="text-zinc-800 group-hover:text-[#F97316] transition-colors" size={24} />
                                      </div>

                                      <div className="space-y-2">
                                         <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Time Blocks</span>
                                         {(slot?.blocked_slots || []).length === 0 ? (
                                            <p className="text-[9px] text-zinc-800 uppercase italic">Free all day</p>
                                         ) : (
                                            (slot?.blocked_slots || []).map((b, i) => (
                                               <div key={i} className="p-2 bg-[#0d0d0d] border border-zinc-800 flex items-center justify-between group/slot">
                                                  <div className="flex flex-col">
                                                     <span className="text-[9px] font-black text-[#F97316] leading-none mb-1">{b.start_time} - {b.end_time}</span>
                                                     <span className="text-[8px] font-bold text-zinc-600 uppercase italic truncate max-w-[80px]">{b.reason_category}</span>
                                                  </div>
                                               </div>
                                            ))
                                         )}
                                      </div>
                                   </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Right Sector: Team Capacity (Admin Only) */}
                <div className="xl:col-span-4 space-y-8">
                    {isAdmin && (
                        <Card className="bg-[#1a1a1a] border border-zinc-900 rounded-none shadow-2xl">
                           <CardHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between bg-[#0d0d0d]">
                              <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#F97316]">Team Capacity</CardTitle>
                              <UserIcon size={14} className="text-zinc-600" />
                           </CardHeader>
                           <CardContent className="p-6 space-y-6">
                              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                 {(teamAvailability || []).map(member => (
                                    <div key={member.user_id} className="p-4 bg-[#0d0d0d] border border-zinc-800 hover:border-[#F97316]/30 transition-all group">
                                       <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full border border-zinc-800 p-0.5 group-hover:border-[#F97316] overflow-hidden bg-zinc-900">
                                                <img src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} className="w-full h-full rounded-full" />
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{member.name}</span>
                                                <span className="text-[8px] text-zinc-600 font-bold uppercase italic leading-none">{member.role}</span>
                                             </div>
                                          </div>
                                          <Badge className={cn("text-[7px] h-4 rounded-none font-black", getBandColor(member.daily_band))}>{member.daily_band}</Badge>
                                       </div>
                                       
                                       <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">
                                          <span>Capacity Today</span>
                                          <span className="text-white">{member.today_available_hours}h</span>
                                       </div>
                                       <div className="mt-2 w-full bg-zinc-900 h-1 rounded-none overflow-hidden border border-zinc-800">
                                          <div 
                                            className={cn("h-full transition-all duration-1000", getBandColor(member.daily_band).split(' ')[0])} 
                                            style={{ width: `${(member.today_available_hours / 15) * 100}%` }}
                                          />
                                       </div>
                                    </div>
                                 ))}
                                 {(teamAvailability || []).length === 0 && (
                                    <p className="p-12 text-center opacity-10 font-black uppercase italic text-xs">No team data available</p>
                                 )}
                              </div>
                           </CardContent>
                        </Card>
                    )}

                    <Card className="bg-[#0d0d0d] border border-zinc-800 p-6 rounded-none space-y-4">
                       <h3 className="text-xs font-black uppercase italic tracking-widest text-white border-l-2 border-[#F97316] pl-3">Availability Guide</h3>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-loose">
                          Keep your capacity updated so managers know when you can pick up tasks. High availability (8h+) is shown in green.
                       </p>
                       <Button className="w-full bg-transparent border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-sm">
                          Edit My Hours
                       </Button>
                    </Card>
                </div>
            </div>
          </main>
        </div>
    );
};

export default AvailabilityPage;
