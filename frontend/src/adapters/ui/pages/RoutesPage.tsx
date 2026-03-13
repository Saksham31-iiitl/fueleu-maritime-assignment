import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routeApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn, formatNumber } from '../../../shared/utils';
import GlassCard from '../components/GlassCard';
import { Ship, Filter, ChevronDown, ChevronRight, Anchor, Crosshair } from 'lucide-react';
import type { Route } from '../../../core/domain/types';

const TARGET = 89.3368;

export default function RoutesPage() {
  const { theme } = useAppStore();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ vesselType: '', fuelType: '', year: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Route>('routeId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes', filters],
    queryFn: () => routeApi.getAll({
      vesselType: filters.vesselType || undefined,
      fuelType: filters.fuelType || undefined,
      year: filters.year ? Number(filters.year) : undefined,
    }),
  });

  const baselineMut = useMutation({
    mutationFn: (routeId: string) => routeApi.setBaseline(routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['comparison'] });
    },
  });

  const sorted = useMemo(() => {
    return [...routes].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [routes, sortField, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const vesselTypes = [...new Set(routes.map(r => r.vesselType))];
  const fuelTypes = [...new Set(routes.map(r => r.fuelType))];
  const years = [...new Set(routes.map(r => r.year))].sort();

  const handleSort = (field: keyof Route) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const txtMuted = theme === 'dark' ? 'text-white/40' : 'text-ocean-400';
  const txtMain = theme === 'dark' ? 'text-white' : 'text-ocean-800';
  const borderCol = theme === 'dark' ? 'border-white/[0.06]' : 'border-ocean-100/20';

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Routes</h1>
        <p className={cn('mt-1 text-sm', txtMuted)}>Manage and monitor shipping route emissions data</p>
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className={cn('h-4 w-4', txtMuted)} />
          <select
            value={filters.vesselType}
            onChange={e => { setFilters(f => ({ ...f, vesselType: e.target.value })); setPage(0); }}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs bg-transparent outline-none',
              borderCol, txtMuted
            )}
          >
            <option value="">All Vessels</option>
            {vesselTypes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select
            value={filters.fuelType}
            onChange={e => { setFilters(f => ({ ...f, fuelType: e.target.value })); setPage(0); }}
            className={cn('rounded-lg border px-3 py-1.5 text-xs bg-transparent outline-none', borderCol, txtMuted)}
          >
            <option value="">All Fuels</option>
            {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={filters.year}
            onChange={e => { setFilters(f => ({ ...f, year: e.target.value })); setPage(0); }}
            className={cn('rounded-lg border px-3 py-1.5 text-xs bg-transparent outline-none', borderCol, txtMuted)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(filters.vesselType || filters.fuelType || filters.year) && (
            <button
              onClick={() => { setFilters({ vesselType: '', fuelType: '', year: '' }); setPage(0); }}
              className="text-xs text-sea-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn('border-b text-[11px] font-medium uppercase tracking-wider', borderCol, txtMuted)}>
                <th className="px-4 py-3 w-8" />
                {[
                  { key: 'routeId', label: 'Route' },
                  { key: 'vesselType', label: 'Vessel' },
                  { key: 'fuelType', label: 'Fuel' },
                  { key: 'year', label: 'Year' },
                  { key: 'ghgIntensity', label: 'GHG Intensity' },
                  { key: 'fuelConsumption', label: 'Fuel (t)' },
                  { key: 'distance', label: 'Distance (km)' },
                  { key: 'totalEmissions', label: 'Emissions (t)' },
                ].map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 cursor-pointer select-none hover:text-sea-400 transition-colors"
                    onClick={() => handleSort(col.key as keyof Route)}
                  >
                    {col.label}
                    {sortField === col.key && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="px-4 py-4">
                      <div className="h-4 rounded bg-white/[0.04]" />
                    </td>
                  </tr>
                ))
              ) : paged.map(route => (
                <React.Fragment key={route.routeId}>
                  <tr className={cn(
                    'border-b transition-colors',
                    borderCol,
                    theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-ocean-50/50',
                    route.isBaseline && (theme === 'dark' ? 'bg-sea-400/[0.03]' : 'bg-sea-50/50')
                  )}>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded === route.routeId ? null : route.routeId)}>
                        {expanded === route.routeId
                          ? <ChevronDown className="h-3.5 w-3.5 text-sea-400" />
                          : <ChevronRight className={cn('h-3.5 w-3.5', txtMuted)} />
                        }
                      </button>
                    </td>
                    <td className={cn('px-4 py-3 text-xs font-mono font-semibold', txtMain)}>
                      {route.routeId}
                      {route.isBaseline && (
                        <span className="ml-2 rounded-full bg-sea-400/10 px-2 py-0.5 text-[10px] text-sea-400">
                          BASELINE
                        </span>
                      )}
                    </td>
                    <td className={cn('px-4 py-3 text-xs', txtMuted)}>{route.vesselType}</td>
                    <td className={cn('px-4 py-3 text-xs', txtMuted)}>{route.fuelType}</td>
                    <td className={cn('px-4 py-3 text-xs font-mono', txtMuted)}>{route.year}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs font-mono font-semibold',
                        route.ghgIntensity <= TARGET ? 'text-sea-400' : 'text-coral-400'
                      )}>
                        {route.ghgIntensity.toFixed(1)}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 text-xs font-mono', txtMuted)}>{formatNumber(route.fuelConsumption)}</td>
                    <td className={cn('px-4 py-3 text-xs font-mono', txtMuted)}>{formatNumber(route.distance)}</td>
                    <td className={cn('px-4 py-3 text-xs font-mono', txtMuted)}>{formatNumber(route.totalEmissions)}</td>
                    <td className="px-4 py-3">
                      {route.ghgIntensity <= TARGET ? (
                        <span className="tag-surplus">✓ Compliant</span>
                      ) : (
                        <span className="tag-deficit">✗ Deficit</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => baselineMut.mutate(route.routeId)}
                        disabled={route.isBaseline || baselineMut.isPending}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
                          route.isBaseline
                            ? 'bg-sea-400/10 text-sea-400 cursor-default'
                            : 'bg-white/[0.04] text-white/50 hover:bg-sea-400/10 hover:text-sea-400'
                        )}
                      >
                        <Crosshair className="h-3 w-3" />
                        {route.isBaseline ? 'Baseline' : 'Set Baseline'}
                      </button>
                    </td>
                  </tr>
                  {/* Expansion panel */}
                  {expanded === route.routeId && (
                    <tr>
                      <td colSpan={10} className={cn('px-8 py-4', theme === 'dark' ? 'bg-white/[0.01]' : 'bg-ocean-50/30')}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className={txtMuted}>Energy (MJ)</div>
                            <div className={cn('font-mono font-semibold mt-1', txtMain)}>
                              {formatNumber(route.fuelConsumption * 41000)}
                            </div>
                          </div>
                          <div>
                            <div className={txtMuted}>Compliance Balance</div>
                            <div className={cn('font-mono font-semibold mt-1',
                              (TARGET - route.ghgIntensity) >= 0 ? 'text-sea-400' : 'text-coral-400')}>
                              {formatNumber((TARGET - route.ghgIntensity) * route.fuelConsumption * 41000)} gCO₂eq
                            </div>
                          </div>
                          <div>
                            <div className={txtMuted}>Intensity vs Target</div>
                            <div className={cn('font-mono font-semibold mt-1', txtMain)}>
                              {((route.ghgIntensity / TARGET - 1) * 100).toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className={txtMuted}>Penalty Estimate</div>
                            <div className={cn('font-mono font-semibold mt-1',
                              route.ghgIntensity > TARGET ? 'text-coral-400' : 'text-sea-400')}>
                              {route.ghgIntensity > TARGET
                                ? `€${formatNumber(Math.abs((TARGET - route.ghgIntensity) * route.fuelConsumption * 41000) / 1_000_000 * 2400)}`
                                : '€0 — Compliant'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 pt-4">
            <div className={cn('text-xs', txtMuted)}>
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition-all',
                    page === i
                      ? 'bg-sea-400 text-white'
                      : theme === 'dark' ? 'text-white/40 hover:bg-white/[0.04]' : 'text-ocean-400 hover:bg-ocean-50'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
