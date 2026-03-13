import { describe, it, expect } from 'vitest';
import {
  computeComplianceBalance,
  computeEnergy,
  computePercentDiff,
  isCompliant,
  computeHealthScore,
  getComplianceStatus,
  validateBanking,
  validateApply,
  simulatePool,
  generateInsights,
  estimatePenalty,
  TARGET_INTENSITY_2025,
  MJ_PER_TON,
  buildComparison,
} from '../src/core/domain/services/complianceService';

describe('computeEnergy', () => {
  it('should compute energy from fuel consumption', () => {
    expect(computeEnergy(5000)).toBe(5000 * 41000);
    expect(computeEnergy(0)).toBe(0);
  });
});

describe('computeComplianceBalance', () => {
  it('should return positive CB when intensity is below target', () => {
    const cb = computeComplianceBalance(88.0, 4800);
    // (89.3368 - 88.0) * 4800 * 41000 = 1.3368 * 196_800_000 = 263,162,400
    expect(cb).toBeGreaterThan(0);
  });

  it('should return negative CB when intensity exceeds target', () => {
    const cb = computeComplianceBalance(93.5, 5100);
    expect(cb).toBeLessThan(0);
  });

  it('should return zero when intensity matches target exactly', () => {
    const cb = computeComplianceBalance(TARGET_INTENSITY_2025, 5000);
    expect(cb).toBe(0);
  });

  it('should compute correct value for R001 HFO', () => {
    const cb = computeComplianceBalance(91.0, 5000);
    // (89.3368 - 91.0) * 5000 * 41000 = -1.6632 * 205_000_000 = -340,956,000
    expect(cb).toBeLessThan(0);
    expect(Math.round(cb)).toBe(-340956000);
  });
});

describe('computePercentDiff', () => {
  it('should compute percent difference correctly', () => {
    const diff = computePercentDiff(88.0, 91.0);
    // ((88/91) - 1) * 100 = -3.2967...
    expect(diff).toBeCloseTo(-3.2967, 2);
  });

  it('should handle zero baseline gracefully', () => {
    expect(computePercentDiff(88.0, 0)).toBe(0);
  });

  it('should return positive for higher comparison intensity', () => {
    expect(computePercentDiff(95, 90)).toBeGreaterThan(0);
  });
});

describe('isCompliant', () => {
  it('should return true for intensity at or below target', () => {
    expect(isCompliant(88.0)).toBe(true);
    expect(isCompliant(TARGET_INTENSITY_2025)).toBe(true);
  });

  it('should return false for intensity above target', () => {
    expect(isCompliant(91.0)).toBe(false);
    expect(isCompliant(93.5)).toBe(false);
  });
});

describe('computeHealthScore', () => {
  it('should return 100 for very low intensity', () => {
    expect(computeHealthScore(70)).toBe(100);
  });

  it('should return high score for compliant routes', () => {
    const score = computeHealthScore(88.0);
    expect(score).toBeGreaterThan(50);
  });

  it('should return low score for non-compliant routes', () => {
    const score = computeHealthScore(95.0);
    expect(score).toBeLessThan(50);
  });
});

describe('getComplianceStatus', () => {
  it('should return correct status for each range', () => {
    expect(getComplianceStatus(90)).toBe('excellent');
    expect(getComplianceStatus(70)).toBe('good');
    expect(getComplianceStatus(50)).toBe('warning');
    expect(getComplianceStatus(20)).toBe('critical');
  });
});

describe('validateBanking', () => {
  it('should allow positive CB', () => {
    expect(validateBanking(1000).valid).toBe(true);
  });

  it('should reject zero CB', () => {
    expect(validateBanking(0).valid).toBe(false);
  });

  it('should reject negative CB', () => {
    expect(validateBanking(-500).valid).toBe(false);
  });
});

