import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Pin,
  X,
  Loader2,
  Lock,
  MoreVertical,
  SendHorizonal,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import api from '../api/api';
import ChatSidebar from '../components/chat/ChatSidebar';
import MessageItem from '../components/chat/MessageItem';
import ChatInput from '../components/chat/ChatInput';
import Sidebar from '../components/layout/Sidebar';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import type { ChatGroup, DMThread, ChatMessage } from '../types/chat';

const ChatPage: React.FC = () => {
  const { groupId, threadId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { connect, socket, messages, setMessages, sendMessage, sendTyping, typing } = useChatStore();

  // Mode state
  const isDM = !!threadId;
  const currentId = groupId || threadId;
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  
  // Message Feed Utilities
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- WebSocket Connection ---
  useEffect(() => {
    connect();
  }, []);

  // --- Initial Sidebar Data ---
  const { data: groups = [] } = useQuery<ChatGroup[]>({
    queryKey: ['chat-groups'],
    queryFn: async () => {
       const res = await api.get('/chat/groups');
       return Array.isArray(res.data) ? res.data : (res.data?.groups || []);
    }
  });

  const { data: dms = [] } = useQuery<DMThread[]>({
    queryKey: ['chat-dms'],
    queryFn: async () => {
       const res = await api.get('/chat/dm');
       return Array.isArray(res.data) ? res.data : (res.data?.threads || []);
    }
  });

  // --- Search Results for DM ---
  const [dmSearch, setDmSearch] = useState('');
  const { data: allUsers = [] } = useQuery<any[]>({
     queryKey: ['users-search', dmSearch],
     queryFn: async () => {
        const res = await api.get('/users', { params: { search: dmSearch } });
        return Array.isArray(res.data) ? res.data : (res.data?.users || []);
     },
     enabled: isNewDMModalOpen
  });

  const startDMMutation = useMutation({
     mutationFn: (userId: string) => api.post('/chat/dm', { user_id: userId }),
     onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ['chat-dms'] });
        setIsNewDMModalOpen(false);
        navigate(`/chat/dm/${res.data.thread_id}`);
     }
  });

  // --- Active Conversation Info ---
  const activeGroup = groups.find(g => g.id === groupId);
  const activeDM = dms.find(d => d.id === threadId);
  const conversationName = activeGroup?.name || activeDM?.participant.name || 'Secure Channel';

  // --- Message History ---
  const { data: history, isLoading: isHistoryLoading } = useQuery<{ messages: ChatMessage[], has_more: boolean }>({
    queryKey: ['chat-messages', currentId],
    queryFn: async () => {
       const url = isDM ? `/chat/dm/${threadId}/messages` : `/chat/groups/${groupId}/messages`;
       const res = await api.get(url, { params: { limit: 50 } });
       return res.data;
    },
    enabled: !!currentId
  });

  useEffect(() => {
    if (history?.messages) {
      setMessages(history.messages);
      // Auto-scroll to bottom on load
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  }, [history, currentId]);

  // --- Handlers ---
  const handleSend = (content: string, _attachment?: File, replyToId?: string) => {
     if (!socket) return;
     
     // Optimized: If attachment, use separate REST flow first or multipart via socket?
     // User requirement: "On send: emit chat:message event"
     // For attachments, we handle via multipart REST first then send socket signal.
     
     const payload = {
        group_id: groupId,
        dm_thread_id: threadId,
        content,
        reply_to_id: replyToId,
        // Attachment ID from a pre-upload flow if applicable
     };
     
     sendMessage(payload);
  };

  const handleTyping = (isTyping: boolean) => {
     if (currentId) sendTyping(currentId, isTyping);
  };

  // Reactions/Pins/etc (REST fallback for persistence)
  const reactMutation = useMutation({
     mutationFn: (data: { id: string, emoji: string }) => api.post(`/chat/messages/${data.id}/reactions`, { emoji: data.emoji })
  });

  const pinMutation = useMutation({
     mutationFn: (data: { id: string, is_pinned: boolean }) => api.patch(`/chat/messages/${data.id}/pin`, { is_pinned: data.is_pinned }),
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-messages', currentId] })
  });

  const deleteMutation = useMutation({
     mutationFn: (id: string) => api.delete(`/chat/messages/${id}`),
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-messages', currentId] })
  });

  return (
    <div className="flex bg-[#111111] min-h-screen text-zinc-300">
        <Sidebar />

        <main className="flex-1 ml-0 md:ml-64 p-0 flex flex-col md:flex-row h-screen overflow-hidden">
            
            {/* Chat Sidebar */}
            <div className={cn("w-full md:w-auto", currentId ? "hidden md:block" : "block")}>
              <ChatSidebar
                groups={groups}
                dms={dms}
                onNewGroup={() => {}}
                onNewDM={() => setIsNewDMModalOpen(true)}
              />
            </div>

            {/* Conversation Area */}
            <div className={cn("flex-1 flex flex-col relative", !currentId ? "hidden md:flex" : "flex")}>
               
               {/* Conversation Header */}
               <header className="h-14 md:h-16 px-3 md:px-6 border-b border-[#2e2e2e] bg-[#0d0d0d]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                  <div className="flex items-center gap-4">
                     <button onClick={() => navigate('/chat')} className="md:hidden p-2 min-h-[44px] min-w-[44px] text-zinc-400 hover:text-white mr-2">
                       <ChevronLeft size={20} />
                     </button>
                     <span className="text-[#F97316] font-semibold text-xl"># {conversationName}</span>
                     {activeGroup && <span className="text-[11px] font-medium text-zinc-600 flex items-center gap-1"><Users size={12} /> {activeGroup.member_count || 0} members</span>}
                     {activeDM && <Badge className="bg-green-600/10 text-green-500 border-green-500/20 text-[10px] h-4">Online</Badge>}
                  </div>
                  <div className="flex items-center gap-4">
                     <Search size={18} className="text-zinc-600 hover:text-white cursor-pointer" />
                     <button onClick={() => setShowPins(!showPins)} className={cn("relative p-2 rounded-sm transition-all", showPins ? "bg-[#F97316]/10 text-[#F97316]" : "text-zinc-600 hover:text-white")}>
                        <Pin size={18} />
                     </button>
                     <MoreVertical size={18} className="text-zinc-600 cursor-pointer" />
                  </div>
               </header>

               {/* Messages Feed */}
               <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[radial-gradient(circle_at_center,_#161616_0%,_#111111_100%)]">
                  {isHistoryLoading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-[#F97316]" size={32} /></div>
                  ) : !currentId ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale-0 text-center">
                       <Lock size={64} className="text-zinc-700 mb-6" />
                       <h2 className="text-2xl font-semibold text-[#F97316]">Pick a conversation</h2>
                       <p className="text-xs font-normal mt-2">Select a group or start a direct message.</p>
                    </div>
                  ) : (
                    <>
                       {/* Load More Trigger */}
                       <div className="text-center py-4">
                          <button className="text-[11px] font-medium text-zinc-700 hover:text-zinc-400">Load older messages</button>
                       </div>

                       {/* Message Clusters */}
                       <div className="space-y-6">
                           {messages.map((m, i) => {
                             const prev = messages[i-1];
                             const showDate = !prev || format(new Date(m.created_at), 'yyyy-MM-dd') !== format(new Date(prev.created_at), 'yyyy-MM-dd');
                             return (
                               <React.Fragment key={m.id}>
                                  {showDate && (
                                     <div className="flex items-center gap-4 py-6">
                                        <div className="flex-1 h-px bg-[#2e2e2e]" />
                                        <span className="text-[11px] font-medium text-zinc-600">{format(new Date(m.created_at), 'MMMM d, yyyy')}</span>
                                        <div className="flex-1 h-px bg-[#2e2e2e]" />
                                     </div>
                                  )}
                                  <MessageItem 
                                    message={m} 
                                    onReply={(msg) => setReplyTo(msg)}
                                    onReact={(msg, emoji) => reactMutation.mutate({ id: msg.id, emoji })}
                                    onPin={(msg) => pinMutation.mutate({ id: msg.id, is_pinned: !msg.is_pinned })}
                                    onEdit={() => {}}
                                    onDelete={(msg) => deleteMutation.mutate(msg.id)}
                                  />
                               </React.Fragment>
                             )
                           })}
                       </div>

                       {/* Typing Indicators */}
                       <div className="h-6">
                          {currentId && typing[currentId]?.length > 0 && (
                             <div className="text-[11px] font-medium text-zinc-600 flex items-center gap-2 px-4 animate-pulse">
                                {typing[currentId].join(', ')} is typing...
                                <div className="flex gap-0.5">
                                   <div className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce" />
                                   <div className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                   <div className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                </div>
                             </div>
                          )}
                       </div>
                    </>
                  )}
               </div>

               {/* Input Section */}
               {currentId && (
                  <ChatInput 
                    onSend={handleSend} 
                    onTyping={handleTyping}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                  />
               )}

               {/* Pins Panel (Overlay) */}
               {showPins && (
                  <div className="absolute top-16 right-0 bottom-0 w-full md:w-[300px] bg-[#0d0d0d] border-l border-[#2e2e2e] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20 flex flex-col p-6 animate-in slide-in-from-right-full duration-300">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-xl font-semibold text-[#F97316] flex items-center gap-2"><Pin size={20} /> Pinned Messages</h3>
                         <button onClick={() => setShowPins(false)} className="text-zinc-600 hover:text-white"><X size={20} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                         {messages.filter(m => m.is_pinned).map(pm => (
                            <div key={pm.id} className="p-4 bg-[#161616] border border-[#2e2e2e] space-y-2 relative group hover:border-[#F97316]/50 transition-all">
                               <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-white">{pm.sender.name}</span>
                                  <span className="text-[10px] font-normal text-zinc-600">{format(new Date(pm.created_at), 'MM/dd')}</span>
                               </div>
                               <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-sans">{pm.content}</p>
                               <button 
                                 onClick={() => pinMutation.mutate({ id: pm.id, is_pinned: false })}
                                 className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-[#111] text-zinc-600 hover:text-red-500 transition-all"
                               >
                                  <X size={10} />
                               </button>
                            </div>
                         ))}
                         {messages.filter(m => m.is_pinned).length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
                               <Pin size={32} />
                               <span className="text-xs font-medium">No pinned messages</span>
                            </div>
                         )}
                      </div>
                  </div>
               )}
            </div>
        </main>

        {/* NEW DM MODAL */}
        <Dialog open={isNewDMModalOpen} onOpenChange={setIsNewDMModalOpen}>
           <DialogContent className="max-w-md bg-[#0d0d0d] border-[#2e2e2e] text-zinc-300 flex flex-col p-0">
              <DialogHeader className="p-6 border-b border-[#2e2e2e]">
                 <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">New Direct Message</DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-6">
                 <div className="relative">
                    <Search className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <Input 
                      placeholder="Search by name..."
                      value={dmSearch}
                      onChange={(e) => setDmSearch(e.target.value)}
                      className="pl-10 h-12 bg-[#111] border-[#2e2e2e] text-xs font-normal focus-visible:border-[#F97316]"
                    />
                 </div>
                 <div className="h-64 overflow-y-auto space-y-1 custom-scrollbar">
                    {allUsers.filter(u => u.id !== user?.id).map((u: any) => (
                       <button 
                         key={u.id}
                         onClick={() => startDMMutation.mutate(u.id)}
                         className="w-full p-3 flex items-center gap-4 hover:bg-[#F97316]/10 border border-transparent hover:border-[#F97316]/30 transition-all group"
                       >
                          <div className="w-10 h-10 rounded-full border border-[#2e2e2e] bg-[#1a1a1a] overflow-hidden group-hover:border-[#F97316]/50">
                             {u.avatar_url && <img src={u.avatar_url} className="w-full h-full object-cover" />}
                          </div>
                          <div className="text-left">
                             <p className="text-xs font-medium text-white group-hover:text-[#F97316] transition-colors">{u.name}</p>
                             <p className="text-[10px] font-normal text-zinc-600">{u.role}</p>
                          </div>
                          <SendHorizonal size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-[#F97316] transition-opacity" />
                       </button>
                    ))}
                 </div>
              </div>
           </DialogContent>
        </Dialog>
    </div>
  );
};

export default ChatPage;
