import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  RefreshCcw, 
  Forward, 
  Flag, 
  CheckCircle, 
  AtSign, 
  MessageSquare 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import type { Notification } from '../../types/notifications';
import { useNotificationStore } from '../../store/useNotificationStore';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const { markAsRead } = useNotificationStore();

  const getIcon = () => {
    switch (notification.type) {
      case 'task_assigned': return <UserPlus size={16} className="text-blue-500" />;
      case 'status_change': return <RefreshCcw size={16} className="text-[#F97316]" />;
      case 'carry_forward': return <Forward size={16} className="text-yellow-500" />;
      case 'flag_raised': return <Flag size={16} className="text-red-500" />;
      case 'flag_resolved': return <CheckCircle size={16} className="text-green-500" />;
      case 'chat_mention': return <AtSign size={16} className="text-[#6366f1]" />;
      case 'chat_message': return <MessageSquare size={16} className="text-zinc-500" />;
      default: return <MessageSquare size={16} />;
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    onClose?.();

    switch (notification.reference_type) {
      case 'task': navigate(`/tasks/${notification.reference_id}`); break;
      case 'document': navigate(`/documents/${notification.reference_id}`); break;
      case 'flag': navigate(`/flags`); break;
      case 'message': navigate(`/chat/group/${notification.reference_id}`); break;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "p-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all cursor-pointer flex gap-3 relative overflow-hidden",
        !notification.is_read && "border-l-2 border-l-[#F97316]/50 bg-[#0d0d0d]"
      )}
    >
      <div className="shrink-0 pt-1">
        {getIcon()}
      </div>
      
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <span className="text-xs font-medium text-[#F97316] leading-none">{notification.title}</span>
          <span className="text-xs text-zinc-600 font-bold shrink-0">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-tight line-clamp-2">{notification.body}</p>
        {!notification.is_read && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
