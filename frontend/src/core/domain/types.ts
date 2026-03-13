// ============================================================
// Domain Types — Frontend Core
// No React/framework dependencies
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

export interface ComparisonResponse {
  baseline: Route | null;
  comparisons: ComparisonResult[];
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

export interface BankingRecord {
  shipId: string;
  year: number;
  cbBefore: number;
  banked: number;
  applied: number;
  cbAfter: number;
  entries: BankEntry[];
}

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolSimulation {
  valid: boolean;
  totalCB: number;
  members: PoolMember[];
  transfers: { from: string; to: string; amount: number }[];
}

export interface Pool {
  id: number;
  year: number;
  name: string;
  members: PoolMember[];
}

export interface ComplianceHealth {
  shipId: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  cb: number;
  intensity: number;
  target: number;
}

export interface InsightMessage {
  type: 'info' | 'warning' | 'success' | 'action';
  title: string;
  message: string;
  shipId?: string;
}

export interface DashboardData {
  kpis: {
    totalRoutes: number;
    compliantRoutes: number;
    totalEmissions: number;
    complianceScore: number;
    complianceRate: number;
  };
  charts: {
    byVesselType: Record<string, number>;
    byFuelType: Record<string, number>;
    byYear: Record<string, { totalEmissions: number; avgIntensity: number; count: number }>;
  };
  healthScores: ComplianceHealth[];
  insights: InsightMessage[];
}
