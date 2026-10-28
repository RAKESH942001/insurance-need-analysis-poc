import assert from 'node:assert';
import {
  PostgresCustomerRepository,
  MemoryCustomerRepository,
  CustomerService,
  mapRowToProfile
} from '../src/repositories/customerRepository';
import { CustomerProfile } from '../src/models/types';
import { v4 as uuidv4 } from 'uuid';

console.log('\n================================================================');
console.log('POSTGRESQL 17 REPOSITORY & PERSISTENCE TEST SUITE');
console.log('================================================================\n');

/**
 * In-memory Mock PostgreSQL 17 Pool to test parameterized queries,
 * error handling, transactions and duplicate seeding without requiring
 * an external live database during automated local builds.
 */
class MockPostgresPool {
  private rows: Map<string, any> = new Map();
  public shouldFailConnections = false;

  async connect() {
    if (this.shouldFailConnections) {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:5433');
      (err as any).code = 'ECONNREFUSED';
      throw err;
    }
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }

  async query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    if (this.shouldFailConnections) {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:5433');
      (err as any).code = 'ECONNREFUSED';
      throw err;
    }

    const trimmed = text.trim().toUpperCase();

    // 0. Handle customer_goals queries
    if (trimmed.includes('CUSTOMER_GOALS')) {
      return { rows: [], rowCount: 0 };
    }

    // 1. Transaction statements
    if (trimmed.startsWith('BEGIN') || trimmed.startsWith('COMMIT') || trimmed.startsWith('ROLLBACK')) {
      return { rows: [], rowCount: 0 };
    }