describe('validateApply', () => {
  it('should allow valid apply amount', () => {
    expect(validateApply(500, 1000).valid).toBe(true);
  });

  it('should reject over-apply', () => {
    const result = validateApply(1500, 1000);
    expect(result.valid).toBe(false);
  });

  it('should reject zero or negative amount', () => {
    expect(validateApply(0, 1000).valid).toBe(false);
    expect(validateApply(-100, 1000).valid).toBe(false);
  });
});

describe('simulatePool', () => {
  it('should redistribute surplus to deficit', () => {
    const members = [
      { shipId: 'S001', cb: 500000 },
      { shipId: 'S002', cb: -300000 },
    ];
    const result = simulatePool(members);
    expect(result.valid).toBe(true);
    expect(result.totalCB).toBe(200000);
    expect(result.transfers.length).toBeGreaterThan(0);
  });

  it('should reject pool with negative total CB', () => {
    const members = [
      { shipId: 'S001', cb: -500000 },
      { shipId: 'S002', cb: -300000 },
    ];
    const result = simulatePool(members);
    expect(result.valid).toBe(false);
  });

  it('should handle empty members', () => {
    const result = simulatePool([]);
    expect(result.valid).toBe(false);
    expect(result.members.length).toBe(0);
  });

  it('should not make surplus ship negative', () => {
    const members = [
      { shipId: 'S001', cb: 100000 },
      { shipId: 'S002', cb: -80000 },
    ];
    const result = simulatePool(members);
    expect(result.valid).toBe(true);
    const surplusAfter = result.members.find(m => m.shipId === 'S001')!;
    expect(surplusAfter.cbAfter).toBeGreaterThanOrEqual(0);
  });

  it('should handle all-surplus pool', () => {
    const members = [
      { shipId: 'S001', cb: 500000 },
      { shipId: 'S002', cb: 300000 },
    ];
    const result = simulatePool(members);
    expect(result.valid).toBe(true);
    expect(result.transfers.length).toBe(0);
  });
});

describe('buildComparison', () => {
  const baseline = {
    id: 1, routeId: 'R001', vesselType: 'Container', fuelType: 'HFO',
    year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000,
    totalEmissions: 4500, isBaseline: true,
  };

  const routes = [
    baseline,
    { id: 2, routeId: 'R002', vesselType: 'BulkCarrier', fuelType: 'LNG',
      year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500,
      totalEmissions: 4200, isBaseline: false },
  ];

  it('should exclude baseline from comparisons', () => {
    const result = buildComparison(baseline, routes);
    expect(result.length).toBe(1);
    expect(result[0].routeId).toBe('R002');
  });

  it('should compute correct percentDiff', () => {
    const result = buildComparison(baseline, routes);
    expect(result[0].percentDiff).toBeCloseTo(-3.2967, 2);
  });
});

describe('estimatePenalty', () => {
  it('should return 0 for surplus', () => {
    expect(estimatePenalty(500000)).toBe(0);
  });

  it('should calculate penalty for deficit', () => {
    const penalty = estimatePenalty(-1_000_000);
    expect(penalty).toBeGreaterThan(0);
  });
});

describe('generateInsights', () => {
  it('should generate insights for deficit ships', () => {
    const routes = [
      { id: 1, routeId: 'R001', vesselType: 'Container', fuelType: 'HFO',
        year: 2024, ghgIntensity: 93.5, fuelConsumption: 5000, distance: 12000,
        totalEmissions: 4500, isBaseline: false },
    ];
    const compliance = [{ shipId: 'S001', cb: -1000000 }];
    const insights = generateInsights(routes, compliance);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('should generate success message when all compliant', () => {
    const routes = [
      { id: 1, routeId: 'R001', vesselType: 'Container', fuelType: 'LNG',
        year: 2024, ghgIntensity: 85.0, fuelConsumption: 5000, distance: 12000,
        totalEmissions: 4500, isBaseline: false },
    ];
    const compliance = [{ shipId: 'S001', cb: 500000 }];
    const insights = generateInsights(routes, compliance);
    const successInsight = insights.find(i => i.type === 'success');
    expect(successInsight).toBeDefined();
  });
});
