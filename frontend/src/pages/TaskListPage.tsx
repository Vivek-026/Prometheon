import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Task, TaskStatus, TaskPriority } from '../types/tasks';
import { cn } from '../lib/utils';
import { 
  Search, 
  Filter, 
  Plus, 
  Flag, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Tag as TagIcon
} from 'lucide-react';

// --- MOCK DATA FALLBACK ---
const MOCK_TASKS_LIST: Task[] = [
  { 
    id: '1', name: 'DATABASE ENCRYPTION AUDIT', status: 'pending', priority: 'urgent', carry_forward_count: 0, flag_count: 0, is_frozen: false,
    tags: ['security', 'infrastructure'], created_by: 'u1', original_deadline: '2026-04-10', current_deadline: '2026-04-10', created_at: '2026-04-01', updated_at: '2026-04-01', 
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' }]
  },
  { 
    id: '2', name: 'CORE API REFACTOR', status: 'in_progress', priority: 'high', carry_forward_count: 2, flag_count: 1, is_frozen: false,
    tags: ['refactor', 'v2'], created_by: 'u1', original_deadline: '2026-04-10', current_deadline: '2026-04-12', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [
      { id: 'me', name: 'Alpha User', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' },
      { id: 'u2', name: 'Bravo Coder', role: 'coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo' }
    ]
  },
  { 
    id: '3', name: 'ZUSTAND STORE POLISH', status: 'in_review', priority: 'medium', carry_forward_count: 0, flag_count: 0, is_frozen: false,
    tags: ['frontend', 'ui'], created_by: 'u1', original_deadline: '2026-04-08', current_deadline: '2026-04-08', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [{ id: 'u2', name: 'Bravo Coder', role: 'coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo' }]
  },
  { 
    id: '4', name: 'LEGACY REPO MIGRATION', status: 'flagged', priority: 'urgent', carry_forward_count: 4, flag_count: 3, is_frozen: true,
    tags: ['migration', 'legacy'], created_by: 'u1', original_deadline: '2026-04-01', current_deadline: '2026-04-01', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' }]
  },
];

const TaskBadge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: any }) => {
  const variants: Record<string, string> = {
    pending: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    in_progress: 'bg-blue-900/20 text-blue-400 border-blue-800/50',
    in_review: 'bg-purple-900/20 text-purple-400 border-purple-800/50',
    completed: 'bg-green-900/20 text-green-400 border-green-800/50',
    flagged: 'bg-red-900/20 text-red-500 border-red-800/50',
    reassigned: 'bg-orange-900/20 text-orange-400 border-orange-800/50',
    low: 'bg-zinc-800 text-zinc-500 border-zinc-700',
    medium: 'bg-blue-900/20 text-blue-400 border-blue-800/50',
    high: 'bg-orange-900/20 text-orange-500 border-orange-800/50',
    urgent: 'bg-red-900/20 text-red-500 border-red-800/50',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", variants[variant] || variants.default)}>
      {children}
    </span>
  );
};

const TaskListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="h-24 bg-[#1a1a1a] border border-[#2e2e2e] animate-pulse rounded-sm" />
    ))}
  </div>
);

