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
          <Card className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none shadow-[0_0_20px_rgba(0,0,0,0.3)] group overflow-hidden">
             <CardHeader className="p-6 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#F97316] flex items-center gap-2">
                   <Target size={16} /> Completion Rate Trend
                </CardTitle>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black italic rounded-full">
                   <TrendingUpIcon size={12} /> ON TRACK
                </div>
             </CardHeader>
             <CardContent className="p-6">
                <div style={{ width: '100%', height: 300 }}>
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
          <Card className="bg-[#0d0d0d] border-[#2e2e2e] rounded-none shadow-[0_0_20px_rgba(0,0,0,0.3)] group overflow-hidden">
             <CardHeader className="p-6 border-b border-[#2e2e2e] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic tracking-[0.2em] text-[#6366f1] flex items-center gap-2">
                   <Activity size={16} /> Work Output Tracking
                </CardTitle>
                <Badge className="bg-[#111] text-zinc-600 border-zinc-800 text-[8px] h-5 rounded-none font-black italic">QUARTERLY VOLUME</Badge>
             </CardHeader>
             <CardContent className="p-6">
                <div style={{ width: '100%', height: 300 }}>
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
       <div className="space-y-6 pb-12">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-zinc-500 flex items-center gap-3">
             <Award size={14} className="text-[#F97316]" /> Performance Leaders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {(data?.top_users || []).map((user, idx) => (
                <div key={user.id} className="p-5 bg-zinc-950/40 border border-[#2e2e2e] hover:border-[#F97316]/40 transition-all flex items-center justify-between group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Award size={64} />
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-zinc-800 p-0.5 group-hover:border-[#F97316] transition-all overflow-hidden bg-zinc-900">
                           <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F97316] rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black italic">{idx + 1}</div>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[11px] font-black uppercase text-white truncate max-w-[120px]">{user.name}</span>
                         <span className="text-[8px] text-zinc-600 font-bold uppercase italic">{user.role}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-2xl font-black italic tracking-tighter text-[#F97316]">{user.score}</div>
                      <div className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Perf Index</div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default WorklogQuarterly;
