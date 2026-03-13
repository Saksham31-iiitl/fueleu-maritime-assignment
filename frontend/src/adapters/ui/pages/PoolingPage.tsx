import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poolApi, complianceApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn, formatCB, formatNumber } from '../../../shared/utils';
import GlassCard from '../components/GlassCard';
import { Users, ArrowRight, Play, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import type { ShipCompliance, PoolSimulation } from '../../../core/domain/types';

export default function PoolingPage() {
  const { theme } = useAppStore();
  const qc = useQueryClient();
  const [selectedShips, setSelectedShips] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<PoolSimulation | null>(null);
  const [poolName, setPoolName] = useState('');
  const [error, setError] = useState('');
  const [simYear, setSimYear] = useState(2024);

  const { data: compliance = [] } = useQuery({
    queryKey: ['compliance-all'],
    queryFn: () => complianceApi.getCB() as Promise<ShipCompliance[]>,
  });

  const { data: pools = [] } = useQuery({
    queryKey: ['pools'],
    queryFn: () => poolApi.getAll(),
  });

  const simulateMut = useMutation({
    mutationFn: () => poolApi.simulate(simYear, selectedShips),
    onSuccess: (data) => { setSimulation(data); setError(''); },
    onError: (err: Error) => { setError(err.message); setSimulation(null); },
  });

  const createMut = useMutation({
    mutationFn: () => poolApi.create(simYear, selectedShips, poolName || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pools'] });
      setSelectedShips([]);
      setSimulation(null);
      setPoolName('');
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleShip = (shipId: string) => {
    setSelectedShips(prev =>
      prev.includes(shipId) ? prev.filter(s => s !== shipId) : [...prev, shipId]
    );
    setSimulation(null);
  };

  const yearShips = compliance.filter((c: ShipCompliance) => c.year === simYear);

  const txtMuted = theme === 'dark' ? 'text-white/40' : 'text-ocean-400';
  const txtMain = theme === 'dark' ? 'text-white' : 'text-ocean-800';
  const borderCol = theme === 'dark' ? 'border-white/[0.06]' : 'border-ocean-100/20';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Pooling</h1>
          <p className={cn('mt-1 text-sm', txtMuted)}>
            FuelEU Maritime Article 21 — Pool compliance balances across vessels
          </p>
        </div>
        <select
          value={simYear}
          onChange={e => { setSimYear(Number(e.target.value)); setSelectedShips([]); setSimulation(null); }}
          className={cn('rounded-lg border px-3 py-1.5 text-xs bg-transparent outline-none', borderCol, txtMuted)}
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-coral-400/20 bg-coral-400/5 px-4 py-3 text-xs text-coral-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ship Selection */}
        <GlassCard>
          <div className={cn('text-xs font-medium uppercase tracking-wider mb-4', txtMuted)}>
            Select Ships for Pool ({selectedShips.length} selected)
          </div>
          <div className="space-y-2">
            {yearShips.length === 0 ? (
              <div className={cn('py-8 text-center text-xs', txtMuted)}>
                No compliance records found for {simYear}
              </div>
            ) : (
              yearShips.map((ship: ShipCompliance) => {
                const selected = selectedShips.includes(ship.shipId);
                const isSurplus = ship.cbGco2eq > 0;
                return (
                  <button
                    key={ship.shipId}
                    onClick={() => toggleShip(ship.shipId)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl border p-3 transition-all text-left',
                      selected
                        ? 'border-sea-400/30 bg-sea-400/5'
                        : cn(borderCol, 'hover:border-white/10'),
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono',
                        selected ? 'bg-sea-400 text-white' : theme === 'dark' ? 'bg-white/[0.04] text-white/50' : 'bg-ocean-50 text-ocean-500'
                      )}>
                        {ship.shipId.slice(-2)}
                      </div>
                      <div>
                        <div className={cn('text-xs font-semibold font-mono', txtMain)}>{ship.shipId}</div>
                        <div className={cn('text-[10px]', txtMuted)}>Year {ship.year}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('text-xs font-mono font-semibold', isSurplus ? 'text-sea-400' : 'text-coral-400')}>
                        {formatCB(ship.cbGco2eq)}
                      </div>
                      <div className="mt-0.5">
                        {isSurplus ? <span className="tag-surplus text-[10px]">Surplus</span> : <span className="tag-deficit text-[10px]">Deficit</span>}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pool actions */}
          {selectedShips.length >= 2 && (
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Pool name (optional)"
                value={poolName}
                onChange={e => setPoolName(e.target.value)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-xs bg-transparent outline-none',
                  borderCol, txtMuted
                )}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => simulateMut.mutate()}
                  disabled={simulateMut.isPending}
                  className="btn-ghost border border-sea-400/20 text-sea-400 flex-1"
                >
                  <Play className="h-3.5 w-3.5" />
                  Simulate Pool
                </button>
                {simulation?.valid && (
                  <button
                    onClick={() => createMut.mutate()}
                    disabled={createMut.isPending}
                    className="btn-primary flex-1"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Create Pool
                  </button>
                )}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Simulation Result */}
        <GlassCard>
          <div className={cn('text-xs font-medium uppercase tracking-wider mb-4', txtMuted)}>
            Pool Simulator Preview
          </div>

          {!simulation ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className={cn('h-10 w-10 mb-3', txtMuted)} />
              <div className={cn('text-xs', txtMuted)}>
                Select 2+ ships and click "Simulate Pool" to preview results
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pool sum indicator */}
              <div className={cn(
                'flex items-center justify-between rounded-xl border p-3',
                simulation.valid ? 'border-sea-400/20 bg-sea-400/5' : 'border-coral-400/20 bg-coral-400/5'
              )}>
                <div className="flex items-center gap-2">
                  {simulation.valid
                    ? <CheckCircle className="h-4 w-4 text-sea-400" />
                    : <XCircle className="h-4 w-4 text-coral-400" />
                  }
                  <span className="text-xs font-medium">
                    Pool {simulation.valid ? 'Valid' : 'Invalid'} — Sum(CB) = {formatCB(simulation.totalCB)}
                  </span>
                </div>
              </div>

              {/* Members before/after */}
              <div className="space-y-2">
                {simulation.members.map(m => (
                  <div key={m.shipId} className={cn('flex items-center gap-3 rounded-xl border p-3', borderCol)}>
                    <div className={cn('text-xs font-mono font-semibold w-12', txtMain)}>{m.shipId}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className={cn(
                        'rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold',
                        m.cbBefore >= 0 ? 'bg-sea-400/10 text-sea-400' : 'bg-coral-400/10 text-coral-400'
                      )}>
                        {formatCB(m.cbBefore)}
                      </div>
                      <ArrowRight className={cn('h-3.5 w-3.5 animate-pulse', txtMuted)} />
                      <div className={cn(
                        'rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold',
                        m.cbAfter >= 0 ? 'bg-sea-400/10 text-sea-400' : 'bg-coral-400/10 text-coral-400'
                      )}>
                        {formatCB(m.cbAfter)}
                      </div>
                    </div>
                    {m.cbAfter > m.cbBefore ? (
                      <span className="text-[10px] text-sea-400">↑ Improved</span>
                    ) : m.cbAfter < m.cbBefore ? (
                      <span className="text-[10px] text-amber-400">↓ Transferred</span>
                    ) : (
                      <span className={cn('text-[10px]', txtMuted)}>— No change</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Transfer flow */}
              {simulation.transfers.length > 0 && (
                <div>
                  <div className={cn('text-[11px] font-medium uppercase tracking-wider mb-2', txtMuted)}>
                    Surplus Transfers
                  </div>
                  <div className="space-y-1.5">
                    {simulation.transfers.map((t, i) => (
                      <div key={i} className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                        borderCol, theme === 'dark' ? 'bg-white/[0.01]' : 'bg-ocean-50/30'
                      )}>
                        <span className="font-mono font-semibold text-sea-400">{t.from}</span>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="flex items-center gap-1">
                            <div className="h-[1px] w-8 bg-sea-400/40" />
                            <span className="font-mono text-[10px] text-sea-400">{formatNumber(t.amount)}</span>
                            <ArrowRight className="h-3 w-3 text-sea-400 animate-pulse" />
                            <div className="h-[1px] w-8 bg-sea-400/40" />
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-coral-400">{t.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Existing Pools */}
      {pools.length > 0 && (
        <GlassCard>
          <div className={cn('text-xs font-medium uppercase tracking-wider mb-4', txtMuted)}>
            Created Pools
          </div>
          <div className="space-y-3">
            {pools.map((pool: any) => (
              <div key={pool.id} className={cn('rounded-xl border p-4', borderCol)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-sea-400" />
                    <span className={cn('text-xs font-semibold', txtMain)}>{pool.name || `Pool #${pool.id}`}</span>
                  </div>
                  <span className={cn('text-[10px] font-mono', txtMuted)}>{pool.year}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pool.members?.map((m: any) => (
                    <div key={m.shipId} className={cn(
                      'rounded-lg border px-2.5 py-1 text-[10px] font-mono',
                      borderCol
                    )}>
                      <span className={txtMain}>{m.shipId}</span>
                      <span className={m.cbAfter >= 0 ? ' text-sea-400' : ' text-coral-400'}>
                        {' '}{formatCB(m.cbAfter)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
