import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Upload, 
  X, 
  Info,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Separator } from '../ui/Separator';
import { cn } from '../../lib/utils';
import api from '../../api/api';
import type { Task, FlagReasonCategory, FlagProgressStatus } from '../../types/tasks';

interface RaiseFlagModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const RaiseFlagModal: React.FC<RaiseFlagModalProps> = ({ task, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  
  // --- Form State ---
  const [reasonCategory, setReasonCategory] = useState<FlagReasonCategory>('academic');
  const [reasonText, setReasonText] = useState('');
  const [progressStatus, setProgressStatus] = useState<FlagProgressStatus>('not_started');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  
  // --- Late Flag Logic ---
  const [isLate, setIsLate] = useState(false);
  
  useEffect(() => {
    if (!task.current_deadline) return;
    
    const deadline = new Date(task.current_deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Logic: if < 24h remaining and notice < 12h (wait, the requirement says simply mark as late if window is tight)
    // "if < 24h remaining" -> if I'm flagging now, my notice is "now". 
    // Requirement text: "if < 24h remaining and notice < 12h, or < 3 days and notice < 24h"
    // Since "raising flag" happens NOW, notice period IS diffHours.
    if (diffHours < 12 && diffHours < 24) {
      setIsLate(true);
    } else if (diffHours < 24 && diffHours < 72) {
      setIsLate(true);
    } else if (diffHours < 0) {
      setIsLate(true); // Already overdue
    } else {
      setIsLate(false);
    }
  }, [task.current_deadline, isOpen]);

  // --- Mutation ---
  const flagMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('reason_category', data.reason_category);
      formData.append('reason_text', data.reason_text);
      formData.append('progress_status', data.progress_status);
      if (data.handoff_notes) formData.append('handoff_notes', data.handoff_notes);
      if (data.estimated_hours_remaining) formData.append('estimated_hours_remaining', data.estimated_hours_remaining.toString());
      
      data.attachments.forEach((file: File) => {
        formData.append('attachments[]', file);
      });
      
      return api.post(`/tasks/${task.id}/flags`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      alert('Flag submitted. Your manager has been notified.');
      onClose();
      // Reset form
      setReasonCategory('academic');
      setReasonText('');
      setProgressStatus('not_started');
      setHandoffNotes('');
      setAttachments([]);
      setEstimatedHours(undefined);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText || (progressStatus !== 'not_started' && !handoffNotes)) return;
    
    flagMutation.mutate({
      reason_category: reasonCategory,
      reason_text: reasonText,
      progress_status: progressStatus,
      handoff_notes: progressStatus !== 'not_started' ? handoffNotes : undefined,
      attachments,
      estimated_hours_remaining: estimatedHours
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0d0d0d] border-[#2e2e2e] text-zinc-300 overflow-hidden flex flex-col p-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#F97316]/50" />
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-white">
            <AlertTriangle className="text-[#F97316]" size={24} /> Raise Flag
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 leading-relaxed">
            Report a blocker or request help from your manager. <br/>
            Task: <span className="text-zinc-300">{task.name}</span>
          </DialogDescription>
        </DialogHeader>

        {isLate && (
           <div className="mx-6 mb-4 p-3 bg-red-950/30 border border-red-500/30 flex gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <div className="space-y-1">
                 <p className="text-xs font-medium text-red-500">⚠️ LATE FLAG</p>
                 <p className="text-xs text-red-400/80 leading-snug">This flag is being raised close to the deadline. It will be marked as a late flag.</p>
              </div>
           </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
           {/* Section 1: Reason */}
           <div className="space-y-4">
              <div className="space-y-2">
                 <Label className="text-xs font-medium text-zinc-500 flex justify-between">
                    Reason Category <span>*</span>
                 </Label>
                 <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'academic', label: 'Academic' },
                      { id: 'personal', label: 'Personal' },
                      { id: 'workload', label: 'Workload' },
                      { id: 'technical', label: 'Technical' },
                      { id: 'other', label: 'Other' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setReasonCategory(cat.id as FlagReasonCategory)}
                        className={cn(
                          "py-2 px-3 text-xs font-medium border transition-all",
                          reasonCategory === cat.id 
                            ? "bg-[#F97316] border-[#F97316] text-black shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                            : "bg-[#161616] border-[#2e2e2e] text-zinc-500 hover:border-zinc-500"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-xs font-medium text-zinc-500 flex justify-between">
                    Details <span>*</span>
                 </Label>
                 <Textarea 
                   value={reasonText}
                   onChange={(e) => setReasonText(e.target.value)}
                   required
                   placeholder="Elaborate on the roadblock..."
                   className="min-h-[80px] bg-[#111] border-[#2e2e2e] rounded-none focus-visible:border-[#F97316] text-xs placeholder:text-zinc-700"
                 />
              </div>
           </div>

           <Separator className="bg-[#2e2e2e]" />

           {/* Section 2: Progress */}
           <div className="space-y-4">
              <div className="space-y-3">
                 <Label className="text-xs font-medium text-zinc-500">Progress So Far</Label>
                 <div className="flex gap-4 items-center">
                    {[
                      { id: 'not_started', label: 'NOT STARTED' },
                      { id: 'pct_25', label: '~25% DONE' },
                      { id: 'pct_50', label: '~50% DONE' },
                      { id: 'pct_75', label: '~75% DONE' }
                    ].map(item => (
                       <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="progress" 
                            className="hidden" 
                            checked={progressStatus === item.id}
                            onChange={() => setProgressStatus(item.id as FlagProgressStatus)}
                          />
                          <div className={cn(
                             "w-4 h-4 border-2 flex items-center justify-center transition-all",
                             progressStatus === item.id ? "border-[#F97316] bg-[#F97316]/10" : "border-[#2e2e2e] group-hover:border-zinc-500"
                          )}>
                             {progressStatus === item.id && <div className="w-1.5 h-1.5 bg-[#F97316]" />}
                          </div>
                          <span className={cn(
                             "text-xs font-medium transition-colors",
                             progressStatus === item.id ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"
                          )}>{item.label}</span>
                       </label>
                    ))}
                 </div>
              </div>

              {progressStatus !== 'not_started' && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs font-medium text-[#F97316] flex justify-between">
                       Handoff Notes <span>*</span>
                    </Label>
                    <Textarea 
                      value={handoffNotes}
                      onChange={(e) => setHandoffNotes(e.target.value)}
                      required
                      placeholder="What has been done, where the code/files are, what remains..."
                      className="min-h-[100px] bg-[#111] border-[#F97316]/20 rounded-none focus-visible:border-[#F97316] text-xs"
                    />
                    <div className="flex items-center gap-2 text-zinc-600">
                       <Info size={12} />
                       <p className="text-xs font-bold">Required so someone else can pick up where you left off.</p>
                    </div>
                 </div>
              )}
           </div>

           <Separator className="bg-[#2e2e2e]" />

           {/* Section 3: Meta & Files */}
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                 <Label className="text-xs font-medium text-zinc-500 flex justify-between">
                    Est. Hours Remaining
                 </Label>
                 <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                    <Input 
                      type="number"
                      value={estimatedHours || ''}
                      onChange={(e) => setEstimatedHours(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="pl-10 bg-[#111] border-[#2e2e2e] rounded-none focus-visible:border-[#F97316] italic"
                      placeholder="0.0"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-xs font-medium text-zinc-500">Supporting Data</Label>
                 <div 
                   className="relative h-10 border border-[#2e2e2e] bg-[#111] hover:border-zinc-500 transition-colors flex items-center px-4 cursor-pointer"
                   onClick={() => document.getElementById('flag-attachments')?.click()}
                 >
                    <Upload size={14} className="mr-3 text-zinc-600" />
                    <span className="text-xs font-medium text-zinc-500">Attach Files</span>
                    <input 
                      id="flag-attachments"
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                 </div>
              </div>
           </div>

           {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                 {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#161616] border border-[#2e2e2e] text-xs font-medium">
                       <div className="flex items-center gap-2 truncate pr-2">
                          <CheckCircle2 size={10} className="text-green-500" />
                          <span className="truncate">{file.name}</span>
                       </div>
                       <button type="button" onClick={() => handleRemoveFile(idx)} className="text-zinc-600 hover:text-red-500 transition-colors">
                          <X size={12} />
                       </button>
                    </div>
                 ))}
              </div>
           )}
        </form>

        <DialogFooter className="p-6 bg-[#111]/50 border-t border-[#2e2e2e]">
           <Button 
             variant="outline" 
             onClick={onClose} 
             className="rounded-none border-[#2e2e2e] font-semibold text-xs"
           >
              Cancel
           </Button>
           <Button 
             onClick={handleSubmit}
             disabled={flagMutation.isPending || (progressStatus !== 'not_started' && !handoffNotes) || !reasonText}
             className="rounded-none bg-[#F97316] hover:bg-[#F97316]/90 text-black font-semibold px-10 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
           >
              {flagMutation.isPending ? 'Submitting...' : 'Submit Flag'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RaiseFlagModal;
