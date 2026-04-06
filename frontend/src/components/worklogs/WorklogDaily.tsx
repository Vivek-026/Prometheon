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
  onTaskClick: (taskId: string) => void;
}

const WorklogDaily: React.FC<WorklogDailyProps> = ({ data, onTaskClick }) => {
  const renderTask = (task: Task) => {
    const isFrozen = task.carry_forward_count >= 5; // Assuming 5+ is frozen/red

    return (
      <div 
        key={task.id}
        onClick={() => onTaskClick(task.id)}
        className="group flex items-center justify-between p-3 bg-[#0d0d0d] border border-[#2e2e2e] hover:border-[#F97316]/50 transition-all cursor-pointer rounded-none border-l-4"
        style={{ borderLeftColor: task.priority === 'high' ? '#F97316' : task.priority === 'medium' ? '#6366f1' : '#3f3f46' }}
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-white truncate tracking-widest">{task.name}</span>
              {task.tags?.slice(0,2).map(tag => (
                 <span key={tag} className="text-[7px] font-bold text-zinc-600 uppercase border border-zinc-800 px-1 italic">{tag}</span>
              ))}
           </div>
           
           <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[8px] h-4 border-zinc-800 uppercase font-black">{task.status}</Badge>
              <span className="text-[8px] font-bold text-zinc-600 uppercase flex items-center gap-1">
                 <Calendar size={10} /> {task.current_deadline}
              </span>
           </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
           {/* Carry Forward Badge */}
           {task.carry_forward_count > 0 && (
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black italic",
                isFrozen ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
              )}>
                 <Forward size={10} /> {isFrozen ? "FROZEN" : `CF×${task.carry_forward_count}`}
              </div>
           )}

           {/* Evidence Count */}
           {(task.progress_entries?.length || 0) > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                 <div className="flex items-center gap-0.5">
                    <ImageIcon size={10} />
                    <span className="text-[8px] font-black">{(task.progress_entries?.filter(e => e.entry_type === 'screenshot' || e.entry_type === 'document')?.length || 0)}</span>
                 </div>
                 <div className="flex items-center gap-0.5">
                    <Paperclip size={10} />
                    <span className="text-[8px] font-black">{(task.progress_entries?.length || 0)}</span>
                 </div>
              </div>
           )}
        </div>
      </div>
    );
  };

  const sections = [
    { title: 'Overdue Protocol', key: 'overdue', icon: <AlertCircle className="text-red-500" />, color: 'text-red-500' },
    { title: 'Due Cycles_Today', key: 'due_today', icon: <Zap className="text-yellow-500" />, color: 'text-yellow-500' },
    { title: 'Active Transmissions', key: 'in_progress', icon: <Clock className="text-[#F97316]" />, color: 'text-[#F97316]' },
    { title: 'Completed Archives', key: 'completed_today', icon: <CheckCircle2 className="text-green-500" />, color: 'text-green-500' },
    { title: 'Carry Forward Pipeline', key: 'carry_forwarded_today', icon: <Forward className="text-zinc-600" />, color: 'text-zinc-600' },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 gap-6">
          {sections.map(section => {
             const tasks = data?.sections?.[section.key as keyof typeof data.sections] || [];
             if (tasks.length === 0 && section.key !== 'in_progress') return null;

             return (
               <div key={section.key} className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                     {section.icon}
                     <h3 className={cn("text-xs font-black uppercase tracking-[0.2em] italic", section.color)}>{section.title}</h3>
                     <Badge className="bg-zinc-900 border-zinc-800 text-zinc-500 text-[9px] h-5 rounded-none font-black italic">{tasks.length}</Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                     {tasks.length === 0 ? (
                        <div className="p-8 border border-dashed border-zinc-900 flex flex-col items-center justify-center opacity-20 grayscale grayscale-0">
                           <span className="text-[10px] font-black uppercase italic">Null_Stream_Data</span>
                        </div>
                     ) : (
                        tasks.map(renderTask)
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
