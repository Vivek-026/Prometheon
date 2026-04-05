import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import Sidebar from '../components/layout/Sidebar';
import PageHeader from '../components/layout/PageHeader';
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
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
                <PageHeader title="Dashboard" subtitle={`${role} View`} />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 md:pb-0">
                    {/* Widgets for ALL roles */}
                    <ActiveTasksWidget />
                    <CarryForwardWidget />

                    {/* Role Specific Widgets */}
                    {role === 'coder' && (
                        <div className="col-span-1">
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
                <div className="hidden md:block fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none -z-1 font-mono text-[200px] font-black uppercase tracking-tighter leading-none italic select-none">
                    PROMETHEON
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
