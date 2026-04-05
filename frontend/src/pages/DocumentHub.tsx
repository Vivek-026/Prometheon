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
  AlertCircle,
  Menu
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
  { id: 'd1', auto_name: 'Product-Guide-v1.2.pdf', original_filename: 'prd_v1.2.pdf', category: 'product', tags: ['core', 'v1'], upload_origin: 'direct_upload', uploaded_by: { id: 'u1', name: 'Alpha Admin' }, mime_type: 'application/pdf', file_size_bytes: 4500000, version_number: 1, is_current_version: true, created_at: '2026-04-01T10:00:00Z' },
  { id: 'd2', auto_name: 'Process-Manual.md', original_filename: 'sop_s7.md', category: 'process', tags: ['security', 'sop'], upload_origin: 'direct_upload', uploaded_by: { id: 'u2', name: 'Bravo User' }, mime_type: 'text/markdown', file_size_bytes: 12000, version_number: 2, is_current_version: true, created_at: '2026-04-02T14:30:00Z' },
  { id: 'd3', auto_name: 'Revenue-Projection.xlsx', original_filename: 'q3_rev.xlsx', category: 'finance', tags: ['projection', 'q3'], upload_origin: 'direct_upload', uploaded_by: { id: 'u1', name: 'Alpha Admin' }, mime_type: 'application/xlsx', file_size_bytes: 2500000, version_number: 1, is_current_version: true, created_at: '2026-04-03T09:15:00Z' },
  { id: 'd4', auto_name: 'Bug-Report-88.png', original_filename: 'task88_bug.png', category: 'task_uploads', tags: ['bug', 'ui'], upload_origin: 'progress_file', uploaded_by: { id: 'u3', name: 'Charlie Coder' }, mime_type: 'image/png', file_size_bytes: 850000, version_number: 1, is_current_version: true, created_at: '2026-04-04T16:20:00Z' },
  { id: 'd5', auto_name: 'Legal-Compliance.pdf', original_filename: 'legal_compl.pdf', category: 'legal_hr', tags: ['legal', 'hr'], upload_origin: 'direct_upload', uploaded_by: { id: 'u2', name: 'Bravo User' }, mime_type: 'application/pdf', file_size_bytes: 3200000, version_number: 1, is_current_version: true, created_at: '2026-04-04T18:00:00Z' },
];

