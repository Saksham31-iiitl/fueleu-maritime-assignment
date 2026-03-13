import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, routeApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn, formatNumber, FUEL_COLORS, VESSEL_COLORS } from '../../../shared/utils';
import GlassCard from '../components/GlassCard';
import RadialGauge from '../components/RadialGauge';
import { BarChart3, TrendingDown, Leaf } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area, ComposedChart,
  ReferenceLine,
} from 'recharts';

const TARGET = 89.3368;

export default function AnalyticsPage() {
  const { theme } = useAppStore();
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getData(),
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routeApi.getAll(),
  });

  const txtMuted = theme === 'dark' ? 'text-white/40' : 'text-ocean-400';
  const txtMain = theme === 'dark' ? 'text-white' : 'text-ocean-800';

  if (!dashboard) {
    return <div className="animate-pulse h-96 rounded-2xl bg-white/[0.02]" />;
  }

  const { charts, healthScores } = dashboard;

  // Vessel emission stacked data
  const vesselFuelMatrix: Record<string, Record<string, number>> = {};
  routes.forEach(r => {
    if (!vesselFuelMatrix[r.vesselType]) vesselFuelMatrix[r.vesselType] = {};
    vesselFuelMatrix[r.vesselType][r.fuelType] = (vesselFuelMatrix[r.vesselType][r.fuelType] || 0) + r.totalEmissions;
  });
  const allFuels = [...new Set(routes.map(r => r.fuelType))];
  const stackedData = Object.entries(vesselFuelMatrix).map(([vessel, fuels]) => ({
    vessel,
    ...fuels,
  }));

  // Intensity distribution
  const intensityBuckets = [
    { range: '<85', count: routes.filter(r => r.ghgIntensity < 85).length },
    { range: '85-88', count: routes.filter(r => r.ghgIntensity >= 85 && r.ghgIntensity < 88).length },
    { range: '88-90', count: routes.filter(r => r.ghgIntensity >= 88 && r.ghgIntensity < 90).length },
    { range: '90-92', count: routes.filter(r => r.ghgIntensity >= 90 && r.ghgIntensity < 92).length },
    { range: '92-95', count: routes.filter(r => r.ghgIntensity >= 92 && r.ghgIntensity < 95).length },
    { range: '>95', count: routes.filter(r => r.ghgIntensity >= 95).length },
  ];

  // Route scatter data: consumption vs intensity
  const scatterData = routes.map(r => ({
    name: r.routeId,
    intensity: r.ghgIntensity,
    consumption: r.fuelConsumption,
    emissions: r.totalEmissions,
    compliant: r.ghgIntensity <= TARGET,
  }));

  // Yearly trend data
  const yearData = Object.entries(charts.byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, d]) => ({
      year,
      emissions: Math.round(d.totalEmissions),
      intensity: Number(d.avgIntensity.toFixed(2)),
      target: TARGET,
      routes: d.count,
    }));

  // Radar data for vessel type performance
  const radarData = Object.entries(charts.byVesselType).map(([name, emissions]) => {
    const vesselRoutes = routes.filter(r => r.vesselType === name);
    const avgIntensity = vesselRoutes.reduce((s, r) => s + r.ghgIntensity, 0) / vesselRoutes.length;
    return {
      subject: name,
      intensity: Math.round(avgIntensity * 10) / 10,
      emissions: Math.round(emissions / 100),
      efficiency: Math.round((1 - avgIntensity / 100) * 100),
    };
  });

  const tooltipStyle = {
    background: theme === 'dark' ? 'rgba(6,14,20,0.95)' : 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '11px',
    color: theme === 'dark' ? 'white' : '#0f3d5e',
  };

  const axisColor = theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#5e81a4';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,61,94,0.06)';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Analytics</h1>
          <p className={cn('mt-1 text-sm', txtMuted)}>
            Deep-dive into fleet emissions and compliance performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-sea-400" />
          <span className={cn('text-xs', txtMuted)}>{routes.length} routes analyzed</span>
        </div>
      </div>

      {/* Row 1: Stacked bar + Intensity distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            Emissions by Vessel & Fuel Type
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="vessel" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              {allFuels.map(fuel => (
                <Bar key={fuel} dataKey={fuel} stackId="a" fill={FUEL_COLORS[fuel] || '#666'} radius={fuel === allFuels[allFuels.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            GHG Intensity Distribution
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={intensityBuckets} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} label={{ value: 'gCO₂e/MJ', position: 'bottom', fontSize: 10, fill: axisColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {intensityBuckets.map((entry, i) => {
                  const midVal = entry.range.includes('>') ? 96 : entry.range.includes('<') ? 83 : Number(entry.range.split('-')[0]);
                  return <Cell key={i} fill={midVal <= TARGET ? '#2ec4b6' : '#ff6b6b'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Row 2: Trend + Radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            Yearly Emissions & Intensity Trend
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[85, 95]} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar yAxisId="left" dataKey="emissions" name="Emissions (t)" fill="#0f3d5e" radius={[6, 6, 0, 0]} opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="intensity" name="Avg Intensity" stroke="#2ec4b6" strokeWidth={2.5} dot={{ r: 4, fill: '#2ec4b6' }} />
              <ReferenceLine yAxisId="right" y={TARGET} stroke="#ff6b6b" strokeDasharray="6 3" label={{ value: 'Target', position: 'right', fill: '#ff6b6b', fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard hover>
          <div className={cn('mb-4 text-xs font-medium uppercase tracking-wider', txtMuted)}>
            Vessel Type Performance Radar
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: axisColor }} />
              <Radar name="Intensity" dataKey="intensity" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.15} />
              <Radar name="Efficiency" dataKey="efficiency" stroke="#2ec4b6" fill="#2ec4b6" fillOpacity={0.15} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Row 3: Health scores overview */}
      <GlassCard>
        <div className={cn('mb-6 text-xs font-medium uppercase tracking-wider', txtMuted)}>
          Fleet Compliance Health Map
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {healthScores.map(h => (
            <div key={h.shipId} className="flex flex-col items-center">
              <RadialGauge score={h.score} size={100} status={h.status} />
              <div className={cn('mt-2 text-xs font-mono font-semibold', txtMain)}>{h.shipId}</div>
              <div className={cn('text-[10px]', txtMuted)}>{h.intensity} gCO₂e/MJ</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
