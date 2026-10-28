import fs from 'fs';
import path from 'path';
import { getPool, closePool, getPoolConfig } from './pool';

export async function runDatabaseMigration(silent = false): Promise<boolean> {
  const config = getPoolConfig();
  const schemaCandidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '../src/db/schema.sql'),
    path.join(__dirname, '../../src/db/schema.sql'),
    path.resolve(process.cwd(), 'backend/src/db/schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql')
  ];
  const schemaPath = schemaCandidates.find(p => fs.existsSync(p));

  if (!schemaPath) {
    console.error(`[PostgreSQL Migration Error]: Schema file not found in candidates: ${schemaCandidates.join(', ')}`);
    return false;
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const pool = getPool();

  if (!silent) {
    console.log(`[PostgreSQL Migration]: Connecting to ${config.user}@${config.host}:${config.port}/${config.database}...`);
  }

  let client;
  try {
    client = await pool.connect();
  } catch (connErr: any) {
    if (!silent) {
      if (connErr.code === 'ECONNREFUSED') {
        console.error(`❌ [PostgreSQL Connection Error]: Connection refused on ${config.host}:${config.port}.`);
        console.error(`   Troubleshooting:`);
        console.error(`   1. Verify PostgreSQL 17 service is running.`);
        console.error(`   2. In pgAdmin, right click your server -> Properties -> Connection, and check the Port.`);
        console.error(`   3. Update PGPORT in backend/.env (e.g. PGPORT=5433 or PGPORT=5432).`);
      } else if (connErr.code === '28P01' || connErr.message?.includes('password authentication failed')) {
        console.error(`❌ [PostgreSQL Auth Error]: Password authentication failed for user "${config.user}".`);
        console.error(`   Please set your local PostgreSQL password in backend/.env:`);
        console.error(`   PGPASSWORD=your_actual_postgres_password`);
      } else if (connErr.code === '3D000' || connErr.message?.includes('database') && connErr.message?.includes('does not exist')) {
        console.error(`❌ [PostgreSQL Database Error]: Database "${config.database}" does not exist.`);
        console.error(`   Please create it in pgAdmin 4:`);
        console.error(`   CREATE DATABASE ${config.database};`);
      } else {
        console.error(`❌ [PostgreSQL Connection Error]: ${connErr.message} (Code: ${connErr.code || 'UNKNOWN'})`);
      }
    }
    return false;
  }

  try {
    if (!silent) console.log('[PostgreSQL Migration]: Running schema.sql transaction...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    if (!silent) {
      console.log('✅ [PostgreSQL Migration]: Schema "customer_profiles" initialized and Rahul Mehta seeded successfully.');
    }
    return true;
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ [PostgreSQL Migration Error]: Failed executing schema SQL:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Standalone execution support
if (require.main === module) {
  runDatabaseMigration(false)
    .then((success) => {
      closePool().then(() => {
        process.exit(success ? 0 : 1);
      });
    })
    .catch((err) => {
      console.error(err);
      closePool().then(() => process.exit(1));
    });
}
