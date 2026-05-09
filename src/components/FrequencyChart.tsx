import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FrequencyResponsePoint } from '../types';

interface FrequencyChartProps {
  data: FrequencyResponsePoint[];
  iemName: string;
}

export const FrequencyChart: React.FC<FrequencyChartProps> = ({ data, iemName }) => {
  return (
    <div className="w-full h-[400px] hardware-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="mono-text text-xs uppercase tracking-widest text-[#8E9299]">Frequency Response: {iemName}</h3>
        <div className="flex gap-4 text-[10px] mono-text uppercase">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FFFFFF]" /> Raw Hardware
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FF4444]" /> B&K 5128 Optimized
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d33" vertical={false} />
          <XAxis 
            dataKey="frequency" 
            scale="log" 
            domain={[20, 20000]} 
            type="number" 
            stroke="#4a4d55"
            tick={{fontSize: 10, fill: '#8E9299'}}
            tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
          />
          <YAxis 
            domain={[40, 100]} 
            stroke="#4a4d55"
            tick={{fontSize: 10, fill: '#8E9299'}}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2128', border: 'none', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="raw" 
            stroke="#FFFFFF" 
            strokeWidth={2} 
            dot={false} 
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="equalized" 
            stroke="#FF4444" 
            strokeWidth={3} 
            dot={false} 
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
