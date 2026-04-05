import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { 
  Forward, 
  Zap, 
  CheckSquare,
  BarChart,
  Calendar,
  MoreVertical
} from 'lucide-react';
import type { WeeklyWorklog } from '../../types/worklogs';

interface WorklogWeeklyProps {
  data: WeeklyWorklog;
}

const WorklogWeekly: React.FC<WorklogWeeklyProps> = ({ data }) => {
  const summaryItems = [
    { label: 'Tasks Assigned', value: data?.summary?.tasks_assigned || 0, icon: <Zap size={16} />, color: 'text-zinc-300' },
    { label: 'Completed', value: data?.summary?.completed_count || 0, icon: <CheckSquare size={16} />, color: 'text-[#F97316]' },
    { label: 'Completion Rate', value: `${data?.summary?.completed_pct || 0}%`, icon: <BarChart size={16} />, color: 'text-green-500' },
    { label: 'Pushed Forward', value: data?.summary?.carry_forwarded_count || 0, icon: <Forward size={16} />, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* Summary Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.map((item, i) => (
             <Card key={i} className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none focus-within:border-[#F97316]/60 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   {item.icon}
                 </div>
                <CardContent className="p-6 space-y-2">
                   <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none">{item.label}</span>
                   </div>
                   <div className={cn("text-3xl font-black italic tracking-tighter", item.color)}>
                      {item.value}
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>

       {/* Days Grid */}
       <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-zinc-500 flex items-center gap-3">
             <Calendar size={14} className="text-[#F97316]" /> Tasks by Day
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
             {(data?.days || []).map((day) => (
                <div key={day.date} className="bg-[#111] border border-[#2e2e2e] p-4 flex flex-col gap-4 relative rounded-none hover:bg-zinc-900 transition-colors">
                   <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2">
                      <span className="text-[11px] font-black uppercase text-white italic">{day.date}</span>
                      <Badge className="bg-[#1a1a1a] border-zinc-800 text-[9px] h-5 rounded-none font-black italic text-zinc-500">{day.tasks?.length || 0}</Badge>
                   </div>
                   
                   <div className="space-y-2 min-h-[100px]">
                      {day.tasks?.length === 0 ? (
                         <div className="h-full flex items-center justify-center opacity-20 italic text-center py-8">
                            <span className="text-[8px] font-black uppercase tracking-widest">No tasks</span>
                         </div>
                      ) : (
                         day.tasks.map(task => (
                            <div 
                              key={task.id}
                              className="w-full text-left p-2.5 bg-[#0d0d0d] border border-[#2e2e2e] hover:border-[#F97316]/40 transition-all group flex flex-col gap-1.5"
                            >
                               <div className="flex items-center justify-between gap-2 overflow-hidden">
                                  <span className="text-[9px] font-black uppercase text-zinc-300 truncate tracking-tight">{task.name}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <Badge className={cn(
                                    "text-[7px] font-black h-4 px-1 rounded-none uppercase italic border-zinc-800",
                                    task.status === 'completed' ? "bg-green-600/10 text-green-500" : "bg-yellow-600/10 text-yellow-500"
                                  )}>{task.status.replace('_', ' ')}</Badge>
                                  {task.carry_forward_count > 0 && <span className="text-[7px] font-black text-yellow-500 italic">Pushed ×{task.carry_forward_count}</span>}
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Tracker Board */}
       <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-zinc-500 flex items-center gap-3">
             <Forward size={14} className="text-[#F97316]" /> Tasks That Were Pushed Forward
          </h3>
          <div className="bg-[#0b0b0b] border border-[#2e2e2e] overflow-x-auto rounded-none">
             <table className="w-full text-[10px] uppercase font-bold italic tracking-tighter min-w-[600px]">
                <thead className="bg-[#111] border-b border-[#2e2e2e] text-zinc-600">
                   <tr>
                      <th className="p-4 text-left">Task</th>
                      <th className="p-4 text-center">Times Pushed</th>
                      <th className="p-4 text-center">Current Status</th>
                      <th className="p-4 text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                   {(data?.days || []).flatMap(d => d.tasks || []).filter(t => t.carry_forward_count > 0).slice(0, 5).map(task => (
                      <tr key={task.id} className="hover:bg-zinc-900 transition-colors group">
                         <td className="p-4 font-black tracking-tight text-white">{task.name}</td>
                         <td className="p-4 text-center">
                            <Badge className="bg-yellow-600/10 text-yellow-500 border-none rounded-none italic px-3">×{task.carry_forward_count}</Badge>
                         </td>
                         <td className="p-4 text-center text-zinc-600 group-hover:text-zinc-400 transition-colors">{task.status.replace('_', ' ')}</td>
                         <td className="p-4 text-right">
                            <button className="text-[#F97316] hover:underline">VIEW DETAIL</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

export default WorklogWeekly;