const TaskListPage: React.FC = () => {
    const { user } = useAuthStore();
    const canCreateTask = user?.role === 'admin' || user?.role === 'task_manager';

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ['tasks', statusFilter, priorityFilter, search],
        queryFn: async () => {
          try {
            const params: any = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (priorityFilter !== 'all') params.priority = priorityFilter;
            if (search) params.search = search;
            
            const res = await api.get('/tasks', { params });
            return Array.isArray(res.data) ? res.data : MOCK_TASKS_LIST;
          } catch (e) {
            return MOCK_TASKS_LIST;
          }
        },
    });

    const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const safeFormatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return 'STABLE';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'UNKNOWN';
            return date.toLocaleDateString();
        } catch (e) {
            return 'UNKNOWN';
        }
    };

    const getDeadlineColor = (dateStr: string | undefined | null) => {
        if (!dateStr) return 'text-muted-foreground';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'text-muted-foreground';
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (date < today) return 'text-red-500';
            if (date.getTime() === today.getTime()) return 'text-orange-500';
            return 'text-muted-foreground';
        } catch (e) {
            return 'text-muted-foreground';
        }
    };

    return (
        <div className="flex bg-[#111111] min-h-screen font-mono">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                <header className="mb-10 flex flex-col gap-6">
                   <PageHeader title="Mission Operations" subtitle="Task Registry" />
                   
                   <div className="flex justify-between items-end -mt-10">
                      <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">NODE DATABASE ACCESS / ALL SECTORS</p>
                      </div>

                      {canCreateTask && (
                          <Link to="/tasks/new">
                              <Button className="h-10 px-6 bg-[#F97316] hover:bg-[#F97316]/90 text-black border-none rounded-none font-black flex gap-2">
                                  <Plus size={16} strokeWidth={3} />
                                  ESTABLISH NEW TASK
                              </Button>
                          </Link>
                      )}
                   </div>
                </header>

                {/* Filter Bar */}
                <div className="bg-[#1a1a1a] border border-[#2e2e2e] p-4 mb-8 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="SEARCH BY TASK IDENTIFIER..." 
                            className="pl-10 bg-[#111] border-[#2e2e2e] h-10 rounded-none focus-visible:ring-[#F97316]"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-[#F97316]" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-[#111] border border-[#2e2e2e] text-[10px] font-black uppercase tracking-widest px-3 h-10 outline-none focus:border-[#F97316] text-white cursor-pointer"
                        >
                            <option value="all">ALL STATUSES</option>
                            <option value="pending">PENDING</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="in_review">IN REVIEW</option>
                            <option value="completed">COMPLETED</option>
                            <option value="flagged">FLAGGED</option>
                        </select>

                        <select 
                             value={priorityFilter}
                             onChange={(e) => setPriorityFilter(e.target.value as any)}
                             className="bg-[#111] border border-[#2e2e2e] text-[10px] font-black uppercase tracking-widest px-3 h-10 outline-none focus:border-[#F97316] text-white cursor-pointer"
                        >
                            <option value="all">ALL PRIORITIES</option>
                            <option value="low">LOW</option>
                            <option value="medium">MEDIUM</option>
                            <option value="high">HIGH</option>
                            <option value="urgent">URGENT</option>
                        </select>
                    </div>
                </div>

                {/* Task List */}
                {isLoading ? (
                    <TaskListSkeleton />
                ) : filteredTasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#2e2e2e] opacity-40">
                         <AlertCircle size={48} className="mb-4" />
                         <span className="text-sm font-black uppercase">No tasks match your filters</span>
                         <span className="text-[10px] uppercase mt-1 tracking-widest">QUERY RETURNED NULL RESULT</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.map(task => (
                            <Link key={task.id} to={`/tasks/${task.id}`} className="block group">
                                <div className={cn(
                                    "bg-[#1a1a1a] border border-[#2e2e2e] p-5 flex items-center gap-6 transition-all group-hover:bg-[#222] relative overflow-hidden",
                                    "border-l-4",
                                    task.priority === 'urgent' ? 'border-l-red-500' : 
                                    task.priority === 'high' ? 'border-l-orange-500' :
                                    task.priority === 'medium' ? 'border-l-blue-500' : 'border-l-zinc-700'
                                )}>
                                    {/* Info Selection */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-black uppercase tracking-tight">{task.name}</h3>
                                            <TaskBadge variant={task.priority as any}>{task.priority}</TaskBadge>
                                            {task.flag_count > 0 && <Flag size={14} className="text-red-500" />}
                                            {task.tags?.map(tag => (
                                                <span key={tag} className="flex items-center gap-1 text-[9px] text-[#F97316]/60 font-bold uppercase tracking-widest bg-orange-500/5 px-1.5 py-0.5 border border-orange-500/10">
                                                    <TagIcon size={8} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                            <span className={cn("flex items-center gap-1.5", getDeadlineColor(task.current_deadline))}>
                                                <Clock size={12} /> DUE {safeFormatDate(task.current_deadline)}
                                            </span>
                                            <span className="opacity-30">|</span>
                                            <span className="flex items-center gap-1.5">
                                                ID: {task.id.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats Selection */}
                                    <div className="flex items-center gap-8 pr-4">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <TaskBadge variant={task.status as any}>{task.status?.replace('_', ' ')}</TaskBadge>
                                            <div className="flex gap-2">
                                                {task.carry_forward_count > 0 && (
                                                    <span className={cn(
                                                        "text-[9px] font-black px-1.5 py-0.5 uppercase tracking-tighter",
                                                        task.is_frozen ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
                                                    )}>
                                                        {task.is_frozen ? "FROZEN" : `CF X${task.carry_forward_count}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Assignees */}
                                        <div className="flex items-center">
                                            {task.assignees?.slice(0, 3).map((assignee) => (
                                                <div 
                                                    key={assignee.id}
                                                    className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] bg-[#2e2e2e] flex items-center justify-center overflow-hidden -ml-2 first:ml-0 relative group/avatar"
                                                    title={assignee.name}
                                                >
                                                    {assignee.avatar_url ? (
                                                        <img src={assignee.avatar_url} alt={assignee.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px] font-black">{assignee.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {task.assignees?.length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] bg-[#333] flex items-center justify-center -ml-2 z-10">
                                                    <span className="text-[9px] font-black">+{task.assignees.length - 3}</span>
                                                </div>
                                            )}
                                        </div>

                                        <ChevronRight size={20} className="text-[#2e2e2e] group-hover:text-[#F97316] transition-colors" />
                                    </div>

                                    {/* Industrial Decoration */}
                                    <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-10">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-0.5 h-4 bg-white" />)}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TaskListPage;
