"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c'];

export default function DashboardCharts({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        No data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#0f172a', 
            border: '1px solid #1e293b',
            borderRadius: '12px',
            color: '#f8fafc'
          }} 
          itemStyle={{ color: '#f8fafc' }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
