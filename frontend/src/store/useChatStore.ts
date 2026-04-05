import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import type { ChatMessage, PresenceStatus } from '../types/chat';

interface ChatStore {
  socket: WebSocket | null;
  messages: ChatMessage[];
  presence: Record<string, PresenceStatus>;
  typing: Record<string, string[]>; // id (group/dm) -> userNames[]
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (data: any) => void;
  sendTyping: (convoId: string, isTyping: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
}

const WS_URL = 'ws://localhost:8000/ws'; // Assuming port 8000 for backend

export const useChatStore = create<ChatStore>((set, get) => ({
  socket: null,
  messages: [],
  presence: {},
  typing: {},

  connect: () => {
    const token = useAuthStore.getState().token;
    if (!token || get().socket) return;

    const socket = new WebSocket(`${WS_URL}?token=${token}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { type, payload } = data;

      switch (type) {
        case 'chat:message':
          set((state) => ({ messages: [...state.messages, payload.message] }));
          break;
        case 'chat:typing':
          set((state) => {
             const { group_id, dm_thread_id, user_name, is_typing } = payload;
             const id = group_id || dm_thread_id;
             const existing = state.typing[id] || [];
             const next = is_typing ? [...new Set([...existing, user_name])] : existing.filter(n => n !== user_name);
             return { typing: { ...state.typing, [id]: next } };
          });
          break;
        case 'chat:reaction':
          // Update reactions in message list
          set((state) => ({
            messages: state.messages.map(m => {
               if (m.id === payload.message_id) {
                  // Optimization: Backend sends full message or updated reactions list
                  // If just reaction, we merge. For now assuming simple update/re-fetch or full message.
                  return { ...m, reactions: payload.reactions || m.reactions };
               }
               return m;
            })
          }));
          break;
        case 'presence:update':
          set((state) => ({ 
             presence: { ...state.presence, [payload.user_id]: payload.status } 
          }));
          break;
      }
    };

    socket.onclose = () => set({ socket: null });
    set({ socket });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null });
  },

  sendMessage: (payload) => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'chat:message', payload }));
    }
  },

  sendTyping: (convoId, isTyping) => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'chat:typing', payload: { is_typing: isTyping, convo_id: convoId } }));
    }
  },

  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] }))
}));
