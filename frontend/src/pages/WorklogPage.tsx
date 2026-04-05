import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon, 
  Loader2,
  FileText,
  LayoutGrid,
  Calendar
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
import type { DailyWorklog, WeeklyWorklog, MonthlyWorklog, QuarterlyWorklog } from '../types/worklogs';

type LogTab = 'daily' | 'weekly' | 'monthly' | 'quarterly';

const WorklogPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LogTab>('daily');
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());

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
        return `Q${quarter} ${year}`;
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
     queryKey: ['worklogs', 'quarterly', selectedUser, currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) + 1],
     queryFn: async () => {
        const res = await api.get('/worklogs/quarterly', { params: { user_id: selectedUser, year: currentDate.getFullYear(), quarter: Math.floor(currentDate.getMonth() / 3) + 1 } });
        return res.data;
     },
     enabled: activeTab === 'quarterly'
  });

  const isLoading = isLoadingDaily || isLoadingWeekly || isLoadingMonthly || isLoadingQuarterly;

  return (
    <div className="flex bg-[#111] min-h-screen">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
        
        <header className="mb-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
           <div className="space-y-1">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Worklogs</h1>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Viewing daily and historical performance data</p>
           </div>

           <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {isManager && (
                 <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2e2e2e] p-2 pr-4 rounded-sm w-full sm:w-64">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                       <UserIcon size={14} className="text-[#F97316]" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                       <span className="text-[8px] font-black uppercase text-zinc-500 italic leading-none mb-1">View For:</span>
                       <select 
                         className="bg-transparent text-xs font-bold text-zinc-300 outline-none truncate"
                         value={selectedUser}
                         onChange={(e) => setSelectedUser(e.target.value)}
                       >
                          <option value={user?.id}>Myself ({user?.name})</option>
                          {teamMembers.map((m: any) => (
                             <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              )}

              <div className="flex items-center bg-[#1a1a1a] border border-[#2e2e2e] p-2 rounded-sm w-full md:w-auto">
                 <button onClick={handlePrev} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-[#F97316] transition-all"><ChevronLeft size={16} /></button>
                 <div className="px-4 text-[10px] font-black uppercase tracking-widest text-white border-x border-[#2e2e2e] flex items-center gap-2">
                    <Calendar size={12} className="text-[#F97316]" />
                    {dateLabel}
                 </div>
                 <button onClick={handleNext} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-[#F97316] transition-all"><ChevronRight size={16} /></button>
              </div>
           </div>
        </header>

        {/* Tab Selection */}
        <div className="mb-8 overflow-x-auto pb-2">
           <Tabs value={activeTab} className="w-full">
              <TabsList className="bg-transparent h-auto p-0 gap-2 flex flex-nowrap">
                 {[
                   { id: 'daily', label: 'Daily' },
                   { id: 'weekly', label: 'Weekly' },
                   { id: 'monthly', label: 'Monthly' },
                   { id: 'quarterly', label: 'Quarterly', hide: !isManager }
                 ].filter(t => !t.hide).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as LogTab)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                        activeTab === tab.id 
                          ? "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                          : "text-zinc-600 hover:text-zinc-300 border-[#2e2e2e] hover:border-zinc-700"
                      )}
                    >
                       {tab.label}
                    </button>
                 ))}
              </TabsList>
           </Tabs>
        </div>

        {/* Dynamic Sector Rendering */}
        <div className="pb-20 md:pb-0">
           {isLoading ? (
              <div className="flex flex-col items-center justify-center p-32 space-y-6 opacity-20 italic">
                 <Loader2 size={48} className="animate-spin text-[#F97316]" />
                 <span className="text-xl font-black uppercase tracking-widest">Auditing System Records...</span>
              </div>
           ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {activeTab === 'daily' && dailyData && <WorklogDaily data={dailyData} />}
                 {activeTab === 'weekly' && weeklyData && <WorklogWeekly data={weeklyData} />}
                 {activeTab === 'monthly' && monthlyData && <WorklogMonthly data={monthlyData} onExport={() => {}} />}
                 {activeTab === 'quarterly' && quarterlyData && <WorklogQuarterly data={quarterlyData} />}
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default WorklogPage;
