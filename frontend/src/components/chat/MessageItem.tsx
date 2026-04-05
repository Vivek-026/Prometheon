import React from 'react';
import { format } from 'date-fns';
import { 
  Reply, 
  Smile, 
  Pin, 
  Edit3, 
  Trash2, 
  FileIcon, 
  Download,
  CornerUpRight,
  MoreVertical
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';
import type { ChatMessage } from '../../types/chat';

interface MessageItemProps {
  message: ChatMessage;
  onReply: (m: ChatMessage) => void;
  onReact: (m: ChatMessage, emoji: string) => void;
  onPin: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  onReply, 
  onReact, 
  onPin, 
  onEdit, 
  onDelete 
}) => {
  const { user } = useAuthStore();
  const isOwn = message.sender.id === user?.id;
  const isManager = user?.role === 'admin' || user?.role === 'task_manager';

  const canEdit = isOwn && (new Date().getTime() - new Date(message.created_at).getTime() < 15 * 60 * 1000);

  return (
    <div className={cn(
      "group relative flex gap-3 p-4 hover:bg-[#1a1a1a]/40 transition-all",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full border border-[#2e2e2e] bg-[#111] overflow-hidden flex items-center justify-center">
           {message.sender.avatar_url ? (
             <img src={message.sender.avatar_url} className="w-full h-full object-cover" />
           ) : (
             <span className="text-[10px] font-black uppercase text-zinc-500">{message.sender.name.slice(0,2)}</span>
           )}
        </div>
      </div>

      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
           <span className="text-[10px] font-black uppercase text-white tracking-widest">{message.sender.name}</span>
           <span className="text-[8px] font-bold text-zinc-600 uppercase italic">
             {format(new Date(message.created_at), 'HH:mm')}
           </span>
        </div>

        {/* Reply Indicator */}
        {message.reply_to && (
           <div className="bg-[#111] border-l-2 border-[#F97316]/50 p-2 mb-1 flex items-center gap-2 opacity-60 rounded-sm">
              <CornerUpRight size={10} className="text-zinc-600" />
              <div className="text-[9px] uppercase tracking-tighter truncate">
                 <span className="font-black text-zinc-400">{message.reply_to.sender_name}: </span>
                 <span className="text-zinc-600 italic">"{message.reply_to.content}"</span>
              </div>
           </div>
        )}

        {/* Content Bubble */}
        <div className={cn(
          "px-4 py-2 text-xs leading-relaxed font-sans border transition-all",
          isOwn 
            ? "bg-[#F97316]/5 border-[#F97316]/20 text-indigo-50 rounded-l-xl rounded-tr-xl" 
            : "bg-[#161616] border-[#2e2e2e] text-zinc-300 rounded-r-xl rounded-tl-xl",
          message.is_deleted && "bg-[#111] border-zinc-800 text-zinc-700 italic"
        )}>
           {message.is_deleted ? (
             "[PROTOCOL_RECORD_DELETED]"
           ) : (
             <div className="markdown-chat">
                <ReactMarkdown 
                  components={{
                    pre: ({node, ...props}) => <pre className="bg-[#0d0d0d] p-3 border border-[#2e2e2e] overflow-x-auto my-2 rounded-sm" {...props} />,
                    code: ({node, ...props}) => <code className="text-[#F97316] font-mono" {...props} />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
             </div>
           )}
           {message.is_edited && !message.is_deleted && <span className="text-[8px] text-zinc-700 italic ml-2">(edited)</span>}
           {message.is_pinned && <Pin size={8} className="inline ml-1 text-[#F97316] fill-[#F97316]" />}
        </div>

        {/* Attachment Card */}
        {message.attachment && !message.is_deleted && (
           <div className="mt-2 bg-[#0d0d0d] border border-[#2e2e2e] p-3 flex items-center gap-3 w-64 group/file hover:border-white/20 transition-all rounded-sm">
              <div className="p-2 bg-[#1a1a1a] border border-[#2e2e2e] group-hover/file:border-[#F97316]/50">
                 <FileIcon size={16} className="text-zinc-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-[9px] font-black uppercase text-zinc-300 truncate tracking-tighter">{message.attachment.auto_name}</p>
                 <p className="text-[8px] text-zinc-600 font-bold">{(message.attachment.file_size_bytes / 1024).toFixed(1)} KB</p>
              </div>
              <a href={message.attachment.s3_presigned_url} download className="text-zinc-700 hover:text-[#F97316]">
                 <Download size={14} />
              </a>
           </div>
        )}

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && !message.is_deleted && (
           <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((r, i) => (
                 <button 
                   key={i} 
                   onClick={() => onReact(message, r.emoji)}
                   className="flex items-center gap-1.5 px-2 py-0.5 bg-[#111] border border-[#2e2e2e] hover:border-[#F97316]/40 transition-all rounded-full group/react"
                   title={r.users.join(', ')}
                 >
                    <span className="text-xs">{r.emoji}</span>
                    <span className="text-[9px] font-black text-zinc-500 group-hover/react:text-white">{r.count}</span>
                 </button>
              ))}
           </div>
        )}
      </div>

      {/* Action Bar (Float) */}
      {!message.is_deleted && (
         <div className={cn(
           "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex border border-[#2e2e2e] bg-[#0d0d0d] divide-x divide-[#2e2e2e] shadow-[0_0_15px_rgba(0,0,0,0.5)] h-8 items-center",
           isOwn ? "right-full mr-2" : "left-full ml-2"
         )}>
            <button onClick={() => onReply(message)} className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all" title="Reply"><Reply size={14} /></button>
            <button onClick={() => onReact(message, '🔥')} className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all" title="React"><Smile size={14} /></button>
            {isManager && (
               <button onClick={() => onPin(message)} className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-[#F97316] transition-all" title="Pin"><Pin size={14} /></button>
            )}
            {canEdit && (
               <button onClick={() => onEdit(message)} className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-indigo-400 transition-all" title="Edit"><Edit3 size={14} /></button>
            )}
            {isOwn && (
               <button onClick={() => onDelete(message)} className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-red-500 transition-all" title="Delete"><Trash2 size={14} /></button>
            )}
            <button className="p-2 hover:bg-zinc-900 text-zinc-500"><MoreVertical size={14} /></button>
         </div>
      )}
    </div>
  );
};

export default MessageItem;
