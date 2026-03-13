// ============================================================
// Infrastructure Adapter: REST API Client
// Implements all outbound ports
// ============================================================

import type { RoutePort, CompliancePort, BankingPort, PoolPort, DashboardPort } from '../../core/ports';

const BASE = '/api';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API Error');
  }
  return res.json();
}

export const routeApi: RoutePort = {
  getAll: (filters) => {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.set('vesselType', filters.vesselType);
    if (filters?.fuelType) params.set('fuelType', filters.fuelType);
    if (filters?.year) params.set('year', String(filters.year));
    const qs = params.toString();
    return fetchJSON(`/routes${qs ? `?${qs}` : ''}`);
  },
  setBaseline: (routeId) => fetchJSON(`/routes/${routeId}/baseline`, { method: 'POST' }),
  getComparison: () => fetchJSON('/routes/comparison'),
};

export const complianceApi: CompliancePort = {
  getCB: (shipId, year) => {
    const params = new URLSearchParams();
    if (shipId) params.set('shipId', shipId);
    if (year) params.set('year', String(year));
    const qs = params.toString();
    return fetchJSON(`/compliance/cb${qs ? `?${qs}` : ''}`);
  },
  getAdjustedCB: (shipId, year) =>
    fetchJSON(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`),
};

export const bankingApi: BankingPort = {
  getRecords: (shipId, year) => {
    const params = new URLSearchParams();
    if (shipId) params.set('shipId', shipId);
    if (year) params.set('year', String(year));
    const qs = params.toString();
    return fetchJSON(`/banking/records${qs ? `?${qs}` : ''}`);
  },
  bankSurplus: (shipId, year, amount) =>
    fetchJSON('/banking/bank', { method: 'POST', body: JSON.stringify({ shipId, year, amount }) }),
  applyBanked: (shipId, year, amount) =>
    fetchJSON('/banking/apply', { method: 'POST', body: JSON.stringify({ shipId, year, amount }) }),
};

export const poolApi: PoolPort = {
  create: (year, members, name) =>
    fetchJSON('/pools', { method: 'POST', body: JSON.stringify({ year, members, name }) }),
  simulate: (year, members) =>
    fetchJSON('/pools/simulate', { method: 'POST', body: JSON.stringify({ year, members }) }),
  getAll: (year) => fetchJSON(`/pools${year ? `?year=${year}` : ''}`),
};

export const dashboardApi: DashboardPort = {
  getData: () => fetchJSON('/dashboard'),
  getInsights: () => fetchJSON('/dashboard/insights'),
};