    // 2. Seed query with WHERE NOT EXISTS
    if (trimmed.includes('WHERE NOT EXISTS') && trimmed.includes('RAHUL MEHTA')) {
      const existing = Array.from(this.rows.values()).find(
        r => r.full_name === 'Rahul Mehta' || r.id === '00000000-0000-0000-0000-000000000001'
      );
      if (!existing) {
        const seedRow = {
          id: '00000000-0000-0000-0000-000000000001',
          full_name: 'Rahul Mehta',
          age: 32,
          monthly_income: '85000.00',
          expenses: '48000.00',
          savings: '250000.00',
          emi: '12000.00',
          existing_life_cover: '2000000.00',
          dependants: 2,
          primary_goal: 'Family Protection & Child Education',
          goal_timeline: 15,
          advisor_notes: 'Benchmark sample customer',
          created_at: new Date(),
          updated_at: new Date()
        };
        this.rows.set(seedRow.id, seedRow);
        return { rows: [seedRow], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 3. SELECT all
    if (trimmed.startsWith('SELECT') && trimmed.includes('FROM CUSTOMER_PROFILES') && !trimmed.includes('WHERE ID =')) {
      return { rows: Array.from(this.rows.values()), rowCount: this.rows.size };
    }

    // 4. SELECT by ID
    if (trimmed.startsWith('SELECT') && trimmed.includes('WHERE ID =')) {
      const id = params[0];
      const row = this.rows.get(id);
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    }

    // 5. INSERT
    if (trimmed.startsWith('INSERT INTO CUSTOMER_PROFILES')) {
      const [
        id, full_name, age, monthly_income, expenses, savings, emi,
        existing_life_cover, dependants, primary_goal, goal_timeline, advisor_notes
      ] = params;

      const newRow = {
        id,
        full_name,
        age,
        monthly_income: String(monthly_income),
        expenses: String(expenses),
        savings: String(savings),
        emi: String(emi),
        existing_life_cover: String(existing_life_cover),
        dependants,
        primary_goal,
        goal_timeline,
        advisor_notes,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.rows.set(id, newRow);
      return { rows: [newRow], rowCount: 1 };
    }

    // 6. UPDATE
    if (trimmed.startsWith('UPDATE CUSTOMER_PROFILES')) {
      const [
        id, full_name, age, monthly_income, expenses, savings, emi,
        existing_life_cover, dependants, primary_goal, goal_timeline, advisor_notes
      ] = params;

      const existing = this.rows.get(id);
      if (!existing) return { rows: [], rowCount: 0 };

      const updatedRow = {
        ...existing,
        full_name,
        age,
        monthly_income: String(monthly_income),
        expenses: String(expenses),
        savings: String(savings),
        emi: String(emi),
        existing_life_cover: String(existing_life_cover),
        dependants,
        primary_goal,
        goal_timeline,
        advisor_notes,
        updated_at: new Date()
      };
      this.rows.set(id, updatedRow);
      return { rows: [updatedRow], rowCount: 1 };
    }

    // 7. DELETE
    if (trimmed.startsWith('DELETE FROM CUSTOMER_PROFILES')) {
      const id = params[0];
      const existed = this.rows.delete(id);
      return { rows: [], rowCount: existed ? 1 : 0 };
    }

    return { rows: [], rowCount: 0 };
  }
}

export async function runDatabaseRepositoryTests() {
  const mockPool = new MockPostgresPool();
  const repo = new PostgresCustomerRepository(mockPool as any);

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  };

  // Test 1: Seed Rahul Mehta & check fields
  await test('DB 1: Seed Rahul Mehta idempotently into customer_profiles', async () => {
    await repo.seedSampleIfNotExists();
    const all = await repo.findAll();
    assert.strictEqual(all.length, 1);
    const rahul = all[0];
    assert.strictEqual(rahul.name, 'Rahul Mehta');
    assert.strictEqual(rahul.monthlyIncome, 85000);
    assert.strictEqual(rahul.monthlyExpenses, 48000);
    assert.strictEqual(rahul.monthlyEmi, 12000);
    assert.strictEqual(rahul.existingSavings, 250000);
    assert.strictEqual(rahul.existingInsuranceCover, 2000000);
    assert.strictEqual(rahul.dependantsCount, 2);
  });

  // Test 2: Idempotency of duplicate sample seeding
  await test('DB 2: Duplicate seeding does not duplicate sample records', async () => {
    await repo.seedSampleIfNotExists();
    await repo.seedSampleIfNotExists();
    const all = await repo.findAll();
    assert.strictEqual(all.length, 1, `Expected 1 record after duplicate seeding, found ${all.length}`);
  });

  // Test 3: CRUD - Create new customer
  let createdId = '';
  await test('DB 3: Parameterized Create inserts customer with UUID primary key', async () => {
    const newCust: Partial<CustomerProfile> = {
      name: 'Sneha Kapoor',
      age: 29,
      monthlyIncome: 95000,
      monthlyExpenses: 52000,
      monthlyEmi: 15000,
      existingSavings: 350000,
      existingInsuranceCover: 2500000,
      dependantsCount: 1,
      primaryGoal: 'Wealth Creation',
      goalTimeline: 10,
      notes: 'New prospective client'
    };
    const created = await repo.create(newCust);
    assert.ok(created.id, 'Expected generated UUID');
    assert.strictEqual(created.name, 'Sneha Kapoor');
    assert.strictEqual(created.monthlyIncome, 95000);
    createdId = created.id;

    const fetched = await repo.findById(createdId);
    assert.ok(fetched);
    assert.strictEqual(fetched?.name, 'Sneha Kapoor');
  });

  // Test 4: CRUD - Update customer
  await test('DB 4: Parameterized Update updates customer data and timestamp', async () => {
    const updated = await repo.update(createdId, {
      monthlyIncome: 105000,
      notes: 'Promoted to Lead Consultant'
    });
    assert.ok(updated);
    assert.strictEqual(updated?.monthlyIncome, 105000);
    assert.strictEqual(updated?.notes, 'Promoted to Lead Consultant');
  });

  // Test 5: Persistence after simulated backend restart
  await test('DB 5: Re-initializing repository against storage persists all profiles', async () => {
    // Simulating new server instance connecting to the same PostgreSQL pool
    const restartedRepo = new PostgresCustomerRepository(mockPool as any);
    const profiles = await restartedRepo.findAll();
    assert.strictEqual(profiles.length, 2, 'Both Rahul Mehta and Sneha Kapoor must persist across restarts');
    const sneha = profiles.find(p => p.id === createdId);
    assert.ok(sneha);
    assert.strictEqual(sneha?.monthlyIncome, 105000);
  });

  // Test 6: Invalid inputs validation
  await test('DB 6: Invalid non-UUID ID queries return null cleanly without SQL error', async () => {
    const res = await repo.findById('invalid-non-uuid-string');
    assert.strictEqual(res, null);
    const updateRes = await repo.update('invalid-non-uuid-string', { name: 'Test' });
    assert.strictEqual(updateRes, null);
    const delRes = await repo.delete('invalid-non-uuid-string');
    assert.strictEqual(delRes, false);
  });

  // Test 7: CRUD - Delete customer
  await test('DB 7: Parameterized Delete removes customer cleanly', async () => {
    const deleted = await repo.delete(createdId);
    assert.strictEqual(deleted, true);
    const fetched = await repo.findById(createdId);
    assert.strictEqual(fetched, null);
  });

  // Test 8: Connection failure resilience & graceful fallback
  await test('DB 8: Database connection failure triggers clean fallback to in-memory store', async () => {
    mockPool.shouldFailConnections = true;
    CustomerService.setUsePostgres(true);

    // Call service methods while DB is simulating connection failure
    const all = await CustomerService.getAllClients();
    assert.ok(Array.isArray(all));
    assert.ok(all.length >= 1, 'Memory store serves clients when DB is disconnected');
    assert.strictEqual(all[0].name, 'Rahul Mehta');

    mockPool.shouldFailConnections = false;
    CustomerService.setUsePostgres(false);
  });

  // Test 9: Row-to-Profile mapper handles boundary types and nulls
  await test('DB 9: mapRowToProfile handles numeric strings, null goals and dates', () => {
    const mockRow = {
      id: uuidv4(),
      full_name: 'Test Customer',
      age: '40',
      monthly_income: '75000.50',
      expenses: '35000.00',
      savings: '100000.00',
      emi: '0.00',
      existing_life_cover: '1000000.00',
      dependants: '0',
      primary_goal: null,
      goal_timeline: null,
      advisor_notes: null,
      created_at: new Date('2026-10-28T10:00:00Z'),
      updated_at: new Date('2026-10-28T10:00:00Z')
    };
    const mapped = mapRowToProfile(mockRow);
    assert.strictEqual(mapped.age, 40);
    assert.strictEqual(mapped.monthlyIncome, 75000.50);
    assert.strictEqual(mapped.monthlyExpenses, 35000);
    assert.strictEqual(mapped.dependantsCount, 0);
    assert.strictEqual(mapped.primaryGoal, '');
  });

  if (failed > 0) {
    throw new Error(`${failed} Database Repository tests failed`);
  }
  return { passed, failed };
}

if (require.main === module) {
  runDatabaseRepositoryTests().catch(() => process.exit(1));
}

