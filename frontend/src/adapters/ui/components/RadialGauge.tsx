import React from 'react';
import { cn } from '../../../shared/utils';

interface RadialGaugeProps {
  score: number;
  size?: number;
  label?: string;
  status?: 'excellent' | 'good' | 'warning' | 'critical';
}

const STATUS_GRADIENT = {
  excellent: ['#2ec4b6', '#20a89c'],
  good: ['#60a5fa', '#3b82f6'],
  warning: ['#fbbf24', '#f59e0b'],
  critical: ['#ff6b6b', '#ef4444'],
};

export default function RadialGauge({ score, size = 140, label, status = 'good' }: RadialGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;
  const colors = STATUS_GRADIENT[status];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={`gauge-grad-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/[0.06]"
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#gauge-grad-${score})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight" style={{ color: colors[0] }}>
            {score}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            Score
          </span>
        </div>
      </div>
      {label && (
        <span className={cn(
          'text-xs font-medium',
          status === 'excellent' && 'text-sea-400',
          status === 'good' && 'text-blue-400',
          status === 'warning' && 'text-amber-400',
          status === 'critical' && 'text-coral-400',
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
