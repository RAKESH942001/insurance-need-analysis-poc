import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api';
import { checkDatabaseHealth, closePool } from './db/pool';
import { runDatabaseMigration } from './db/migrate';
import { CustomerService } from './repositories/customerRepository';

// Ensure .env is loaded regardless of invocation directory
const candidateEnvPaths = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Routes
app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.send({
    message: 'Axis Max Life Customer Need Analysis Engine API is running.',
    endpoints: {
      health: '/api/health',
      clients: '/api/clients',
      analyze: '/api/analyze',
      aiInsights: '/api/ai-insights'
    }
  });
});

const server = app.listen(PORT, async () => {
  console.log(`[NeedAnalysis-Backend] Server listening on port ${PORT}`);

  // Test database connection on startup
  try {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.isConnected) {
      console.log(`✅ [PostgreSQL 17]: Connected to ${dbHealth.database} on ${dbHealth.host}:${dbHealth.port}`);
      CustomerService.setUsePostgres(true);
      await runDatabaseMigration(true);
    } else {
      console.log(`ℹ️ [PostgreSQL 17]: ${dbHealth.message}`);
      CustomerService.setUsePostgres(false);
    }
  } catch (err: any) {
    console.warn('[PostgreSQL 17 Startup Warning]:', err.message);
    CustomerService.setUsePostgres(false);
  }
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\n[NeedAnalysis-Backend]: Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default app;
