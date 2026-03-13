// ============================================================
// Application Use Cases
// Orchestrate domain services with ports
// ============================================================

import { Route, ComparisonResult, BankingRecord, PoolSimulation, ComplianceHealth, InsightMessage } from '../../domain/entities';
import {
  computeComplianceBalance,
  computeEnergy,
  buildComparison,
  computeHealthScore,
  getComplianceStatus,
  validateBanking,
  validateApply,
  simulatePool,
  generateInsights,
  estimatePenalty,
  TARGET_INTENSITY_2025,
} from '../../domain/services';
import {
  RouteRepository,
  ComplianceRepository,
  BankRepository,
  PoolRepository,
} from '../../ports';

// ---- Route Use Cases ----

export class GetRoutesUseCase {
  constructor(private routeRepo: RouteRepository) {}

  async execute(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]> {
    if (filters && Object.values(filters).some(Boolean)) {
      return this.routeRepo.findByFilters(filters);
    }
    return this.routeRepo.findAll();
  }
}

export class SetBaselineUseCase {
  constructor(private routeRepo: RouteRepository) {}

  async execute(routeId: string): Promise<Route> {
    return this.routeRepo.setBaseline(routeId);
  }
}

export class GetComparisonUseCase {
  constructor(private routeRepo: RouteRepository) {}

  async execute(): Promise<{ baseline: Route | null; comparisons: ComparisonResult[] }> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) {
      return { baseline: null, comparisons: [] };
    }
    const allRoutes = await this.routeRepo.findAll();
    const comparisons = buildComparison(baseline, allRoutes);
    return { baseline, comparisons };
  }
}

// ---- Compliance Use Cases ----

export class ComputeCBUseCase {
  constructor(
    private routeRepo: RouteRepository,
    private complianceRepo: ComplianceRepository
  ) {}

  async execute(shipId: string, year: number): Promise<{ cb: number; energy: number; compliant: boolean }> {
    // Derive route from shipId (S001 -> R001)
    const routeId = shipId.replace('S0', 'R0').replace('S', 'R');
    const route = await this.routeRepo.findByRouteId(routeId);

    if (!route) {
      throw new Error(`No route found for ship ${shipId}`);
    }

    const cb = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);
    const energy = computeEnergy(route.fuelConsumption);

    // Store/update compliance record
    await this.complianceRepo.upsert({ shipId, year, cbGco2eq: cb });

    return {
      cb,
      energy,
      compliant: cb >= 0,
    };
  }
}

export class GetAdjustedCBUseCase {
  constructor(
    private complianceRepo: ComplianceRepository,
    private bankRepo: BankRepository
  ) {}

  async execute(shipId: string, year: number) {
    const compliance = await this.complianceRepo.findByShipAndYear(shipId, year);
    if (!compliance) {
      throw new Error(`No compliance record for ${shipId} in ${year}`);
    }

    const totalBanked = await this.bankRepo.getTotalBanked(shipId, year);
    const totalApplied = await this.bankRepo.getTotalApplied(shipId, year);

    const adjustedCB = compliance.cbGco2eq - totalBanked + totalApplied;

    return {
      shipId,
      year,
      originalCB: compliance.cbGco2eq,
      banked: totalBanked,
      applied: totalApplied,
      adjustedCB,
    };
  }
}

export class GetAllComplianceUseCase {
  constructor(private complianceRepo: ComplianceRepository) {}

  async execute(): Promise<import('../domain/entities').ShipCompliance[]> {
    return this.complianceRepo.findAll();
  }
}

// ---- Banking Use Cases ----

export class GetBankRecordsUseCase {
  constructor(
    private bankRepo: BankRepository,
    private complianceRepo: ComplianceRepository
  ) {}

  async execute(shipId?: string, year?: number): Promise<BankingRecord[]> {
    const allCompliance = await this.complianceRepo.findAll();
    const allEntries = await this.bankRepo.findAll();

    const records: BankingRecord[] = [];

    for (const comp of allCompliance) {
      if (shipId && comp.shipId !== shipId) continue;
      if (year && comp.year !== year) continue;

      const entries = allEntries.filter(e => e.shipId === comp.shipId && e.year === comp.year);
      const banked = entries.filter(e => e.entryType === 'bank').reduce((s, e) => s + e.amountGco2eq, 0);
      const applied = entries.filter(e => e.entryType === 'apply').reduce((s, e) => s + e.amountGco2eq, 0);

      records.push({
        shipId: comp.shipId,
        year: comp.year,
        cbBefore: comp.cbGco2eq,
        banked,
        applied,
        cbAfter: comp.cbGco2eq - banked + applied,
        entries,
      });
    }

    return records;
  }
}

export class BankSurplusUseCase {
  constructor(
    private complianceRepo: ComplianceRepository,
    private bankRepo: BankRepository
  ) {}

  async execute(shipId: string, year: number, amount?: number) {
    const compliance = await this.complianceRepo.findByShipAndYear(shipId, year);
    if (!compliance) {
      throw new Error(`No compliance record found for ${shipId} in ${year}`);
    }

    const totalBanked = await this.bankRepo.getTotalBanked(shipId, year);
    const availableCB = compliance.cbGco2eq - totalBanked;
    const bankAmount = amount ?? availableCB;

    const validation = validateBanking(bankAmount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (bankAmount > availableCB) {
      throw new Error(`Cannot bank ${bankAmount}. Only ${availableCB} available.`);
    }

    const entry = await this.bankRepo.create({
      shipId,
      year,
      amountGco2eq: bankAmount,
      entryType: 'bank',
    });

    return {
      entry,
      remainingCB: availableCB - bankAmount,
    };
  }
}

export class ApplyBankedUseCase {
  constructor(
    private complianceRepo: ComplianceRepository,
    private bankRepo: BankRepository
  ) {}

