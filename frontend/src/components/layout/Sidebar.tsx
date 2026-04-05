import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useSidebarStore } from '../../store/useSidebarStore';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Flag, 
  ShieldAlert,
  Terminal,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Role } from '../../types/auth';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Documents', href: '/documents', icon: FileText, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Worklogs', href: '/worklogs', icon: Clock, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Your Availability', href: '/availability', icon: Calendar, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Flags', href: '/flags', icon: Flag, roles: ['admin', 'task_manager'] },
  { name: 'Escalations', href: '/admin/escalations', icon: ShieldAlert, roles: ['admin'] },
];

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { isOpen, close } = useSidebarStore();
  const userRole = user?.role || 'coder';

  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] md:hidden transition-opacity"
          onClick={close}
        />
      )}

      <aside className={cn(
        "w-64 h-screen bg-[#1a1a1a] border-r border-[#2e2e2e] fixed left-0 top-0 overflow-y-auto flex flex-col font-mono z-[100] transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal size={24} className="text-[#F97316]" />
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#F97316]">Prometheon</h2>
          </div>
          <button onClick={close} className="p-1 md:hidden text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => close()}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 group text-xs uppercase font-bold tracking-wider",
                isActive 
                  ? "bg-[#F97316]/10 text-[#F97316] border-l-2 border-[#F97316]" 
                  : "text-muted-foreground hover:bg-[#2e2e2e] hover:text-white"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-colors",
                "group-hover:text-[#F97316]"
              )} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#2e2e2e] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#111] border border-[#2e2e2e] rounded-sm">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white font-black truncate uppercase leading-none">{user?.name}</span>
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{user?.role}</span>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
