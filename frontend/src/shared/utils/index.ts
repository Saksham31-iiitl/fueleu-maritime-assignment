export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(n: number, decimals = 0): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function formatCB(cb: number): string {
  const abs = Math.abs(cb);
  const formatted = abs >= 1_000_000
    ? `${(abs / 1_000_000).toFixed(2)}M`
    : abs >= 1_000
    ? `${(abs / 1_000).toFixed(1)}K`
    : abs.toFixed(0);
  return `${cb >= 0 ? '+' : '-'}${formatted}`;
}

export const STATUS_COLORS = {
  excellent: { bg: 'bg-sea-400/10', text: 'text-sea-400', ring: 'ring-sea-400/20' },
  good: { bg: 'bg-blue-400/10', text: 'text-blue-400', ring: 'ring-blue-400/20' },
  warning: { bg: 'bg-amber-400/10', text: 'text-amber-400', ring: 'ring-amber-400/20' },
  critical: { bg: 'bg-coral-400/10', text: 'text-coral-400', ring: 'ring-coral-400/20' },
} as const;

export const FUEL_COLORS: Record<string, string> = {
  HFO: '#ff6b6b',
  LNG: '#2ec4b6',
  MGO: '#ffd166',
  VLSFO: '#ff9f43',
  Methanol: '#48dbfb',
  Biodiesel: '#0abde3',
};

export const VESSEL_COLORS: Record<string, string> = {
  Container: '#2ec4b6',
  BulkCarrier: '#0f3d5e',
  Tanker: '#ff6b6b',
  RoRo: '#ffd166',
};
