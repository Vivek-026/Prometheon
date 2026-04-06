import React, { useState, useRef } from 'react';
import { 
  Smile, 
  Bold, 
  Italic, 
  Code, 
  Paperclip, 
  SendHorizonal, 
  X,
  CornerUpRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { ChatMessage } from '../../types/chat';

interface ChatInputProps {
  onSend: (content: string, attachment?: File, replyToId?: string) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo?: ChatMessage | null;
  onCancelReply: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTyping, replyTo, onCancelReply }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const typingTimer = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTyping = () => {
    onTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 3000);
  };

  const handleSubmit = () => {
    if (!content.trim() && !file) return;
    onSend(content, file || undefined, replyTo?.id);
    setContent('');
    setFile(null);
    setFilePreview(null);
    onCancelReply();
    onTyping(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selected));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    handleTyping();
  };

  // Markdown Toolbar Helpers
  const wrapText = (symbol: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + symbol + selectedText + symbol + text.substring(end);
    setContent(newText);
    // Move cursor back
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + symbol.length, end + symbol.length);
    }, 0);
  };

  return (
    <div className="p-4 bg-[#0d0d0d] border-t border-[#2e2e2e] space-y-4">
       
       {/* Reply Banner */}
       {replyTo && (
         <div className="flex items-center justify-between p-2 bg-[#1a1a1a] border border-[#F97316]/30 rounded-sm animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
               <CornerUpRight size={14} className="text-[#F97316]" />
               <div className="text-xs font-normal">
                  <span className="text-zinc-500">Replying to </span>
                  <span className="text-white font-medium">{replyTo.sender.name}</span>
               </div>
            </div>
            <button onClick={onCancelReply} className="text-zinc-600 hover:text-white transition-colors"><X size={14} /></button>
         </div>
       )}

       {/* File Preview */}
       {file && (
         <div className="flex items-center gap-3 p-2 bg-[#1a1a1a] border border-[#2e2e2e] w-fit animate-in fade-in duration-300">
            {filePreview ? (
              <img src={filePreview} className="w-10 h-10 object-cover border border-[#2e2e2e]" />
            ) : (
              <Paperclip size={16} className="text-zinc-600" />
            )}
            <div className="flex flex-col gap-0.5 pr-4">
               <span className="text-[11px] font-medium text-zinc-300 truncate w-32">{file.name}</span>
               <span className="text-[10px] text-zinc-600">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button onClick={() => { setFile(null); setFilePreview(null); }} className="text-zinc-600 hover:text-red-500"><X size={12} /></button>
         </div>
       )}

       <div className="relative border border-[#2e2e2e] bg-[#111] focus-within:border-[#F97316]/50 transition-all rounded-sm pb-10">
          <textarea 
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENGAGE_PROTOCOL [SHIFT+ENTER FOR NEWLINE]..."
            className="w-full bg-transparent p-4 text-xs text-zinc-300 font-sans outline-none resize-none placeholder:text-zinc-800 placeholder:italic"
          />

          {/* Action Toolbar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between border-t border-[#2e2e2e]/30 pt-2">
             <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (e: any) => handleFileChange(e);
                    input.click();
                  }}
                  className="p-1.5 hover:bg-[#1a1a1a] text-zinc-600 hover:text-white transition-colors" title="Attach File"
                >
                   <Paperclip size={14} />
                </button>
                <div className="w-px h-4 bg-[#2e2e2e] mx-1" />
                <button onClick={() => wrapText('**')} className="p-1.5 hover:bg-[#1a1a1a] text-zinc-600 hover:text-white transition-colors" title="Bold"><Bold size={14} /></button>
                <button onClick={() => wrapText('*')} className="p-1.5 hover:bg-[#1a1a1a] text-zinc-600 hover:text-white transition-colors" title="Italic"><Italic size={14} /></button>
                <button onClick={() => wrapText('```')} className="p-1.5 hover:bg-[#1a1a1a] text-zinc-600 hover:text-white transition-colors" title="Code"><Code size={14} /></button>
                <button className="p-1.5 hover:bg-[#1a1a1a] text-zinc-600 hover:text-white transition-colors" title="Emoji"><Smile size={14} /></button>
             </div>

             <Button 
               size="sm" 
               onClick={handleSubmit}
               className="h-7 px-4 bg-[#F97316] hover:bg-[#F97316]/90 text-black font-semibold text-[11px] gap-2 rounded-none"
             >
                SEND <SendHorizonal size={12} />
             </Button>
          </div>
       </div>
    </div>
  );
};

export default ChatInput;
