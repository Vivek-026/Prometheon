import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  Flag, 
  Paperclip, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Link as LinkIcon,
  Code,
  Image as ImageIcon,
  MessageSquare,
  ExternalLink,
  Download,
  User,
  History,
  ShieldQuestion
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import RaiseFlagModal from '../components/tasks/RaiseFlagModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Separator } from '../components/ui/Separator';
import { cn } from '../lib/utils';
import type { Task, ProgressEntry } from '../types/tasks';

// --- Components ---

const ProgressEntryIcon = ({ type }: { type: ProgressEntry['entry_type'] }) => {
  switch (type) {
    case 'screenshot': return <ImageIcon size={16} />;
    case 'document': return <FileText size={16} />;
    case 'link': return <LinkIcon size={16} />;
    case 'text_note': return <MessageSquare size={16} />;
    case 'code_snippet': return <Code size={16} />;
    case 'doc_hub_link': return <Paperclip size={16} />;
    default: return <FileText size={16} />;
  }
};

// --- MOCK DATA FALLBACK ---
const MOCK_TASK_DETAIL: Task = {
  id: '1',
  name: 'DATABASE ENCRYPTION AUDIT',
  description: '# SECURITY PROTOCOL V4.2\n\nPerform a deep audit on all production databases to insure AES-256 compliance.\n\n### Requirements\n- Scan all schemas\n- Verify key rotation\n- Extract audit log signature',
  status: 'in_progress',
  priority: 'urgent',
  tags: ['security', 'infrastructure', 'compliance'],
  created_by: { id: 'admin1', name: 'Commander Alpha' },
  original_deadline: '2026-04-10T18:00:00Z',
  current_deadline: '2026-04-12T18:00:00Z',
  carry_forward_count: 2,
  flag_count: 1,
  is_frozen: false,
  assignees: [
    { id: 'me', name: 'Alpha User', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha', contribution_pct: 75 },
    { id: 'u2', name: 'Bravo Coder', role: 'coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo', contribution_pct: 25 }
  ],
  task_brief: {
    id: 'b1',
    auto_name: 'ENCRYPTION_GUIDE.PDF',
    s3_presigned_url: '#',
    mime_type: 'application/pdf'
  },
  progress_entries: [
    {
      id: 'e1',
      entry_type: 'text_note',
      note: 'Initial scan complete for Sector 7. No unauthorized access nodes detected.',
      uploaded_by: { id: 'me', name: 'Alpha User' },
      created_at: '2026-04-01T10:00:00Z'
    },
    {
      id: 'e2',
      entry_type: 'code_snippet',
      content: 'SELECT * FROM pg_stat_activity WHERE wait_event_type = \'Lock\';',
      note: 'Monitoring for active locks during encryption process.',
      uploaded_by: { id: 'u2', name: 'Bravo Coder' },
      created_at: '2026-04-02T14:30:00Z'
    }
  ],
  carry_forward_logs: [
    { id: 'l1', carry_number: 1, from_deadline: '2026-04-10', to_deadline: '2026-04-11', reason: 'Upstream dependency lag', created_at: '2026-04-09T09:00:00Z' },
    { id: 'l2', carry_number: 2, from_deadline: '2026-04-11', to_deadline: '2026-04-12', reason: 'Extended sector scan required', created_at: '2026-04-10T09:00:00Z' }
  ],
  linked_documents: [
    { id: 'd1', auto_name: 'GLOBAL_ENCRYPTION_POLICY.MD', link_type: 'internal', mime_type: 'text/markdown' },
    { id: 'd2', auto_name: 'AUDIT_LOG_TEMPLATE.XLSX', link_type: 'internal', mime_type: 'application/xlsx' }
  ]
};

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAddProgressOpen, setIsAddProgressOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  // --- Queries ---
  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/tasks/${id}`);
        return res.data || MOCK_TASK_DETAIL;
      } catch (e) {
        return MOCK_TASK_DETAIL;
      }
    }
  });

  // --- Mutations ---
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => api.patch(`/tasks/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex bg-[#111111] min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-[#F97316]">Loading task...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex bg-[#111111] min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
          <p className="text-xs text-muted-foreground mb-6">Could not load this task</p>
          <Link to="/tasks">
            <Button className="bg-[#F97316] text-black hover:bg-[#F97316]/90 rounded-none font-semibold px-8">
              Back to Tasks
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const isManager = user?.role === 'admin' || user?.role === 'task_manager';
  const isAssignee = task.assignees?.some(a => a.id === user?.id) || false;

  const getDeadlineColor = (dateStr: string | undefined) => {
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

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return 'UNSET';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'INVALID DATA';
      return format(date, formatStr);
    } catch (e) {
      return 'INVALID DATA';
    }
  };

  const safeFormatDistance = (dateStr: string | undefined) => {
    if (!dateStr) return 'STABLE';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'UNKNOWN';
      return formatDistanceToNow(date);
    } catch (e) {
      return 'UNKNOWN';
    }
  };

  return (
    <div className="flex bg-[#111111] min-h-screen selection:bg-[#F97316] selection:text-black">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-32">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 md:mb-10 pt-10 md:pt-0">
          <Link to="/tasks" className="inline-flex items-center gap-2 group">
            <div className="p-1 bg-[#1a1a1a] border border-[#2e2e2e] group-hover:bg-[#F97316] group-hover:text-black transition-colors">
              <ChevronLeft size={16} strokeWidth={3} />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">
              Back to Tasks
            </span>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* LEFT COLUMN: PRIMARY WORKSPACE */}
          <div className="flex-1 max-w-4xl space-y-12">
            
            {/* 1. Header & ID Card */}
            <section className="space-y-6">
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-[#F97316]" />
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-semibold leading-none mb-4">
                  {task.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={task.status as any}>{task.status?.replace('_', ' ')}</Badge>
                  <Badge variant={task.priority as any}>{task.priority}</Badge>
                  <Separator orientation="vertical" className="h-4 bg-[#2e2e2e]" />
                  {task.tags?.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-medium text-[#F97316]/60 bg-[#F97316]/5 border border-[#F97316]/10 px-2 py-0.5"
                    >
                      # {tag}
                    </span>
                  ))}
                  {task.flag_count > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-900/20 text-red-500 border border-red-500/30 text-xs font-medium">
                       <Flag size={12} fill="currentColor" /> {task.flag_count} FLAGS
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Description (Markdown) */}
            <section className="bg-[#1a1a1a] border border-[#2e2e2e] p-8 relative overflow-hidden group">
               {/* Industrial Background pattern */}
              <div className="absolute top-0 right-0 p-1 opacity-5 select-none pointer-events-none text-[80px] font-semibold">DESC</div>
              
              <div className="prose prose-invert prose-orange max-w-none prose-sm font-sans">
                {task.description ? (
                  <ReactMarkdown>{task.description}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground text-xs">No description provided.</p>
                )}
              </div>
            </section>

            {/* 3. Task Brief (Pinned at top) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1 bg-[#F97316]" />
                  <h2 className="text-[12px] font-medium">📎 Task Brief</h2>
                </div>
                {isManager && (
                  <Button variant="outline" className="h-8 px-4 rounded-none border-[#2e2e2e] text-xs font-medium hover:bg-[#F97316] hover:text-black hover:border-transparent transition-all">
                    Update Brief
                  </Button>
                )}
              </div>
              
              <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border-[#2e2e2e]">
                <CardContent className="p-6">
                  {task.task_brief ? (
                    <div className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#111] border border-[#2e2e2e] flex items-center justify-center text-[#F97316]">
                            {task.task_brief.mime_type.includes('image') ? <ImageIcon size={24} /> : 
                             task.task_brief.mime_type.includes('pdf') ? <FileText size={24} /> : <Paperclip size={24} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{task.task_brief.auto_name}</p>
                            <p className="text-xs text-muted-foreground font-medium">{task.task_brief.mime_type} • SECTOR CLASSIFIED</p>
                          </div>
                       </div>
                       <Button className="h-9 px-6 bg-[#F97316] text-black hover:bg-[#F97316]/90 rounded-none font-semibold flex gap-2">
                          <Download size={16} /> DOWNLOAD
                       </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground opacity-40">
                       <ShieldQuestion size={32} className="mb-2" />
                       <p className="text-xs font-medium">No brief uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* 4. Progress Entries (Progress Files) */}
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1 bg-blue-500" />
                  <h2 className="text-[12px] font-medium">📁 Progress & Updates</h2>
                </div>
                {(isAssignee || isManager) && (
                  <Button 
                    onClick={() => setIsAddProgressOpen(true)}
                    className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-none font-semibold flex gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all transform hover:-translate-y-0.5"
                  >
                    <Plus size={16} strokeWidth={3} /> Add Update
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {task.progress_entries && task.progress_entries?.length > 0 ? (
                  task.progress_entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((entry) => (
                    <div key={entry.id} className="group flex gap-4 transition-all hover:translate-x-1">
                      {/* Timeline Decoration */}
                      <div className="flex flex-col items-center py-2">
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center text-zinc-500 overflow-hidden ring-2 ring-[#111]">
                          {entry.uploaded_by.avatar_url ? (
                            <img src={entry.uploaded_by.avatar_url} alt={entry.uploaded_by.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium">{entry.uploaded_by.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 w-[1px] bg-[#2e2e2e] my-1" />
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] transition-colors group-hover:border-[#F97316]/30 overflow-hidden">
                        <div className="px-4 py-2 bg-[#111]/50 border-b border-[#2e2e2e] flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <span className="text-[#F97316]"><ProgressEntryIcon type={entry.entry_type} /></span>
                             <span className="text-xs font-medium">{entry.entry_type.replace('_', ' ')}</span>
                           </div>
                           <span className="text-[11px] text-muted-foreground font-medium">
                             {safeFormatDistance(entry.created_at)} ago
                           </span>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          {entry.note && <p className="text-xs text-zinc-300 leading-relaxed font-sans">{entry.note}</p>}
                          
                          {/* Rendering based on type */}
                          {entry.entry_type === 'screenshot' && entry.document?.s3_presigned_url && (
                             <div className="mt-4 border border-[#2e2e2e] overflow-hidden bg-[#111] p-1">
                               <img src={entry.document.s3_presigned_url} alt="Screenshot" className="w-full h-auto max-h-[400px] object-contain" />
                             </div>
                          )}

                          {entry.entry_type === 'code_snippet' && entry.content && (
                            <pre className="mt-4 p-4 bg-black border border-[#2e2e2e] overflow-x-auto text-xs text-green-500/80 font-mono scrollbar-thin scrollbar-thumb-zinc-800">
                              <code>{entry.content}</code>
                            </pre>
                          )}

                          {(entry.entry_type === 'link' || entry.entry_type === 'doc_hub_link') && entry.content && (
                            <a 
                              href={entry.content} 
                              target="_blank" 
                              rel="noreferrer"
                              className="mt-2 flex items-center gap-3 p-3 bg-[#111] border border-[#2e2e2e] hover:border-[#F97316] transition-colors text-xs text-[#F97316] font-bold"
                            >
                              <ExternalLink size={14} /> 
                              <span className="truncate">{entry.content}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-[#2e2e2e] rounded-sm opacity-30">
                    <History size={32} className="mb-2" />
                    <p className="text-xs font-medium">No updates yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: SPECS & CONTROL */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="lg:sticky lg:top-8 space-y-6">
              
              {/* Mark as Completed - Admin/Manager only when in_review */}
              {isManager && task.status === 'in_review' && (
                <Button 
                  onClick={() => statusMutation.mutate('completed')}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-none border-none font-semibold shadow-[0_0_20px_rgba(22,163,74,0.3)] animate-pulse"
                >
                  <CheckCircle2 className="mr-2" size={18} /> MARK AS COMPLETED
                </Button>
              )}

              {/* Status Transitions for Assignees */}
              {isAssignee && (
                <div className="space-y-3">
                   {task.status === 'pending' && (
                     <Button 
                       onClick={() => statusMutation.mutate('in_progress')}
                       className="w-full h-12 bg-[#F97316] hover:bg-[#F97316]/90 text-black rounded-none border-none font-semibold shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                     >
                        START TASK
                     </Button>
                   )}
                   {task.status === 'in_progress' && (
                     <Button 
                       onClick={() => {
                         if (!task.progress_entries || task.progress_entries.length === 0) {
                           alert('Upload at least one progress file before submitting for review');
                           return;
                         }
                         statusMutation.mutate('in_review');
                       }}
                       className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-none border-none font-semibold"
                     >
                        SUBMIT FOR REVIEW
                     </Button>
                   )}
                </div>
              )}

              {/* Deadline & Chrono */}
              <Card>
                <CardHeader className="pb-3 px-4 pt-4 border-b border-[#2e2e2e]">
                  <CardTitle className="text-xs text-zinc-500">DEADLINES</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">ORIGINAL DEADLINE</p>
                    <p className="text-xs font-bold text-zinc-400">{safeFormatDate(task.original_deadline, 'PPpp')}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">CURRENT DEADLINE</p>
                    <p className={cn("text-sm font-semibold", getDeadlineColor(task.current_deadline))}>
                      {safeFormatDate(task.current_deadline, 'PPpp')}
                    </p>
                    {task.current_deadline !== task.original_deadline && (
                      <div className="inline-block mt-1 px-1.5 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-medium border border-orange-500/20">
                        DEADLINE CHANGED
                      </div>
                    )}
                  </div>

                  {task.carry_forward_count > 0 && (
                    <>
                      <Separator className="bg-[#2e2e2e]" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-zinc-500">CARRY FORWARD</span>
                          <span className="text-yellow-500">X{task.carry_forward_count}</span>
                        </div>
                        <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                           {task.carry_forward_logs?.slice().reverse().map(log => (
                             <div key={log.id} className="mb-2 last:mb-0 border-l-2 border-yellow-500/30 pl-2 py-0.5">
                               <p className="text-[11px] font-normal text-zinc-400 truncate">{log.reason}</p>
                               <p className="text-[10px] text-zinc-600 font-normal">{safeFormatDate(log.created_at, 'dd MMM yyyy')}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Assignees */}
              <Card>
                <CardHeader className="pb-3 px-4 pt-4 border-b border-[#2e2e2e]">
                  <CardTitle className="text-xs text-zinc-500">ASSIGNED TO</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3">
                    {task.assignees?.map((assignee) => (
                      <div key={assignee.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-[#2e2e2e] bg-[#111] flex items-center justify-center overflow-hidden">
                            {assignee.avatar_url ? (
                              <img src={assignee.avatar_url} alt={assignee.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={14} className="text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-zinc-300">{assignee.name}</p>
                            <p className="text-[11px] text-zinc-600 font-normal">{assignee.role}</p>
                          </div>
                        </div>
                        {assignee.contribution_pct !== undefined && (
                          <div className="text-xs font-medium text-[#F97316]">{assignee.contribution_pct}%</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Linked Documents */}
              <Card>
                <CardHeader className="pb-3 px-4 pt-4 border-b border-[#2e2e2e]">
                  <CardTitle className="text-xs text-zinc-500">LINKED DOCUMENTS</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {task.linked_documents && task.linked_documents?.length > 0 ? (
                    <div className="space-y-2">
                       {task.linked_documents.map(doc => (
                         <Link key={doc.id} to={`/documents/${doc.id}`} className="flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 truncate group">
                           <LinkIcon size={10} className="group-hover:rotate-45 transition-transform" />
                           <span className="truncate">{doc.auto_name}</span>
                         </Link>
                       ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-600 font-normal text-center">No documents linked yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Flags & Roadblocks */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium text-zinc-500">FLAG STATUS</span>
                  <span className={cn("text-xs font-medium", task.flag_count > 0 ? "text-red-500" : "text-green-500")}>
                    {task.flag_count > 0 ? 'Has active flag' : 'No flags'}
                  </span>
                </div>
                {isAssignee && (task.status === 'pending' || task.status === 'in_progress') && (
                  <Button 
                    onClick={() => setIsFlagModalOpen(true)}
                    variant="outline" 
                    className="w-full border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-none font-semibold text-xs transition-all"
                  >
                    RAISE FLAG
                  </Button>
                )}
                {task.status === 'flagged' && (
                   <div className="px-3 py-2 bg-red-900/10 border border-red-500/30 text-red-500 text-xs font-medium text-center">
                     PENDING FLAG REVIEW
                   </div>
                )}
              </div>

            </div>
          </aside>
        </div>
      </main>

      {/* --- ADD PROGRESS MODAL placeholder --- */}
      {/* (Actual implementation would be a Dialog from UI) */}
      <AddProgressModal 
        isOpen={isAddProgressOpen} 
        onClose={() => setIsAddProgressOpen(false)} 
        taskId={id!}
      />
      <RaiseFlagModal 
        task={task} 
        isOpen={isFlagModalOpen} 
        onClose={() => setIsFlagModalOpen(false)} 
      />
    </div>
  );
};

// --- Add Progress Modal Component (Simplified Inline for this example) ---

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/Dialog';

const AddProgressModal = ({ isOpen, onClose, taskId }: { isOpen: boolean, onClose: () => void, taskId: string }) => {
  const [type, setType] = useState<ProgressEntry['entry_type']>('text_note');
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saveToHub, setSaveToHub] = useState(false);
  
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => api.post(`/tasks/${taskId}/progress`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      onClose();
      // Reset form
      setType('text_note');
      setContent('');
      setNote('');
      setFile(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('entry_type', type);
    formData.append('note', note);
    if (content) formData.append('content', content);
    if (file) formData.append('file', file);
    if (saveToHub) formData.append('save_to_hub', 'true');
    
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#161616] border-[#2e2e2e]">
        <DialogHeader className="border-b border-[#2e2e2e] pb-4 mb-4">
          <DialogTitle>Add Progress Update</DialogTitle>
          <DialogDescription>Attach evidence or notes to this task</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#F97316]">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#111] border border-[#2e2e2e] text-xs font-normal p-2.5 outline-none focus:border-[#F97316] text-white"
              >
                <option value="text_note">Text Note</option>
                <option value="screenshot">Screenshot (JPG/PNG)</option>
                <option value="document">Document (PDF/DOC)</option>
                <option value="link">External URL</option>
                <option value="code_snippet">Code Snippet</option>
                <option value="doc_hub_link">Doc Hub Item</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                <span>Save to Document Hub</span>
                <input type="checkbox" checked={saveToHub} onChange={e => setSaveToHub(e.target.checked)} className="accent-[#F97316]" />
              </label>
              <div className="text-[11px] text-zinc-600 bg-[#111] p-2 border border-[#2e2e2e] h-[42px] flex items-center">
                Also save this file to the Document Hub
              </div>
            </div>
          </div>

          {(type === 'screenshot' || type === 'document') && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500">File</label>
              <input 
                type="file" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full bg-[#111] border border-dashed border-[#2e2e2e] text-xs p-8 text-center cursor-pointer hover:border-[#F97316] transition-colors"
                required
              />
            </div>
          )}

          {(type === 'link' || type === 'code_snippet') && (
            <div className="space-y-2">
               <label className="text-xs font-medium text-zinc-500">
                 {type === 'link' ? 'URL' : 'Code'}
               </label>
               <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] p-4 text-xs font-mono text-zinc-300 outline-none focus:border-[#F97316]"
                  placeholder={type === 'link' ? 'https://...' : '// Paste code here...'}
                  rows={4}
                  required
               />
            </div>
          )}

          <div className="space-y-2">
             <label className="text-xs font-medium text-zinc-500">Note</label>
             <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-[#111] border border-[#2e2e2e] p-4 text-xs text-zinc-300 outline-none focus:border-[#F97316]"
                placeholder="Add context about this update..."
                rows={2}
             />
          </div>

          <DialogFooter className="pt-4 border-t border-[#2e2e2e]">
             <Button type="button" variant="outline" onClick={onClose} className="rounded-none font-medium text-xs border-[#2e2e2e]">CANCEL</Button>
             <Button
               type="submit"
               disabled={mutation.isPending}
               className="rounded-none bg-[#F97316] hover:bg-[#F97316]/90 text-black font-semibold text-xs px-8"
             >
               {mutation.isPending ? 'Saving...' : 'Save Update'}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailPage;
