import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Zap, 
  Target, 
  Award,
  ChevronRight,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { QuarterlyWorklog } from '../../types/worklogs';

interface WorklogQuarterlyProps {
  data: QuarterlyWorklog;
}

const WorklogQuarterly: React.FC<WorklogQuarterlyProps> = ({ data }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Completion Trend */}
          <Card className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none shadow-[0_0_20px_rgba(0,0,0,0.3)]">
             <CardHeader className="p-6 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#F97316] flex items-center gap-2">
                   <Target size={16} /> Completion_Protocol_Trend
                </CardTitle>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black italic rounded-full">
                   <TrendingUpIcon size={12} /> OPTIMAL_STATUS
                </div>
             </CardHeader>
             <CardContent className="p-6">
                <div style={{ width: '100%', height: 300 }}>
                   {/* @ts-ignore */}
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.completion_trend || []}>
                         <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                         <XAxis dataKey="month" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                         <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #2e2e2e', fontSize: '10px', borderRadius: '0' }}
                           cursor={{ stroke: '#F97316', strokeWidth: 1 }}
                         />
                         <Area type="monotone" dataKey="rate" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" dot={{ fill: '#F97316', strokeWidth: 2 }} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>

          {/* Velocity Trend */}
          <Card className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none shadow-[0_0_20px_rgba(0,0,0,0.3)]">
             <CardHeader className="p-6 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#6366f1] flex items-center gap-2">
                   <Activity size={16} /> Velocity_Execution_Registry
                </CardTitle>
                <Badge className="bg-[#111] text-zinc-600 border-zinc-800 text-[8px] h-5 rounded-none font-black italic">QUARTERLY_OUTPUT</Badge>
             </CardHeader>
             <CardContent className="p-6">
                <div style={{ width: '100%', height: 300 }}>
                   {/* @ts-ignore */}
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.velocity_trend || []}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                         <XAxis dataKey="month" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                         <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #2e2e2e', fontSize: '10px', borderRadius: '0' }}
                           cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                         />
                         <Line type="step" dataKey="tasks_completed" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>
       </div>

       {/* Top Personnel Quarterly Performance */}
       <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-zinc-500 flex items-center gap-3">
             <Award size={14} className="text-[#F97316]" /> HighPersonnel_Efficiency_Audit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {(data?.per_person || []).map((p) => (
                <div key={p.user.id} className="relative bg-[#0d0d0d] border border-[#2e2e2e] p-5 flex flex-col gap-4 group hover:border-[#F97316]/50 transition-all overflow-hidden border-t-2 border-t-[#F97316]">
                   <div className="absolute -right-2 -bottom-2 text-zinc-900 group-hover:text-[#F97316]/10 transition-colors">
                      <Zap size={64} fill="currentColor" />
                   </div>
                   
                   <div className="flex flex-col gap-1 z-10">
                      <span className="text-[10px] font-black uppercase text-white truncate tracking-widest">{p.user.name}</span>
                      <span className="text-[7px] text-zinc-700 font-bold uppercase italic tracking-tighter">OPERATIVE_ID: {p.user.id.slice(0,8)}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 z-10 pt-2 border-t border-zinc-900">
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black text-zinc-600 uppercase">PROTOCOL_EX_TOTAL</span>
                         <span className="text-sm font-black text-zinc-400 italic font-mono">{p.total}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black text-zinc-600 uppercase">COMPLETION_RATE</span>
                         <span className="text-sm font-black text-green-500 italic font-mono">{Math.round((p.completed / Math.max(1, p.total)) * 100)}%</span>
                      </div>
                   </div>

                   <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden z-10">
                      <div className="h-full bg-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all" style={{ width: `${(p.completed / Math.max(1, p.total)) * 100}%` }} />
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Detailed Auditor Table */}
       <div className="bg-[#0b0b0b] border border-[#2e2e2e] overflow-hidden rounded-none">
          <table className="w-full text-[10px] uppercase font-bold italic tracking-tighter">
             <thead className="bg-[#111] border-b border-[#2e2e2e] text-zinc-600">
                <tr>
                   <th className="p-4 text-left">Target Operative</th>
                   <th className="p-4 text-center">Quarterly_Protocol</th>
                   <th className="p-4 text-center">Completed_Cycle</th>
                   <th className="p-4 text-center">Carry_Forward_Metric</th>
                   <th className="p-4 text-right">Access_Profile</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-zinc-900">
                {(data?.per_person || []).map(p => (
                   <tr key={p.user.id} className="hover:bg-zinc-900 transition-colors group">
                      <td className="p-4 font-black tracking-tight text-white">{p.user.name}</td>
                      <td className="p-4 text-center font-black text-zinc-500 italic">{p.total} UNITS</td>
                      <td className="p-4 text-center">
                         <Badge className="bg-green-600/10 text-green-500 border-none rounded-none italic px-3">{p.completed} DONE</Badge>
                      </td>
                      <td className="p-4 text-center">
                         <div className="inline-flex items-center gap-1.5 text-yellow-500">
                            <TrendingDown size={12} className="text-zinc-700" />
                            {p.carry_forwards} DELAYS
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
  );
};

export default WorklogQuarterly;
