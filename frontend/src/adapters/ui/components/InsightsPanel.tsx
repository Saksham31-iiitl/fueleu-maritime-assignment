import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn } from '../../../shared/utils';
import { X, Sparkles, AlertTriangle, CheckCircle, Zap, Info } from 'lucide-react';
import type { InsightMessage } from '../../../core/domain/types';

const INSIGHT_ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  action: Zap,
};

const INSIGHT_STYLES = {
  info: 'border-blue-400/20 bg-blue-400/5',
  warning: 'border-amber-400/20 bg-amber-400/5',
  success: 'border-sea-400/20 bg-sea-400/5',
  action: 'border-purple-400/20 bg-purple-400/5',
};

const INSIGHT_ICON_COLORS = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  success: 'text-sea-400',
  action: 'text-purple-400',
};

export default function InsightsPanel() {
  const { theme, toggleInsights } = useAppStore();
  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => dashboardApi.getInsights(),
  });

  return (
    <div className={cn(
      'fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col border-l animate-slide-in-left',
      theme === 'dark' ? 'border-white/[0.06] bg-navy-900/95 backdrop-blur-2xl' : 'border-ocean-100/20 bg-white/95 backdrop-blur-2xl'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Compliance Insights</div>
            <div className={cn('text-[10px] uppercase tracking-wider', theme === 'dark' ? 'text-white/30' : 'text-ocean-400')}>
              AI-Powered Analysis
            </div>
          </div>
        </div>
        <button onClick={toggleInsights} className="rounded-lg p-1.5 hover:bg-white/[0.06] transition-colors">
          <X className="h-4 w-4 text-white/40" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div className="h-4 w-1/2 rounded bg-white/[0.06] mb-2" />
                <div className="h-3 w-full rounded bg-white/[0.04]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.04] mt-1" />
              </div>
            ))}
          </div>
        ) : (
          insights?.map((insight: InsightMessage, idx: number) => {
            const Icon = INSIGHT_ICONS[insight.type];
            return (
              <div
                key={idx}
                className={cn(
                  'rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01]',
                  INSIGHT_STYLES[insight.type]
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', INSIGHT_ICON_COLORS[insight.type])} />
                  <div>
                    <div className="text-xs font-semibold mb-1">{insight.title}</div>
                    <div className={cn('text-xs leading-relaxed', theme === 'dark' ? 'text-white/50' : 'text-ocean-500')}>
                      {insight.message}
                    </div>
                    {insight.shipId && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono">
                        {insight.shipId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={cn('border-t px-5 py-3', theme === 'dark' ? 'border-white/[0.06]' : 'border-ocean-100/20')}>
        <div className={cn('text-[10px]', theme === 'dark' ? 'text-white/20' : 'text-ocean-300')}>
          Insights generated from fleet compliance data • Updated in real-time
        </div>
      </div>
    </div>
  );
}
