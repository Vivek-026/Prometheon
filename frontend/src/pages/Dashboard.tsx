import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import Sidebar from '../components/layout/Sidebar';
import { 
  ActiveTasksWidget, 
  CarryForwardWidget, 
  MyFlagsWidget, 
  TeamSummaryWidget, 
  FlaggedTasksWidget, 
  EscalatedTasksWidget 
} from '../components/dashboard/DashboardWidgets';

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const role = user?.role || 'coder';

    return (
        <div className="flex bg-[#111111] min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <header className="mb-10 flex flex-col gap-2 relative">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-[#F97316]" />
                        <h1 className="text-3xl font-black uppercase tracking-tighter">
                            Control Center / <span className="opacity-40 italic">{role} Portal</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em]">
                            ESTABLISHED UPLINK: {new Date().toLocaleTimeString()}
                        </span>
                        <div className="h-[1px] flex-1 bg-[#2e2e2e]" />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Widgets for ALL roles */}
                    <ActiveTasksWidget />
                    <CarryForwardWidget />

                    {/* Role Specific Widgets */}
                    {role === 'coder' && (
                        <div className="col-span-1 md:col-span-1 lg:col-span-1">
                            <MyFlagsWidget />
                        </div>
                    )}

                    {(role === 'task_manager' || role === 'admin') && (
                        <>
                            <TeamSummaryWidget />
                            <FlaggedTasksWidget />
                        </>
                    )}

                    {role === 'admin' && (
                        <EscalatedTasksWidget />
                    )}
                </div>

                {/* Background Decoratives */}
                <div className="fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none -z-1 font-mono text-[200px] font-black uppercase tracking-tighter leading-none italic select-none">
                    PROMETHEON
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
