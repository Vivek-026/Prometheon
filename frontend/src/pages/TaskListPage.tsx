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
    id: '1', name: 'Database Encryption Audit', status: 'pending', priority: 'urgent', carry_forward_count: 0, flag_count: 0, is_frozen: false,
    tags: ['security', 'infrastructure'], created_by: 'u1', original_deadline: '2026-04-10', current_deadline: '2026-04-10', created_at: '2026-04-01', updated_at: '2026-04-01', 
    assignees: [{ id: 'me', name: 'Alpha User', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' }]
  },
  { 
    id: '2', name: 'Core API Refactor', status: 'in_progress', priority: 'high', carry_forward_count: 2, flag_count: 1, is_frozen: false,
    tags: ['refactor', 'v2'], created_by: 'u1', original_deadline: '2026-04-10', current_deadline: '2026-04-12', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [
      { id: 'me', name: 'Alpha User', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' },
      { id: 'u2', name: 'Bravo Coder', role: 'coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo' }
    ]
  },
  { 
    id: '3', name: 'Zustand Store Polish', status: 'in_review', priority: 'medium', carry_forward_count: 0, flag_count: 0, is_frozen: false,
    tags: ['frontend', 'ui'], created_by: 'u1', original_deadline: '2026-04-08', current_deadline: '2026-04-08', created_at: '2026-04-01', updated_at: '2026-04-01',
    assignees: [{ id: 'u2', name: 'Bravo Coder', role: 'coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo' }]
  },
  { 
    id: '4', name: 'Legacy Repo Migration', status: 'flagged', priority: 'urgent', carry_forward_count: 4, flag_count: 3, is_frozen: true,
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
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", variants[variant] || variants.default)}>
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

    const filteredTasks = Array.isArray(tasks) ? tasks : MOCK_TASKS_LIST;

    return (
        <div className="flex bg-[#111111] min-h-screen">
          <Sidebar />

          <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto w-full">
            <PageHeader title="Tasks" subtitle="Showing all tasks" />

            {/* Controls Bar */}
            <div className="mb-8 p-4 md:p-6 bg-[#1a1a1a] border border-[#2e2e2e] flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
               <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-[#F97316] transition-colors" size={18} />
                  <Input 
                    placeholder="Search tasks..." 
                    className="pl-10 bg-[#0d0d0d] border-[#2e2e2e] rounded-sm focus:border-[#F97316]/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>

               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                 <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#2e2e2e]">
                    <Filter size={14} className="text-zinc-600" />
                    <select 
                      className="bg-transparent text-[10px] uppercase font-black tracking-widest text-zinc-300 outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                      <option value="flagged">Flagged</option>
                    </select>
                 </div>

                 <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#2e2e2e]">
                    <Clock size={14} className="text-zinc-600" />
                    <select 
                      className="bg-transparent text-[10px] uppercase font-black tracking-widest text-zinc-300 outline-none"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as any)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                 </div>

                 {canCreateTask && (
                   <Button className="bg-[#F97316] hover:bg-[#EA580C] text-black font-black uppercase text-[10px] tracking-widest rounded-sm py-5 mt-2 sm:mt-0">
                     <Plus size={16} className="mr-2" /> New Task
                   </Button>
                 )}
               </div>
            </div>

            {/* Task List Grid */}
            <div className="space-y-4">
               {isLoading ? (
                 <TaskListSkeleton />
               ) : filteredTasks.length === 0 ? (
                 <div className="p-20 text-center border-2 border-dashed border-[#2e2e2e] opacity-20 italic font-black uppercase text-2xl tracking-tighter">
                   No Tasks Found
                 </div>
               ) : filteredTasks.map(task => (
                 <Link 
                   key={task.id} 
                   to={`/tasks/${task.id}`}
                   className="block bg-[#1a1a1a] border border-[#2e2e2e] p-5 hover:border-[#F97316]/50 transition-all group overflow-hidden"
                 >
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                         <div className="flex items-center gap-3">
                            <span className="hidden sm:block text-[9px] font-black text-zinc-700 bg-zinc-900 px-2 py-0.5 border border-zinc-800 tracking-tighter shrink-0">ID: {task.id}</span>
                            <h3 className="text-sm md:text-base font-bold text-white group-hover:text-[#F97316] transition-colors truncate">{task.name}</h3>
                         </div>
                         <div className="flex flex-wrap items-center gap-3">
                            <TaskBadge variant={task.status}>{task.status.replace('_', ' ')}</TaskBadge>
                            <TaskBadge variant={task.priority}>{task.priority}</TaskBadge>
                            <div className="flex items-center gap-1.5 text-zinc-600 text-[10px] font-bold uppercase">
                               <Clock size={12} /> {new Date(task.current_deadline).toLocaleDateString()}
                            </div>
                            {task.carry_forward_count > 0 && (
                              <div className="flex items-center gap-1 text-[#F97316] text-[10px] font-black uppercase italic bg-[#F97316]/10 px-2 border border-[#F97316]/20">
                                Pushed ×{task.carry_forward_count}
                              </div>
                            )}
                            {task.flag_count > 0 && (
                              <div className="flex items-center gap-1 text-red-500 text-[10px] font-black uppercase italic bg-red-900/10 px-2 border border-red-900/20">
                                <Flag size={10} /> {task.flag_count}
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-none border-zinc-900">
                         <div className="flex -space-x-2">
                            {task.assignees.map((a, i) => (
                               <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] bg-zinc-800 overflow-hidden" title={a.name}>
                                  <img src={a.avatar_url} alt={a.name} className="w-full h-full object-cover" />
                               </div>
                            ))}
                         </div>

                         <div className="flex items-center gap-4 text-zinc-800 group-hover:text-[#F97316] transition-colors">
                            <div className="hidden lg:flex items-center gap-2">
                               {task.tags.map(tag => (
                                 <span key={tag} className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">#{tag}</span>
                               ))}
                            </div>
                            <ChevronRight size={24} />
                         </div>
                      </div>
                   </div>
                 </Link>
               ))}
            </div>
          </main>
        </div>
    );
};

export default TaskListPage;
