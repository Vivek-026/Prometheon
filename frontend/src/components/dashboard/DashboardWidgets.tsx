import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import type { Task, Flag, TaskSummary } from '../../types/tasks';
import { cn } from '../../lib/utils';
import { AlertCircle, ArrowRight, Clock, ShieldAlert } from 'lucide-react';

const MOCO_TASKS: Task[] = [
  { 
    id: '1', name: 'Database Encryption Audit', status: 'pending', priority: 'urgent', carry_forward_count: 0, flag_count: 0, is_frozen: false,
    tags: ['security'], created_by: 'u1', original_deadline: '2026-04-10', current_deadline: '2026-04-10', created_at: '2026-04-01', updated_at: '2026-04-01', 
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin' }]
  },
  { 
    id: '2', name: 'Core API Refactor', status: 'in_progress', priority: 'high', carry_forward_count: 2, flag_count: 0, is_frozen: false,
    tags: ['refactor'], created_by: 'u1', original_deadline: '2026-04-10', current_deadline: '2026-04-12', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin' }]
  },
  { 
    id: '3', name: 'Zustand Store Polish', status: 'in_review', priority: 'medium', carry_forward_count: 0, flag_count: 0, is_frozen: false,
    tags: ['frontend'], created_by: 'u1', original_deadline: '2026-04-08', current_deadline: '2026-04-08', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin' }]
  },
  { 
    id: '4', name: 'Legacy Repo Migration', status: 'pending', priority: 'high', carry_forward_count: 4, flag_count: 1, is_frozen: true,
    tags: ['migration'], created_by: 'u1', original_deadline: '2026-04-01', current_deadline: '2026-04-01', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin' }]
  },
];

