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
            const res = await api.get(`/documents/${id}`);
            return res.data;
        }
    });

    const { data: presignedData } = useQuery({
        queryKey: ['presigned-url', id],
        queryFn: async () => {
            const res = await api.get(`/documents/${id}/presigned-url`);
            return res.data;
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
                        <p className="italic text-zinc-500 mb-8 border-b border-[#2e2e2e] pb-4 text-xs font-medium">Document: {document.auto_name}</p>
                        <div className="leading-relaxed">
                            <ReactMarkdown>
                                {`# ${document.original_filename}\n\nCategory: ${document.category}\n\n*Content preview is loaded from the file.*`}
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
                  <h3 className="text-xl font-semibold">Preview not available</h3>
                  <p className="text-xs font-bold mt-2">Mime-type: {mime_type} not supported in browser environment</p>
                </div>
                <Button 
                  asChild
                  className="rounded-none border-[#2e2e2e] h-11 px-10 cursor-pointer"
                  variant="outline"
                >
                  <a href={url} download={document.original_filename} className="flex items-center gap-2">
                    <Download size={16} /> Download File
                  </a>
                </Button>
            </div>
        );
    };

    if (isLoading) return <div className="h-screen bg-[#111111] flex items-center justify-center text-[#F97316]"><Loader2 className="animate-spin" size={48} /></div>;
    if (!document) return <div className="h-screen bg-[#111111] flex items-center justify-center text-red-500">Document not found</div>;

    return (
        <div className="flex bg-[#111111] min-h-screen text-zinc-300">
            <SidebarNavigation />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex flex-col min-h-screen lg:h-screen overflow-auto lg:overflow-hidden">
                {/* --- TOP BAR --- */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8 shrink-0 pt-10 md:pt-0">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-zinc-500 hover:text-[#F97316] transition-colors">
                           <ChevronLeft size={16} />
                           <span className="text-xs font-medium">Back to Documents</span>
                        </button>
                        <div className="h-8 w-[1px] bg-[#2e2e2e]" />
                        <div>
                           <h1 className="text-2xl font-semibold flex items-center gap-2 break-words">
                              {document?.auto_name || document?.original_filename || 'Untitled Document'}
                              {document?.is_current_version && <Badge className="bg-[#F97316] text-black rounded-none text-[10px] h-4 font-medium">LATEST</Badge>}
                           </h1>
                           <p className="text-xs text-zinc-600 font-bold mt-1">
                              Category: <span className="text-[#F97316] opacity-60">{document?.category?.replace('_', ' ') || 'Uncategorized'}</span>
                           </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Button 
                           asChild
                           className="rounded-none bg-[#F97316] hover:bg-[#F97316]/90 text-black font-semibold h-10 px-6"
                         >
                            <a href={presignedData?.url} download={document.original_filename}>
                               <Download size={16} className="mr-2" /> Download
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

                <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0 overflow-y-auto lg:overflow-hidden">
                    {/* --- LEFT: PREVIEW --- */}
                    <div className="flex-1 bg-[#0a0a0a] border border-[#2e2e2e] relative group flex flex-col min-h-0">
                         {/* Header Details */}
                         <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between bg-[#111] shrink-0">
                            <div className="flex items-center gap-3">
                               <div className="p-1.5 bg-[#1a1a1a] border border-[#2e2e2e]">
                                  {document.mime_type?.includes('image') ? <FileImage size={14} className="text-pink-500" /> : <FileText size={14} className="text-zinc-500" />}
                               </div>
                               <span className="text-xs font-medium text-zinc-500">{document.mime_type || 'Unknown type'}</span>
                            </div>
                            <span></span>
                         </div>

                         <div className="flex-1 overflow-hidden min-h-0">
                            {renderPreview()}
                         </div>

                         {/* Footer details */}
                         <div className="p-3 border-t border-[#2e2e2e] flex items-center justify-between bg-[#111] shrink-0">
                             <div className="flex items-center gap-6 text-[11px] font-medium text-zinc-600">
                                <div className="flex items-center gap-2">
                                   <History size={12} className="text-[#F97316]" /> Version {document.version_number}
                                </div>
                                <div className="flex items-center gap-2">
                                   <Clock size={12} /> Uploaded: {safeFormatDate(document.created_at, 'dd MMM yyyy')}
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span></span>
                                <div className="w-24 h-1.5 bg-[#1a1a1a] border border-[#2e2e2e] overflow-hidden">
                                   <div className={cn("h-full bg-[#F97316]/30", isZoomed ? "w-full" : "w-1/2")} />
                                </div>
                             </div>
                         </div>
                    </div>

                    {/* --- RIGHT: SIDEBAR --- */}
                    <aside className="w-full lg:w-80 space-y-6 overflow-y-auto pr-0 lg:pr-2 custom-scrollbar shrink-0">
                        
                        {/* Meta Profile */}
                        <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none shadow-none">
                           <CardHeader className="p-4 border-b border-[#2e2e2e]">
                              <CardTitle className="text-xs font-semibold text-zinc-500">FILE DETAILS</CardTitle>
                           </CardHeader>
                           <CardContent className="p-5 space-y-5">
                              <div className="space-y-1">
                                 <p className="text-[11px] font-medium text-zinc-600">FILE NAME</p>
                                 <p className="text-sm font-semibold text-white truncate">{document?.original_filename || 'Unknown file'}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[11px] font-medium text-zinc-600">FILE SIZE</p>
                                    <p className="text-xs font-medium text-zinc-300">{formatBytes(document?.file_size_bytes)}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[11px] font-medium text-zinc-600">CATEGORY</p>
                                    <Badge className="bg-[#111] border-[#2e2e2e] text-[#F97316] text-[10px] font-medium px-1.5 h-4">
                                       {document?.category?.replace('_', ' ') || 'Uncategorized'}
                                    </Badge>
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <p className="text-[11px] font-medium text-zinc-600">UPLOADER</p>
                                 <div className="flex items-center gap-3 p-2 bg-[#111] border border-[#2e2e2e]">
                                    <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center overflow-hidden">
                                       {document?.uploaded_by?.avatar_url ? <img src={document.uploaded_by.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-medium truncate">{document?.uploaded_by?.name || 'Unknown'}</p>
                                       <p className="text-[10px] font-bold text-zinc-600">ID: {document?.uploaded_by?.id || '\u2014'}</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <p className="text-[11px] font-medium text-zinc-600">UPLOADED FROM</p>
                                 <div className="flex items-start gap-2 text-xs text-zinc-500 leading-tight">
                                    <ExternalLink size={12} className="shrink-0 text-[#F97316]" />
                                    <span>{document?.upload_origin || 'Direct Upload'}</span>
                                 </div>
                              </div>
                              
                              {isAdmin && (
                                <Button 
                                  onClick={() => setIsMoveModalOpen(true)}
                                  variant="outline" 
                                  className="w-full h-9 rounded-none border-[#2e2e2e] text-[11px] font-medium text-[#F97316] hover:bg-[#F97316] hover:text-black mt-2"
                                >
                                   <FolderInput size={14} className="mr-2" /> Change Category
                                </Button>
                              )}
                           </CardContent>
                        </Card>

                        {/* Meta Tags */}
                        <Card className="bg-[#1a1a1a] border-[#2e2e2e] rounded-none shadow-none">
                           <CardHeader className="p-4 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                              <CardTitle className="text-xs font-semibold text-zinc-500">TAGS</CardTitle>
                              <TagIcon size={12} className="text-zinc-700" />
                           </CardHeader>
                           <CardContent className="p-4 space-y-4">
                              <div className="flex flex-wrap gap-1.5">
                                 {document?.tags?.map((tag: string) => (
                                    <Badge key={tag} className="bg-[#1a1a1a] border border-[#2e2e2e] text-blue-400 group flex items-center gap-1.5 rounded-none text-[11px] font-bold px-2 py-0.5">
                                       #{tag}
                                       <button onClick={() => removeTag(tag)} className="opacity-30 group-hover:opacity-100 hover:text-red-500"><X size={10} /></button>
                                    </Badge>
                                 ))}
                              </div>
                              <div className="relative">
                                 <Input 
                                    placeholder="Add a tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                    className="h-8 text-xs rounded-none bg-[#111] border-[#2e2e2e] font-normal pr-10 focus-visible:border-[#F97316]"
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
                              <CardTitle className="text-xs font-semibold text-zinc-500">LINKED TASKS</CardTitle>
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
                                       <span className="text-xs font-medium truncate max-w-[150px]">{task.name}</span>
                                    </div>
                                    <Badge className="bg-[#1a1a1a] border-zinc-700 text-[10px]">{task.status}</Badge>
                                 </Link>
                              ))}
                              <Button 
                                onClick={() => setIsLinkModalOpen(true)}
                                variant="outline" 
                                className="w-full h-8 rounded-none border-[#2e2e2e] text-[11px] font-medium bg-[#111]"
                              >
                                 + Link to Task
                              </Button>
                           </CardContent>
                        </Card>

                        {/* Version Lineage */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-zinc-500 ml-1">
                              <History size={14} className="text-[#F97316]" />
                              <h3 className="text-xs font-semibold">Version History</h3>
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
                                          <p className="text-xs font-medium text-zinc-300">v{v.version_number} &ndash; {v.auto_name?.split('.')[0] || 'ASSET'}</p>
                                          {v.is_current_version && <span className="text-[10px] font-medium text-[#F97316] animate-pulse">LATEST</span>}
                                       </div>
                                       <div className="flex justify-between text-[10px] font-bold text-zinc-600">
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
                <DialogContent className="max-w-md bg-[#161616] border-[#2e2e2e] text-zinc-300">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Link to Task</DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-2">Search for a task to link this document to</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                            <Input 
                                placeholder="Search tasks..."
                                value={taskSearch}
                                onChange={(e) => setTaskSearch(e.target.value)}
                                className="pl-10 h-11 rounded-none bg-[#111] border-[#2e2e2e] focus-visible:border-[#F97316] text-xs"
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
                                       <p className="text-xs font-medium text-white">{task.name}</p>
                                       <p className="text-[10px] font-bold text-zinc-600">ID: {task.id}</p>
                                    </div>
                                    <Badge className="bg-zinc-900 border-zinc-700 text-[10px]">{task.status}</Badge>
                                 </button>
                              ))
                           ) : taskSearch.length > 2 ? (
                              <p className="text-center p-8 text-xs text-zinc-700 font-medium">No records matching query</p>
                           ) : (
                              <p className="text-center p-8 text-xs text-zinc-700 font-medium">Awaiting query parameters...</p>
                           )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- DELETE CONFIRMATION --- */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-sm bg-[#1a0a0a] border-red-900/30 text-zinc-300">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 font-semibold flex items-center gap-3">
                           <AlertCircle size={24} className="text-red-500" /> Delete Document?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs font-bold text-zinc-500 leading-relaxed py-4">
                       This document will be permanently deleted. This action <span className="text-white">cannot be undone</span>.
                    </p>
                    <DialogFooter className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-none border-[#2e2e2e] font-semibold">Cancel</Button>
                        <Button
                          onClick={() => deleteMutation.mutate()}
                          variant="destructive"
                          className="rounded-none bg-red-700 hover:bg-red-800 text-white font-semibold"
                        >
                           Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MOVE CATEGORY MODAL --- */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="max-w-sm bg-[#161616] border-[#2e2e2e] text-zinc-300">
                    <DialogHeader>
                        <DialogTitle className="font-semibold">Change Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Label>New Category</Label>
                        <div className="grid grid-cols-1 gap-2">
                             {['product', 'process', 'meetings', 'research', 'legal_hr', 'finance'].map(cat => (
                                 <button 
                                   key={cat}
                                   onClick={() => moveMutation.mutate(cat)}
                                   className={cn(
                                       "w-full p-3 text-xs font-medium text-left border transition-all",
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
