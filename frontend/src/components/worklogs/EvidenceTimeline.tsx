import React from 'react';
import { 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  Mic, 
  Code, 
  MessageSquare,
  Clock,
  User as UserIcon,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import type { EvidenceEvent } from '../../types/worklogs';

interface EvidenceTimelineProps {
  events: EvidenceEvent[];
  onClose: () => void;
  taskName: string;
}

const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ events, onClose, taskName }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'screenshot': return <ImageIcon size={14} className="text-[#F97316]" />;
      case 'doc': return <FileText size={14} className="text-zinc-300" />;
      case 'link': return <LinkIcon size={14} className="text-[#6366f1]" />;
      case 'text': return <MessageSquare size={14} className="text-zinc-500" />;
      case 'voice': return <Mic size={14} className="text-green-500" />;
      case 'code': return <Code size={14} className="text-indigo-400" />;
      default: return <Clock size={14} className="text-zinc-700" />;
    }
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#0d0d0d] border-l border-[#2e2e2e] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col p-0 animate-in slide-in-from-right duration-300">
       {/* Header */}
       <header className="p-6 border-b border-[#2e2e2e] bg-[#111] flex items-center justify-between">
          <div className="flex flex-col gap-1 overflow-hidden pr-4">
             <span className="text-xs font-medium text-[#F97316] italic">Evidence Timeline</span>
             <h2 className="text-xs font-medium text-white truncate italic">{taskName}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors p-2 bg-[#0d0d0d] border border-zinc-900"><X size={16} /></button>
       </header>

       {/* Timeline Content */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-zinc-900 z-0" />
          
          <div className="space-y-10 relative z-10">
             {events.map((event, i) => (
                <div key={i} className="flex gap-6 group">
                   {/* Icon Bubble */}
                   <div className="shrink-0 w-8 h-8 rounded-full bg-[#111] border border-[#2e2e2e] flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] group-hover:border-[#F97316]/50 transition-all">
                      {getEventIcon(event.type)}
                   </div>

                   {/* Event Card */}
                   <div className="flex-1 space-y-3 pb-8">
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{event.uploader.name}</span>
                            <span className="text-xs font-bold text-zinc-700 italic">{event.type}</span>
                         </div>
                         <span className="text-xs font-medium text-zinc-700 italic">{format(new Date(event.timestamp), 'HH:mm | MM/dd')}</span>
                      </div>

                      <div className={cn(
                        "p-4 bg-[#0d0d0d] border border-zinc-900 group-hover:border-[#2e2e2e] transition-all relative overflow-hidden",
                        event.type === 'code' && "bg-[#0a0a0a] border-l-2 border-l-indigo-500/30"
                      )}>
                         {event.type === 'screenshot' && (
                            <div className="mb-2 w-full h-32 bg-[#111] border border-zinc-950 overflow-hidden relative">
                               <img 
                                 src={event.content_preview} 
                                 alt="Evidence" 
                                 className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                               />
                               <div className="absolute bottom-2 right-2 p-1.5 bg-[#0d0d0d]/80 rounded-sm">
                                  <ImageIcon size={12} className="text-zinc-600" />
                               </div>
                            </div>
                         )}

                         <p className={cn(
                           "text-xs leading-relaxed text-zinc-400 font-sans group-hover:text-zinc-200 transition-colors",
                           event.type === 'code' && "font-mono text-indigo-300 text-xs"
                         )}>
                            {event.content_preview.length > 200 ? `${event.content_preview.slice(0, 200)}...` : event.content_preview}
                         </p>

                         {event.type === 'link' && (
                            <div className="mt-2 flex items-center gap-2 py-1 px-2 border border-zinc-950 bg-[#0a0a0a] w-fit">
                               <LinkIcon size={10} className="text-zinc-700" />
                               <span className="text-xs text-zinc-600 font-semibold cursor-pointer truncate max-w-[200px] hover:text-[#6366f1] transition-color">{event.content_preview}</span>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             ))}

             {events.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-center py-32 space-y-4">
                   <Clock size={48} className="text-zinc-800" />
                   <span className="text-xs font-medium">No evidence recorded</span>
                </div>
             )}
          </div>
       </div>

       {/* Footer / Context */}
       <footer className="p-4 bg-[#0a0a0a] border-t border-[#2e2e2e] text-center">
          <span className="text-xs font-bold text-zinc-800 italic leading-loose">End of timeline</span>
       </footer>
    </div>
  );
};

export default EvidenceTimeline;
