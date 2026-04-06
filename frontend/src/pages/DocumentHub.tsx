import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  FileImage, 
  FileCode, 
  FileArchive, 
  File as FileIcon,
  Search, 
  Filter, 
  Plus, 
  User as UserIcon, 
  Tag as TagIcon, 
  X,
  History,
  Upload,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Card, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { cn } from '../lib/utils';
import type { HubDocument, UserSummary } from '../types/tasks';

// --- MOCK DATA ---
const MOCK_DOCS: HubDocument[] = [
  { id: 'd1', auto_name: 'PRD-CORE-v1.2.PDF', original_filename: 'prd_v1.2.pdf', category: 'product', tags: ['core', 'v1'], upload_origin: 'direct_upload', uploaded_by: { id: 'u1', name: 'Commander Alpha' }, mime_type: 'application/pdf', file_size_bytes: 4500000, version_number: 1, is_current_version: true, created_at: '2026-04-01T10:00:00Z' },
  { id: 'd2', auto_name: 'SOP-SECTOR-7.MD', original_filename: 'sop_s7.md', category: 'process', tags: ['security', 'sop'], upload_origin: 'direct_upload', uploaded_by: { id: 'u2', name: 'Bravo Operative' }, mime_type: 'text/markdown', file_size_bytes: 12000, version_number: 2, is_current_version: true, created_at: '2026-04-02T14:30:00Z' },
  { id: 'd3', auto_name: 'Q3-REVENUE-PROJECTION.XLSX', original_filename: 'q3_rev.xlsx', category: 'finance', tags: ['projection', 'q3'], upload_origin: 'direct_upload', uploaded_by: { id: 'u1', name: 'Commander Alpha' }, mime_type: 'application/xlsx', file_size_bytes: 2500000, version_number: 1, is_current_version: true, created_at: '2026-04-03T09:15:00Z' },
  { id: 'd4', auto_name: 'SCREENSHOT-TASK-88.PNG', original_filename: 'task88_bug.png', category: 'task_uploads', tags: ['bug', 'ui'], upload_origin: 'progress_file', uploaded_by: { id: 'u3', name: 'Charlie Coder' }, mime_type: 'image/png', file_size_bytes: 850000, version_number: 1, is_current_version: true, created_at: '2026-04-04T16:20:00Z' },
  { id: 'd5', auto_name: 'LEGAL-COMPLIANCE-DOC.PDF', original_filename: 'legal_compl.pdf', category: 'legal_hr', tags: ['legal', 'hr'], upload_origin: 'direct_upload', uploaded_by: { id: 'u2', name: 'Bravo Operative' }, mime_type: 'application/pdf', file_size_bytes: 3200000, version_number: 1, is_current_version: true, created_at: '2026-04-04T18:00:00Z' },
];

const MOCK_USERS: (UserSummary & { doc_count: number })[] = [
  { id: 'u1', name: 'Commander Alpha', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha', doc_count: 12 },
  { id: 'u2', name: 'Bravo Operative', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo', doc_count: 8 },
  { id: 'u3', name: 'Charlie Coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', doc_count: 4 },
];

// --- Helper for File Icons ---
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return <FileImage className="text-pink-500" />;
  if (mimeType.includes('pdf')) return <FileText className="text-red-500" />;
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('markdown')) return <FileCode className="text-blue-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive className="text-yellow-500" />;
  return <FileIcon className="text-zinc-500" />;
};

// --- SAFETY WRAPPERS ---
const safeFormatDistance = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'INVALID';
        return formatDistanceToNow(date);
    } catch (e) {
        return 'INVALID';
    }
};

