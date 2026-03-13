// ============================================================
// FuelEU Maritime Domain Services
// Pure business logic - NO framework dependencies
// ============================================================

import {
  ComparisonResult,
  ComplianceHealth,
  InsightMessage,
  PoolMember,
  PoolSimulation,
  Route,
} from '../entities';

// FuelEU Constants
export const TARGET_INTENSITY_2025 = 89.3368; // gCO₂e/MJ (2% below 91.16)
export const BASELINE_INTENSITY = 91.16; // gCO₂e/MJ
export const MJ_PER_TON = 41_000; // MJ/t energy conversion
export const PENALTY_EUR_PER_TON = 2_400; // EUR per tonne VLSFO equivalent

/**
 * Calculate energy in scope (MJ) from fuel consumption
 */
export function computeEnergy(fuelConsumptionTons: number): number {
  return fuelConsumptionTons * MJ_PER_TON;
}

/**
 * Calculate Compliance Balance (gCO₂eq)
 * Positive = Surplus, Negative = Deficit
 */
export function computeComplianceBalance(
  actualIntensity: number,
  fuelConsumptionTons: number,
  targetIntensity: number = TARGET_INTENSITY_2025
): number {
  const energy = computeEnergy(fuelConsumptionTons);
  return (targetIntensity - actualIntensity) * energy;
}

/**
 * Calculate percent difference between comparison and baseline
 */
export function computePercentDiff(
  comparisonIntensity: number,
  baselineIntensity: number
): number {
  if (baselineIntensity === 0) return 0;
  return ((comparisonIntensity / baselineIntensity) - 1) * 100;
}

/**
 * Check if a route is compliant (intensity ≤ target)
 */
export function isCompliant(
  ghgIntensity: number,
  target: number = TARGET_INTENSITY_2025
): boolean {
  return ghgIntensity <= target;
}

/**
 * Build comparison results from baseline and routes
 */
export function buildComparison(
  baseline: Route,
  routes: Route[]
): ComparisonResult[] {
  return routes
    .filter(r => r.routeId !== baseline.routeId)
    .map(route => {
      const energy = computeEnergy(route.fuelConsumption);
      const cb = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);
      return {
        routeId: route.routeId,
        vesselType: route.vesselType,
        fuelType: route.fuelType,
        year: route.year,
        baselineIntensity: baseline.ghgIntensity,
        comparisonIntensity: route.ghgIntensity,
        percentDiff: computePercentDiff(route.ghgIntensity, baseline.ghgIntensity),
        compliant: isCompliant(route.ghgIntensity),
        complianceBalance: cb,
        energy,
      };
    });
}

/**
 * Calculate compliance health score (0-100)
 */
export function computeHealthScore(
  actualIntensity: number,
  target: number = TARGET_INTENSITY_2025
): ComplianceHealth['score'] {
  const ratio = actualIntensity / target;
  if (ratio <= 0.9) return 100;
  if (ratio <= 0.95) return 90;
  if (ratio <= 1.0) return Math.round(100 - (ratio - 0.9) * 1000);
  if (ratio <= 1.05) return Math.round(50 - (ratio - 1.0) * 1000);
  return Math.max(0, Math.round(20 - (ratio - 1.05) * 400));
}

/**
 * Get compliance status from health score
 */
export function getComplianceStatus(
  score: number
): ComplianceHealth['status'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'critical';
}

/**
 * Validate banking: can only bank positive CB
 */
export function validateBanking(cb: number): { valid: boolean; error?: string } {
  if (cb <= 0) {
    return { valid: false, error: 'Cannot bank negative or zero compliance balance' };
  }
  return { valid: true };
}

/**
 * Validate apply: cannot apply more than available banked amount
 */
export function validateApply(
  amount: number,
  availableBanked: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Apply amount must be positive' };
  }
  if (amount > availableBanked) {
    return { valid: false, error: `Cannot apply ${amount}. Only ${availableBanked} available in bank` };
  }
  return { valid: true };
}

/**
 * Simulate pool allocation using greedy algorithm
 * Sort by CB desc, transfer from surplus to deficit
 */
