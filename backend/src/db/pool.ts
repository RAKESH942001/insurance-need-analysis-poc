import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Resolve .env accurately whether run from project root, backend folder, or dist
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

let pool: Pool | null = null;
let isShuttingDown = false;

/**
 * Builds pool configuration from environment variables.
 * Never hardcodes or exposes credentials in frontend code.
 */
export function getPoolConfig(): PoolConfig {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5433', 10);
  const database = process.env.PGDATABASE || 'need_analysis_poc';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  const ssl = process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false;
  const max = parseInt(process.env.PG_POOL_MAX || '10', 10);
  const idleTimeoutMillis = parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10);
  const connectionTimeoutMillis = parseInt(process.env.PG_CONNECTION_TIMEOUT_MS || '5000', 10);

  return {
    host,
    port,
    database,
    user,
    password,
    ssl,
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis
  };
}

/**
 * Check if database credentials have been configured in environment.
 */
export function isDbConfigured(): boolean {
  // Configured if PGPASSWORD or DATABASE_URL is set, or if explicitly enabled
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.PGPASSWORD && process.env.PGPASSWORD.trim().length > 0)
  );
}

/**
 * Returns singleton PostgreSQL connection pool with error handling.
 */
export function getPool(): Pool {
  if (!pool) {
    const config = getPoolConfig();
    pool = new Pool(config);

    // Pool level error listener prevents idle client errors from crashing process
    pool.on('error', (err) => {
      if (!isShuttingDown) {
        console.warn('[PostgreSQL Pool Warning]: Unexpected error on idle client:', err.message);
      }
    });
  }
  return pool;
}

/**
 * Checks database connectivity and retrieves PostgreSQL server version.
 * Safe and non-throwing.
 */
export async function checkDatabaseHealth(): Promise<{
  isConnected: boolean;
  message: string;
  version?: string;
  host: string;
  port: number;
  database: string;
}> {
  const config = getPoolConfig();
  const safeHost = config.host || 'localhost';
  const safePort = config.port || 5433;
  const safeDb = config.database || 'need_analysis_poc';

  if (!isDbConfigured()) {
    return {
      isConnected: false,
      message: 'PostgreSQL credentials not configured in backend/.env. Using resilient in-memory storage.',
      host: safeHost,
      port: safePort,
      database: safeDb
    };
  }

  try {
    const currentPool = getPool();
    const res = await currentPool.query('SELECT version();');
    const versionStr = res.rows[0]?.version || 'PostgreSQL';

    return {
      isConnected: true,
      message: 'Connected to PostgreSQL successfully',
      version: versionStr,
      host: safeHost,
      port: safePort,
      database: safeDb
    };
  } catch (err: any) {
    return {
      isConnected: false,
      message: `Database connection failed (${err.code || err.message}). Operating in resilient fallback mode.`,
      host: safeHost,
      port: safePort,
      database: safeDb
    };
  }
}

/**
 * Gracefully shuts down connection pool on server termination.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    isShuttingDown = true;
    try {
      await pool.end();
      console.log('[PostgreSQL Pool]: All pool connections terminated gracefully.');
    } catch (err: any) {
      console.warn('[PostgreSQL Pool Warning]: Error closing pool:', err.message);
    } finally {
      pool = null;
      isShuttingDown = false;
    }
  }
}

