// ============================================================
// Ports — Interfaces the frontend core defines
// ============================================================

import type {
  Route, ComparisonResponse, ShipCompliance, BankingRecord,
  PoolSimulation, Pool, DashboardData, InsightMessage,
} from '../domain/types';

export interface RoutePort {
  getAll(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<ComparisonResponse>;
}

export interface CompliancePort {
  getCB(shipId?: string, year?: number): Promise<ShipCompliance[] | { cb: number; energy: number; compliant: boolean }>;
  getAdjustedCB(shipId: string, year: number): Promise<any>;
}

export interface BankingPort {
  getRecords(shipId?: string, year?: number): Promise<BankingRecord[]>;
  bankSurplus(shipId: string, year: number, amount?: number): Promise<any>;
  applyBanked(shipId: string, year: number, amount: number): Promise<any>;
}

export interface PoolPort {
  create(year: number, members: string[], name?: string): Promise<{ pool: Pool; simulation: PoolSimulation }>;
  simulate(year: number, members: string[]): Promise<PoolSimulation>;
  getAll(year?: number): Promise<Pool[]>;
}

export interface DashboardPort {
  getData(): Promise<DashboardData>;
  getInsights(): Promise<InsightMessage[]>;
}
