import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Separator } from '../components/ui/Separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { cn } from '../lib/utils';

// --- Validation Schema ---
const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(120, 'Maximum 120 characters allowed'),
  description: z.string().min(1, 'Description is required'),
  deadlineDate: z.string().min(1, 'Deadline date required'),
  deadlineTime: z.string().min(1, 'Deadline time required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_ids: z.array(z.string()).min(1, 'At least one person must be assigned'),
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

    return (
        <div className="flex bg-[#111111] min-h-screen">
          <Sidebar />

          <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
            <div className="mb-6 flex items-center gap-2">
                <Link to="/tasks" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest group">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Tasks
                </Link>
            </div>

            <PageHeader title="New Task" subtitle="Create and assign a new task to your team" />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32">
                
                {/* Left Sector: Form Area */}
                <div className="xl:col-span-8 space-y-8">
                    
                    <div className="bg-[#1a1a1a] border border-zinc-900 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F97316]/30 to-transparent" />
                        
                        <div className="p-4 md:p-8 space-y-8">
                           {/* Task Core Intel */}
                           <div className="space-y-6">
                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase text-[#F97316] tracking-widest">General Information</Label>
                                 <div className="space-y-2">
                                    <Input 
                                      {...register('name')}
                                      placeholder="Task Name"
                                      className="bg-transparent border-0 border-b border-zinc-800 rounded-none text-xl p-0 h-12 focus-visible:ring-0 focus-visible:border-[#F97316] placeholder:text-zinc-800 font-bold"
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase italic">{errors.name.message}</p>}
                                 </div>
                              </div>

                              <div className="space-y-4 pt-4 border-t border-zinc-900/50">
                                 <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Briefing / Description</Label>
                                    <button 
                                      type="button"
                                      onClick={() => setIsPreview(!isPreview)}
                                      className="text-[9px] font-black uppercase tracking-widest text-[#F97316] hover:underline flex items-center gap-2"
                                    >
                                       {isPreview ? <Edit2 size={12} /> : <Eye size={12} />}
                                       {isPreview ? 'Back to Editor' : 'Preview Result'}
                                    </button>
                                 </div>
                                 <div className="space-y-2 min-h-[300px]">
                                    {isPreview ? (
                                       <div className="p-6 bg-[#0a0a0a] border border-zinc-900 prose prose-invert prose-zinc max-w-none prose-p:text-sm prose-headings:uppercase prose-headings:tracking-widest">
                                          <ReactMarkdown>{watch('description') || '*No content provided yet*'}</ReactMarkdown>
                                       </div>
                                    ) : (
                                       <Textarea 
                                          {...register('description')}
                                          placeholder="Enter task details, requirements, and instructions (Supports Markdown)"
                                          className="bg-[#0a0a0a] border-zinc-800 focus:border-[#F97316]/30 rounded-none text-sm min-h-[300px] font-medium leading-relaxed"
                                       />
                                    )}
                                    {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase italic">{errors.description.message}</p>}
                                 </div>
                              </div>
                           </div>

                           {/* Requirements: Assignees & Tags */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-900/50">
                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Assign Personnel</Label>
                                 <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                                    <Input 
                                       placeholder="Find team members..."
                                       className="bg-[#0d0d0d] border-zinc-800 pl-10 rounded-none h-11 text-xs focus:border-[#F97316]/30"
                                       value={userQuery}
                                       onChange={(e) => { setUserQuery(e.target.value); setShowUserDropdown(true); }}
                                       onFocus={() => setShowUserDropdown(true)}
                                    />
                                    {/* Selected UI */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                       {selectedUsers.map(u => (
                                          <Badge key={u.id} className="bg-zinc-900 border-zinc-800 text-white rounded-none py-1.5 px-3 uppercase text-[9px] font-bold group/badge">
                                             {u.name} <X size={12} className="ml-2 cursor-pointer hover:text-red-500 transition-colors" />
                                          </Badge>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Categorization Tags</Label>
                                 <div className="relative">
                                    <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                                    <Input 
                                      placeholder="Add tags..."
                                      className="bg-[#0d0d0d] border-zinc-800 pl-10 rounded-none h-11 text-xs focus:border-[#F97316]/30"
                                      value={tagInput}
                                      onChange={(e) => setTagInput(e.target.value)}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Right Sector: Constraints & Files */}
                <div className="xl:col-span-4 space-y-8">
                   <Card className="bg-[#1a1a1a] border-zinc-900 rounded-none">
                      <CardHeader className="p-6 border-b border-zinc-900">
                         <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#F97316]">Project Constraints</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-8">
                         <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                               <Clock size={12} className="text-[#F97316]" /> Hand-off Deadline
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="relative">
                                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" size={14} />
                                  <Input type="date" {...register('deadlineDate')} className="bg-[#0d0d0d] border-zinc-800 rounded-none text-[10px] h-10 uppercase font-bold" />
                               </div>
                               <Input type="time" {...register('deadlineTime')} className="bg-[#0d0d0d] border-zinc-800 rounded-none text-[10px] h-10 uppercase font-bold" />
                            </div>
                         </div>

                         <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Priority Ranking</Label>
                            <Controller 
                               name="priority"
                               control={control}
                               render={({ field }) => (
                                 <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                    {['low', 'medium', 'high', 'urgent'].map(p => (
                                       <div key={p} className="flex items-center space-x-2">
                                          <RadioGroupItem value={p} id={p} className="text-[#F97316]" />
                                          <Label htmlFor={p} className="text-[10px] font-bold uppercase cursor-pointer">{p}</Label>
                                       </div>
                                    ))}
                                 </RadioGroup>
                               )}
                            />
                         </div>
                      </CardContent>
                   </Card>

                   <Card className="bg-[#1a1a1a] border-zinc-900 rounded-none">
                      <CardHeader className="p-6 border-b border-zinc-900">
                         <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-white">Reference Material</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500">Attach Briefing Documentation</Label>
                            <div className="group relative h-20 border-2 border-dashed border-zinc-800 hover:border-[#F97316]/30 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer">
                               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setBriefFile(e.target.files?.[0] || null)} />
                               <Upload size={18} className={cn("text-zinc-800 group-hover:text-[#F97316]", briefFile && "text-green-500")} />
                               <span className="text-[8px] font-black uppercase text-zinc-700">{briefFile ? briefFile.name : "Select or Drop File"}</span>
                            </div>
                         </div>
                      </CardContent>
                   </Card>

                   <div className="pt-8">
                      <Button 
                        disabled={isSubmitting}
                        onClick={handleSubmit((data) => console.log(data))}
                        className="w-full bg-[#F97316] hover:bg-[#EA580C] text-black font-black uppercase text-[11px] tracking-[0.3em] h-14 rounded-none shadow-[0_10px_30px_rgba(249,115,22,0.2)]"
                      >
                         Establish New Task
                         {isSubmitting && <Loader2 size={16} className="ml-3 animate-spin" />}
                      </Button>
                   </div>
                </div>
            </div>
          </main>
        </div>
    );
};

export default TaskCreatePage;
