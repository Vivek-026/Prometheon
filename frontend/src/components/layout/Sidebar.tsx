import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
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
  Menu,
  X,
  LogOut
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
  { name: 'Availability', href: '/availability', icon: Calendar, roles: ['admin', 'task_manager', 'coder'] },
  { name: 'Flags', href: '/flags', icon: Flag, roles: ['admin', 'task_manager'] },
  { name: 'Escalations', href: '/admin/escalations', icon: ShieldAlert, roles: ['admin'] },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.role || 'coder';
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-6 border-b border-[#2e2e2e] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={24} className="text-[#F97316]" />
          <h2 className="text-lg font-black uppercase tracking-tighter text-[#F97316] font-mono">Prometheon</h2>
        </div>
        {/* Close button only on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 text-zinc-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group text-sm font-medium min-h-[44px]",
              isActive
                ? "bg-[#F97316]/10 text-[#F97316] border-l-2 border-[#F97316]"
                : "text-muted-foreground hover:bg-[#2e2e2e] hover:text-white"
            )}
          >
            <item.icon size={18} className={cn(
              "transition-colors shrink-0",
              "group-hover:text-[#F97316]"
            )} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#2e2e2e] space-y-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 bg-[#111] border border-[#2e2e2e] rounded-sm">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
           <span className="text-xs text-muted-foreground truncate">{user?.name || 'User'} · {userRole}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] bg-[#111] border border-[#2e2e2e] rounded-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all text-xs font-medium"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#F97316] min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex w-64 h-screen bg-[#1a1a1a] border-r border-[#2e2e2e] fixed left-0 top-0 overflow-y-auto flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-[#1a1a1a] border-r border-[#2e2e2e] flex flex-col z-50 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
