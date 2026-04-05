import React from 'react';
import { cn } from '../../lib/utils';

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn("flex flex-col", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string; value?: string; onValueChange?: (value: string) => void }> = ({ children, className, value, onValueChange }) => {
  return (
    <div className={cn("flex", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string; activeValue?: string; onValueChange?: (value: string) => void }> = ({ value, children, className, activeValue, onValueChange }) => {
  const isActive = activeValue === value;
  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={cn(
        "px-4 py-2 transition-all",
        isActive ? "bg-[#F97316] text-black" : "text-zinc-500 hover:text-white",
        className
      )}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string; activeValue?: string }> = ({ value, children, className, activeValue }) => {
  if (value !== activeValue) return null;
  return <div className={className}>{children}</div>;
};
