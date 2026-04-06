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
    { label: 'Total Tasks', value: data?.stats?.total_tasks || 0, icon: <Clock size={16} />, color: 'text-zinc-100' },
    { label: 'Completion Rate', value: `${data?.stats?.completion_pct || 0}%`, icon: <CheckCircle2 size={16} />, color: 'text-green-500',
      delta: data?.stats?.vs_previous_month?.completion_pct_delta },
    { label: 'Pushed Forward', value: data?.stats?.carry_forward_count || 0, icon: <Forward size={16} />, color: 'text-yellow-500',
      delta: data?.stats?.vs_previous_month?.carry_forward_delta, inverse: true },
    { label: 'On-Time Rate', value: `${data?.stats?.on_time_rate || 0}%`, icon: <AlertTriangle size={16} />, color: 'text-[#F97316]' },
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
                      <span className="text-xs font-medium text-zinc-600">{stat.label}</span>
                   </div>
                   <div className="flex items-end justify-between">
                      <span className={cn("text-3xl font-semibold", stat.color)}>{stat.value}</span>
                      {stat.delta !== undefined && data?.stats?.vs_previous_month && (
                         <div className={cn(
                           "flex items-center gap-1 text-xs font-medium mb-1",
                           (stat.inverse ? stat.delta < 0 : stat.delta > 0) ? "text-green-500" : "text-red-500"
                         )}>
                            {stat.delta > 0 ? <TrendingUpIcon size={12} /> : <TrendingDownIcon size={12} />}
                            {Math.abs(stat.delta)}% VS_PREV
                         </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <Card className="lg:col-span-2 bg-[#0d0d0d] border-[#2e2e2e] rounded-none">
             <CardHeader className="p-6 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-zinc-300">Tasks by Label</CardTitle>
                <Badge className="bg-[#111] text-zinc-600 border-zinc-800 text-[10px] h-5 rounded-none font-medium">By Category</Badge>
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

          {/* Blockers Section */}
          <Card className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none">
             <CardHeader className="p-6 border-b border-[#2e2e2e]">
                <CardTitle className="text-xs font-semibold text-[#F97316] flex items-center gap-2">
                   <AlertOctagon size={14} /> Common Blockers
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                {(data?.top_blockers || []).map((blocker, i) => (
                   <div key={i} className="flex flex-col gap-2 p-3 bg-[#111] border border-zinc-900 group hover:border-[#F97316]/30 transition-all border-l-2 border-l-red-900/40">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">{blocker.reason}</span>
                         <Badge className="bg-red-500/10 text-red-500 border-none text-xs h-4 font-medium">{blocker.count} INCIDENTS</Badge>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                         <div className="h-full bg-red-500/30" style={{ width: `${(blocker.count / Math.max(...(data?.top_blockers || [{count: 1}]).map(b => b.count))) * 100}%` }} />
                      </div>
                   </div>
                ))}
                {(data?.top_blockers || []).length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-12">
                      <span className="text-xs font-normal">No blockers recorded</span>
                   </div>
                )}
             </CardContent>
          </Card>
       </div>

       {/* Team Summary - Only if Admin/Manager */}
       {data?.per_person_summary && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-500 flex items-center gap-3">
                   Team Performance
                </h3>
                <Button onClick={onExport} variant="outline" size="sm" className="bg-[#111] border-zinc-800 text-xs font-medium gap-2 rounded-none hover:bg-zinc-900 hover:border-[#F97316]">
                   <Download size={14} /> Export Report
                </Button>
             </div>
             
             <div className="bg-[#0d0d0d] border border-[#2e2e2e] overflow-hidden rounded-none table-scroll-wrapper">
                <table className="w-full text-xs font-normal">
                   <thead className="bg-[#111] border-b border-[#2e2e2e] text-zinc-600">
                      <tr>
                         <th className="p-4 text-left font-medium">Name</th>
                         <th className="p-4 text-center font-medium">Total</th>
                         <th className="p-4 text-center font-medium">Completed</th>
                         <th className="p-4 text-center font-medium">Pushed Forward</th>
                         <th className="p-4 text-right font-medium">Details</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-900">
                      {data.per_person_summary.map(p => (
                         <tr key={p.user.id} className="hover:bg-zinc-900 transition-colors group">
                            <td className="p-4">
                               <div className="flex flex-col">
                                  <span className="text-zinc-300 font-semibold">{p.user.name}</span>
                                  <span className="text-[10px] text-zinc-700">ID: {p.user.id.slice(0,8)}</span>
                               </div>
                            </td>
                            <td className="p-4 text-center font-normal text-zinc-500">{p.total}</td>
                            <td className="p-4 text-center">
                               <div className="flex flex-col items-center gap-1">
                                  <span className="font-medium text-green-500">{p.completed}</span>
                                  <div className="w-16 h-1 bg-zinc-900 overflow-hidden">
                                     <div className="h-full bg-green-500" style={{ width: `${(p.completed / p.total) * 100}%` }} />
                                  </div>
                                </div>
                            </td>
                            <td className="p-4 text-center">
                               <div className="inline-flex items-center gap-2 text-yellow-500 font-medium">
                                  <Forward size={12} /> {p.carry_forwards}
                                </div>
                            </td>
                            <td className="p-4 text-right">
                               <button className="text-zinc-700 hover:text-[#F97316] transition-colors"><ChevronRight size={16} /></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       )}
    </div>
  );
};

export default WorklogMonthly;
