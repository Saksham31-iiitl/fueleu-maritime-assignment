import React, { ReactNode } from 'react';
import { useAppStore } from '../../../shared/store';
import { cn } from '../../../shared/utils';
import GlassCard from './GlassCard';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  glow?: 'sea' | 'coral' | 'amber' | 'none';
}

export default function KPICard({ title, value, subtitle, icon, trend, glow = 'none' }: KPICardProps) {
  const { theme } = useAppStore();

  return (
    <GlassCard hover glow={glow} padding="md">
      <div className="flex items-start justify-between">
        <div>
          <div className={cn('text-[11px] font-medium uppercase tracking-wider', theme === 'dark' ? 'text-white/35' : 'text-ocean-400')}>
            {title}
          </div>
          <div className={cn('mt-2 text-3xl font-bold tracking-tight', theme === 'dark' ? 'text-white' : 'text-ocean-800')}>
            {value}
          </div>
          {subtitle && (
            <div className={cn('mt-1 text-xs', theme === 'dark' ? 'text-white/30' : 'text-ocean-400')}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              trend.positive ? 'bg-sea-400/10 text-sea-400' : 'bg-coral-400/10 text-coral-400'
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          theme === 'dark' ? 'bg-white/[0.04]' : 'bg-ocean-50'
        )}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}