const MOCK_FLAGS: Flag[] = [
  { id: 'f1', task_id: '4', task_title: 'Legacy Repo Migration', reporter_id: 'c1', reporter_name: 'Coder 1', status: 'pending_review', message: 'Unknown dependency in bundle', created_at: '2026-04-05' }
];

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'urgent' | 'warning' | 'success' | 'info', className?: string }) => {
  const variants = {
    default: 'bg-[#2e2e2e] text-white',
    urgent: 'bg-red-500/20 text-red-500 border border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
    success: 'bg-green-500/20 text-green-500 border border-green-500/30',
    info: 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30',
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded-[1px] text-[10px] font-bold uppercase tracking-widest", variants[variant], className)}>
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
      try {
        const res = await api.get('/tasks?assignee=me&status=pending,in_progress,in_review');
        return Array.isArray(res.data) ? res.data : MOCO_TASKS;
      } catch (e) {
        return MOCO_TASKS;
      }
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allTasks = Array.isArray(tasks) ? tasks : MOCO_TASKS;
  const topTasks = allTasks.slice(0, 3);

  return (
    <Link to="/tasks" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#F97316]/50 transition-all min-h-[190px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">My Active Tasks</h3>
        <Badge variant="info">{allTasks.length}</Badge>
      </div>

      <div className="space-y-4">
        {topTasks.length === 0 ? (
          <p className="text-[10px] text-muted-foreground uppercase py-4">No active tasks found.</p>
        ) : (
          topTasks.map(task => (
            <div key={task.id} className="flex flex-col gap-1 border-l-2 border-[#2e2e2e] pl-3 group-hover:border-[#F97316]/30">
              <div className="flex justify-between items-start gap-3">
                <span className="text-[11px] font-bold truncate">{task.name}</span>
                <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'urgent' : 'default'}>{task.priority}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase">
                 <Clock size={10} /> {new Date(task.current_deadline).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View all tasks</span>
        <ArrowRight size={12} />
      </div>
    </Link>
  );
};

export const CarryForwardWidget = () => {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['carry-forward-tasks'],
    queryFn: async () => {
        try {
            const res = await api.get('/tasks');
            const data = Array.isArray(res.data) ? res.data : MOCO_TASKS;
            return data.filter((t: Task) => t.carry_forward_count > 0 && t.status !== 'completed');
        } catch (e) {
            return MOCO_TASKS.filter((t: Task) => t.carry_forward_count > 0 && t.status !== 'completed');
        }
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allTasks = Array.isArray(tasks) ? tasks : [];
  const count = allTasks.length;
  const isUrgent = count > 3;

  return (
    <Link to="/tasks?filter=carry-forward" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] min-h-[190px]">
       <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Tasks Pushed to Today</h3>
       <div className="flex items-baseline gap-4 mb-4">
         <span className={cn(
           "text-5xl font-black tracking-tighter",
           count > 0 ? (isUrgent ? "text-red-500" : "text-yellow-500") : "text-muted-foreground/30"
         )}>
           {count.toString().padStart(2, '0')}
         </span>
         <div className="flex flex-col gap-0.5">
           <Badge variant={count > 0 ? (isUrgent ? 'urgent' : 'warning') : 'default'}>
              {isUrgent ? 'Critical' : 'Needs Attention'}
           </Badge>
         </div>
       </div>
       <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-medium">
         These tasks missed their deadline and were moved to today.
       </p>
    </Link>
  );
};

// --- CODERS ONLY ---

export const MyFlagsWidget = () => {
    const { data: flags, isLoading } = useQuery<Flag[]>({
      queryKey: ['my-flags'],
       queryFn: async () => {
        try {
            const res = await api.get('/flags');
            return Array.isArray(res.data) ? res.data : MOCK_FLAGS;
        } catch (e) {
            return MOCK_FLAGS;
        }
      },
    });
  
    if (isLoading) return <Skeleton className="h-48 w-full" />;
    
    const allFlags = Array.isArray(flags) ? flags : [];

    return (
      <Link to="/flags" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] min-h-[190px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">My Flags</h3>
        <div className="space-y-4">
            {allFlags.slice(0, 2).map(flag => (
                <div key={flag.id} className="flex justify-between items-center py-2 border-b border-[#2e2e2e]/50">
                    <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-[10px] text-muted-foreground uppercase truncate opacity-70">Task: {flag.task_title}</span>
                        <span className="text-[11px] font-bold truncate">{flag.message}</span>
                    </div>
                    <Badge variant={flag.status === 'resolved' ? 'success' : 'warning'}>
                      {flag.status.replace('_', ' ')}
                    </Badge>
                </div>
            ))}
            {allFlags.length === 0 && <p className="text-[10px] text-muted-foreground uppercase">All clear. No active flags.</p>}
        </div>
      </Link>
    );
};

// --- MANAGERS + ADMINS ---

export const TeamSummaryWidget = () => {
  const { data: summary, isLoading } = useQuery<TaskSummary>({
    queryKey: ['team-summary'],
    queryFn: async () => {
      try {
        const res = await api.get('/tasks');
        const tasks = Array.isArray(res.data) ? res.data : MOCO_TASKS;
        return {
          activeCount: tasks.filter(t => t.status !== 'completed').length,
          inReviewCount: tasks.filter(t => t.status === 'in_review').length,
          overdueCount: tasks.filter(t => new Date(t.current_deadline) < new Date() && t.status !== 'completed').length,
          totalCount: tasks.length
        };
      } catch (e) {
        return {
            activeCount: MOCO_TASKS.filter(t => t.status !== 'completed').length,
            inReviewCount: MOCO_TASKS.filter(t => t.status === 'in_review').length,
            overdueCount: MOCO_TASKS.filter(t => new Date(t.current_deadline) < new Date() && t.status !== 'completed').length,
            totalCount: MOCO_TASKS.length
          };
      }
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="p-5 bg-[#1a1a1a] border border-[#2e2e2e] grid grid-cols-2 gap-4 min-h-[190px]">
      <div className="col-span-2 flex justify-between items-center mb-2">
         <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Team Overview</h3>
         <ShieldAlert size={14} className="text-[#F97316]" />
      </div>
      
      <div className="p-3 bg-[#111] border border-[#2e2e2e]">
          <div className="text-2xl font-black text-white">{summary?.activeCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase font-bold">Active</div>
      </div>
      <div className="p-3 bg-[#111] border border-[#2e2e2e]">
          <div className="text-2xl font-black text-[#F97316]">{summary?.inReviewCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase font-bold">In Review</div>
      </div>
      <div className="p-3 bg-[#111] border border-[#2e2e2e] col-span-2 flex justify-between items-center border-l-orange-500 border-l-2">
          <div>
            <div className="text-2xl font-black text-red-500">{summary?.overdueCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase font-bold">Overdue</div>
          </div>
          <AlertCircle className="text-red-500 opacity-20" size={32} />
      </div>
    </div>
  );
};

export const FlaggedTasksWidget = () => {
  const { data: flags, isLoading } = useQuery<Flag[]>({
    queryKey: ['admin-flags'],
    queryFn: async () => {
        try {
            const res = await api.get('/flags');
            const data = Array.isArray(res.data) ? res.data : MOCK_FLAGS;
            return data.filter((f: Flag) => f.status === 'pending_review');
        } catch (e) {
            return MOCK_FLAGS.filter((f: Flag) => f.status === 'pending_review');
        }
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allFlags = Array.isArray(flags) ? flags : [];
  const count = allFlags.length;

  return (
    <Link to="/flags" className="block group p-5 bg-[#1a1a1a] border border-[#2e2e2e] min-h-[190px]">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 text-right">Flagged Tasks</h3>
      <div className="flex flex-row-reverse items-baseline gap-4 mb-4">
         <span className={cn(
           "text-5xl font-black tracking-tighter",
           count > 0 ? "text-[#F97316]" : "text-muted-foreground/30"
         )}>
           {count.toString().padStart(2, '0')}
         </span>
         <div className="flex flex-col items-end gap-0.5">
           <Badge variant={count > 0 ? 'warning' : 'default'} className="bg-orange-500/20 border-orange-500/30 text-orange-500">
              Waiting for Review
           </Badge>
         </div>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase leading-relaxed text-right opacity-60 font-medium">
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
        try {
          const res = await api.get('/tasks');
          const data = Array.isArray(res.data) ? res.data : MOCO_TASKS;
          return data.filter((t: Task) => (t.carry_forward_count >= 3 || (t.flag_count > 0 && !t.is_frozen)));
        } catch (e) {
            return MOCO_TASKS.filter((t: Task) => (t.carry_forward_count >= 3 || (t.flag_count > 0 && !t.is_frozen)));
        }
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const allEscalated = Array.isArray(escalated) ? escalated : [];

  return (
    <div className="p-5 bg-red-950/10 border border-red-900/50 col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="text-red-500" size={20} />
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-500">Escalations</h3>
          <div className="h-[1px] flex-1 bg-red-500/20" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {allEscalated.slice(0, 3).map(task => (
           <div key={task.id} className="p-3 bg-red-950/20 border border-red-900/30 flex flex-col gap-2 relative overflow-hidden">
              <span className="text-[11px] font-bold truncate">{task.name}</span>
              <div className="flex gap-2">
                 {task.carry_forward_count >= 3 && <Badge variant="urgent">Pushed forward ({task.carry_forward_count})</Badge>}
                 {task.flag_count > 0 && <Badge variant="urgent">Flagged</Badge>}
              </div>
           </div>
         ))}
         {allEscalated.length === 0 && <p className="text-[10px] text-red-500 uppercase font-bold opacity-40">No critical escalations.</p>}
      </div>
    </div>
  );
};
