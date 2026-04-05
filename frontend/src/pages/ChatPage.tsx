import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ChevronLeft,
  MessageSquare
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

  const isDM = !!threadId;
  const currentId = groupId || threadId;
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect();
  }, []);

  const { data: groups = [] } = useQuery<ChatGroup[]>({
    queryKey: ['chat-groups'],
    queryFn: async () => {
       const res = await api.get('/chat/groups');
       const data = Array.isArray(res.data) ? res.data : (res.data?.groups || []);
       return data.map((g: any) => ({ ...g, name: g.name.replace(/_/g, ' ') }));
    }
  });

  const { data: dms = [] } = useQuery<DMThread[]>({
    queryKey: ['chat-dms'],
    queryFn: async () => {
       const res = await api.get('/chat/dm');
       return Array.isArray(res.data) ? res.data : (res.data?.threads || []);
    }
  });

  const activeGroup = groups.find(g => g.id === groupId);
  const activeDM = dms.find(d => d.id === threadId);
  const conversationName = activeGroup?.name || activeDM?.participant.name || 'Chat';

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
     if (history?.messages) setMessages(history.messages);
  }, [history, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex bg-[#111] h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col h-full relative">
        
        {/* Responsive Mobile Layout: Sidebar vs Content */}
        <div className="flex h-full overflow-hidden">
           
           {/* Conversation List Sidebar */}
           <div className={cn(
             "w-full md:w-80 border-r border-[#2e2e2e] bg-[#1a1a1a] flex flex-col shrink-0 transition-all",
             currentId ? "hidden md:flex" : "flex"
           )}>
              <div className="p-6 border-b border-[#2e2e2e] flex flex-col gap-4">
                 <h2 className="text-xl font-black uppercase text-white tracking-widest">Chat</h2>
                 <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-hover:text-[#F97316]" size={16} />
                    <Input 
                      placeholder="Search messages..." 
                      className="bg-[#0d0d0d] border-[#2e2e2e] pl-9 h-10 text-xs rounded-none focus:border-[#F97316]/30"
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                 <ChatSidebar 
                    groups={groups} 
                    dms={dms} 
                    activeId={currentId} 
                    onNewDM={() => setIsNewDMModalOpen(true)}
                 />
              </div>
           </div>

           {/* Message Area */}
           <div className={cn(
             "flex-1 flex flex-col bg-[#111111] min-w-0 transition-all",
             !currentId ? "hidden md:flex items-center justify-center" : "flex"
           )}>
              {currentId ? (
                <>
                  {/* Chat Header */}
                  <header className="h-16 px-6 border-b border-[#2e2e2e] bg-[#0d0d0d] flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4 truncate">
                        <button 
                          onClick={() => navigate('/chat')}
                          className="p-2 -ml-2 text-zinc-500 hover:text-white md:hidden"
                        >
                           <ChevronLeft size={20} />
                        </button>
                        <div className="flex flex-col truncate">
                           <h3 className="text-sm font-black text-white uppercase tracking-widest truncate">{conversationName}</h3>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Active Participants: 12</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setShowPins(!showPins)}
                          className={cn("p-2 rounded-sm transition-colors", showPins ? "bg-[#F97316]/10 text-[#F97316]" : "text-zinc-600 hover:text-white")}
                        >
                           <Pin size={18} />
                        </button>
                        <button className="p-2 text-zinc-600 hover:text-white"><MoreVertical size={18} /></button>
                     </div>
                  </header>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                     {messages.map((msg, idx) => (
                       <MessageItem 
                          key={msg.id} 
                          message={msg} 
                          isMe={msg.sender.id === user?.id}
                          onReply={setReplyTo}
                       />
                     ))}
                     <div ref={scrollRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 md:p-6 bg-[#0d0d0d] border-t border-[#2e2e2e] shrink-0">
                     {replyTo && (
                        <div className="mb-3 p-2 bg-[#1a1a1a] border-l-2 border-[#F97316] flex items-center justify-between animate-in slide-in-from-bottom-2">
                           <div className="text-[9px] uppercase font-bold text-zinc-500">Replying to <span className="text-[#F97316]">{replyTo.sender.name}</span></div>
                           <button onClick={() => setReplyTo(null)} className="text-zinc-600 hover:text-white"><X size={14} /></button>
                        </div>
                     )}
                     <ChatInput 
                        onSend={(content) => sendMessage({ type: 'chat:message', payload: { content, reply_to: replyTo?.id } })} 
                        onTyping={(isTyping) => sendTyping(currentId, isTyping)}
                     />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-10">
                   <MessageSquare size={120} strokeWidth={0.5} />
                   <div className="flex flex-col items-center gap-2">
                      <h3 className="text-xl font-black uppercase tracking-widest italic">Pick a conversation</h3>
                      <p className="text-[10px] uppercase font-bold tracking-tighter">Select a group or start a direct message to begin chatting.</p>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* User Picker Modal for DM */}
        <Dialog open={isNewDMModalOpen} onOpenChange={setIsNewDMModalOpen}>
           <DialogContent className="bg-[#111] border-[#2e2e2e] text-white rounded-none max-w-sm">
              <DialogHeader>
                 <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-[#F97316]">New Direct Message</DialogTitle>
              </DialogHeader>
              <div className="pt-4 space-y-4">
                 <Input 
                   placeholder="Search people..." 
                   className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none focus:border-[#F97316]/30"
                 />
                 <div className="max-h-60 overflow-y-auto space-y-1">
                    {/* Mock users for now */}
                    {[
                      {id: 'u1', name: 'Alpha Admin', role: 'admin'},
                      {id: 'u2', name: 'Bravo User', role: 'manager'},
                      {id: 'u3', name: 'Charlie Coder', role: 'coder'}
                    ].map(u => (
                       <button 
                         key={u.id}
                         onClick={() => navigate(`/chat/dm/${u.id}`)}
                         className="w-full flex items-center gap-3 p-3 hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700" />
                          <div className="flex flex-col text-left">
                             <span className="text-[11px] font-black uppercase truncate">{u.name}</span>
                             <span className="text-[8px] text-zinc-600 font-bold uppercase">{u.role}</span>
                          </div>
                        </button>
                    ))}
                 </div>
              </div>
           </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ChatPage;
