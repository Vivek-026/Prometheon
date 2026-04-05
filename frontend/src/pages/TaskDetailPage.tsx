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
  name: 'Database Encryption Audit',
  description: '# SECURE DATABASE SETUP\n\nPerform a deep audit on all production databases to ensure AES-256 compliance.\n\n### Requirements\n- Scan all schemas\n- Verify key rotation\n- Check audit logs',
  status: 'in_progress',
  priority: 'urgent',
  tags: ['security', 'infrastructure', 'compliance'],
  created_by: { id: 'admin1', name: 'Alpha Admin' },
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
    auto_name: 'encryption_guide.pdf',
    s3_presigned_url: '#',
    mime_type: 'application/pdf'
  },
  progress_entries: [
    {
      id: 'e1',
      entry_type: 'text_note',
      note: 'Initial scan complete. No issues detected.',
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
    { id: 'd1', auto_name: 'global_policy.md', link_type: 'internal', mime_type: 'text/markdown' },
    { id: 'd2', auto_name: 'audit_template.xlsx', link_type: 'internal', mime_type: 'application/xlsx' }
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
        <main className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">Loading Task Details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex bg-[#111111] min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-8 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold uppercase mb-2">Not Found</h2>
          <p className="text-[10px] text-muted-foreground uppercase mb-6 tracking-widest">Failed to load task</p>
          <Link to="/tasks">
            <Button variant="outline" className="rounded-sm border-zinc-800 uppercase font-black text-xs tracking-widest">
              Back to Tasks
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';
  const isFlagged = task.flag_count > 0 || task.status === 'flagged';

  return (
    <div className="flex bg-[#111111] min-h-screen overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
            <Link to="/tasks" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest group">
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Tasks
            </Link>
        </div>

        {/* Task Header Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                   <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-500 rounded-sm italic uppercase text-[9px]">ID: {task.id}</Badge>
                   <Badge className={cn(
                     "rounded-sm uppercase text-[9px] tracking-widest",
                     task.priority === 'urgent' ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30"
                   )}>
                     {task.priority} Priority
                   </Badge>
                   {task.is_frozen && <Badge className="bg-blue-900/20 text-blue-400 border border-blue-800/50 rounded-sm uppercase text-[9px] tracking-widest italic animate-pulse">Frozen</Badge>}
                </div>
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">{task.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                      <User size={14} className="text-[#F97316]" />
                      Created By: <span className="text-zinc-300">{typeof task.created_by === 'string' ? task.created_by : task.created_by.name}</span>
                   </div>
                   <Separator orientation="vertical" className="h-3 bg-zinc-800 hidden sm:block" />
                   <div className="flex items-center gap-2">
                      <Clock size={14} className="text-zinc-500" />
                      Created {format(new Date(task.created_at), 'MMM dd, yyyy')}
                   </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {!isCompleted && (
                    <Button 
                      onClick={() => setIsFlagModalOpen(true)}
                      variant="outline" 
                      className="border-red-900/50 text-red-500 hover:bg-red-900/10 font-black uppercase text-[10px] tracking-widest rounded-sm h-11"
                    >
                        <Flag size={14} className="mr-2" /> Report Issue
                    </Button>
                )}
                
                {task.status !== 'completed' && (
                  <Button 
                    onClick={() => statusMutation.mutate('completed')}
                    disabled={statusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-black font-black uppercase text-[10px] tracking-widest rounded-sm h-11 px-6"
                  >
                      Complete Task
                  </Button>
                )}
            </div>
        </div>

        {/* Main Sector Grid (Responsive Stacking) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20 md:pb-0">
            
            {/* Left Sector: Details & Briefing */}
            <div className="xl:col-span-8 space-y-8">
                
                {/* Description Card */}
                <Card className="bg-[#0d0d0d] border border-zinc-900 rounded-none shadow-2xl overflow-hidden min-h-[300px]">
                   <CardHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#F97316]">Task Brief</CardTitle>
                      <div className="flex gap-2">
                         {task.tags.map(tag => (
                            <span key={tag} className="text-[8px] font-black uppercase text-zinc-700 bg-zinc-900 px-2 py-0.5 border border-zinc-800 italic">#{tag}</span>
                         ))}
                      </div>
                   </CardHeader>
                   <CardContent className="p-8 prose prose-invert prose-zinc max-w-none prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-sm prose-p:leading-relaxed prose-p:text-zinc-400">
                      {task.description ? (
                        <ReactMarkdown>{task.description}</ReactMarkdown>
                      ) : (
                        <p className="opacity-20 italic font-black uppercase text-center py-20">No description provided.</p>
                      )}
                   </CardContent>
                </Card>

                {/* Progress Stream */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-500">
                           <History size={14} className="text-[#F97316]" /> Progress & Updates
                        </h3>
                        <Button 
                          onClick={() => setIsAddProgressOpen(true)}
                          variant="outline" 
                          className="border-[#2e2e2e] text-[#F97316] font-black uppercase text-[9px] tracking-widest rounded-sm bg-[#1a1a1a] h-8"
                        >
                           <Plus size={12} className="mr-2" /> Add Update
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {(task.progress_entries || []).map((entry, idx) => (
                           <Card key={entry.id || idx} className="bg-[#111] border-[#2e2e2e] rounded-none group hover:border-[#F97316]/30 transition-all border-l-2 border-l-[#2e2e2e] hover:border-l-[#F97316]">
                              <CardContent className="p-5 flex gap-4">
                                 <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0 group-hover:text-[#F97316] group-hover:bg-[#F97316]/5 transition-all">
                                    <ProgressEntryIcon type={entry.entry_type} />
                                 </div>
                                 <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                       <span className="text-[10px] font-black uppercase text-zinc-400">{entry.uploaded_by.name}</span>
                                       <span className="text-[9px] text-zinc-600 font-bold italic">{formatDistanceToNow(new Date(entry.created_at))} ago</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                       {entry.entry_type === 'text_note' ? entry.note : `Uploaded a ${entry.entry_type}`}
                                    </p>
                                    {entry.entry_type === 'code_snippet' && (
                                      <pre className="bg-black/40 p-3 text-[10px] font-mono text-blue-400 border border-blue-900/20 mt-2 overflow-x-auto rounded-sm">
                                         <code>{entry.content}</code>
                                      </pre>
                                    )}
                                    {(entry.entry_type === 'screenshot' || entry.s3_presigned_url) && (
                                       <a 
                                         href={entry.s3_presigned_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer" 
                                         className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase text-[#F97316] hover:bg-[#F97316] hover:text-black transition-all rounded-sm"
                                       >
                                          <ExternalLink size={10} /> View Attachment
                                       </a>
                                    )}
                                 </div>
                              </CardContent>
                           </Card>
                        ))}
                        {(!task.progress_entries || task.progress_entries.length === 0) && (
                           <div className="p-12 text-center border-2 border-dashed border-zinc-900 opacity-20 italic font-black uppercase text-xs">Waiting for updates...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sector: Constraints & Operatives */}
            <div className="xl:col-span-4 space-y-8">
                
                {/* Protocol Constraints */}
                <Card className="bg-[#1a1a1a] border border-zinc-900 rounded-none shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F97316]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <CardHeader className="p-6 border-b border-zinc-900">
                      <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#F97316]">Deadlines</CardTitle>
                   </CardHeader>
                   <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Original Deadline</span>
                            <span className="text-xs font-black text-white italic">{format(new Date(task.original_deadline), 'MMM dd | HH:mm')}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Current Deadline</span>
                            <span className="text-xs font-black text-[#F97316] italic">{format(new Date(task.current_deadline), 'MMM dd | HH:mm')}</span>
                         </div>
                      </div>

                      {task.carry_forward_count > 0 && (
                        <div className="p-4 bg-orange-950/20 border border-orange-900/30 rounded-none">
                           <div className="flex items-center justify-between mb-3">
                              <span className="text-[9px] font-black text-orange-500 uppercase italic">Pushed {task.carry_forward_count} Times</span>
                              <AlertCircle size={14} className="text-orange-500" />
                           </div>
                           <div className="space-y-2">
                              {task.carry_forward_logs?.slice(-2).map((log, i) => (
                                 <div key={i} className="flex flex-col border-l border-orange-900/50 pl-3">
                                    <span className="text-[8px] text-zinc-500 uppercase font-black">Reason: {log.reason}</span>
                                    <span className="text-[8px] text-orange-500/70 font-bold italic">{log.from_deadline} → {log.to_deadline}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </CardContent>
                </Card>

                {/* Assigned Personnel */}
                <Card className="bg-[#1a1a1a] border border-zinc-900 rounded-none">
                   <CardHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-white">Assigned To</CardTitle>
                      <User size={14} className="text-zinc-600" />
                   </CardHeader>
                   <CardContent className="p-6 space-y-4">
                      {task.assignees.map((assignee) => (
                         <div key={assignee.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full border-2 border-zinc-800 p-0.5 group-hover:border-[#F97316] transition-all">
                                  <img src={assignee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.name}`} alt={assignee.name} className="w-full h-full rounded-full object-cover" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase text-white tracking-widest">{assignee.name}</span>
                                  <span className="text-[8px] text-zinc-600 font-bold italic uppercase">{assignee.role || 'Operative'}</span>
                               </div>
                            </div>
                            {assignee.contribution_pct && (
                              <div className="text-right">
                                 <div className="text-[10px] font-black text-[#F97316] italic">{assignee.contribution_pct}%</div>
                                 <div className="text-[7px] text-zinc-700 font-bold uppercase">Impact</div>
                              </div>
                            )}
                         </div>
                      ))}
                   </CardContent>
                </Card>

                {/* Linked Documents Hub */}
                <Card className="bg-[#1a1a1a] border border-zinc-900 rounded-none shadow-2xl">
                   <CardHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-white">Linked Documents</CardTitle>
                      <Paperclip size={14} className="text-zinc-600" />
                   </CardHeader>
                   <CardContent className="p-6 space-y-3">
                      {(task.linked_documents || []).map((doc) => (
                         <Link 
                           key={doc.id} 
                           to={`/documents/${doc.id}`}
                           className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#F97316]/50 transition-all group"
                         >
                            <div className="flex items-center gap-3">
                               <div className="text-zinc-700 group-hover:text-[#F97316] transition-colors">
                                  <FileText size={16} />
                               </div>
                               <span className="text-[10px] font-bold text-zinc-300 uppercase truncate max-w-[120px]">{doc.auto_name}</span>
                            </div>
                            <ExternalLink size={12} className="text-zinc-800 group-hover:text-zinc-500" />
                         </Link>
                      ))}
                      {(!task.linked_documents || task.linked_documents.length === 0) && (
                         <p className="text-[10px] text-zinc-700 uppercase font-bold text-center py-4">No documents linked</p>
                      )}
                   </CardContent>
                </Card>

                {/* Incident/Flag Registry */}
                <Card className={cn(
                  "bg-[#1a1a1a] rounded-none border transition-all",
                  isFlagged ? "border-red-900/50 bg-red-950/5" : "border-zinc-900"
                )}>
                   <CardHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-white">Flag Status</CardTitle>
                      <ShieldQuestion size={14} className={isFlagged ? "text-red-500" : "text-zinc-600"} />
                   </CardHeader>
                   <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col gap-1">
                            <span className={cn(
                              "text-sm font-black uppercase tracking-tight italic",
                              isFlagged ? "text-red-500" : "text-green-500"
                            )}>
                               {isFlagged ? "Has active flag" : "All Clear"}
                            </span>
                            <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
                               {isFlagged ? `${task.flag_count} Reported Issue(s)` : "No anomalies reported"}
                            </span>
                         </div>
                         {isFlagged && <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse"><Flag size={18} /></div>}
                      </div>
                   </CardContent>
                </Card>

            </div>
        </div>

        {/* Action Modals */}
        <RaiseFlagModal 
          isOpen={isFlagModalOpen} 
          onClose={() => setIsFlagModalOpen(false)} 
          taskId={task.id} 
          taskTitle={task.name}
        />
      </main>
    </div>
  );
};

export default TaskDetailPage;
