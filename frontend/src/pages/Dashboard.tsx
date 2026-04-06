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
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto">
                <PageHeader title="Dashboard" subtitle="" />

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
                <div className="hidden md:block fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none -z-1 font-mono text-[200px] font-bold leading-none select-none">
                    PROMETHEON
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
