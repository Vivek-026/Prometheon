export type NotificationReferenceType = 'task' | 'document' | 'flag' | 'message';

export type NotificationType = 
  | 'task_assigned' 
  | 'status_change' 
  | 'carry_forward' 
  | 'flag_raised' 
  | 'flag_resolved' 
  | 'chat_mention' 
  | 'chat_message';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  reference_type: NotificationReferenceType;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}
