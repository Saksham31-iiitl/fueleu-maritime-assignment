import express from 'express';
import cors from 'cors';
import {
  createRoutesRouter,
  createComplianceRouter,
  createBankingRouter,
  createPoolsRouter,
  createDashboardRouter,
} from '../../adapters/inbound/http/controllers';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'FuelEU Maritime API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/routes', createRoutesRouter());
app.use('/api/compliance', createComplianceRouter());
app.use('/api/banking', createBankingRouter());
app.use('/api/pools', createPoolsRouter());
app.use('/api/dashboard', createDashboardRouter());

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚢 FuelEU Maritime API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Routes: http://localhost:${PORT}/api/routes`);
});

export default app;
