// ============================================================
// FuelEU Maritime Domain Entities
// Pure domain objects - NO framework dependencies
// ============================================================

export interface Route {
  id: number;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface ShipCompliance {
  id: number;
  shipId: string;
  year: number;
  cbGco2eq: number;
}

export interface BankEntry {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
  entryType: 'bank' | 'apply';
}

export interface Pool {
  id: number;
  year: number;
  name: string;
  members: PoolMember[];
}

export interface PoolMember {
  id?: number;
  poolId?: number;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface ComparisonResult {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  baselineIntensity: number;
  comparisonIntensity: number;
  percentDiff: number;
  compliant: boolean;
  complianceBalance: number;
  energy: number;
}

export interface ComplianceHealth {
  shipId: string;
  score: number; // 0–100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  cb: number;
  intensity: number;
  target: number;
}

export interface BankingRecord {
  shipId: string;
  year: number;
  cbBefore: number;
  banked: number;
  applied: number;
  cbAfter: number;
  entries: BankEntry[];
}

export interface PoolSimulation {
  valid: boolean;
  totalCB: number;
  members: PoolMember[];
  transfers: { from: string; to: string; amount: number }[];
}

export interface InsightMessage {
  type: 'info' | 'warning' | 'success' | 'action';
  title: string;
  message: string;
  shipId?: string;
}
