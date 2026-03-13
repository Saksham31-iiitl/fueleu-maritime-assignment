import React, { ReactNode } from 'react';
import { useAppStore } from '../../../shared/store';
import { cn } from '../../../shared/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'sea' | 'coral' | 'amber' | 'none';
  padding?: 'sm' | 'md' | 'lg';
}

export default function GlassCard({ children, className, hover = false, glow = 'none', padding = 'md' }: GlassCardProps) {
  const { theme } = useAppStore();
  const padCls = padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6';

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300',
      theme === 'dark'
        ? 'border-white/[0.06] bg-white/[0.025]'
        : 'border-ocean-100/20 bg-white/70',
      hover && 'hover:border-sea-400/20 hover:-translate-y-0.5',
      hover && theme === 'dark' && 'hover:shadow-[0_12px_48px_rgba(46,196,182,0.06)]',
      hover && theme === 'light' && 'hover:shadow-[0_12px_48px_rgba(15,61,94,0.08)]',
      padCls,
      className
    )}>
      {/* Inner glow */}
      {glow !== 'none' && (
        <div className={cn(
          'absolute -top-20 -right-20 h-40 w-40 rounded-full blur-[80px] opacity-20 pointer-events-none',
          glow === 'sea' && 'bg-sea-400',
          glow === 'coral' && 'bg-coral-400',
          glow === 'amber' && 'bg-amber-400',
        )} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
