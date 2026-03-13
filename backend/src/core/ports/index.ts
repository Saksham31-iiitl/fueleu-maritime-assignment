// ============================================================
// Ports — Interfaces that the core defines
// Adapters (DB, HTTP) implement these
// ============================================================

import {
  Route,
  ShipCompliance,
  BankEntry,
  Pool,
  PoolMember,
} from '../domain/entities';

// ---- Outbound Ports (driven / secondary) ----

export interface RouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: number): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
  findByFilters(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]>;
}

export interface ComplianceRepository {
  findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
  findByYear(year: number): Promise<ShipCompliance[]>;
  findAll(): Promise<ShipCompliance[]>;
  upsert(data: Omit<ShipCompliance, 'id'>): Promise<ShipCompliance>;
}

export interface BankRepository {
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  findAll(): Promise<BankEntry[]>;
  create(data: Omit<BankEntry, 'id'>): Promise<BankEntry>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  getTotalApplied(shipId: string, year: number): Promise<number>;
}

export interface PoolRepository {
  create(pool: { year: number; name: string; members: Omit<PoolMember, 'id' | 'poolId'>[] }): Promise<Pool>;
  findByYear(year: number): Promise<Pool[]>;
  findAll(): Promise<Pool[]>;
}
