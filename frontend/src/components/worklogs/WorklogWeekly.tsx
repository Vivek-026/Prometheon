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
  onTaskClick: (taskId: string) => void;
}

const WorklogWeekly: React.FC<WorklogWeeklyProps> = ({ data, onTaskClick }) => {
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
                      {React.cloneElement(item.icon as React.ReactElement, { size: 12, className: "text-zinc-600" })}
                      <span className="text-xs font-medium text-zinc-600">{item.label}</span>
                   </div>
                   <div className={cn("text-3xl font-semibold", item.color)}>
                      {item.value}
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>

       {/* Days Grid */}
       <div className="space-y-6">
          <h3 className="text-xs font-semibold text-zinc-500 flex items-center gap-3">
             <Calendar size={14} className="text-[#F97316]" /> Tasks by Day
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {(data?.days || []).map((day) => (
                <div key={day.date} className="bg-[#111] border border-[#2e2e2e] p-4 flex flex-col gap-4 relative rounded-none hover:bg-zinc-900 transition-colors">
                   <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2">
                      <span className="text-xs font-semibold text-white">{day.date}</span>
                      <Badge className="bg-[#1a1a1a] border-zinc-800 text-xs h-5 rounded-none font-medium text-zinc-500">{day.tasks?.length || 0} ITEMS</Badge>
                   </div>
                   
                   <div className="space-y-2 min-h-[100px]">
                      {day.tasks?.length === 0 ? (
                         <div className="h-full flex items-center justify-center opacity-20 grayscale-0 text-center py-8">
                            <span className="text-[10px] font-normal">No Data Anchored</span>
                         </div>
                      ) : (
                         day.tasks.map(task => (
                            <button 
                              key={task.id}
                              onClick={() => onTaskClick(task.id)}
                              className="w-full text-left p-2.5 bg-[#0d0d0d] border border-[#2e2e2e] hover:border-[#F97316]/40 transition-all group flex flex-col gap-1.5"
                            >
                               <div className="flex items-center justify-between gap-2 overflow-hidden">
                                  <span className="text-xs font-semibold text-zinc-300 truncate">{task.name}</span>
                                  <Badge className={cn(
                                    "text-[10px] font-medium h-4 px-1 rounded-none border-zinc-800",
                                    task.status === 'completed' ? "bg-green-600/10 text-green-500" : "bg-yellow-600/10 text-yellow-500"
                                  )}>{task.status}</Badge>
                               </div>
                               <div className="flex items-center gap-3">
                                  <span className={cn(
                                    "text-[10px] font-normal",
                                    task.priority === 'high' ? "text-[#F97316]" : "text-zinc-600"
                                  )}>{task.priority}</span>
                                  {task.carry_forward_count > 0 && <span className="text-[10px] font-medium text-yellow-500">CF×{task.carry_forward_count}</span>}
                               </div>
                            </button>
                         ))
                      )}
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Tracker Board */}
       <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-500 flex items-center gap-3">
             <Forward size={14} className="text-[#F97316]" /> Tasks Pushed Forward
          </h3>
          <div className="bg-[#0d0d0d] border border-[#2e2e2e] overflow-hidden rounded-none table-scroll-wrapper">
             <table className="w-full text-xs font-normal">
                <thead className="bg-[#111] border-b border-[#2e2e2e] text-zinc-600">
                   <tr>
                      <th className="p-3 text-left font-medium">Task</th>
                      <th className="p-3 text-left font-medium">Times Pushed</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-right font-medium">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                   {(data?.carry_forward_tracker || []).map(item => (
                      <tr key={item.task_id} className="hover:bg-zinc-900 transition-colors group">
                         <td className="p-3 text-zinc-300 font-semibold">{item.name}</td>
                         <td className="p-3">
                            <div className={cn(
                              "flex items-center gap-2",
                              item.carry_count >= 5 ? "text-red-500" : "text-yellow-500"
                            )}>
                               <Forward size={12} />
                               {item.carry_count}
                            </div>
                         </td>
                         <td className="p-3 truncate max-w-[150px] text-zinc-600">{item.current_status}</td>
                         <td className="p-3 text-right">
                            <button onClick={() => onTaskClick(item.task_id)} className="text-zinc-700 hover:text-[#F97316] transition-colors"><MoreVertical size={14} /></button>
                         </td>
                      </tr>
                   ))}
                   {(data?.carry_forward_tracker || []).length === 0 && (
                      <tr>
                         <td colSpan={4} className="p-8 text-center text-zinc-800 font-normal opacity-20">No data</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

export default WorklogWeekly;
