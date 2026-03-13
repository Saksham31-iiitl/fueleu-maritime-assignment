// ============================================================
// Inbound Adapter: Express HTTP Controllers
// ============================================================

import { Router, Request, Response } from 'express';
import {
  GetRoutesUseCase,
  SetBaselineUseCase,
  GetComparisonUseCase,
  ComputeCBUseCase,
  GetAdjustedCBUseCase,
  GetAllComplianceUseCase,
  GetBankRecordsUseCase,
  BankSurplusUseCase,
  ApplyBankedUseCase,
  CreatePoolUseCase,
  SimulatePoolUseCase,
  GetDashboardUseCase,
  GetInsightsUseCase,
} from '../../../../core/application/usecases';
import {
  PrismaRouteRepository,
  PrismaComplianceRepository,
  PrismaBankRepository,
  PrismaPoolRepository,
} from '../../../outbound/postgres/repositories';

// Instantiate repositories
const routeRepo = new PrismaRouteRepository();
const complianceRepo = new PrismaComplianceRepository();
const bankRepo = new PrismaBankRepository();
const poolRepo = new PrismaPoolRepository();

// ---- Routes Controller ----
export function createRoutesRouter(): Router {
  const router = Router();
  const getRoutes = new GetRoutesUseCase(routeRepo);
  const setBaseline = new SetBaselineUseCase(routeRepo);
  const getComparison = new GetComparisonUseCase(routeRepo);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { vesselType, fuelType, year } = req.query;
      const routes = await getRoutes.execute({
        vesselType: vesselType as string,
        fuelType: fuelType as string,
        year: year ? Number(year) : undefined,
      });
      res.json(routes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:routeId/baseline', async (req: Request, res: Response) => {
    try {
      const route = await setBaseline.execute(req.params.routeId);
      res.json(route);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/comparison', async (req: Request, res: Response) => {
    try {
      const result = await getComparison.execute();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ---- Compliance Controller ----
export function createComplianceRouter(): Router {
  const router = Router();
  const computeCB = new ComputeCBUseCase(routeRepo, complianceRepo);
  const getAdjustedCB = new GetAdjustedCBUseCase(complianceRepo, bankRepo);
  const getAllCompliance = new GetAllComplianceUseCase(complianceRepo);

  router.get('/cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (shipId && year) {
        const result = await computeCB.execute(shipId as string, Number(year));
        res.json(result);
      } else {
        const all = await getAllCompliance.execute();
        res.json(all);
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year required' });
      }
      const result = await getAdjustedCB.execute(shipId as string, Number(year));
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

// ---- Banking Controller ----
export function createBankingRouter(): Router {
  const router = Router();
  const getBankRecords = new GetBankRecordsUseCase(bankRepo, complianceRepo);
  const bankSurplus = new BankSurplusUseCase(complianceRepo, bankRepo);
  const applyBanked = new ApplyBankedUseCase(complianceRepo, bankRepo);

  router.get('/records', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      const records = await getBankRecords.execute(
        shipId as string,
        year ? Number(year) : undefined
      );
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/bank', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amount } = req.body;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year required' });
      }
      const result = await bankSurplus.execute(shipId, year, amount);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/apply', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amount } = req.body;
      if (!shipId || !year || !amount) {
        return res.status(400).json({ error: 'shipId, year, and amount required' });
      }
      const result = await applyBanked.execute(shipId, year, amount);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

// ---- Pools Controller ----
export function createPoolsRouter(): Router {
  const router = Router();
  const createPool = new CreatePoolUseCase(complianceRepo, poolRepo);
  const simulatePoolUC = new SimulatePoolUseCase(complianceRepo);

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { year, members, name } = req.body;
      if (!year || !members || !Array.isArray(members)) {
        return res.status(400).json({ error: 'year and members[] required' });
      }
      const result = await createPool.execute(year, members, name);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/simulate', async (req: Request, res: Response) => {
    try {
      const { year, members } = req.body;
      if (!year || !members || !Array.isArray(members)) {
        return res.status(400).json({ error: 'year and members[] required' });
      }
      const result = await simulatePoolUC.execute(year, members);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { year } = req.query;
      const pools = year
        ? await poolRepo.findByYear(Number(year))
        : await poolRepo.findAll();
      res.json(pools);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ---- Dashboard Controller ----
export function createDashboardRouter(): Router {
  const router = Router();
  const getDashboard = new GetDashboardUseCase(routeRepo, complianceRepo);
  const getInsights = new GetInsightsUseCase(routeRepo, complianceRepo);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const data = await getDashboard.execute();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const insights = await getInsights.execute();
      res.json(insights);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
