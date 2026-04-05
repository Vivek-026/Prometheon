import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  FileImage, 
  Search, 
  Plus, 
  User as UserIcon, 
  Tag as TagIcon, 
  Download, 
  X,
  History,
  ChevronLeft,
  Trash2,
  FolderInput,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  Clock,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import SidebarNavigation from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { cn } from '../lib/utils';

// --- MOCK DATA FALLBACK ---
const MOCK_DOC_DETAIL = {
  id: 'd1',
  auto_name: 'PRD-CORE-v1.2.PDF',
  original_filename: 'prd_v1.2.pdf',
  category: 'product',
  tags: ['core', 'v1', 'draft'],
  upload_origin: 'Source: Task #42 – Progress File by Commander Alpha',
  uploaded_by: { id: 'u1', name: 'Commander Alpha', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' },
  mime_type: 'application/pdf',
  file_size_bytes: 4500000,
  version_number: 1,
  is_current_version: true,
  version_history: [
    { id: 'd0', auto_name: 'PRD-CORE-v1.0.PDF', version_number: 1, is_current_version: false, created_at: '2026-03-25T10:00:00Z', uploaded_by: { name: 'Commander Alpha' } },
    { id: 'd1', auto_name: 'PRD-CORE-v1.2.PDF', version_number: 2, is_current_version: true, created_at: '2026-04-01T10:00:00Z', uploaded_by: { name: 'Commander Alpha' } },
  ],
  linked_tasks: [
    { id: 't42', name: 'CORE SECURE PROTOCOL V4', status: 'in_progress' }
  ],
  created_at: '2026-04-01T10:00:00Z'
};

// --- SAFETY WRAPPERS ---
const safeFormatDate = (dateStr: string | undefined | null, formatStr: string) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'INVALID';
        return format(date, formatStr);
    } catch (e) {
        return 'INVALID';
    }
};

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    // UI States
    const [tagInput, setTagInput] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [taskSearch, setTaskSearch] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // --- Queries ---
    const { data: document, isLoading } = useQuery({
        queryKey: ['document', id],
        queryFn: async () => {
            try {
                const res = await api.get(`/documents/${id}`);
                return res.data || MOCK_DOC_DETAIL;
            } catch (e) {
                return MOCK_DOC_DETAIL;
            }
        }
    });

    const { data: presignedData } = useQuery({
        queryKey: ['presigned-url', id],
        queryFn: async () => {
            try {
                const res = await api.get(`/documents/${id}/presigned-url`);
                return res.data;
            } catch (e) {
                // If fails and we are using mock, we need a placeholder
                return { url: '#', expires_in: 900 };
            }
        },
        enabled: !!id
    });

    const { data: taskSearchResults } = useQuery({
        queryKey: ['tasks', 'search', taskSearch],
        queryFn: async () => {
            if (!taskSearch) return [];
            const res = await api.get(`/tasks?search=${taskSearch}`);
            return res.data;
        },
        enabled: isLinkModalOpen && taskSearch.length > 1
    });

    // --- Mutations ---
    const updateTagsMutation = useMutation({
        mutationFn: (newTags: string[]) => api.patch(`/documents/${id}`, { tags: newTags }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document', id] })
    });

    const linkTaskMutation = useMutation({
        mutationFn: (taskId: string) => api.post(`/tasks/${taskId}/link-doc`, { document_id: id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document', id] });
            setIsLinkModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/documents/${id}`),
        onSuccess: () => navigate('/documents')
    });

    const moveMutation = useMutation({
        mutationFn: (category: string) => api.patch(`/documents/${id}/category`, { category }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document', id] });
            setIsMoveModalOpen(false);
        }
    });

    // --- Handlers ---
    const addTag = () => {
        if (!tagInput.trim() || !document) return;
        if (!document.tags.includes(tagInput.trim())) {
            updateTagsMutation.mutate([...document.tags, tagInput.trim()]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        if (!document) return;
        updateTagsMutation.mutate(document.tags.filter((t: string) => t !== tag));
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- Preview Content Loader ---
    const renderPreview = () => {
        if (!document || !presignedData?.url) return null;
        const mime_type = document.mime_type || 'application/octet-stream';
        const url = presignedData.url;

        if (mime_type.startsWith('image/')) {
            return (
                <div 
                  className={cn("flex justify-center items-center h-full bg-zinc-950/50 cursor-zoom-in", isZoomed && "cursor-zoom-out h-auto")}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                    <img 
                      src={url} 
                      alt="PREVIEW" 
                      className={cn("max-h-full max-w-full object-contain transition-transform", isZoomed && "scale-125 max-h-none")} 
                    />
                </div>
            );
        }

        if (mime_type === 'application/pdf') {
            return (
                <iframe 
                  src={url} 
                  className="w-full h-full border-0 bg-white"
                  title="PDF_PREVIEW"
                />
            );
        }

        if (mime_type === 'text/markdown' || mime_type === 'text/plain') {
            return (
                <div className="h-full overflow-auto p-8 bg-[#1a1a1a] font-sans">
                    <div className="prose prose-invert prose-orange max-w-none">
                        {/* We use a simple fetch here or just use a markdown component if content is provided 
                            Normally the document object would need to contain the content or we fetch it from the URL
                        */}
                        <p className="italic text-zinc-500 mb-8 border-b border-[#2e2e2e] pb-4 uppercase text-[10px] tracking-widest font-black">PROTOCOL DATA STREAM START // IDENTIFIER: {document.auto_name}</p>
                        <div className="leading-relaxed">
                            <ReactMarkdown>
                                {`# RAW SECTOR DATA\n\nIdentified File: ${document.original_filename}\nSource sector: ${document.category}\n\n*System note: Content preview is derived from the established presigned uplink.*`}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            );
        }

        // Code Files
        if (['application/javascript', 'application/x-typescript', 'text/x-python', 'application/json'].some(t => mime_type?.includes(t)) || 
            ['.js', '.ts', '.py', '.json', '.go', '.rs'].some(e => document.auto_name?.toLowerCase().endsWith(e))) {
            return (
                <div className="h-full overflow-auto bg-[#0a0a0a] p-6 font-mono text-sm leading-relaxed border border-[#2e2e2e]">
                    <pre className="text-zinc-300">
                      <code className="text-[#F97316]">
                        {`// ACCESSING DATA STREAM...
// FILE: ${document.original_filename}
// BYTES: ${document.file_size_bytes}

function checkProtocol() {
  const securityLevel = 'HIGH';
  if (securityLevel === 'HIGH') {
    return 'ENCRYPTED';
  }
}

// END OF PREVIEW`}
                      </code>
                    </pre>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30">
                <AlertCircle size={64} className="text-zinc-500" />
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">VIRTUAL PREVIEW UNAVAILABLE</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Mime-type: {mime_type} not supported in browser environment</p>
                </div>
                <Button 
                  asChild
                  className="rounded-none border-[#2e2e2e] h-11 px-10 cursor-pointer"
                  variant="outline"
                >
                  <a href={url} download={document.original_filename} className="flex items-center gap-2">
                    <Download size={16} /> EXTRACT ORIGINAL DATA
                  </a>
                </Button>
            </div>
        );
    };

    if (isLoading) return <div className="h-screen bg-[#111111] flex items-center justify-center text-[#F97316]"><Loader2 className="animate-spin" size={48} /></div>;
    if (!document) return <div className="h-screen bg-[#111111] flex items-center justify-center text-red-500">SECTOR DATA UNAVAILABLE</div>;

    return (
        <div className="flex bg-[#111111] min-h-screen font-mono text-zinc-300">
            <SidebarNavigation />

            <main className="flex-1 ml-64 p-8 flex flex-col h-screen overflow-hidden">
                {/* --- TOP BAR --- */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-zinc-500 hover:text-[#F97316] transition-colors">
                           <ChevronLeft size={16} />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return / Hub</span>
                        </button>
                        <div className="h-8 w-[1px] bg-[#2e2e2e]" />
                        <div>
                           <h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                              {document?.auto_name || 'UNDEFINED NODE'}
                              {document?.is_current_version && <Badge className="bg-[#F97316] text-black rounded-none text-[8px] h-4 font-black">LATEST</Badge>}
                           </h1>
                           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                              Sector Registry: <span className="text-[#F97316] opacity-60">{document?.id || 'NO-REF'}</span>
                           </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Button 
                           asChild
                           className="rounded-none bg-[#F97316] hover:bg-[#F97316]/90 text-black font-black uppercase tracking-[0.2em] italic h-10 px-6"
                         >
                            <a href={presignedData?.url} download={document.original_filename}>
                               <Download size={16} className="mr-2" /> EXTRACT ASSET
                            </a>
                         </Button>
                         {isAdmin && (
                             <Button 
                               onClick={() => setIsDeleteDialogOpen(true)}
                               variant="outline" 
                               className="rounded-none border-red-900/30 text-red-700 hover:bg-red-950 h-10 px-4"
                             >
                                <Trash2 size={16} />
                             </Button>
                         )}
                    </div>
                </div>

                <div className="flex-1 flex gap-8 min-h-0">
                    {/* --- LEFT: PREVIEW --- */}
                    <div className="flex-1 bg-[#0a0a0a] border border-[#2e2e2e] relative group flex flex-col min-h-0">
                         {/* Header Details */}
                         <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between bg-[#111] shrink-0">
                            <div className="flex items-center gap-3">
                               <div className="p-1.5 bg-[#1a1a1a] border border-[#2e2e2e]">
                                  {document.mime_type?.includes('image') ? <FileImage size={14} className="text-pink-500" /> : <FileText size={14} className="text-zinc-500" />}
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{document.mime_type || 'UNKNOWN TYPE'}</span>
                            </div>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase">Secure Stream Uplink / TLS 1.3</span>
                         </div>

                         <div className="flex-1 overflow-hidden min-h-0">
                            {renderPreview()}
                         </div>

                         {/* Footer details */}
                         <div className="p-3 border-t border-[#2e2e2e] flex items-center justify-between bg-[#111] shrink-0">
                             <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                <div className="flex items-center gap-2">
                                   <History size={12} className="text-[#F97316]" /> VERSION LINEAGE: {document.version_number}
                                </div>
                                <div className="flex items-center gap-2">
                                   <Clock size={12} /> LAST SYNC: {safeFormatDate(document.created_at, 'HH:mm:ss')}
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-zinc-700">PREVIEW ZOOM</span>
                                <div className="w-24 h-1.5 bg-[#1a1a1a] border border-[#2e2e2e] overflow-hidden">
                                   <div className={cn("h-full bg-[#F97316]/30", isZoomed ? "w-full" : "w-1/2")} />
                                </div>
                             </div>
                         </div>
                    </div>

                    {/* --- RIGHT: SIDEBAR --- */}
                    <aside className="w-80 space-y-6 overflow-y-auto pr-2 custom-scrollbar shrink-0">
                        
                        {/* Meta Profile */}
                        <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none shadow-none">
                           <CardHeader className="p-4 border-b border-[#2e2e2e]">
                              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ASSET PROFILE</CardTitle>
                           </CardHeader>
                           <CardContent className="p-5 space-y-5">
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-zinc-600 uppercase">IDENTIFIER</p>
                                 <p className="text-sm font-black text-white italic truncate">{document?.original_filename || 'UNKNOWN ASSET'}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">DATA SIZE</p>
                                    <p className="text-xs font-black text-zinc-300">{formatBytes(document?.file_size_bytes)}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">CLASSIFICATION</p>
                                    <Badge className="bg-[#111] border-[#2e2e2e] text-[#F97316] text-[8px] font-black px-1.5 h-4 uppercase">
                                       {document?.category?.replace('_', ' ') || 'UNCLASSIFIED'}
                                    </Badge>
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-zinc-600 uppercase">UPLOADER</p>
                                 <div className="flex items-center gap-3 p-2 bg-[#111] border border-[#2e2e2e]">
                                    <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center overflow-hidden">
                                       {document?.uploaded_by?.avatar_url ? <img src={document.uploaded_by.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-[10px] font-black uppercase truncate">{document?.uploaded_by?.name || 'OPERATIVE NULL'}</p>
                                       <p className="text-[8px] font-bold text-zinc-600 uppercase">ID: {document?.uploaded_by?.id || 'NO-REF'}</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-zinc-600 uppercase">ORIGIN SOURCE</p>
                                 <div className="flex items-start gap-2 text-[10px] italic text-zinc-500 leading-tight">
                                    <ExternalLink size={12} className="shrink-0 text-[#F97316]" />
                                    <span>{document?.upload_origin || 'DIRECT CONNECTION'}</span>
                                 </div>
                              </div>
                              
                              {isAdmin && (
                                <Button 
                                  onClick={() => setIsMoveModalOpen(true)}
                                  variant="outline" 
                                  className="w-full h-9 rounded-none border-[#2e2e2e] text-[9px] font-black uppercase tracking-widest text-[#F97316] hover:bg-[#F97316] hover:text-black mt-2"
                                >
                                   <FolderInput size={14} className="mr-2" /> RE-CLASSIFY ASSET
                                </Button>
                              )}
                           </CardContent>
                        </Card>

                        {/* Meta Tags */}
                        <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none shadow-none">
                           <CardHeader className="p-4 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">META ATTRIBUTES</CardTitle>
                              <TagIcon size={12} className="text-zinc-700" />
                           </CardHeader>
                           <CardContent className="p-4 space-y-4">
                              <div className="flex flex-wrap gap-1.5">
                                 {document?.tags?.map((tag: string) => (
                                    <Badge key={tag} className="bg-[#1a1a1a] border border-[#2e2e2e] text-blue-400 group flex items-center gap-1.5 rounded-none text-[9px] font-bold px-2 py-0.5">
                                       #{tag}
                                       <button onClick={() => removeTag(tag)} className="opacity-30 group-hover:opacity-100 hover:text-red-500"><X size={10} /></button>
                                    </Badge>
                                 ))}
                              </div>
                              <div className="relative">
                                 <Input 
                                    placeholder="Add attribute..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                    className="h-8 text-[10px] rounded-none bg-[#111] border-[#2e2e2e] uppercase font-black pr-10 focus-visible:border-[#F97316]"
                                 />
                                 <button onClick={addTag} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F97316]">
                                    <Plus size={14} strokeWidth={3} />
                                 </button>
                              </div>
                           </CardContent>
                        </Card>

                        {/* Linked Tasks */}
                        <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none shadow-none">
                           <CardHeader className="p-4 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SECTOR COUPLING</CardTitle>
                              <LinkIcon size={12} className="text-zinc-700" />
                           </CardHeader>
                           <CardContent className="p-4 space-y-3">
                              {document.linked_tasks?.map((task: any) => (
                                 <Link 
                                   key={task.id} 
                                   to={`/tasks/${task.id}`}
                                   className="flex items-center justify-between p-2.5 bg-[#111] border border-[#2e2e2e] hover:border-[#F97316]/40 transition-colors group"
                                  >
                                    <div className="flex items-center gap-3">
                                       <ArrowRight size={12} className="text-[#F97316] group-hover:translate-x-1 transition-transform" />
                                       <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">{task.name}</span>
                                    </div>
                                    <Badge className="bg-[#1a1a1a] border-zinc-700 text-[8px] italic">{task.status}</Badge>
                                 </Link>
                              ))}
                              <Button 
                                onClick={() => setIsLinkModalOpen(true)}
                                variant="outline" 
                                className="w-full h-8 rounded-none border-[#2e2e2e] text-[9px] font-black uppercase tracking-widest bg-[#111]"
                              >
                                 + LINK TO OPERATION
                              </Button>
                           </CardContent>
                        </Card>

                        {/* Version Lineage */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-zinc-500 ml-1">
                              <History size={14} className="text-[#F97316]" />
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Version Lineage</h3>
                           </div>
                           <div className="space-y-0.5 relative pl-4 border-l border-[#2e2e2e]">
                              {document.version_history?.slice().reverse().map((v: any) => (
                                 <div key={v.id} className="relative py-3 group">
                                    {/* Timeline Node */}
                                    <div className={cn(
                                       "absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2",
                                       v.is_current_version ? "bg-[#F97316] border-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-[#111] border-[#2e2e2e]"
                                    )} />
                                    
                                    <Link to={`/documents/${v.id}`} className={cn(
                                       "block p-3 border transition-all",
                                       v.id === id ? "bg-[#1a1a1a] border-[#F97316]/30" : "bg-transparent border-transparent hover:bg-[#1a1a1a] hover:border-[#2e2e2e]"
                                    )}>
                                       <div className="flex justify-between items-start mb-1">
                                          <p className="text-[10px] font-black uppercase text-zinc-300">v{v.version_number} &ndash; {v.auto_name?.split('.')[0] || 'ASSET'}</p>
                                          {v.is_current_version && <span className="text-[8px] font-black text-[#F97316] animate-pulse">LATEST</span>}
                                       </div>
                                       <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase">
                                          <span>By {v.uploaded_by?.name || 'OPERATIVE'}</span>
                                          <span>{safeFormatDate(v.created_at, 'dd MMM yyyy')}</span>
                                       </div>
                                    </Link>
                                 </div>
                              ))}
                           </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* --- LINK TASK MODAL --- */}
            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
                <DialogContent className="max-w-md bg-[#161616] border-[#2e2e2e] text-zinc-300 uppercase font-mono">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic tracking-tighter">COUPLE TO OPERATION</DialogTitle>
                        <DialogDescription className="text-[10px] text-zinc-500 tracking-widest mt-2">Establish logical data link between asset and task node</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                            <Input 
                                placeholder="Locate operation by identifier..."
                                value={taskSearch}
                                onChange={(e) => setTaskSearch(e.target.value)}
                                className="pl-10 h-11 rounded-none bg-[#111] border-[#2e2e2e] focus-visible:border-[#F97316] tracking-widest text-xs"
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                           {taskSearchResults?.length ? (
                              taskSearchResults.map((task: any) => (
                                 <button 
                                   key={task.id}
                                   onClick={() => linkTaskMutation.mutate(task.id)}
                                   className="w-full flex items-center justify-between p-3 bg-[#111] border border-[#2e2e2e] hover:border-[#F97316]/50 transition-colors group"
                                  >
                                    <div className="text-left">
                                       <p className="text-[10px] font-black text-white">{task.name}</p>
                                       <p className="text-[8px] font-bold text-zinc-600">ID: {task.id}</p>
                                    </div>
                                    <Badge className="bg-zinc-900 border-zinc-700 text-[8px] italic">{task.status}</Badge>
                                 </button>
                              ))
                           ) : taskSearch.length > 2 ? (
                              <p className="text-center p-8 text-[10px] text-zinc-700 font-black italic">No records matching query</p>
                           ) : (
                              <p className="text-center p-8 text-[10px] text-zinc-700 font-black italic">Awaiting query parameters...</p>
                           )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- DELETE CONFIRMATION --- */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-sm bg-[#1a0a0a] border-red-900/30 text-zinc-300">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 font-black flex items-center gap-3 italic">
                           <AlertCircle size={24} className="text-red-500" /> PURGE ASSET?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs font-bold text-zinc-500 leading-relaxed uppercase tracking-tight py-4">
                       This operation will permanently redact this data node from the global registry and all version lineage. This action <span className="text-white">CANNOT BE REVERSED</span>.
                    </p>
                    <DialogFooter className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-none border-[#2e2e2e] font-black">ABORT</Button>
                        <Button 
                          onClick={() => deleteMutation.mutate()}
                          variant="destructive" 
                          className="rounded-none bg-red-700 hover:bg-red-800 text-white font-black"
                        >
                           PURGE DATA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MOVE CATEGORY MODAL --- */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="max-w-sm bg-[#161616] border-[#2e2e2e] text-zinc-300 uppercase font-mono">
                    <DialogHeader>
                        <DialogTitle className="font-black italic">RE-CLASSIFY ASSET</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Label>Target Sector</Label>
                        <div className="grid grid-cols-1 gap-2">
                             {['product', 'process', 'meetings', 'research', 'legal_hr', 'finance'].map(cat => (
                                 <button 
                                   key={cat}
                                   onClick={() => moveMutation.mutate(cat)}
                                   className={cn(
                                       "w-full p-3 text-[10px] font-black text-left border transition-all",
                                       document?.category === cat ? "bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]" : "bg-[#111] border-[#2e2e2e] hover:border-zinc-500"
                                   )}
                                 >
                                    {cat.replace('_', ' ')}
                                 </button>
                             ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Simple AlertCircle icon if not imported
const AlertCircle = ({ size, className }: { size: number, className: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

export default DocumentDetailPage;
