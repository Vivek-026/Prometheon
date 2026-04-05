import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Forward, 
  Download, 
  AlertOctagon, 
  ChevronRight, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { MonthlyWorklog } from '../../types/worklogs';

interface WorklogMonthlyProps {
  data: MonthlyWorklog;
  onExport: () => void;
}

const WorklogMonthly: React.FC<WorklogMonthlyProps> = ({ data, onExport }) => {
  const stats = [
    { label: 'Tasks Completed', value: data?.stats?.total_tasks || 0, icon: <Clock size={16} />, color: 'text-zinc-100' },
    { label: 'Completion Rate', value: `${data?.stats?.completion_pct || 0}%`, icon: <CheckCircle2 size={16} />, color: 'text-green-500', 
      delta: data?.stats?.vs_previous_month?.completion_pct_delta },
    { label: 'Pushed Forward', value: data?.stats?.carry_forward_count || 0, icon: <Forward size={16} />, color: 'text-yellow-500',
      delta: data?.stats?.vs_previous_month?.carry_forward_delta, inverse: true },
    { label: 'On-Time Delivery', value: `${data?.stats?.on_time_rate || 0}%`, icon: <AlertTriangle size={16} />, color: 'text-[#F97316]' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* Stats Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
             <Card key={i} className="bg-[#0b0b0b] border-[#2e2e2e] rounded-none overflow-hidden hover:border-[#F97316]/50 transition-all border-l-2 border-l-[#F97316]">
                <CardContent className="p-6 space-y-3">
                   <div className="flex items-center gap-2">
                      <span className="text-zinc-700">{stat.icon}</span>
                      <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">{stat.label}</span>
                   </div>
                   <div className="flex items-end justify-between">
                      <span className={cn("text-3xl font-black italic tracking-tighter", stat.color)}>{stat.value}</span>
                      {stat.delta !== undefined && data?.stats?.vs_previous_month && (
                         <div className={cn(
                           "flex items-center gap-1 text-[9px] font-black uppercase italic mb-1",
                           (stat.inverse ? stat.delta < 0 : stat.delta > 0) ? "text-green-500" : "text-red-500"
                         )}>
                            {stat.delta > 0 ? <TrendingUpIcon size={12} /> : <TrendingDownIcon size={12} />}
                            {Math.abs(stat.delta)}% vs prev
                         </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <Card className="lg:col-span-2 bg-[#0d0d0d] border-[#2e2e2e] rounded-none shadow-2xl relative overflow-hidden group">
             <CardHeader className="p-6 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic tracking-widest text-[#F97316]">Workload by Category</CardTitle>
                <Badge className="bg-[#111] text-zinc-600 border-zinc-800 text-[8px] h-5 rounded-none font-black italic">VOLUME BY TAG</Badge>
             </CardHeader>
             <CardContent className="p-6">
                <div style={{ width: '100%', height: 300 }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.by_tag || []} layout="vertical" margin={{ left: 20 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                         <XAxis type="number" stroke="#444" fontSize={10} tickFormatter={(v) => `${v}%`} />
                         <YAxis dataKey="tag" type="category" stroke="#444" fontSize={10} tickLine={false} width={80} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #2e2e2e', fontSize: '10px', borderRadius: '0' }}
                           cursor={{ fill: '#1a1a1a' }}
                         />
                         <Bar dataKey="count" fill="#F97316" barSize={12} radius={[0, 4, 4, 0]}>
                            {(data?.by_tag || []).map((_entry, index) => (
                               <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#F97316' : '#6366f1'} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>

          {/* Blockers / High CF Section */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <AlertOctagon className="text-red-500" size={16} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-red-500">Stuck Tasks</h3>
             </div>

             <div className="space-y-3">
                {(data?.blockers || []).map((task) => (
                   <div key={task.id} className="p-4 bg-[#111] border border-red-900/20 hover:border-red-900/50 transition-all group flex flex-col gap-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                         <AlertOctagon size={48} />
                      </div>
                      <div className="flex justify-between items-start">
                         <span className="text-[11px] font-black uppercase text-white truncate max-w-[150px] leading-tight">{task.name}</span>
                         <Badge className="bg-red-950/40 text-red-500 border border-red-900/30 rounded-none text-[8px] h-4 font-black">
                           ×{task.carry_forward_count} CF
                         </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-red-500/50 text-[9px] font-bold uppercase italic">
                         <Forward size={10} /> Consistently pushed forward
                      </div>
                      <Button variant="outline" className="h-7 text-[8px] font-black uppercase rounded-none border-red-900/30 text-red-500 hover:bg-red-900/10">
                         Audit History <ChevronRight size={10} className="ml-1" />
                      </Button>
                   </div>
                ))}
                {(data?.blockers || []).length === 0 && (
                   <div className="p-20 border border-dashed border-zinc-900 text-center opacity-10 font-black uppercase italic text-xs">No stuck tasks this month</div>
                )}
             </div>

             <Button 
                onClick={onExport}
                className="w-full bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#F97316]/50 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-sm"
              >
                <Download size={16} className="mr-3" /> Export Performance Report
             </Button>
          </div>
       </div>
    </div>
  );
};

export default WorklogMonthly;
