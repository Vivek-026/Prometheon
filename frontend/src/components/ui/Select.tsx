import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn("relative group", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string; value?: string }> = ({ children, className }) => {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 bg-[#111] border border-zinc-900 group-hover:border-[#F97316] transition-all cursor-pointer",
      className
    )}>
      <div className="flex-1 overflow-hidden">{children}</div>
      <ChevronDown size={14} className="text-zinc-600 transition-transform group-hover:rotate-180" />
    </div>
  );
};

export const SelectValue: React.FC<{ placeholder?: string; value?: string }> = ({ placeholder, value }) => {
  return <span className="truncate">{value || placeholder}</span>;
};

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string; onValueChange?: (v: string) => void }> = ({ children, className, onValueChange }) => {
  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-1 bg-[#0d0d0d] border border-zinc-900 shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50",
      className
    )}>
      <div className="p-1 space-y-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { onValueChange });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string; onValueChange?: (v: string) => void }> = ({ value, children, className, onValueChange }) => {
  return (
    <div 
      onClick={() => onValueChange?.(value)}
      className={cn(
        "px-3 py-2 text-xs text-zinc-400 hover:bg-[#F97316] hover:text-black cursor-pointer transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
};
