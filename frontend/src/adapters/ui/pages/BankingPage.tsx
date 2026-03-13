import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankingApi, complianceApi } from '../../infrastructure/api';
import { useAppStore } from '../../../shared/store';
import { cn, formatCB, formatNumber } from '../../../shared/utils';
import GlassCard from '../components/GlassCard';
import { Landmark, ArrowDownToLine, ArrowUpFromLine, Clock, AlertTriangle } from 'lucide-react';
import type { BankingRecord, ShipCompliance } from '../../../core/domain/types';

export default function BankingPage() {
  const { theme } = useAppStore();
  const qc = useQueryClient();
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [applyAmount, setApplyAmount] = useState<string>('');
  const [error, setError] = useState('');

  const { data: compliance = [] } = useQuery({
    queryKey: ['compliance-all'],
    queryFn: () => complianceApi.getCB() as Promise<ShipCompliance[]>,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['banking-records'],
    queryFn: () => bankingApi.getRecords(),
  });

  const bankMut = useMutation({
    mutationFn: ({ shipId, year }: { shipId: string; year: number }) =>
      bankingApi.bankSurplus(shipId, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banking-records'] });
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const applyMut = useMutation({
    mutationFn: ({ shipId, year, amount }: { shipId: string; year: number; amount: number }) =>
      bankingApi.applyBanked(shipId, year, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banking-records'] });
      setApplyAmount('');
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const txtMuted = theme === 'dark' ? 'text-white/40' : 'text-ocean-400';
  const txtMain = theme === 'dark' ? 'text-white' : 'text-ocean-800';
  const borderCol = theme === 'dark' ? 'border-white/[0.06]' : 'border-ocean-100/20';

  // Build timeline entries from records
  const enrichedRecords = records.map((r: BankingRecord) => ({
    ...r,
    hasSurplus: r.cbBefore > 0,
    availableToBank: Math.max(0, r.cbBefore - r.banked),
    availableToApply: Math.max(0, r.banked - r.applied),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold tracking-tight', txtMain)}>Banking</h1>
        <p className={cn('mt-1 text-sm', txtMuted)}>
          FuelEU Maritime Article 20 — Bank surplus compliance balance for future use
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-coral-400/20 bg-coral-400/5 px-4 py-3 text-xs text-coral-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard glow="sea" hover>
          <div className={cn('text-[11px] font-medium uppercase tracking-wider', txtMuted)}>Total Banked</div>
          <div className={cn('mt-2 text-2xl font-bold font-mono', 'text-sea-400')}>
            {formatNumber(records.reduce((s: number, r: BankingRecord) => s + r.banked, 0))}
          </div>
          <div className={cn('text-xs mt-1', txtMuted)}>gCO₂eq surplus stored</div>
        </GlassCard>
        <GlassCard glow="amber" hover>
          <div className={cn('text-[11px] font-medium uppercase tracking-wider', txtMuted)}>Total Applied</div>
          <div className={cn('mt-2 text-2xl font-bold font-mono', 'text-amber-400')}>
            {formatNumber(records.reduce((s: number, r: BankingRecord) => s + r.applied, 0))}
          </div>
          <div className={cn('text-xs mt-1', txtMuted)}>gCO₂eq credits used</div>
        </GlassCard>
        <GlassCard glow="coral" hover>
          <div className={cn('text-[11px] font-medium uppercase tracking-wider', txtMuted)}>Ships with Deficit</div>
          <div className={cn('mt-2 text-2xl font-bold font-mono', 'text-coral-400')}>
            {records.filter((r: BankingRecord) => r.cbBefore < 0).length}
          </div>
          <div className={cn('text-xs mt-1', txtMuted)}>Require banking credits</div>
        </GlassCard>
      </div>

      {/* Banking Timeline */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Clock className={cn('h-4 w-4', txtMuted)} />
          <div className={cn('text-xs font-medium uppercase tracking-wider', txtMuted)}>Banking Timeline</div>
        </div>

        <div className="space-y-0">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-white/[0.02]" />)}
            </div>
          ) : (
            enrichedRecords.map((record: any, idx: number) => {
              const isSurplus = record.cbBefore > 0;
              return (
                <div key={`${record.shipId}-${record.year}`} className="relative flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'h-4 w-4 rounded-full border-2 z-10 shrink-0',
                      isSurplus ? 'border-sea-400 bg-sea-400/20' : 'border-coral-400 bg-coral-400/20'
                    )} />
                    {idx < enrichedRecords.length - 1 && (
                      <div className={cn('w-[2px] flex-1 min-h-[60px]', theme === 'dark' ? 'bg-white/[0.06]' : 'bg-ocean-100/30')} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 mb-4 rounded-xl border p-4 transition-all',
                    borderCol,
                    theme === 'dark' ? 'bg-white/[0.015]' : 'bg-white/50'
                  )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-semibold font-mono', txtMain)}>{record.shipId}</span>
                          <span className={cn('text-xs font-mono', txtMuted)}>• {record.year}</span>
                          {isSurplus ? (
                            <span className="tag-surplus">Surplus</span>
                          ) : (
                            <span className="tag-deficit">Deficit</span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className={txtMuted}>CB Before</div>
                            <div className={cn('font-mono font-semibold mt-0.5', isSurplus ? 'text-sea-400' : 'text-coral-400')}>
                              {formatCB(record.cbBefore)}
                            </div>
                          </div>
                          <div>
                            <div className={txtMuted}>Banked</div>
                            <div className={cn('font-mono font-semibold mt-0.5', txtMain)}>{formatNumber(record.banked)}</div>
                          </div>
                          <div>
                            <div className={txtMuted}>Applied</div>
                            <div className={cn('font-mono font-semibold mt-0.5', txtMain)}>{formatNumber(record.applied)}</div>
                          </div>
                          <div>
                            <div className={txtMuted}>CB After</div>
                            <div className={cn('font-mono font-semibold mt-0.5', record.cbAfter >= 0 ? 'text-sea-400' : 'text-coral-400')}>
                              {formatCB(record.cbAfter)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4 shrink-0">
                        {record.availableToBank > 0 && (
                          <button
                            onClick={() => bankMut.mutate({ shipId: record.shipId, year: record.year })}
                            disabled={bankMut.isPending}
                            className="btn-primary text-[11px] !px-3 !py-1.5"
                          >
                            <ArrowDownToLine className="h-3 w-3" />
                            Bank
                          </button>
                        )}
                        {record.availableToApply > 0 && (
                          <div className="flex gap-1">
                            <input
                              type="number"
                              placeholder="Amount"
                              value={selectedShip === record.shipId ? applyAmount : ''}
                              onFocus={() => setSelectedShip(record.shipId)}
                              onChange={e => { setSelectedShip(record.shipId); setApplyAmount(e.target.value); }}
                              className={cn(
                                'w-20 rounded-lg border px-2 py-1 text-[11px] font-mono bg-transparent outline-none',
                                borderCol, txtMuted
                              )}
                            />
                            <button
                              onClick={() => {
                                const amt = Number(applyAmount);
                                if (amt > 0) applyMut.mutate({ shipId: record.shipId, year: record.year, amount: amt });
                              }}
                              disabled={applyMut.isPending || !applyAmount}
                              className="btn-ghost text-[11px] !px-2 !py-1 border border-white/[0.06]"
                            >
                              <ArrowUpFromLine className="h-3 w-3" />
                              Apply
                            </button>
                          </div>
                        )}
                        {!isSurplus && record.availableToApply === 0 && (
                          <span className={cn('text-[10px]', txtMuted)}>No credits available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
