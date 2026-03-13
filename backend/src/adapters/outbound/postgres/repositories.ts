// ============================================================
// Outbound Adapter: PostgreSQL via Prisma
// Implements repository ports
// ============================================================

import { PrismaClient } from '@prisma/client';
import {
  RouteRepository,
  ComplianceRepository,
  BankRepository,
  PoolRepository,
} from '../../../core/ports';
import {
  Route,
  ShipCompliance,
  BankEntry,
  Pool,
  PoolMember,
} from '../../../core/domain/entities';

const prisma = new PrismaClient();

// ---- Route Repository ----

export class PrismaRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    return prisma.route.findMany({ orderBy: { routeId: 'asc' } });
  }

  async findById(id: number): Promise<Route | null> {
    return prisma.route.findUnique({ where: { id } });
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    return prisma.route.findUnique({ where: { routeId } });
  }

  async findBaseline(): Promise<Route | null> {
    return prisma.route.findFirst({ where: { isBaseline: true } });
  }

  async setBaseline(routeId: string): Promise<Route> {
    // Reset all baselines
    await prisma.route.updateMany({ data: { isBaseline: false } });
    // Set new baseline
    return prisma.route.update({
      where: { routeId },
      data: { isBaseline: true },
    });
  }

  async findByFilters(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    const where: any = {};
    if (filters.vesselType) where.vesselType = filters.vesselType;
    if (filters.fuelType) where.fuelType = filters.fuelType;
    if (filters.year) where.year = filters.year;
    return prisma.route.findMany({ where, orderBy: { routeId: 'asc' } });
  }
}

// ---- Compliance Repository ----

export class PrismaComplianceRepository implements ComplianceRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    return prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
  }

  async findByYear(year: number): Promise<ShipCompliance[]> {
    return prisma.shipCompliance.findMany({ where: { year } });
  }

  async findAll(): Promise<ShipCompliance[]> {
    return prisma.shipCompliance.findMany({ orderBy: { shipId: 'asc' } });
  }

  async upsert(data: Omit<ShipCompliance, 'id'>): Promise<ShipCompliance> {
    return prisma.shipCompliance.upsert({
      where: { shipId_year: { shipId: data.shipId, year: data.year } },
      create: data,
      update: { cbGco2eq: data.cbGco2eq },
    });
  }
}

// ---- Bank Repository ----

export class PrismaBankRepository implements BankRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany({
      where: { shipId, year },
      orderBy: { createdAt: 'desc' },
    }) as Promise<BankEntry[]>;
  }

  async findAll(): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<BankEntry[]>;
  }

  async create(data: Omit<BankEntry, 'id'>): Promise<BankEntry> {
    return prisma.bankEntry.create({ data }) as Promise<BankEntry>;
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const result = await prisma.bankEntry.aggregate({
      _sum: { amountGco2eq: true },
      where: { shipId, year, entryType: 'bank' },
    });
    return result._sum.amountGco2eq || 0;
  }

  async getTotalApplied(shipId: string, year: number): Promise<number> {
    const result = await prisma.bankEntry.aggregate({
      _sum: { amountGco2eq: true },
      where: { shipId, year, entryType: 'apply' },
    });
    return result._sum.amountGco2eq || 0;
  }
}

// ---- Pool Repository ----

export class PrismaPoolRepository implements PoolRepository {
  async create(pool: { year: number; name: string; members: Omit<PoolMember, 'id' | 'poolId'>[] }): Promise<Pool> {
    return prisma.pool.create({
      data: {
        year: pool.year,
        name: pool.name,
        members: {
          create: pool.members.map(m => ({
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
          })),
        },
      },
      include: { members: true },
    });
  }

  async findByYear(year: number): Promise<Pool[]> {
    return prisma.pool.findMany({
      where: { year },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(): Promise<Pool[]> {
    return prisma.pool.findMany({
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export { prisma };