  async execute(shipId: string, year: number, amount: number) {
    const totalBanked = await this.bankRepo.getTotalBanked(shipId, year);
    const totalApplied = await this.bankRepo.getTotalApplied(shipId, year);
    const availableBanked = totalBanked - totalApplied;

    const validation = validateApply(amount, availableBanked);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const entry = await this.bankRepo.create({
      shipId,
      year,
      amountGco2eq: amount,
      entryType: 'apply',
    });

    return {
      entry,
      remainingBanked: availableBanked - amount,
    };
  }
}

// ---- Pool Use Cases ----

export class CreatePoolUseCase {
  constructor(
    private complianceRepo: ComplianceRepository,
    private poolRepo: PoolRepository
  ) {}

  async execute(year: number, memberShipIds: string[], name?: string) {
    // Get CB for each member
    const members: { shipId: string; cb: number }[] = [];
    for (const shipId of memberShipIds) {
      const compliance = await this.complianceRepo.findByShipAndYear(shipId, year);
      if (!compliance) {
        throw new Error(`No compliance record for ${shipId} in ${year}`);
      }
      members.push({ shipId, cb: compliance.cbGco2eq });
    }

    // Simulate
    const simulation = simulatePool(members);
    if (!simulation.valid) {
      throw new Error('Pool validation failed: sum(CB) must be >= 0 and all constraints must hold');
    }

    // Persist
    const pool = await this.poolRepo.create({
      year,
      name: name ?? `Pool-${year}-${Date.now()}`,
      members: simulation.members,
    });

    return {
      pool,
      simulation,
    };
  }
}

export class SimulatePoolUseCase {
  constructor(private complianceRepo: ComplianceRepository) {}

  async execute(year: number, memberShipIds: string[]) {
    const members: { shipId: string; cb: number }[] = [];
    for (const shipId of memberShipIds) {
      const compliance = await this.complianceRepo.findByShipAndYear(shipId, year);
      if (!compliance) {
        throw new Error(`No compliance record for ${shipId} in ${year}`);
      }
      members.push({ shipId, cb: compliance.cbGco2eq });
    }

    return simulatePool(members);
  }
}

// ---- Analytics / Dashboard Use Cases ----

export class GetDashboardUseCase {
  constructor(
    private routeRepo: RouteRepository,
    private complianceRepo: ComplianceRepository
  ) {}

  async execute() {
    const routes = await this.routeRepo.findAll();
    const compliance = await this.complianceRepo.findAll();

    const totalRoutes = routes.length;
    const compliantRoutes = routes.filter(r => r.ghgIntensity <= TARGET_INTENSITY_2025).length;
    const totalEmissions = routes.reduce((sum, r) => sum + r.totalEmissions, 0);

    // Average health score
    const avgScore = routes.length > 0
      ? Math.round(routes.reduce((sum, r) => sum + computeHealthScore(r.ghgIntensity), 0) / routes.length)
      : 0;

    // Emissions by vessel type
    const byVesselType: Record<string, number> = {};
    routes.forEach(r => {
      byVesselType[r.vesselType] = (byVesselType[r.vesselType] || 0) + r.totalEmissions;
    });

    // Fuel distribution
    const byFuelType: Record<string, number> = {};
    routes.forEach(r => {
      byFuelType[r.fuelType] = (byFuelType[r.fuelType] || 0) + 1;
    });

    // Yearly trends
    const byYear: Record<number, { totalEmissions: number; avgIntensity: number; count: number }> = {};
    routes.forEach(r => {
      if (!byYear[r.year]) byYear[r.year] = { totalEmissions: 0, avgIntensity: 0, count: 0 };
      byYear[r.year].totalEmissions += r.totalEmissions;
      byYear[r.year].avgIntensity += r.ghgIntensity;
      byYear[r.year].count += 1;
    });
    Object.values(byYear).forEach(y => { y.avgIntensity /= y.count; });

    // Health scores per route
    const healthScores: ComplianceHealth[] = routes.map(r => {
      const score = computeHealthScore(r.ghgIntensity);
      const comp = compliance.find(c => c.shipId === r.routeId.replace('R0', 'S0').replace('R', 'S'));
      return {
        shipId: r.routeId.replace('R0', 'S0').replace('R', 'S'),
        score,
        status: getComplianceStatus(score),
        cb: comp?.cbGco2eq ?? 0,
        intensity: r.ghgIntensity,
        target: TARGET_INTENSITY_2025,
      };
    });

    // Insights
    const compData = compliance.map(c => ({ shipId: c.shipId, cb: c.cbGco2eq }));
    const insights = generateInsights(routes, compData);

    return {
      kpis: {
        totalRoutes,
        compliantRoutes,
        totalEmissions,
        complianceScore: avgScore,
        complianceRate: totalRoutes > 0 ? Math.round((compliantRoutes / totalRoutes) * 100) : 0,
      },
      charts: {
        byVesselType,
        byFuelType,
        byYear,
      },
      healthScores,
      insights,
    };
  }
}

export class GetInsightsUseCase {
  constructor(
    private routeRepo: RouteRepository,
    private complianceRepo: ComplianceRepository
  ) {}

  async execute(): Promise<InsightMessage[]> {
    const routes = await this.routeRepo.findAll();
    const compliance = await this.complianceRepo.findAll();
    const compData = compliance.map(c => ({ shipId: c.shipId, cb: c.cbGco2eq }));
    return generateInsights(routes, compData);
  }
}
