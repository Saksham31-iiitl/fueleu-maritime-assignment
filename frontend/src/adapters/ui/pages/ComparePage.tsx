import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { routeApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn } from '../../../shared/utils';
import GlassCard from '../components/GlassCard';
import { GitCompare, CheckCircle, XCircle } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Cell, Legend,
} from 'recharts';

const TARGET = 89.3368;

export default function ComparePage() {
  const { theme } = useAppStore();
  const { data, isLoading } = useQuery({
    queryKey: ['comparison'],
    queryFn: () => routeApi.getComparison(),
  });

  const txtMuted = theme === 'dark' ? 'text-white/40' : 'text-ocean-400';
  const txtMain = theme === 'dark' ? 'text-white' : 'text-ocean-800';
  const borderCol = theme === 'dark' ? 'border-white/[0.06]' : 'border-ocean-100/20';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-white/[0.04]" />
        <div className="h-96 rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
      </div>
    );
  }

  if (!data?.baseline) {
    return (
      <div className="space-y-6">
        <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Compare Routes</h1>
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitCompare className={cn('h-12 w-12 mb-4', txtMuted)} />
            <div className={cn('text-sm font-medium', txtMain)}>No baseline route set</div>
            <div className={cn('text-xs mt-1', txtMuted)}>
              Go to Routes and set a baseline route to enable comparison analysis
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { baseline, comparisons } = data;

  const chartData = comparisons.map(c => ({
    name: c.routeId,
    baseline: baseline.ghgIntensity,
    comparison: c.comparisonIntensity,
    compliant: c.compliant,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Compare Routes</h1>
          <p className={cn('mt-1 text-sm', txtMuted)}>
            Baseline: <span className="font-mono text-sea-400">{baseline.routeId}</span> ({baseline.vesselType} / {baseline.fuelType}) — {baseline.ghgIntensity} gCO₂e/MJ
          </p>
        </div>
      </div>

      {/* Chart */}
      <GlassCard>
        <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
          GHG Intensity Comparison
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,61,94,0.06)'} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#5e81a4' }} axisLine={false} tickLine={false} />
            <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#5e81a4' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: theme === 'dark' ? 'rgba(6,14,20,0.95)' : 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                color: theme === 'dark' ? 'white' : '#0f3d5e',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#5e81a4' }} />
            <ReferenceLine y={TARGET} stroke="#2ec4b6" strokeDasharray="8 4" strokeWidth={2} label={{
              value: `Target: ${TARGET}`, position: 'right',
              fill: '#2ec4b6', fontSize: 10,
            }} />
            <ReferenceLine y={baseline.ghgIntensity} stroke="#ffd166" strokeDasharray="4 4" strokeWidth={1} />
            <Bar dataKey="comparison" name="Route Intensity" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.compliant ? '#2ec4b6' : '#ff6b6b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Comparison Table */}
      <GlassCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn('border-b text-[11px] font-medium uppercase tracking-wider', borderCol, txtMuted)}>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Vessel</th>
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Baseline Intensity</th>
                <th className="px-4 py-3">Route Intensity</th>
                <th className="px-4 py-3">% Difference</th>
                <th className="px-4 py-3">Compliant</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map(c => (
                <tr key={c.routeId} className={cn('border-b transition-colors', borderCol, theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-ocean-50/50')}>
                  <td className={cn('px-4 py-3 text-xs font-mono font-semibold', txtMain)}>{c.routeId}</td>
                  <td className={cn('px-4 py-3 text-xs', txtMuted)}>{c.vesselType}</td>
                  <td className={cn('px-4 py-3 text-xs', txtMuted)}>{c.fuelType}</td>
                  <td className={cn('px-4 py-3 text-xs font-mono', txtMuted)}>{c.year}</td>
                  <td className={cn('px-4 py-3 text-xs font-mono', txtMuted)}>{c.baselineIntensity.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-mono font-semibold',
                      c.compliant ? 'text-sea-400' : 'text-coral-400'
                    )}>
                      {c.comparisonIntensity.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold font-mono',
                      c.percentDiff < 0
                        ? 'bg-sea-400/10 text-sea-400'
                        : 'bg-coral-400/10 text-coral-400'
                    )}>
                      {c.percentDiff > 0 ? '+' : ''}{c.percentDiff.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.compliant ? (
                      <span className="inline-flex items-center gap-1 text-sea-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Yes</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-coral-400">
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">No</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
