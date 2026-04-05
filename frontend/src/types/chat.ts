import type { UserSummary } from './tasks';

export type MessageType = 'text' | 'file' | 'system' | 'image';

export interface ChatAttachment {
  id: string;
  auto_name: string;
  mime_type: string;
  s3_presigned_url: string;
  file_size_bytes: number;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[]; // Names
}

export interface ChatMessage {
  id: string;
  sender: UserSummary;
  content: string;
  message_type: MessageType;
  reply_to: {
    id: string;
    content: string;
    sender_name: string;
  } | null;
  is_pinned: boolean;
  is_deleted: boolean;
  is_edited: boolean;
  edited_at?: string;
  attachment: ChatAttachment | null;
  reactions: ChatReaction[];
  created_at: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  icon_url?: string;
  is_default: boolean;
  unread_count: number;
  member_count?: number;
  last_message?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
}

export interface DMThread {
  id: string;
  participant: UserSummary;
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

export type PresenceStatus = 'online' | 'idle' | 'offline' | 'dnd';

export interface PresenceUpdate {
  user_id: string;
  status: PresenceStatus;
}
