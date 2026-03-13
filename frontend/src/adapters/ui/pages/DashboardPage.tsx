import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn, formatNumber, FUEL_COLORS, VESSEL_COLORS } from '../../../shared/utils';
import KPICard from '../components/KPICard';
import GlassCard from '../components/GlassCard';
import RadialGauge from '../components/RadialGauge';
import { Ship, CheckCircle, Flame, Gauge, TrendingDown, Anchor } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

export default function DashboardPage() {
  const { theme } = useAppStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getData(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, charts, healthScores } = data;

  // Prepare chart data
  const fuelData = Object.entries(charts.byFuelType).map(([name, value]) => ({
    name,
    value,
    color: FUEL_COLORS[name] || '#666',
  }));

  const vesselData = Object.entries(charts.byVesselType).map(([name, emissions]) => ({
    name,
    emissions: Math.round(emissions),
    color: VESSEL_COLORS[name] || '#666',
  }));

  const yearData = Object.entries(charts.byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, d]) => ({
      year,
      emissions: Math.round(d.totalEmissions),
      intensity: Number(d.avgIntensity.toFixed(2)),
    }));

  const txtMuted = theme === 'dark' ? 'text-white/40' : 'text-ocean-400';
  const txtMain = theme === 'dark' ? 'text-white' : 'text-ocean-800';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Fleet Overview</h1>
          <p className={cn('mt-1 text-sm', txtMuted)}>
            Real-time FuelEU Maritime compliance monitoring
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-mono',
          theme === 'dark' ? 'border-white/[0.06] bg-white/[0.02] text-white/50' : 'border-ocean-100/20 bg-white/60 text-ocean-500'
        )}>
          <div className="h-2 w-2 rounded-full bg-sea-400 animate-glow-pulse" />
          Target: 89.3368 gCO₂e/MJ
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Routes"
          value={kpis.totalRoutes}
          icon={<Ship className="h-5 w-5 text-sea-400" />}
          glow="sea"
        />
        <KPICard
          title="Compliant Routes"
          value={kpis.compliantRoutes}
          subtitle={`${kpis.complianceRate}% compliance rate`}
          icon={<CheckCircle className="h-5 w-5 text-sea-400" />}
          trend={{ value: kpis.complianceRate, positive: kpis.complianceRate >= 50 }}
          glow="sea"
        />
        <KPICard
          title="Total Emissions"
          value={`${formatNumber(kpis.totalEmissions)}t`}
          subtitle="CO₂ equivalent"
          icon={<Flame className="h-5 w-5 text-coral-400" />}
          glow="coral"
        />
        <KPICard
          title="Fleet Health"
          value={`${kpis.complianceScore}/100`}
          subtitle="Average compliance score"
          icon={<Gauge className="h-5 w-5 text-amber-400" />}
          glow="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fuel Distribution Donut */}
        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            Fuel Distribution
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={fuelData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {fuelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: theme === 'dark' ? 'rgba(6,14,20,0.95)' : 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: theme === 'dark' ? 'white' : '#0f3d5e',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-3">
            {fuelData.map((f) => (
              <div key={f.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                <span className={txtMuted}>{f.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Emissions by Vessel Type */}
        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            Emissions by Vessel Type
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vesselData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,61,94,0.06)'} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#5e81a4' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#5e81a4' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: theme === 'dark' ? 'rgba(6,14,20,0.95)' : 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: theme === 'dark' ? 'white' : '#0f3d5e',
                }}
              />
              <Bar dataKey="emissions" radius={[6, 6, 0, 0]}>
                {vesselData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Intensity Trend */}
        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            GHG Intensity Trend
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={yearData}>
              <defs>
                <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2ec4b6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2ec4b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,61,94,0.06)'} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#5e81a4' }} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#5e81a4' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: theme === 'dark' ? 'rgba(6,14,20,0.95)' : 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: theme === 'dark' ? 'white' : '#0f3d5e',
                }}
              />
              <Area type="monotone" dataKey="intensity" stroke="#2ec4b6" strokeWidth={2} fill="url(#intensityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Health Scores Row */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className={cn('text-xs font-medium uppercase tracking-wider', txtMuted)}>
              Compliance Health Scores
            </div>
            <div className={cn('text-sm mt-1', txtMuted)}>
              Individual vessel compliance assessment
            </div>
          </div>
          <Anchor className={cn('h-5 w-5', txtMuted)} />
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {healthScores.slice(0, 6).map((h) => (
            <RadialGauge
              key={h.shipId}
              score={h.score}
              size={110}
              label={h.shipId}
              status={h.status}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
