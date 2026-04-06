import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Hash, 
  MessageSquare, 
  Plus, 
  Bell,
  Settings,
  User as UserIcon,
  Dot
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import type { ChatGroup, DMThread, PresenceStatus } from '../../types/chat';

interface ChatSidebarProps {
  groups: ChatGroup[];
  dms: DMThread[];
  onNewGroup: () => void;
  onNewDM: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ groups, dms, onNewGroup, onNewDM }) => {
  const navigate = useNavigate();
  const { groupId, threadId } = useParams();
  const { presence } = useChatStore();
  const { user } = useAuthStore();
  const isManager = user?.role === 'admin' || user?.role === 'task_manager';

  const getPresenceColor = (status: PresenceStatus) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'idle': return 'text-yellow-500';
      case 'dnd': return 'text-red-500';
      default: return 'text-zinc-600';
    }
  };

  const sortedGroups = [...groups].sort((a,b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return 0;
  });

  return (
    <div className="w-[240px] bg-[#111] border-r border-[#2e2e2e] flex flex-col h-full shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.2)]">
       {/* Header */}
       <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-[#F97316] rounded-sm flex items-center justify-center font-semibold text-black text-xs">P</div>
             <span className="text-xs font-semibold text-zinc-300">Chat</span>
          </div>
          <Bell size={14} className="text-zinc-600 hover:text-white cursor-pointer transition-colors" />
       </div>

       {/* Scroller */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-8">
          
          {/* Groups Section */}
          <section className="space-y-2">
             <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5"><Hash size={12} className="text-zinc-700" /> Groups</span>
                {isManager && <button onClick={onNewGroup} className="text-zinc-600 hover:text-[#F97316]"><Plus size={14} /></button>}
             </div>
             <div className="space-y-1">
                {sortedGroups.map(group => (
                   <button 
                     key={group.id} 
                     onClick={() => navigate(`/chat/group/${group.id}`)}
                     className={cn(
                       "w-full flex items-center justify-between p-2 rounded-sm group transition-all",
                       groupId === group.id ? "bg-[#F97316]/10 border border-[#F97316]/30" : "hover:bg-[#1a1a1a] border border-transparent"
                     )}
                   >
                      <div className="flex flex-col gap-0.5 text-left overflow-hidden">
                         <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs font-medium transition-colors truncate",
                              groupId === group.id ? "text-[#F97316]" : "text-zinc-400 group-hover:text-white"
                            )}>{group.name}</span>
                            {group.unread_count > 0 && <Badge className="h-4 px-1 text-[10px] bg-[#F97316] text-black font-medium">{group.unread_count}</Badge>}
                         </div>
                         {group.last_message && (
                            <p className="text-[10px] text-zinc-700 font-normal truncate">{group.last_message.sender_name}: {group.last_message.content}</p>
                         )}
                      </div>
                   </button>
                ))}
             </div>
          </section>

          {/* DMs Section */}
          <section className="space-y-2">
             <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5"><MessageSquare size={12} className="text-zinc-700" /> Direct Messages</span>
                <button onClick={onNewDM} className="text-zinc-600 hover:text-[#F97316]"><Plus size={14} /></button>
             </div>
             <div className="space-y-1">
                {dms.map(thread => {
                   const status = presence[thread.participant.id] || 'offline';
                   return (
                      <button 
                        key={thread.id} 
                        onClick={() => navigate(`/chat/dm/${thread.id}`)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-sm group transition-all relative overflow-hidden",
                          threadId === thread.id ? "bg-indigo-500/10 border border-indigo-500/30" : "hover:bg-[#1a1a1a] border border-transparent"
                        )}
                      >
                         <div className="flex items-center gap-3 w-full">
                            <div className="relative shrink-0">
                               <div className="w-8 h-8 rounded-full border border-[#2e2e2e] bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
                                  {thread.participant.avatar_url ? <img src={thread.participant.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={12} className="text-zinc-700" />}
                               </div>
                               <div className={cn("absolute -bottom-0.5 -right-0.5 rounded-full bg-[#111] z-10", getPresenceColor(status))}>
                                  <Dot size={18} strokeWidth={8} />
                               </div>
                            </div>
                            <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1">
                               <div className="flex items-center justify-between">
                                  <span className={cn(
                                    "text-xs font-medium transition-colors truncate",
                                    threadId === thread.id ? "text-indigo-400" : "text-zinc-400 group-hover:text-white"
                                  )}>{thread.participant.name}</span>
                                  {thread.unread_count > 0 && <Badge className="h-4 px-1 text-[10px] bg-indigo-500 text-white font-medium">{thread.unread_count}</Badge>}
                               </div>
                               {thread.last_message && (
                                  <p className="text-[10px] text-zinc-700 font-normal truncate">{thread.last_message.content}</p>
                               )}
                            </div>
                         </div>
                      </button>
                   )
                })}
             </div>
          </section>
       </div>

       {/* User Profile Hook */}
       <div className="p-3 border-t border-[#2e2e2e] bg-[#0d0d0d] flex items-center justify-between group cursor-pointer hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full border border-indigo-500/30 overflow-hidden bg-[#111]">
                {user?.avatar_url && <img src={user.avatar_url} className="w-full h-full object-cover" />}
             </div>
             <div className="flex flex-col">
                <span className="text-[11px] font-medium text-zinc-300">{user?.name}</span>
                <span className="text-[10px] font-normal text-zinc-600">{user?.role}</span>
             </div>
          </div>
          <Settings size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
       </div>
    </div>
  );
};

export default ChatSidebar;