export function simulatePool(
  members: { shipId: string; cb: number }[]
): PoolSimulation {
  if (members.length === 0) {
    return { valid: false, totalCB: 0, members: [], transfers: [] };
  }

  const totalCB = members.reduce((sum, m) => sum + m.cb, 0);
  const valid = totalCB >= 0;

  // Sort desc by CB (surplus ships first)
  const sorted = [...members].sort((a, b) => b.cb - a.cb);
  const result: PoolMember[] = sorted.map(m => ({
    shipId: m.shipId,
    cbBefore: m.cb,
    cbAfter: m.cb,
  }));

  const transfers: { from: string; to: string; amount: number }[] = [];

  // Greedy allocation
  let surplusIdx = 0;
  let deficitIdx = result.length - 1;

  while (surplusIdx < deficitIdx) {
    const surplus = result[surplusIdx];
    const deficit = result[deficitIdx];

    if (surplus.cbAfter <= 0) {
      surplusIdx++;
      continue;
    }
    if (deficit.cbAfter >= 0) {
      deficitIdx--;
      continue;
    }

    const transferAmount = Math.min(surplus.cbAfter, Math.abs(deficit.cbAfter));

    // Enforce: surplus ship cannot go negative
    if (surplus.cbAfter - transferAmount < 0) {
      surplusIdx++;
      continue;
    }

    surplus.cbAfter -= transferAmount;
    deficit.cbAfter += transferAmount;

    transfers.push({
      from: surplus.shipId,
      to: deficit.shipId,
      amount: transferAmount,
    });

    if (surplus.cbAfter <= 0) surplusIdx++;
    if (deficit.cbAfter >= 0) deficitIdx--;
  }

  // Validate: deficit ship cannot exit worse
  const deficitWorse = result.some(
    (m) => m.cbBefore < 0 && m.cbAfter < m.cbBefore
  );
  // Validate: surplus ship cannot go negative
  const surplusNegative = result.some(
    (m) => m.cbBefore > 0 && m.cbAfter < 0
  );

  return {
    valid: valid && !deficitWorse && !surplusNegative,
    totalCB,
    members: result,
    transfers,
  };
}

/**
 * Generate AI-style insights based on compliance data
 */
export function generateInsights(
  routes: Route[],
  complianceData: { shipId: string; cb: number }[]
): InsightMessage[] {
  const insights: InsightMessage[] = [];

  // Find deficit ships
  const deficitShips = complianceData.filter(c => c.cb < 0);
  const surplusShips = complianceData.filter(c => c.cb > 0);

  if (deficitShips.length === 0) {
    insights.push({
      type: 'success',
      title: 'Full Fleet Compliance',
      message: 'All vessels in your fleet are currently meeting FuelEU Maritime targets. Excellent work!',
    });
  }

  for (const deficit of deficitShips) {
    const bestSurplus = surplusShips.sort((a, b) => b.cb - a.cb)[0];
    if (bestSurplus) {
      insights.push({
        type: 'action',
        title: 'Pooling Opportunity',
        message: `Ship ${deficit.shipId} has a deficit of ${Math.abs(Math.round(deficit.cb)).toLocaleString()} gCO₂eq. Pooling with ${bestSurplus.shipId} (surplus: ${Math.round(bestSurplus.cb).toLocaleString()}) could resolve compliance.`,
        shipId: deficit.shipId,
      });
    }

    if (Math.abs(deficit.cb) > 500000) {
      const route = routes.find(r => r.routeId === deficit.shipId.replace('S0', 'R0'));
      if (route) {
        insights.push({
          type: 'warning',
          title: 'Fuel Switch Recommended',
          message: `${deficit.shipId} using ${route.fuelType} at ${route.ghgIntensity} gCO₂e/MJ exceeds the target of ${TARGET_INTENSITY_2025}. Consider switching to LNG or Methanol for compliance.`,
          shipId: deficit.shipId,
        });
      }
    }
  }

  // Banking insight
  const bankableSurplus = surplusShips.reduce((sum, s) => sum + s.cb, 0);
  if (bankableSurplus > 0) {
    insights.push({
      type: 'info',
      title: 'Banking Potential',
      message: `Your fleet has ${Math.round(bankableSurplus).toLocaleString()} gCO₂eq in total surplus. Consider banking for future deficit years as targets tighten to 6% by 2030.`,
    });
  }

  // Penalty estimation
  for (const deficit of deficitShips) {
    const penaltyTonnes = Math.abs(deficit.cb) / 1_000_000; // Convert to approx tonnes
    const estimatedPenalty = penaltyTonnes * PENALTY_EUR_PER_TON;
    if (estimatedPenalty > 1000) {
      insights.push({
        type: 'warning',
        title: 'Penalty Risk',
        message: `Ship ${deficit.shipId} faces an estimated penalty of €${Math.round(estimatedPenalty).toLocaleString()} if the deficit is not resolved through pooling or banking.`,
        shipId: deficit.shipId,
      });
    }
  }

  return insights;
}

/**
 * Calculate estimated penalty for a deficit (EUR)
 */
export function estimatePenalty(deficitGco2eq: number): number {
  if (deficitGco2eq >= 0) return 0;
  const deficitTonnes = Math.abs(deficitGco2eq) / 1_000_000;
  return deficitTonnes * PENALTY_EUR_PER_TON;
}
