import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon, 
  Loader2,
  FileText,
  LayoutGrid
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import WorklogDaily from '../components/worklogs/WorklogDaily';
import WorklogWeekly from '../components/worklogs/WorklogWeekly';
import WorklogMonthly from '../components/worklogs/WorklogMonthly';
import WorklogQuarterly from '../components/worklogs/WorklogQuarterly';
import EvidenceTimeline from '../components/worklogs/EvidenceTimeline';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import type { DailyWorklog, WeeklyWorklog, MonthlyWorklog, QuarterlyWorklog, EvidenceEvent } from '../types/worklogs';

type LogTab = 'daily' | 'weekly' | 'monthly' | 'quarterly';

const WorklogPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LogTab>('daily');
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskTimelineId, setTaskTimelineId] = useState<string | null>(null);

  const isManager = user?.role === 'task_manager' || user?.role === 'admin';

  // --- Date Range Labels ---
  const dateLabel = useMemo(() => {
     if (activeTab === 'daily') return format(currentDate, 'MMMM dd, yyyy');
     if (activeTab === 'weekly') {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
     }
     if (activeTab === 'monthly') return format(currentDate, 'MMMM yyyy');
     if (activeTab === 'quarterly') {
        const year = currentDate.getFullYear();
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        return `QUARTER_0${quarter} // YEAR_${year}`;
     }
     return '';
  }, [activeTab, currentDate]);

  // --- Handlers ---
  const handlePrev = () => {
     if (activeTab === 'daily') setCurrentDate(prev => subDays(prev, 1));
     if (activeTab === 'weekly') setCurrentDate(prev => subWeeks(prev, 1));
     if (activeTab === 'monthly') setCurrentDate(prev => subMonths(prev, 1));
     if (activeTab === 'quarterly') setCurrentDate(prev => subMonths(prev, 3));
  };

  const handleNext = () => {
     if (activeTab === 'daily') setCurrentDate(prev => addDays(prev, 1));
     if (activeTab === 'weekly') setCurrentDate(prev => addWeeks(prev, 1));
     if (activeTab === 'monthly') setCurrentDate(prev => addMonths(prev, 1));
     if (activeTab === 'quarterly') setCurrentDate(prev => addMonths(prev, 3));
  };

  // --- API Queries ---
  const { data: teamMembers = [] } = useQuery<any[]>({
     queryKey: ['users'],
     queryFn: async () => {
        const res = await api.get('/users');
        return Array.isArray(res.data) ? res.data : (res.data?.users || []);
     },
     enabled: isManager
  });

  const { data: dailyData, isLoading: isLoadingDaily } = useQuery<DailyWorklog>({
     queryKey: ['worklogs', 'daily', selectedUser, format(currentDate, 'yyyy-MM-dd')],
     queryFn: async () => {
        const res = await api.get('/worklogs/daily', { params: { user_id: selectedUser, date: format(currentDate, 'yyyy-MM-dd') } });
        return res.data;
     },
     enabled: activeTab === 'daily'
  });

  const { data: weeklyData, isLoading: isLoadingWeekly } = useQuery<WeeklyWorklog>({
     queryKey: ['worklogs', 'weekly', selectedUser, format(currentDate, 'yyyy-\'W\'ww')],
     queryFn: async () => {
        const res = await api.get('/worklogs/weekly', { params: { user_id: selectedUser, week: format(currentDate, 'yyyy-\'W\'II') } });
        return res.data;
     },
     enabled: activeTab === 'weekly'
  });

  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery<MonthlyWorklog>({
     queryKey: ['worklogs', 'monthly', selectedUser, format(currentDate, 'yyyy-MM')],
     queryFn: async () => {
        const res = await api.get('/worklogs/monthly', { params: { user_id: selectedUser, month: format(currentDate, 'yyyy-MM') } });
        return res.data;
     },
     enabled: activeTab === 'monthly'
  });

  const { data: quarterlyData, isLoading: isLoadingQuarterly } = useQuery<QuarterlyWorklog>({
     queryKey: ['worklogs', 'quarterly', format(currentDate, 'yyyy'), Math.floor(currentDate.getMonth() / 3) + 1],
     queryFn: async () => {
        const res = await api.get('/worklogs/quarterly', { params: { quarter: Math.floor(currentDate.getMonth() / 3) + 1, year: currentDate.getFullYear() } });
        return res.data;
     },
     enabled: activeTab === 'quarterly'
  });

  const { data: taskEvidence } = useQuery<EvidenceEvent[]>({
     queryKey: ['tasks', taskTimelineId, 'evidence'],
     queryFn: async () => {
        const res = await api.get(`/tasks/${taskTimelineId}/evidence`);
        return Array.isArray(res.data) ? res.data : (res.data?.events || []);
     },
     enabled: !!taskTimelineId
  });

  const exportMutation = useMutation({
     mutationFn: (type: 'monthly' | 'quarterly') => api.get('/worklogs/export', { params: { type, period: format(currentDate, 'yyyy-MM') } }),
     onSuccess: (res) => window.open(res.data.url, '_blank')
  });

  return (
    <div className="flex bg-[#0a0a0a] min-h-screen font-mono text-zinc-300">
        <Sidebar />

        <main className="flex-1 ml-64 p-8 space-y-10 pb-32 relative">
            
            {/* Header / Nav */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#2e2e2e] relative overflow-hidden">
                <div className="flex flex-col gap-3 z-10 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-[#F97316]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Central_Worklog_Audit_Hub</span>
                  </div>
                  <h1 className="text-4xl font-black uppercase text-white tracking-widest italic flex items-center gap-4">
                     Temporal_Registry <LayoutGrid className="text-zinc-800" size={32} />
                  </h1>
                </div>

                <div className="flex flex-col gap-4 z-10">
                   {/* Person Selector */}
                   {isManager && (
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-zinc-600" />
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                           <SelectTrigger className="w-[200px] h-10 bg-[#111] border-[#2e2e2e] rounded-none text-[10px] font-black uppercase italic text-[#F97316]">
                              <SelectValue placeholder="Target Operative_" />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none text-zinc-300 font-mono">
                              {teamMembers.map(member => (
                                 <SelectItem key={member.id} value={member.id} className="text-[10px] font-black uppercase italic focus:bg-[#F97316] focus:text-black hover:bg-[#F97316] hover:text-black">
                                    {member.name} {member.id === user?.id ? '(SELF)' : ''}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                      </div>
                   )}
                </div>
            </header>

            {/* Tab Controls / Navigation Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
               <Tabs 
                 value={activeTab} 
                 onValueChange={(v) => setActiveTab(v as LogTab)}
                 className="w-full md:w-auto"
               >
                  <TabsList className="bg-[#111] border border-zinc-900 rounded-none h-12 p-1 gap-1 flex">
                     <TabsTrigger value="daily" className="text-[9px] font-black uppercase italic tracking-widest data-[state=active]:bg-[#F97316] data-[state=active]:text-black rounded-none">Daily_Protocol</TabsTrigger>
                     <TabsTrigger value="weekly" className="text-[9px] font-black uppercase italic tracking-widest data-[state=active]:bg-[#F97316] data-[state=active]:text-black rounded-none">Weekly_Cycle</TabsTrigger>
                     <TabsTrigger value="monthly" className="text-[9px] font-black uppercase italic tracking-widest data-[state=active]:bg-[#F97316] data-[state=active]:text-black rounded-none">Monthly_Audit</TabsTrigger>
                     {isManager && <TabsTrigger value="quarterly" className="text-[9px] font-black uppercase italic tracking-widest data-[state=active]:bg-[#F97316] data-[state=active]:text-black rounded-none">Quarterly_Vel</TabsTrigger>}
                  </TabsList>
               </Tabs>

               {/* Period Navigation */}
               <div className="flex items-center gap-4 bg-[#111] border border-zinc-900 p-1">
                  <Button onClick={handlePrev} size="sm" variant="ghost" className="h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-none"><ChevronLeft size={20} /></Button>
                  <div className="flex flex-col items-center min-w-[220px]">
                     <span className="text-[8px] font-black text-zinc-700 uppercase tracking-tighter italic">Currently Viewing_Period</span>
                     <span className="text-xs font-black uppercase text-white italic tracking-[0.1em]">{dateLabel}</span>
                  </div>
                  <Button onClick={handleNext} size="sm" variant="ghost" className="h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-none"><ChevronRight size={20} /></Button>
               </div>
            </div>

            {/* Content Feed */}
            <div className="min-h-[500px]">
               {activeTab === 'daily' && (
                  isLoadingDaily ? <div className="flex items-center justify-center p-32"><Loader2 className="animate-spin text-[#F97316]" size={48} /></div> :
                  dailyData && <WorklogDaily data={dailyData} onTaskClick={setTaskTimelineId} />
               )}

               {activeTab === 'weekly' && (
                  isLoadingWeekly ? <div className="flex items-center justify-center p-32"><Loader2 className="animate-spin text-[#F97316]" size={48} /></div> :
                  weeklyData && <WorklogWeekly data={weeklyData} onTaskClick={setTaskTimelineId} />
               )}

               {activeTab === 'monthly' && (
                  isLoadingMonthly ? <div className="flex items-center justify-center p-32"><Loader2 className="animate-spin text-[#F97316]" size={48} /></div> :
                  monthlyData && <WorklogMonthly data={monthlyData} onExport={() => exportMutation.mutate('monthly')} />
               )}

               {activeTab === 'quarterly' && isManager && (
                  isLoadingQuarterly ? <div className="flex items-center justify-center p-32"><Loader2 className="animate-spin text-[#F97316]" size={48} /></div> :
                  quarterlyData && <WorklogQuarterly data={quarterlyData} />
               )}

               {/* Error State if null */}
               {activeTab === 'daily' && !dailyData && !isLoadingDaily && (
                  <div className="flex flex-col items-center justify-center p-32 opacity-20 grayscale grayscale-0 space-y-6">
                     <FileText size={64} className="text-zinc-800" />
                     <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Temporal_Data_Missing</h2>
                  </div>
               )}
            </div>

            {/* Evidence Timeline Overlay */}
            {taskTimelineId && (
               <EvidenceTimeline 
                  taskName={
                     dailyData?.sections.in_progress.find(t => t.id === taskTimelineId)?.name || 
                     weeklyData?.days.flatMap(d => d.tasks).find(t => t.id === taskTimelineId)?.name || 
                     'Target_Transmission'
                  }
                  events={taskEvidence || []}
                  onClose={() => setTaskTimelineId(null)}
               />
            )}
        </main>
    </div>
  );
};

export default WorklogPage;