const MOCK_USERS: (UserSummary & { doc_count: number })[] = [
  { id: 'u1', name: 'Alpha Admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha', doc_count: 12 },
  { id: 'u2', name: 'Bravo User', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bravo', doc_count: 8 },
  { id: 'u3', name: 'Charlie Coder', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', doc_count: 4 },
];

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return <FileImage className="text-pink-500" />;
  if (mimeType.includes('pdf')) return <FileText className="text-red-500" />;
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('markdown')) return <FileCode className="text-blue-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive className="text-yellow-500" />;
  return <FileIcon className="text-zinc-500" />;
};

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

    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    
    // Upload Form State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState<string>('');
    const [uploadTags, setUploadTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const { data: documents, isLoading } = useQuery<HubDocument[]>({
        queryKey: ['documents', categoryFilter, search, selectedUser, sortBy],
        queryFn: async () => {
            try {
                const params: any = {};
                if (categoryFilter !== 'all') params.category = categoryFilter;
                if (search) params.search = search;
                if (selectedUser) params.user_id = selectedUser;
                params.sort = sortBy;
                
                const res = await api.get('/documents', { params });
                return Array.isArray(res.data) ? res.data : MOCK_DOCS;
            } catch (e) {
                return MOCK_DOCS;
            }
        },
    });

    const categories = [
        { id: 'all', label: 'All Files', count: MOCK_DOCS.length },
        { id: 'product', label: 'Product Docs', count: 12 },
        { id: 'process', label: 'Process Manuals', count: 8 },
        { id: 'finance', label: 'Finance', count: 4 },
        { id: 'legal_hr', label: 'Legal & HR', count: 6 },
        { id: 'technical', label: 'Technical Specs', count: 15 },
        { id: 'task_uploads', label: 'Task Uploads', count: 22 },
    ];

    const filteredDocs = Array.isArray(documents) ? documents : MOCK_DOCS;

    return (
        <div className="flex bg-[#111111] min-h-screen">
          <Sidebar />

          <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
            <PageHeader title="Documents" subtitle="Browse and manage all shared files" />

            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Sidebar: Filters (Responsive Overlay/Drawer on Mobile) */}
                <div className={cn(
                    "lg:w-64 space-y-8 shrink-0 transition-all duration-300",
                    isMobileFiltersOpen ? "fixed inset-0 z-50 bg-[#111] p-8 overflow-y-auto" : "hidden lg:block"
                )}>
                    {isMobileFiltersOpen && (
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black uppercase text-[#F97316]">Filters</h2>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-zinc-500"><X size={24} /></button>
                        </div>
                    )}

                    {/* Category Filter */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                           <Filter size={14} />
                           <h3 className="text-[10px] font-black uppercase tracking-widest italic">Categories</h3>
                        </div>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <button
                                  key={cat.id}
                                  onClick={() => { setCategoryFilter(cat.id); setIsMobileFiltersOpen(false); }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase transition-all rounded-sm",
                                    categoryFilter === cat.id ? "bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                                  )}
                                >
                                    <span>{cat.label}</span>
                                    <span className="opacity-40 text-[9px]">{cat.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-zinc-900" />

                    {/* People Filter */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                           <UserIcon size={14} />
                           <h3 className="text-[10px] font-black uppercase tracking-widest italic">By Person</h3>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={() => { setSelectedUser(null); setIsMobileFiltersOpen(false); }}
                                className={cn(
                                    "w-full text-left px-3 py-1 text-[11px] font-bold uppercase",
                                    !selectedUser ? "text-[#F97316]" : "text-zinc-600"
                                )}
                            >
                                All People
                            </button>
                            {MOCK_USERS.map(u => (
                                <button 
                                  key={u.id} 
                                  onClick={() => { setSelectedUser(u.id); setIsMobileFiltersOpen(false); }}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-1 group transition-all",
                                    selectedUser === u.id ? "opacity-100" : "opacity-40 hover:opacity-100"
                                  )}
                                >
                                   <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-800 p-0.5 group-hover:border-[#F97316]">
                                      <img src={u.avatar_url} alt={u.name} className="w-full h-full rounded-full" />
                                   </div>
                                   <span className={cn(
                                       "text-[10px] font-bold uppercase truncate",
                                       selectedUser === u.id ? "text-white" : "text-zinc-500"
                                   )}>{u.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Content Area: Main Documents Grid */}
                <div className="flex-1 space-y-6">
                    
                    {/* Search & Global Actions */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1a1a] p-4 border border-zinc-900 rounded-sm">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-[#F97316] transition-colors" size={18} />
                            <Input 
                                placeholder="Search files by name or tag..." 
                                className="pl-10 bg-[#0d0d0d] border-[#2e2e2e] focus:border-[#F97316]/30 text-xs py-5"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="lg:hidden p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 group hover:text-white transition-colors"
                            >
                                <Filter size={20} />
                            </button>

                            <div className="flex items-center gap-2 px-3 h-11 bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0">
                                <ArrowUpDown size={14} />
                                <select 
                                    className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                >
                                    <option value="recent">Recent</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="name">A-Z</option>
                                </select>
                            </div>

                            <Button 
                              onClick={() => setIsUploadModalOpen(true)}
                              className="bg-[#F97316] hover:bg-[#EA580C] text-black font-black uppercase text-[10px] tracking-[0.2em] h-11 px-6 rounded-sm w-full md:w-auto"
                            >
                                <Plus size={16} className="mr-2" /> Upload File
                            </Button>
                        </div>
                    </div>

                    {/* Documents Grid (Responsive Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 md:pb-0">
                        {isLoading ? (
                            Array(6).fill(0).map((_, i) => <div key={i} className="h-48 bg-zinc-900/50 animate-pulse border border-zinc-900" />)
                        ) : filteredDocs.map((doc) => (
                           <Link 
                             key={doc.id} 
                             to={`/documents/${doc.id}`}
                             className="group flex flex-col bg-[#1a1a1a] border border-zinc-900 hover:border-[#F97316]/50 transition-all overflow-hidden relative"
                           >
                              <div className="h-32 bg-[#0d0d0d] flex items-center justify-center border-b border-zinc-900 relative overflow-hidden">
                                 <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none flex flex-wrap gap-2 p-2">
                                    {Array(20).fill(0).map((_, i) => <FileIcon key={i} size={40} />)}
                                 </div>
                                 <div className="w-16 h-16 transform group-hover:scale-110 transition-transform duration-500">
                                    {getFileIcon(doc.mime_type)}
                                 </div>
                              </div>
                              <div className="p-5 space-y-3">
                                 <div className="flex justify-between items-start">
                                    <div className="space-y-1 min-w-0">
                                       <h4 className="text-[11px] font-black uppercase text-white truncate tracking-tight">{doc.auto_name}</h4>
                                       <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase italic">
                                          <span>{doc.category.replace('_', ' ')}</span>
                                          <span className="opacity-20 text-[6px]">●</span>
                                          <span>v{doc.version_number}</span>
                                       </div>
                                    </div>
                                    <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-[8px] h-5 rounded-none shrink-0 px-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                       {doc.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </Badge>
                                 </div>
                                 
                                 <div className="flex flex-wrap gap-1">
                                    {doc.tags.slice(0, 3).map(tag => (
                                       <span key={tag} className="text-[8px] font-black uppercase text-[#F97316] bg-[#F97316]/5 px-1.5 border border-[#F97316]/10">#{tag}</span>
                                    ))}
                                 </div>

                                 <div className="pt-2 border-t border-zinc-900 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                       <div className="w-5 h-5 rounded-full border border-zinc-800 overflow-hidden shrink-0">
                                          <img src={doc.uploaded_by.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.uploaded_by.name}`} alt={doc.uploaded_by.name} className="w-full h-full object-cover" />
                                       </div>
                                       <span className="text-[9px] font-bold text-zinc-500 uppercase truncate max-w-[80px]">{doc.uploaded_by.name}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-zinc-700 italic">{safeFormatDistance(doc.created_at)} ago</span>
                                 </div>
                              </div>
                           </Link>
                        ))}
                    </div>

                    {filteredDocs.length === 0 && (
                        <div className="p-32 text-center border-2 border-dashed border-zinc-900 rounded-none flex flex-col items-center gap-4 opacity-10">
                           <FileText size={48} />
                           <h3 className="text-xl font-black uppercase italic tracking-tighter">No Files Found</h3>
                        </div>
                    )}
                </div>

            </div>

             {/* Upload Modal (Friendly Labels) */}
             <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="bg-[#111] border-[#2e2e2e] text-white rounded-none max-w-sm">
                   <DialogHeader>
                      <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-[#F97316]">Upload File</DialogTitle>
                      <DialogDescription className="text-zinc-500 text-[10px] uppercase font-bold italic">Upload a file to the shared hub</DialogDescription>
                   </DialogHeader>
                   <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-zinc-400">Select File</Label>
                         <div className="group relative h-24 border-2 border-dashed border-zinc-800 hover:border-[#F97316]/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                            <Upload size={24} className={cn("text-zinc-700 group-hover:text-[#F97316] transition-colors", uploadFile && "text-green-500")} />
                            <span className="text-[9px] font-black uppercase text-zinc-600 transition-colors group-hover:text-zinc-300">
                               {uploadFile ? uploadFile.name : "Drag & Drop or Click to browse"}
                            </span>
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-zinc-400">Category</Label>
                         <select 
                            className="w-full bg-[#0d0d0d] border border-zinc-800 p-3 text-[10px] font-bold uppercase tracking-widest text-zinc-300 outline-none focus:border-[#F97316]/30"
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                         >
                            <option value="">Select Category</option>
                            <option value="product">Product Docs</option>
                            <option value="process">Process Manuals</option>
                            <option value="finance">Finance</option>
                            <option value="legal_hr">Legal & HR</option>
                            <option value="technical">Technical Specs</option>
                            <option value="task_uploads">Task Uploads</option>
                         </select>
                      </div>
                   </div>
                   <DialogFooter className="pt-6">
                      <Button onClick={() => setIsUploadModalOpen(false)} variant="outline" className="h-10 text-[9px] font-black uppercase rounded-none border border-zinc-800 text-zinc-500 hover:bg-zinc-900">Cancel</Button>
                      <Button disabled={!uploadFile || !uploadCategory} className="h-10 bg-[#F97316] hover:bg-[#EA580C] text-black text-[9px] font-black uppercase rounded-none px-6">Upload</Button>
                   </DialogFooter>
                </DialogContent>
             </Dialog>
          </main>
        </div>
    );
};

export default DocumentHub;
