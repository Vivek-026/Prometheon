import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import type { Task, TaskSummary } from '../../types/tasks';
import { cn } from '../../lib/utils';
import { AlertCircle, ArrowRight, Clock, ShieldAlert } from 'lucide-react';


const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'urgent' | 'warning' | 'success' | 'info', className?: string }) => {
  const variants = {
    default: 'bg-[#2e2e2e] text-white',
    urgent: 'bg-red-500/20 text-red-500 border border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
    success: 'bg-green-500/20 text-green-500 border border-green-500/30',
    info: 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30',
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded-[1px] text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-[#2e2e2e] rounded-sm", className)} />
);

// --- ALL ROLES ---

export const ActiveTasksWidget = () => {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['active-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks?assignee=me&status=pending,in_progress,in_review');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allTasks = Array.isArray(tasks) ? tasks : [];
  const topTasks = allTasks.slice(0, 3);

  return (
    <Link to="/tasks" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#F97316]/50 transition-all min-h-[190px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-medium text-muted-foreground">My Active Tasks</h3>
        <Badge variant="info">{allTasks.length}</Badge>
      </div>

      <div className="space-y-4">
        {topTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">No active tasks right now.</p>
        ) : (
          topTasks.map(task => (
            <div key={task.id} className="flex flex-col gap-1 border-l-2 border-[#2e2e2e] pl-3 group-hover:border-[#F97316]/30">
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs font-medium truncate">{task.name}</span>
                <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'urgent' : 'default'}>{task.priority}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                 <Clock size={10} /> {new Date(task.current_deadline).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs font-medium text-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View All Tasks</span>
        <ArrowRight size={12} />
      </div>
    </Link>
  );
};

export const CarryForwardWidget = () => {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['carry-forward-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      const data = Array.isArray(res.data) ? res.data : [];
      return data.filter((t: Task) => t.carry_forward_count > 0 && t.status !== 'completed');
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allTasks = Array.isArray(tasks) ? tasks : [];
  const count = allTasks.length;
  const isUrgent = count > 3;

  return (
    <Link to="/tasks?filter=carry-forward" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] min-h-[190px]">
       <h3 className="text-xs font-medium text-muted-foreground mb-6">Tasks Pushed to Today</h3>
       <div className="flex items-baseline gap-4 mb-4">
         <span className={cn(
           "text-5xl font-semibold",
           count > 0 ? (isUrgent ? "text-red-500" : "text-yellow-500") : "text-muted-foreground/30"
         )}>
           {count.toString().padStart(2, '0')}
         </span>
         <div className="flex flex-col gap-0.5">
           <Badge variant={count > 0 ? (isUrgent ? 'urgent' : 'warning') : 'default'}>
              {isUrgent ? 'CRITICAL' : 'NEEDS ATTENTION'}
           </Badge>
         </div>
       </div>
       <p className="text-xs text-muted-foreground leading-relaxed">
         These tasks missed their deadline and were moved to today.
       </p>
    </Link>
  );
};

// --- CODERS ONLY ---

export const MyFlagsWidget = () => {
    const { data: flags, isLoading } = useQuery<any[]>({
      queryKey: ['my-flags'],
      queryFn: async () => {
        const res = await api.get('/flags');
        return Array.isArray(res.data) ? res.data : [];
      },
    });
  
    if (isLoading) return <Skeleton className="h-48 w-full" />;
    
    const allFlags = Array.isArray(flags) ? flags : [];

    return (
      <Link to="/flags" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] min-h-[190px]">
        <h3 className="text-xs font-medium text-muted-foreground mb-6">My Flags</h3>
        <div className="space-y-4">
            {allFlags.slice(0, 2).map(flag => (
                <div key={flag.id} className="flex justify-between items-center py-2 border-b border-[#2e2e2e]/50">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground opacity-70">Task: {flag.task_title}</span>
                        <span className="text-xs font-medium truncate max-w-[150px]">{flag.message}</span>
                    </div>
                    <Badge variant={flag.status === 'resolved' ? 'success' : 'warning'}>{flag.status}</Badge>
                </div>
            ))}
            {allFlags.length === 0 && <p className="text-xs text-muted-foreground">No active flags.</p>}
        </div>
      </Link>
    );
};

// --- MANAGERS + ADMINS ---

export const TeamSummaryWidget = () => {
  const { data: summary, isLoading } = useQuery<TaskSummary>({
    queryKey: ['team-summary'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      const tasks: Task[] = Array.isArray(res.data) ? res.data : [];
      return {
        activeCount: tasks.filter(t => t.status !== 'completed').length,
        inReviewCount: tasks.filter(t => t.status === 'in_review').length,
        overdueCount: tasks.filter(t => new Date(t.current_deadline) < new Date() && t.status !== 'completed').length,
        totalCount: tasks.length
      };
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="p-5 bg-[#1a1a1a] border border-[#2e2e2e] grid grid-cols-2 gap-4 min-h-[190px]">
      <div className="col-span-2 flex justify-between items-center mb-2">
         <h3 className="text-xs font-medium text-muted-foreground">Team Overview</h3>
         <ShieldAlert size={14} className="text-[#F97316]" />
      </div>
      
      <div className="p-3 bg-[#111] border border-[#2e2e2e]">
          <div className="text-2xl font-semibold text-white">{summary?.activeCount}</div>
          <div className="text-[11px] text-muted-foreground">ACTIVE</div>
      </div>
      <div className="p-3 bg-[#111] border border-[#2e2e2e]">
          <div className="text-2xl font-semibold text-[#F97316]">{summary?.inReviewCount}</div>
          <div className="text-[11px] text-muted-foreground">IN REVIEW</div>
      </div>
      <div className="p-3 bg-[#111] border border-[#2e2e2e] col-span-2 flex justify-between items-center border-l-orange-500 border-l-2">
          <div>
            <div className="text-2xl font-semibold text-red-500">{summary?.overdueCount}</div>
            <div className="text-[11px] text-muted-foreground">OVERDUE</div>
          </div>
          <AlertCircle className="text-red-500 opacity-20" size={32} />
      </div>
    </div>
  );
};

export const FlaggedTasksWidget = () => {
  const { data: flags, isLoading } = useQuery<any[]>({
    queryKey: ['admin-flags'],
    queryFn: async () => {
      const res = await api.get('/flags');
      const data = Array.isArray(res.data) ? res.data : [];
      return data.filter((f: any) => f.status === 'pending_review');
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allFlags = Array.isArray(flags) ? flags : [];
  const count = allFlags.length;

  return (
    <Link to="/flags" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] min-h-[190px]">
      <h3 className="text-xs font-medium text-muted-foreground mb-6 text-right">Flagged Tasks</h3>
      <div className="flex flex-row-reverse items-baseline gap-4 mb-4">
         <span className={cn(
           "text-5xl font-semibold",
           count > 0 ? "text-[#F97316]" : "text-muted-foreground/30"
         )}>
           {count.toString().padStart(2, '0')}
         </span>
         <div className="flex flex-col items-end gap-0.5">
           <Badge variant={count > 0 ? 'warning' : 'default'} className="bg-orange-500/20 border-orange-500/30 text-orange-500">
              WAITING FOR REVIEW
           </Badge>
         </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed text-right opacity-60">
        Needs your decision.
      </p>
    </Link>
  );
};

// --- ADMIN ONLY ---

export const EscalatedTasksWidget = () => {
  const { data: escalated, isLoading } = useQuery<Task[]>({
    queryKey: ['escalated-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      const data = Array.isArray(res.data) ? res.data : [];
      return data.filter((t: Task) => (t.carry_forward_count >= 3 || (t.flag_count > 0 && !t.is_frozen)));
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allEscalated = Array.isArray(escalated) ? escalated : [];

  return (
    <div className="p-5 bg-red-950/10 border border-red-900/50 col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="text-red-500" size={20} />
          <h3 className="text-sm font-semibold text-red-500">Escalations</h3>
          <div className="h-[1px] flex-1 bg-red-500/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {allEscalated.slice(0, 3).map(task => (
           <div key={task.id} className="p-3 bg-red-950/20 border border-red-900/30 flex flex-col gap-2 relative overflow-hidden">
              <span className="text-xs font-medium truncate">{task.name}</span>
              <div className="flex gap-2">
                 {task.carry_forward_count >= 3 && <Badge variant="urgent">PUSHED {task.carry_forward_count}× </Badge>}
                 {task.flag_count > 0 && <Badge variant="urgent">FLAGGED</Badge>}
              </div>
           </div>
         ))}
         {allEscalated.length === 0 && <p className="text-xs text-red-500 font-medium opacity-40">No escalations right now.</p>}
      </div>
    </div>
  );
};
