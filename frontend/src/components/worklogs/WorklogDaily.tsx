import React from 'react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Forward, 
  Zap, 
  Calendar,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import type { DailyWorklog } from '../../types/worklogs';
import type { Task } from '../../types/tasks';

interface WorklogDailyProps {
  data: DailyWorklog;
}

const WorklogDaily: React.FC<WorklogDailyProps> = ({ data }) => {
  const sections = [
    { title: 'Overdue', key: 'overdue', icon: <AlertCircle className="text-red-500" />, color: 'text-red-500' },
    { title: 'Due Today', key: 'due_today', icon: <Zap className="text-yellow-500" />, color: 'text-yellow-500' },
    { title: 'Active Tasks', key: 'in_progress', icon: <Clock className="text-[#F97316]" />, color: 'text-[#F97316]' },
    { title: 'Completed Today', key: 'completed_today', icon: <CheckCircle2 className="text-green-500" />, color: 'text-green-500' },
    { title: 'Pushed Forward', key: 'carry_forwarded_today', icon: <Forward className="text-zinc-600" />, color: 'text-zinc-600' },
  ] as const;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 gap-10">
          {sections.map(section => {
             const tasks = data?.sections?.[section.key as keyof typeof data.sections] || [];
             if (tasks.length === 0 && section.key !== 'in_progress') return null;

             return (
               <div key={section.key} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                     {section.icon}
                     <h3 className={cn("text-xs font-black uppercase tracking-[0.2em] italic", section.color)}>{section.title}</h3>
                     <Badge className="bg-zinc-900 border-zinc-800 text-zinc-500 text-[9px] h-5 rounded-none font-black italic">{tasks.length}</Badge>
                     <div className="flex-1 h-[1px] bg-zinc-900 ml-4 hidden sm:block" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {tasks.length === 0 ? (
                        <div className="col-span-full p-10 border border-zinc-900 text-center opacity-20 font-black uppercase italic tracking-widest text-xs">No tasks for this day</div>
                     ) : (
                        tasks.map(task => (
                           <div 
                              key={task.id}
                              className="group flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#2e2e2e] hover:border-[#F97316]/50 transition-all rounded-none border-l-4"
                              style={{ borderLeftColor: task.priority === 'high' || task.priority === 'urgent' ? '#F97316' : task.priority === 'medium' ? '#6366f1' : '#3f3f46' }}
                           >
                              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase text-white truncate tracking-tight">{task.name}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[8px] h-4 border-zinc-800 uppercase font-bold text-zinc-500">
                                       {task.status.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-[8px] font-bold text-zinc-600 uppercase flex items-center gap-1">
                                       <Calendar size={10} /> {task.current_deadline}
                                    </span>
                                 </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                 {task.carry_forward_count > 0 && (
                                    <div className={cn(
                                      "flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black italic border",
                                      task.carry_forward_count >= 3 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                    )}>
                                       Pushed ×{task.carry_forward_count}
                                    </div>
                                 )}
                                 <div className="flex items-center gap-2 text-zinc-800 group-hover:text-zinc-600 transition-colors">
                                    <Clock size={14} />
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
};

export default WorklogDaily;