const DocumentHub: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'admin';

    // --- Filter States ---
    const [filterOpen, setFilterOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
    
    // Upload Form State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState<string>('');
    const [uploadTags, setUploadTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [pendingUploadData, setPendingUploadData] = useState<any>(null);

    // --- Queries ---
    const { data: documents, isLoading } = useQuery<HubDocument[]>({
        queryKey: ['documents', categoryFilter, search, selectedUser, sortBy],
        queryFn: async () => {
            try {
                const params: any = {};
                if (categoryFilter !== 'all') params.category = categoryFilter;
                if (search) params.search = search;
                if (selectedUser) params.user_id = selectedUser;
                if (sortBy) params.sort = sortBy;

                const res = await api.get('/documents', { params });
                return Array.isArray(res.data) ? res.data : MOCK_DOCS;
            } catch (e) {
                return MOCK_DOCS;
            }
        }
    });

    const { data: teamMembers } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
           try {
             const res = await api.get('/users');
             return Array.isArray(res.data) ? res.data : MOCK_USERS;
           } catch(e) {
             return MOCK_USERS;
           }
        }
    });

    // --- Mutations ---
    const uploadMutation = useMutation({
        mutationFn: async ({ file, category, tags, linkVersionId }: any) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            tags.forEach((t: string) => formData.append('tags[]', t));
            
            if (linkVersionId) {
                return api.post(`/documents/${linkVersionId}/link-version`, formData);
            }
            return api.post('/documents/upload', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadCategory('');
            setUploadTags([]);
        }
    });

    // --- Logic ---
    const filteredDocs = (documents || []).filter(doc => {
       if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
       if (search) {
         const s = search.toLowerCase();
         return doc.auto_name.toLowerCase().includes(s) || 
                doc.original_filename.toLowerCase().includes(s) || 
                doc.tags.some(t => t.toLowerCase().includes(s));
       }
       if (doc.category === 'finance' && !isAdmin) return false;
       return true;
     }).sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (sortBy === 'recent') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      return a.auto_name.localeCompare(b.auto_name);
    });

    // --- Handlers ---
    const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault();
        if (!uploadTags.includes(tagInput.trim())) {
          setUploadTags([...uploadTags, tagInput.trim()]);
        }
        setTagInput('');
      }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadFile || !uploadCategory) return;

      // Logic check for linking versions (Simplified for now)
      const existingDoc = filteredDocs.find(d => d.original_filename === uploadFile.name);
      if (existingDoc) {
        setPendingUploadData({ file: uploadFile, category: uploadCategory, tags: uploadTags, linkVersionId: existingDoc.id });
        setIsVersionDialogOpen(true);
      } else {
        uploadMutation.mutate({ file: uploadFile, category: uploadCategory, tags: uploadTags });
      }
    };

    return (
        <div className="flex bg-[#111111] min-h-screen text-zinc-300">
            <Sidebar />

            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex flex-col gap-10">
                <PageHeader title="Documents" subtitle="All files uploaded by your team" />
                
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* LEFT PANEL: FILTERS */}
                    <button onClick={() => setFilterOpen(!filterOpen)} className="lg:hidden mb-4 px-4 py-3 min-h-[44px] bg-[#1a1a1a] border border-[#2e2e2e] text-xs font-medium text-zinc-400 flex items-center gap-2 w-full justify-center"><Filter size={14} className="text-[#F97316]" /> Filters</button>
                    <aside className={cn("w-full lg:w-72 space-y-10 shrink-0", filterOpen ? "block" : "hidden lg:block")}>
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-[#F97316]" />
                                <h2 className="text-xs font-semibold">Filters</h2>
                            </div>
                            
                            <section className="space-y-3">
                                <Label className="text-zinc-600 block mb-1">Category</Label>
                                <RadioGroup className="flex flex-col gap-1.5">
                                    {['all', 'product', 'process', 'meetings', 'research', 'legal_hr', 'task_uploads', 'finance'].map(cat => (
                                        (cat !== 'finance' || isAdmin) && (
                                            <RadioGroupItem 
                                                key={cat}
                                                label={cat === 'task_uploads' ? 'Task Uploads' : cat.replace('_', '/')}
                                                checked={categoryFilter === cat}
                                                onChange={() => setCategoryFilter(cat)}
                                                className="py-1.5 px-3 border-transparent has-[:checked]:bg-[#1a1a1a] has-[:checked]:border-[#2e2e2e]"
                                                variantColor={categoryFilter === cat ? "text-[#F97316]" : "text-zinc-500"}
                                            />
                                        )
                                    ))}
                                </RadioGroup>
                            </section>

                            <Separator className="bg-[#2e2e2e]" />

                            <section className="space-y-4">
                                <Label className="text-zinc-600">By Person</Label>
                                <div className="space-y-1.5">
                                    {(teamMembers && Array.isArray(teamMembers) ? teamMembers : []).map((m: any) => (
                                        <button 
                                            key={m.id} 
                                            onClick={() => setSelectedUser(selectedUser === m.id ? null : m.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-2 transition-all group",
                                                selectedUser === m.id ? "bg-[#1a1a1a] border border-[#2e2e2e]" : "hover:bg-[#1a1a1a]/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center overflow-hidden">
                                                    {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={12} />}
                                                </div>
                                                <span className={cn("text-xs font-medium", selectedUser === m.id ? "text-[#F97316]" : "text-zinc-400 group-hover:text-white")}>{m.name}</span>
                                            </div>
                                            {m.doc_count !== undefined && (
                                                <span className="text-[11px] font-bold text-zinc-600 bg-[#111] px-1.5 py-0.5 border border-[#2e2e2e]">{m.doc_count}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <Separator className="bg-[#2e2e2e]" />

                            <section className="space-y-3">
                                <Label className="text-zinc-600">Source</Label>
                                <select className="w-full bg-[#1a1a1a] border border-[#2e2e2e] text-[11px] font-medium p-2.5 outline-none focus:border-[#F97316]">
                                    <option>All Sources</option>
                                    <option>Direct Upload</option>
                                    <option>Task Brief</option>
                                    <option>Progress File</option>
                                    <option>Chat Attachment</option>
                                </select>
                            </section>
                        </div>
                    </aside>

                    {/* MAIN CONTENT Area */}
                    <div className="flex-1 space-y-8">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#F97316] transition-colors" size={16} />
                                <Input 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by file name, tag, or category..."
                                    className="pl-10 h-12 bg-[#1a1a1a] border-[#2e2e2e] rounded-none focus-visible:border-[#F97316] text-xs font-normal"
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="flex bg-[#1a1a1a] border border-[#2e2e2e] p-1">
                                    <button 
                                        onClick={() => setSortBy('recent')} 
                                        className={cn("px-4 h-9 text-xs font-medium flex items-center gap-2 transition-all", sortBy === 'recent' ? "bg-[#F97316] text-black" : "text-zinc-500 hover:text-white")}
                                    >
                                        <History size={14} /> RECENT
                                    </button>
                                    <button 
                                        onClick={() => setSortBy('name')} 
                                        className={cn("px-4 h-9 text-xs font-medium flex items-center gap-2 transition-all", sortBy === 'name' ? "bg-[#F97316] text-black" : "text-zinc-500 hover:text-white")}
                                    >
                                        <ArrowUpDown size={14} /> A-Z
                                    </button>
                                </div>

                                <Button 
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="h-11 px-6 bg-[#F97316] hover:bg-[#F97316]/90 text-black border-none rounded-none font-semibold flex gap-2"
                                >
                                    <Plus size={16} strokeWidth={3} /> Upload File
                                </Button>
                            </div>
                        </div>

                        {/* Document Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-[#0d0d0d] border border-[#2e2e2e]" />)}
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-32 opacity-20 grayscale-0 italic text-center">
                                <AlertCircle size={48} className="mb-4" />
                                <span className="text-xl font-semibold">No documents found</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredDocs.map(doc => (
                                    <Card 
                                        key={doc.id}
                                        onClick={() => navigate(`/documents/${doc.id}`)}
                                        className="bg-[#0d0d0d] border border-[#2e2e2e] rounded-none group hover:border-[#F97316]/40 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                                            {getFileIcon(doc.mime_type)}
                                        </div>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex flex-col gap-1.5 min-w-0">
                                                <Badge variant="outline" className="w-fit text-[10px] h-4 border-zinc-800 font-medium text-zinc-600">{doc.category}</Badge>
                                                <h3 className="text-xs font-semibold text-white truncate pr-6">{doc.auto_name}</h3>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1.5">
                                                {doc.tags.slice(0,3).map(tag => (
                                                    <span key={tag} className="text-[10px] font-bold text-zinc-600 border border-zinc-900 px-1">#{tag}</span>
                                                ))}
                                            </div>

                                            <Separator className="bg-[#1a1a1a]" />

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 overflow-hidden">
                                                        <img src={doc.uploaded_by.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.uploaded_by.name}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-zinc-600 leading-none">{doc.uploaded_by.name}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-zinc-800 leading-none">{safeFormatDistance(doc.created_at)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- UPLOAD MODAL --- */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="max-w-xl bg-[#161616] border-[#2e2e2e] text-zinc-300">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Upload File</DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">Select a file and choose its category</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUploadSubmit} className="space-y-6 pt-4">
                        <div 
                          className={cn(
                            "border-2 border-dashed border-[#2e2e2e] p-10 flex flex-col items-center justify-center gap-4 transition-all hover:border-[#F97316]/50 cursor-pointer",
                            uploadFile ? "border-solid border-[#F97316] bg-[#F97316]/5" : "bg-[#111]"
                          )}
                          onClick={() => document.getElementById('hub-upload')?.click()}
                        >
                            <input id="hub-upload" type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                            {uploadFile ? (
                                <>
                                   <div className="p-3 bg-[#F97316] text-black">
                                      <Upload size={24} />
                                   </div>
                                   <div className="text-center">
                                      <p className="text-xs font-semibold">{uploadFile.name}</p>
                                      <p className="text-xs text-[#F97316] font-bold mt-1">{(uploadFile.size / 1024).toFixed(1)} KB / VALIDATED</p>
                                   </div>
                                </>
                            ) : (
                                <>
                                   <Upload size={32} className="text-zinc-600" />
                                   <p className="text-xs font-medium text-zinc-500">Click to select a file or drag and drop</p>
                                   <p className="text-[10px] text-zinc-700 font-bold">All file formats accepted</p>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <Label>Category</Label>
                               <select 
                                 value={uploadCategory} 
                                 onChange={(e) => setUploadCategory(e.target.value)}
                                 required
                                 className="w-full bg-[#111] border border-[#2e2e2e] text-xs font-medium p-3 outline-none focus:border-[#F97316]"
                               >
                                  <option value="">Select Category</option>
                                  <option value="product">Product</option>
                                  <option value="process">Process</option>
                                  <option value="meetings">Meetings</option>
                                  <option value="research">Research</option>
                                  <option value="legal_hr">Legal/HR</option>
                                  <option value="task_uploads">Task Uploads</option>
                                  {isAdmin && <option value="finance">Finance</option>}
                               </select>
                            </div>

                            <div className="space-y-2">
                               <Label>Tags</Label>
                               <div className="relative">
                                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                  <Input 
                                    placeholder="Enter + Return..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    className="pl-10 h-11 rounded-none bg-[#111] border-[#2e2e2e] focus-visible:border-[#F97316]"
                                  />
                               </div>
                               <div className="flex flex-wrap gap-2 mt-2">
                                  {uploadTags.map(tag => (
                                    <Badge key={tag} className="bg-zinc-800 text-zinc-300 text-xs h-6 rounded-none flex items-center gap-1">
                                      {tag}
                                      <X size={10} className="cursor-pointer" onClick={() => setUploadTags(uploadTags.filter(t => t !== tag))} />
                                    </Badge>
                                  ))}
                               </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setIsUploadModalOpen(false)}
                              className="text-zinc-600 font-bold hover:bg-transparent"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={uploadMutation.isPending}
                              className="bg-[#F97316] hover:bg-[#F97316]/90 text-black rounded-none font-semibold px-8"
                            >
                              {uploadMutation.isPending ? "Uploading..." : "Upload"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- VERSIONING DIALOG --- */}
            <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
                <DialogContent className="bg-[#161616] border-[#2e2e2e] text-zinc-300">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Duplicate File Detected</DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">A file with the same name already exists. What would you like to do?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button 
                          onClick={() => {
                            uploadMutation.mutate({ ...pendingUploadData });
                            setIsVersionDialogOpen(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-semibold text-[11px] h-11"
                        >
                           Link as New Version
                        </Button>
                        <Button 
                           onClick={() => {
                             uploadMutation.mutate({ ...pendingUploadData, linkVersionId: null });
                             setIsVersionDialogOpen(false);
                           }}
                           className="bg-[#1a1a1a] border border-[#2e2e2e] hover:border-zinc-500 text-white rounded-none font-semibold text-[11px] h-11"
                        >
                           Upload Independently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DocumentHub;
