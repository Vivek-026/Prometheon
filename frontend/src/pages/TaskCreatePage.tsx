import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  X, 
  Search, 
  Calendar, 
  Clock, 
  Upload, 
  FileText, 
  User, 
  Tag as TagIcon,
  Link as LinkIcon,
  ChevronLeft,
  Eye,
  Edit2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api/api';
import Sidebar from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Separator } from '../components/ui/Separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { cn } from '../lib/utils';

// --- Validation Schema ---
const taskSchema = z.object({
  name: z.string().min(1, 'Task identifier is required').max(120, 'Maximum 120 characters allowed'),
  description: z.string().min(1, 'Sector briefing / description is required'),
  deadlineDate: z.string().min(1, 'Deadline date required'),
  deadlineTime: z.string().min(1, 'Deadline time required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_ids: z.array(z.string()).min(1, 'At least one operative must be assigned'),
  tags: z.array(z.string()).optional(),
  linked_document_ids: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreview, setIsPreview] = useState(false);
  
  // --- States for complex fields ---
  const [tagInput, setTagInput] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [docQuery, setDocQuery] = useState('');
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDocDropdown, setShowDocDropdown] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const docDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      assignee_ids: [],
      tags: [],
      linked_document_ids: []
    }
  });

  const taskName = watch('name') || '';

  // --- Queries for Search ---
  const { data: userData } = useQuery({
    queryKey: ['users', userQuery],
    queryFn: async () => {
      if (!userQuery && !showUserDropdown) return [];
      const res = await api.get(`/users?search=${userQuery.replace('@', '')}`);
      return res.data;
    },
    enabled: showUserDropdown
  });

  const { data: docData } = useQuery({
    queryKey: ['documents', docQuery],
    queryFn: async () => {
      if (!docQuery && !showDocDropdown) return [];
      const res = await api.get(`/documents?search=${docQuery}`);
      return res.data;
    },
    enabled: showDocDropdown
  });

  // --- Mutation ---
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/tasks/${data.id}`);
    }
  });

  const onSubmit = (data: TaskFormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    
    // Combine date and time
    const deadline = `${data.deadlineDate}T${data.deadlineTime}:00Z`;
    formData.append('deadline', deadline);
    
    formData.append('priority', data.priority);
    
    data.assignee_ids.forEach(id => formData.append('assignee_ids[]', id));
    
    if (data.tags) {
      data.tags.forEach(tag => formData.append('tags[]', tag));
    }
    
    if (data.linked_document_ids) {
      data.linked_document_ids.forEach(id => formData.append('linked_document_ids[]', id));
    }
    
    if (briefFile) {
      formData.append('task_brief_file', briefFile);
    }

    mutation.mutate(formData);
  };

  // --- Handlers ---
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const currentTags = watch('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        const newTags = [...currentTags, tagInput.trim()];
        setValue('tags', newTags);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter(t => t !== tagToRemove));
  };

  const selectUser = (user: any) => {
    const currentIds = watch('assignee_ids') || [];
    if (!currentIds.includes(user.id)) {
      setValue('assignee_ids', [...currentIds, user.id]);
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserQuery('');
    setShowUserDropdown(false);
  };

  const removeUser = (userId: string) => {
    const currentIds = watch('assignee_ids') || [];
    setValue('assignee_ids', currentIds.filter(id => id !== userId));
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const selectDoc = (doc: any) => {
    const currentIds = watch('linked_document_ids') || [];
    if (!currentIds.includes(doc.id)) {
      setValue('linked_document_ids', [...currentIds, doc.id]);
      setSelectedDocs([...selectedDocs, doc]);
    }
    setDocQuery('');
    setShowDocDropdown(false);
  };

  const removeDoc = (docId: string) => {
    const currentIds = watch('linked_document_ids') || [];
    setValue('linked_document_ids', currentIds.filter(id => id !== docId));
    setSelectedDocs(selectedDocs.filter(d => d.id !== docId));
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (docDropdownRef.current && !docDropdownRef.current.contains(event.target as Node)) {
        setShowDocDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex bg-[#111111] min-h-screen font-mono text-zinc-300">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 flex flex-col items-center">
        {/* Navigation */}
        <div className="w-full max-w-2xl mb-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 group text-zinc-500 hover:text-[#F97316] transition-colors">
            <ChevronLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Abort / Return to Registry</span>
          </button>
        </div>

        <div className="w-full max-w-2xl space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 bg-[#F97316]" />
              <h1 className="text-4xl font-black uppercase tracking-tighter italic">Establish New Node</h1>
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">Protocol Implementation / Task Deployment</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* 1. Task Name */}
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <Label htmlFor="name">Task Identifier</Label>
                <span className={cn("text-[9px] font-bold", taskName.length > 110 ? "text-red-500" : "text-zinc-600")}>
                  {taskName.length} / 120 CHARS
                </span>
              </div>
              <Input 
                id="name"
                {...register('name')}
                placeholder="PROMETHEON_DATA_AUDIT_EX_01"
                className="h-12 text-lg font-black uppercase italic tracking-tight rounded-none border-[#2e2e2e] bg-[#1a1a1a] focus-visible:ring-0 focus-visible:border-[#F97316]"
              />
              {errors.name && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">{errors.name.message}</p>}
            </section>

            <Separator className="bg-[#2e2e2e]" />

            {/* 2. Description (Markdown) */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Sector Briefing / Documentation</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsPreview(!isPreview)}
                  className="h-7 px-3 rounded-none border-[#2e2e2e] text-[9px] font-black uppercase tracking-widest bg-[#1a1a1a]"
                >
                  {isPreview ? <><Edit2 size={12} className="mr-1.5" /> WRITE</> : <><Eye size={12} className="mr-1.5" /> PREVIEW</>}
                </Button>
              </div>

              {isPreview ? (
                <div className="min-h-[200px] p-4 bg-[#1a1a1a] border border-[#2e2e2e] prose prose-invert prose-sm prose-orange max-w-none font-sans">
                  {watch('description') ? <ReactMarkdown>{watch('description')}</ReactMarkdown> : <span className="italic text-zinc-700">Protocol data stream empty...</span>}
                </div>
              ) : (
                <Textarea 
                  id="description"
                  {...register('description')}
                  placeholder="# Enter markdown protocol details..."
                  className="min-h-[200px] font-sans text-sm p-4 rounded-none bg-[#1a1a1a] border-[#2e2e2e] focus-visible:border-[#F97316]"
                />
              )}
              {errors.description && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">{errors.description.message}</p>}
            </section>

            <Separator className="bg-[#2e2e2e]" />

            <div className="grid grid-cols-2 gap-10">
              {/* 3. Priority */}
              <section className="space-y-4">
                <Label>Priority Protocol</Label>
                <Controller 
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup 
                      className="grid grid-cols-2 gap-2" 
                      onBlur={field.onBlur}
                    >
                      <RadioGroupItem 
                        label="Low" 
                        variantColor="text-zinc-500" 
                        checked={field.value === 'low'} 
                        onChange={() => field.onChange('low')}
                        name="priority"
                      />
                      <RadioGroupItem 
                        label="Medium" 
                        variantColor="text-blue-500" 
                        checked={field.value === 'medium'} 
                        onChange={() => field.onChange('medium')}
                        name="priority"
                      />
                      <RadioGroupItem 
                        label="High" 
                        variantColor="text-orange-500" 
                        checked={field.value === 'high'} 
                        onChange={() => field.onChange('high')}
                        name="priority"
                      />
                      <RadioGroupItem 
                        label="Urgent" 
                        variantColor="text-red-500" 
                        checked={field.value === 'urgent'} 
                        onChange={() => field.onChange('urgent')}
                        name="priority"
                      />
                    </RadioGroup>
                  )}
                />
              </section>

              {/* 4. Deadline */}
              <section className="space-y-4">
                <Label>Temporal Quota (Deadline)</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F97316]" size={14} />
                    <Input 
                      type="date"
                      {...register('deadlineDate')}
                      className="pl-10 h-11 rounded-none bg-[#1a1a1a] border-[#2e2e2e] focus-visible:border-[#F97316]"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F97316]" size={14} />
                    <Input 
                      type="time"
                      {...register('deadlineTime')}
                      className="pl-10 h-11 rounded-none bg-[#1a1a1a] border-[#2e2e2e] focus-visible:border-[#F97316]"
                    />
                  </div>
                  {(errors.deadlineDate || errors.deadlineTime) && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Temporal constraints strictly required</p>}
                </div>
              </section>
            </div>

            <Separator className="bg-[#2e2e2e]" />

            {/* 5. Assignees */}
            <section className="space-y-4">
              <Label>Field Operatives (Assignees)</Label>
              <div className="relative" ref={userDropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <Input 
                    placeholder="TYPE '@' OR IDENTIFIER TO LOCATE OPERATIVES..."
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    className="pl-10 h-11 rounded-none bg-[#1a1a1a] border-[#2e2e2e] focus-visible:border-[#F97316]"
                  />
                </div>

                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-[#161616] border border-[#2e2e2e] max-h-60 overflow-y-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    {userData && userData.length > 0 ? (
                      userData.map((user: any) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#1f1f1f] border-b border-[#2e2e2e] last:border-0 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User size={14} />}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-tight">{user.name}</p>
                            <p className="text-[9px] text-[#F97316] font-bold uppercase">{user.role}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-zinc-600 text-[10px] font-black uppercase">No operatives matching identifier</div>
                    )}
                  </div>
                )}
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-[#222] border border-[#2e2e2e] rounded-full">
                      <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center overflow-hidden">
                         {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User size={12} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{user.name}</span>
                      <button type="button" onClick={() => removeUser(user.id)} className="text-zinc-500 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.assignee_ids && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">{errors.assignee_ids.message}</p>}
            </section>

            <Separator className="bg-[#2e2e2e]" />

            {/* 6. Tags */}
            <section className="space-y-4">
              <Label>Protocol Tags (Tags)</Label>
              <div className="space-y-3">
                <div className="relative">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <Input 
                    placeholder="TYPE TERMINOLOGY + ENTER..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="pl-10 h-11 rounded-none bg-[#1a1a1a] border-[#2e2e2e] focus-visible:border-[#F97316]"
                  />
                </div>
                {watch('tags')?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {watch('tags')?.map(tag => (
                      <div key={tag} className="flex items-center gap-2 px-3 py-1 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-[10px] font-black uppercase tracking-widest italic">
                        # {tag}
                        <button type="button" onClick={() => removeTag(tag)}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <Separator className="bg-[#2e2e2e]" />

            {/* 7. Task Brief */}
            <section className="space-y-4">
              <Label>Managerial Instruction Payload (Brief)</Label>
              <div 
                className={cn(
                  "border-2 border-dashed border-[#2e2e2e] bg-[#1a1a1a]/50 p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:border-[#F97316]/50 cursor-pointer",
                  briefFile && "border-solid border-[#F97316]/30 bg-[#F97316]/5"
                )}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => setBriefFile(e.target.files?.[0] || null)}
                />
                
                {briefFile ? (
                  <>
                    <FileText size={32} className="text-[#F97316]" />
                    <div className="text-center">
                      <p className="text-xs font-black uppercase">{briefFile.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                        {(briefFile.size / 1024).toFixed(1)} KB / SECTOR READY
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-8 text-[9px] font-black rounded-none border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); setBriefFile(null); }}
                    >
                      CLEAR PAYLOAD
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-zinc-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Drag & Drop File or click to select payload
                    </p>
                    <p className="text-[8px] text-zinc-700 font-bold uppercase">instructional document (read-only for assignees)</p>
                  </>
                )}
              </div>
            </section>

            <Separator className="bg-[#2e2e2e]" />

            {/* 8. Linked Documents */}
            <section className="space-y-4 pb-20">
              <Label>Accessory Data Links (Linked Docs)</Label>
              <div className="relative" ref={docDropdownRef}>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <Input 
                    placeholder="LOCATE ASSETS IN DOCUMENT HUB..."
                    value={docQuery}
                    onChange={(e) => {
                      setDocQuery(e.target.value);
                      setShowDocDropdown(true);
                    }}
                    onFocus={() => setShowDocDropdown(true)}
                    className="pl-10 h-11 rounded-none bg-[#1a1a1a] border-[#2e2e2e] focus-visible:border-[#F97316]"
                  />
                </div>

                {showDocDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-[#161616] border border-[#2e2e2e] max-h-60 overflow-y-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    {docData && docData.length > 0 ? (
                      docData.map((doc: any) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => selectDoc(doc)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#1f1f1f] border-b border-[#2e2e2e] last:border-0 transition-colors"
                        >
                          <FileText size={16} className="text-blue-500" />
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-tight">{doc.auto_name}</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase">{doc.mime_type}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-zinc-600 text-[10px] font-black uppercase">No assets found in global hub</div>
                    )}
                  </div>
                )}
              </div>

              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[10px] font-black uppercase tracking-tight text-blue-400">
                      <LinkIcon size={10} />
                      {doc.auto_name}
                      <button type="button" onClick={() => removeDoc(doc.id)} className="text-zinc-600 hover:text-red-500 ml-1">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Fixed Bottom Bar for Submission */}
            <div className="fixed bottom-0 left-64 right-0 p-6 bg-[#111]/80 backdrop-blur-md border-t border-[#2e2e2e] z-50 flex justify-center">
              <div className="w-full max-w-2xl flex items-center justify-between">
                <div className="hidden md:block">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F97316]">Safety Warning</p>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase">All task deployments are final and recorded in blockchain</p>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || mutation.isPending}
                  className="w-full md:w-auto h-12 px-12 bg-[#F97316] hover:bg-[#F97316]/90 text-black border-none rounded-none font-black text-sm uppercase tracking-widest italic flex gap-3 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                >
                  {(isSubmitting || mutation.isPending) ? 'ESTABLISHING CONNECTION...' : 'DEPLOY TASK'}
                </Button>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default TaskCreatePage;
