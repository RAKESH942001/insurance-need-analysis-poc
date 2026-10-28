import { Pool, PoolClient } from 'pg';
import { CustomerProfile, FinancialGoal, GoalCategory } from '../models/types';
import { getPool, isDbConfigured } from '../db/pool';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

export interface ICustomerRepository {
  findAll(): Promise<CustomerProfile[]>;
  findById(id: string): Promise<CustomerProfile | null>;
  create(profile: Partial<CustomerProfile>): Promise<CustomerProfile>;
  update(id: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile | null>;
  delete(id: string): Promise<boolean>;
  seedSampleIfNotExists(): Promise<void>;
  getStorageMode(): 'POSTGRESQL' | 'MEMORY_FALLBACK';
}

/**
 * Maps a PostgreSQL customer_goals table row to FinancialGoal TypeScript entity
 */
export function mapRowToGoal(row: any): FinancialGoal {
  return {
    id: row.id,
    customerId: row.customer_id,
    category: (row.goal_type || 'OTHER') as GoalCategory,
    name: row.name,
    targetAge: row.target_age !== null && row.target_age !== undefined ? Number(row.target_age) : undefined,
    targetYears: Number(row.target_years) || 1,
    targetAmount: Number(row.target_amount) || 0,
    inflationRate: Number(row.inflation_rate) !== undefined ? Number(row.inflation_rate) : 6.0,
    expectedReturnPre: Number(row.expected_return_pre) !== undefined ? Number(row.expected_return_pre) : 10.0,
    expectedReturnPost: row.expected_return_post !== null && row.expected_return_post !== undefined ? Number(row.expected_return_post) : 7.0,
    existingSavings: Number(row.existing_savings) || 0,
    monthlyContribution: Number(row.monthly_contribution) || 0,
    priority: (row.priority || 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
    planningHorizonAge: row.planning_horizon_age ? Number(row.planning_horizon_age) : 80,
    metadata: row.metadata || {},
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
  };
}

/**
 * Maps a PostgreSQL customer_profiles table row to CustomerProfile TypeScript entity
 */
export function mapRowToProfile(row: any, goals: FinancialGoal[] = []): CustomerProfile {
  const primaryGoal = row.primary_goal || '';
  const goalTimeline = row.goal_timeline ? Number(row.goal_timeline) : 0;

  // Use associated goals if available; else fallback to legacy primaryGoal
  const profileGoals: FinancialGoal[] = goals.length > 0 ? goals : (
    primaryGoal ? [
      {
        id: 'goal_legacy_primary',
        category: 'EDUCATION',
        name: primaryGoal,
        targetAmount: 0,
        targetYears: goalTimeline || 10,
        inflationRate: 6.0,
        expectedReturnPre: 10.0,
        existingSavings: 0,
        monthlyContribution: 0,
        priority: 'HIGH'
      }
    ] : []
  );

  return {
    id: row.id,
    name: row.full_name,
    age: Number(row.age),
    occupation: 'Salaried Professional',
    dependantsCount: Number(row.dependants) || 0,
    monthlyIncome: Number(row.monthly_income) || 0,
    monthlyExpenses: Number(row.expenses) || 0,
    monthlyEmi: Number(row.emi) || 0,
    existingSavings: Number(row.savings) || 0,
    existingLiabilities: 0,
    existingInsuranceCover: Number(row.existing_life_cover) || 0,
    primaryGoal,
    goalTimeline,
    goals: profileGoals,
    riskAppetite: 'MODERATE',
    notes: row.advisor_notes || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
  };
}

/**
 * PostgreSQL 17 Implementation with Parameterized SQL & Transactions
 */
export class PostgresCustomerRepository implements ICustomerRepository {
  private pool: Pool;

  constructor(pool: Pool = getPool()) {
    this.pool = pool;
  }

  public getStorageMode(): 'POSTGRESQL' | 'MEMORY_FALLBACK' {
    return 'POSTGRESQL';
  }

  public async findAll(): Promise<CustomerProfile[]> {
    const profilesQuery = `
      SELECT 
        id, full_name, age, monthly_income, expenses, savings, emi,
        existing_life_cover, dependants, primary_goal, goal_timeline,
        advisor_notes, created_at, updated_at
      FROM customer_profiles
      ORDER BY 
        CASE WHEN full_name = 'Rahul Mehta' THEN 0 ELSE 1 END,
        created_at DESC;
    `;
    const profilesRes = await this.pool.query(profilesQuery);

    // Query all goals for customers in batch
    let goalsMap = new Map<string, FinancialGoal[]>();
    try {
      const goalsRes = await this.pool.query(`
        SELECT * FROM customer_goals ORDER BY priority DESC, target_years ASC, created_at ASC;
      `);
      for (const row of goalsRes.rows) {
        const goal = mapRowToGoal(row);
        const custId = row.customer_id;
        if (!goalsMap.has(custId)) goalsMap.set(custId, []);
        goalsMap.get(custId)!.push(goal);
      }
    } catch {
      // If table not initialized yet, goalsMap stays empty
    }

    return profilesRes.rows.map(row => mapRowToProfile(row, goalsMap.get(row.id) || []));
  }

  public async findById(id: string): Promise<CustomerProfile | null> {
    if (!validateUuid(id)) {
      return null;
    }
    const profileRes = await this.pool.query(
      `SELECT * FROM customer_profiles WHERE id = $1::uuid;`,
      [id]
    );
    if (profileRes.rows.length === 0) return null;

    let goals: FinancialGoal[] = [];
    try {
      const goalsRes = await this.pool.query(
        `SELECT * FROM customer_goals WHERE customer_id = $1::uuid ORDER BY created_at ASC;`,
        [id]
      );
      goals = goalsRes.rows.map(mapRowToGoal);
    } catch {
      // goals remain empty
    }

    return mapRowToProfile(profileRes.rows[0], goals);
  }

  public async create(profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const id = (profile.id && validateUuid(profile.id)) ? profile.id : uuidv4();
    const fullName = profile.name || 'New Customer';
    const age = Math.max(18, Number(profile.age) || 30);
    const monthlyIncome = Math.max(0, Number(profile.monthlyIncome) || 0);
    const expenses = Math.max(0, Number(profile.monthlyExpenses) || 0);
    const savings = Math.max(0, Number(profile.existingSavings) || 0);
    const emi = Math.max(0, Number(profile.monthlyEmi) || 0);
    const existingLifeCover = Math.max(0, Number(profile.existingInsuranceCover) || 0);
    const dependants = Math.max(0, Number(profile.dependantsCount) || 0);
    const primaryGoal = profile.primaryGoal || (profile.goals?.[0]?.name ?? 'Family Protection');
    const goalTimeline = profile.goalTimeline || (profile.goals?.[0]?.targetYears ?? 10);
    const advisorNotes = profile.notes || null;

    const client: any = (typeof this.pool.connect === 'function')
      ? await this.pool.connect()
      : this.pool;

    try {
      if (typeof client.query === 'function') {
        await client.query('BEGIN');
      }

      const profileInsertQuery = `
        INSERT INTO customer_profiles (
          id, full_name, age, monthly_income, expenses, savings, emi,
          existing_life_cover, dependants, primary_goal, goal_timeline, advisor_notes
        ) VALUES (
          $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING *;
      `;

      const values = [
        id,
        fullName,
        age,
        monthlyIncome,
        expenses,
        savings,
        emi,
        existingLifeCover,
        dependants,
        primaryGoal,
        goalTimeline,
        advisorNotes
      ];

      const profileRes = await client.query(profileInsertQuery, values);

      // Insert associated goals if provided
      const insertedGoals: FinancialGoal[] = [];
      if (profile.goals && Array.isArray(profile.goals) && profile.goals.length > 0) {
        for (const goal of profile.goals) {
          const goalId = (goal.id && validateUuid(goal.id)) ? goal.id : uuidv4();
          const goalQuery = `
            INSERT INTO customer_goals (
              id, customer_id, goal_type, name, target_age, target_years, target_amount,
              inflation_rate, expected_return_pre, expected_return_post, existing_savings,
              monthly_contribution, priority, planning_horizon_age, metadata
            ) VALUES (
              $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
            RETURNING *;
          `;
          const goalValues = [
            goalId,
            id,
            goal.category || 'OTHER',
            goal.name,
            goal.targetAge || null,
            goal.targetYears || 1,
            goal.targetAmount || 0,
            goal.inflationRate !== undefined ? goal.inflationRate : 6.0,
            goal.expectedReturnPre !== undefined ? goal.expectedReturnPre : 10.0,
            goal.expectedReturnPost !== undefined ? goal.expectedReturnPost : 7.0,
            goal.existingSavings || 0,
            goal.monthlyContribution || 0,
            goal.priority || 'MEDIUM',
            goal.planningHorizonAge || 80,
            JSON.stringify(goal.metadata || {})
          ];
          const goalRes = await client.query(goalQuery, goalValues);
          insertedGoals.push(mapRowToGoal(goalRes.rows[0]));
        }
      }

      await client.query('COMMIT');
      return mapRowToProfile(profileRes.rows[0], insertedGoals);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      if (typeof client.release === 'function') {
        client.release();
      }
    }
  }

  public async update(id: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
    if (!validateUuid(id)) {
      return null;
    }

    const existing = await this.findById(id);
    if (!existing) return null;

    const fullName = profile.name !== undefined ? profile.name : existing.name;
    const age = profile.age !== undefined ? Math.max(18, Number(profile.age)) : existing.age;
    const monthlyIncome = profile.monthlyIncome !== undefined ? Math.max(0, Number(profile.monthlyIncome)) : existing.monthlyIncome;
    const expenses = profile.monthlyExpenses !== undefined ? Math.max(0, Number(profile.monthlyExpenses)) : existing.monthlyExpenses;
    const savings = profile.existingSavings !== undefined ? Math.max(0, Number(profile.existingSavings)) : existing.existingSavings;
    const emi = profile.monthlyEmi !== undefined ? Math.max(0, Number(profile.monthlyEmi)) : existing.monthlyEmi;
    const existingLifeCover = profile.existingInsuranceCover !== undefined ? Math.max(0, Number(profile.existingInsuranceCover)) : existing.existingInsuranceCover;
    const dependants = profile.dependantsCount !== undefined ? Math.max(0, Number(profile.dependantsCount)) : existing.dependantsCount;
    const primaryGoal = profile.primaryGoal !== undefined ? profile.primaryGoal : (existing.primaryGoal || 'Family Protection');
    const goalTimeline = profile.goalTimeline !== undefined ? Number(profile.goalTimeline) : (existing.goalTimeline || 10);
    const advisorNotes = profile.notes !== undefined ? profile.notes : existing.notes;

    const client: any = (typeof this.pool.connect === 'function')
      ? await this.pool.connect()
      : this.pool;

    try {
      if (typeof client.query === 'function') {
        await client.query('BEGIN');
      }

      const profileUpdateQuery = `
        UPDATE customer_profiles SET
          full_name = $2,
          age = $3,
          monthly_income = $4,
          expenses = $5,
          savings = $6,
          emi = $7,
          existing_life_cover = $8,
          dependants = $9,
          primary_goal = $10,
          goal_timeline = $11,
          advisor_notes = $12
        WHERE id = $1::uuid
        RETURNING *;
      `;

      const values = [
        id,
        fullName,
        age,
        monthlyIncome,
        expenses,
        savings,
        emi,
        existingLifeCover,
        dependants,
        primaryGoal,
        goalTimeline,
        advisorNotes
      ];

      const profileRes = await client.query(profileUpdateQuery, values);
      if (profileRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // If goals array is explicitly supplied, sync goals
      let finalGoals: FinancialGoal[] = existing.goals;
      if (profile.goals !== undefined && Array.isArray(profile.goals)) {
        await client.query(`DELETE FROM customer_goals WHERE customer_id = $1::uuid;`, [id]);
        finalGoals = [];
        for (const goal of profile.goals) {
          const goalId = (goal.id && validateUuid(goal.id)) ? goal.id : uuidv4();
          const goalInsert = `
            INSERT INTO customer_goals (
              id, customer_id, goal_type, name, target_age, target_years, target_amount,
              inflation_rate, expected_return_pre, expected_return_post, existing_savings,
              monthly_contribution, priority, planning_horizon_age, metadata
            ) VALUES (
              $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
            RETURNING *;
          `;
          const goalValues = [
            goalId,
            id,
            goal.category || 'OTHER',
            goal.name,
            goal.targetAge || null,
            goal.targetYears || 1,
            goal.targetAmount || 0,
            goal.inflationRate !== undefined ? goal.inflationRate : 6.0,
            goal.expectedReturnPre !== undefined ? goal.expectedReturnPre : 10.0,
            goal.expectedReturnPost !== undefined ? goal.expectedReturnPost : 7.0,
            goal.existingSavings || 0,
            goal.monthlyContribution || 0,
            goal.priority || 'MEDIUM',
            goal.planningHorizonAge || 80,
            JSON.stringify(goal.metadata || {})
          ];
          const gRes = await client.query(goalInsert, goalValues);
          finalGoals.push(mapRowToGoal(gRes.rows[0]));
        }
      }

      await client.query('COMMIT');
      return mapRowToProfile(profileRes.rows[0], finalGoals);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      if (typeof client.release === 'function') {
        client.release();
      }
    }
  }

  public async delete(id: string): Promise<boolean> {
    if (!validateUuid(id)) {
      return false;
    }
    const query = `DELETE FROM customer_profiles WHERE id = $1::uuid;`;
    const res = await this.pool.query(query, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public async seedSampleIfNotExists(): Promise<void> {
    const rahulId = '00000000-0000-0000-0000-000000000001';
    const profileSeedQuery = `
      INSERT INTO customer_profiles (
        id, full_name, age, monthly_income, expenses, savings, emi,
        existing_life_cover, dependants, primary_goal, goal_timeline, advisor_notes
      )
      SELECT
        $1::uuid, 'Rahul Mehta', 32, 85000.00, 48000.00, 250000.00, 12000.00,
        2000000.00, 2, 'Family Protection & Child Education', 15,
        'Benchmark sample customer: Income ₹85,000, Expenses ₹48,000, EMI ₹12,000, Savings ₹2,50,000, Cover ₹20,00,000, 2 Dependants.'
      WHERE NOT EXISTS (
        SELECT 1 FROM customer_profiles WHERE id = $1::uuid OR full_name = 'Rahul Mehta'
      );
    `;
    await this.pool.query(profileSeedQuery, [rahulId]);

    // Seed goals for Rahul Mehta if not already seeded
    const goal1Seed = `
      INSERT INTO customer_goals (
        id, customer_id, goal_type, name, target_age, target_years, target_amount,
        inflation_rate, expected_return_pre, expected_return_post, existing_savings,
        monthly_contribution, priority, planning_horizon_age
      )
      SELECT
        '00000000-0000-0000-0000-000000000011'::uuid, $1::uuid, 'RETIREMENT',
        'Comfortable Retirement at 58', 58, 26, 40000.00, 6.00, 10.00, 7.00,
        50000.00, 3000.00, 'HIGH', 80
      WHERE NOT EXISTS (
        SELECT 1 FROM customer_goals WHERE id = '00000000-0000-0000-0000-000000000011'::uuid
      );
    `;
    const goal2Seed = `
      INSERT INTO customer_goals (
        id, customer_id, goal_type, name, target_age, target_years, target_amount,
        inflation_rate, expected_return_pre, existing_savings, monthly_contribution, priority
      )
      SELECT
        '00000000-0000-0000-0000-000000000012'::uuid, $1::uuid, 'EDUCATION',
        'Child College / Higher Education', 18, 14, 2500000.00, 8.00, 10.00,
        100000.00, 2000.00, 'HIGH'
      WHERE NOT EXISTS (
        SELECT 1 FROM customer_goals WHERE id = '00000000-0000-0000-0000-000000000012'::uuid
      );
    `;

    try {
      await this.pool.query(goal1Seed, [rahulId]);
      await this.pool.query(goal2Seed, [rahulId]);
    } catch {
      // Table may not yet exist in early test setup
    }
  }
}

/**
 * Resilient In-Memory Repository Fallback (Used when DB credentials are not configured or offline)
 */
export class MemoryCustomerRepository implements ICustomerRepository {
  private static store: Map<string, CustomerProfile> = new Map();

  constructor() {
    if (MemoryCustomerRepository.store.size === 0) {
      this.seedSampleIfNotExists();
    }
  }

  public getStorageMode(): 'POSTGRESQL' | 'MEMORY_FALLBACK' {
    return 'MEMORY_FALLBACK';
  }

  public async findAll(): Promise<CustomerProfile[]> {
    return Array.from(MemoryCustomerRepository.store.values());
  }

  public async findById(id: string): Promise<CustomerProfile | null> {
    return MemoryCustomerRepository.store.get(id) || null;
  }

  public async create(profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const id = profile.id || uuidv4();
    const now = new Date().toISOString();
    const created: CustomerProfile = {
      id,
      name: profile.name || 'New Customer',
      age: Math.max(18, Number(profile.age) || 30),
      occupation: profile.occupation || 'Salaried Professional',
      dependantsCount: Math.max(0, Number(profile.dependantsCount) || 0),
      monthlyIncome: Math.max(0, Number(profile.monthlyIncome) || 0),
      monthlyExpenses: Math.max(0, Number(profile.monthlyExpenses) || 0),
      monthlyEmi: Math.max(0, Number(profile.monthlyEmi) || 0),
      existingSavings: Math.max(0, Number(profile.existingSavings) || 0),
      existingLiabilities: Math.max(0, Number(profile.existingLiabilities) || 0),
      existingInsuranceCover: Math.max(0, Number(profile.existingInsuranceCover) || 0),
      primaryGoal: profile.primaryGoal || 'Family Protection',
      goalTimeline: profile.goalTimeline || 10,
      goals: profile.goals || [],
      riskAppetite: profile.riskAppetite || 'MODERATE',
      notes: profile.notes || '',
      createdAt: now,
      updatedAt: now
    };
    MemoryCustomerRepository.store.set(id, created);
    return created;
  }

  public async update(id: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
    const existing = MemoryCustomerRepository.store.get(id);
    if (!existing) return null;

    const updated: CustomerProfile = {
      ...existing,
      name: profile.name !== undefined ? profile.name : existing.name,
      age: profile.age !== undefined ? Math.max(18, Number(profile.age)) : existing.age,
      monthlyIncome: profile.monthlyIncome !== undefined ? Math.max(0, Number(profile.monthlyIncome)) : existing.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses !== undefined ? Math.max(0, Number(profile.monthlyExpenses)) : existing.monthlyExpenses,
      monthlyEmi: profile.monthlyEmi !== undefined ? Math.max(0, Number(profile.monthlyEmi)) : existing.monthlyEmi,
      existingSavings: profile.existingSavings !== undefined ? Math.max(0, Number(profile.existingSavings)) : existing.existingSavings,
      existingInsuranceCover: profile.existingInsuranceCover !== undefined ? Math.max(0, Number(profile.existingInsuranceCover)) : existing.existingInsuranceCover,
      dependantsCount: profile.dependantsCount !== undefined ? Math.max(0, Number(profile.dependantsCount)) : existing.dependantsCount,
      primaryGoal: profile.primaryGoal !== undefined ? profile.primaryGoal : existing.primaryGoal,
      goalTimeline: profile.goalTimeline !== undefined ? Number(profile.goalTimeline) : existing.goalTimeline,
      goals: profile.goals !== undefined ? profile.goals : existing.goals,
      notes: profile.notes !== undefined ? profile.notes : existing.notes,
      updatedAt: new Date().toISOString()
    };

    MemoryCustomerRepository.store.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    return MemoryCustomerRepository.store.delete(id);
  }

  public async seedSampleIfNotExists(): Promise<void> {
    const rahulId = '00000000-0000-0000-0000-000000000001';
    if (!MemoryCustomerRepository.store.has(rahulId)) {
      const defaultGoals: FinancialGoal[] = [
        {
          id: '00000000-0000-0000-0000-000000000011',
          customerId: rahulId,
          category: 'RETIREMENT',
          name: 'Comfortable Retirement at 58',
          targetAge: 58,
          targetYears: 26,
          targetAmount: 40000,
          inflationRate: 6.0,
          expectedReturnPre: 10.0,
          expectedReturnPost: 7.0,
          existingSavings: 50000,
          monthlyContribution: 3000,
          priority: 'HIGH',
          planningHorizonAge: 80,
          metadata: { desiredMonthlyExpenses: 40000 }
        },
        {
          id: '00000000-0000-0000-0000-000000000012',
          customerId: rahulId,
          category: 'EDUCATION',
          name: 'Child College / Higher Education',
          targetAge: 18,
          targetYears: 14,
          targetAmount: 2500000,
          inflationRate: 8.0,
          expectedReturnPre: 10.0,
          existingSavings: 100000,
          monthlyContribution: 2000,
          priority: 'HIGH',
          metadata: { childCurrentAge: 4, collegeAge: 18 }
        }
      ];

      const rahulMehta: CustomerProfile = {
        id: rahulId,
        name: 'Rahul Mehta',
        age: 32,
        occupation: 'Senior IT Consultant',
        dependantsCount: 2,
        monthlyIncome: 85000,
        monthlyExpenses: 48000,
        monthlyEmi: 12000,
        existingSavings: 250000,
        existingLiabilities: 0,
        existingInsuranceCover: 2000000,
        primaryGoal: 'Family Protection & Child Education',
        goalTimeline: 15,
        goals: defaultGoals,
        riskAppetite: 'MODERATE',
        notes: 'Benchmark customer: Income ₹85,000, Expenses ₹48,000, EMI ₹12,000, Savings ₹2,50,000, Cover ₹20,00,000, 2 Dependants.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      MemoryCustomerRepository.store.set(rahulId, rahulMehta);
    }
  }

  public static clear(): void {
    MemoryCustomerRepository.store.clear();
  }
}

/**
 * Resilient Customer Service Manager
 * Dynamically switches between PostgreSQL and Memory storage without breaking existing callers
 */
export class CustomerService {
  private static postgresRepo = new PostgresCustomerRepository();
  private static memoryRepo = new MemoryCustomerRepository();
  private static usePostgres = false;

  public static setUsePostgres(value: boolean): void {
    this.usePostgres = value;
  }

  public static isUsingPostgres(): boolean {
    return this.usePostgres;
  }

  private static getActiveRepo(): ICustomerRepository {
    if (this.usePostgres && isDbConfigured()) {
      return this.postgresRepo;
    }
    return this.memoryRepo;
  }

  public static async getAllClients(): Promise<CustomerProfile[]> {
    try {
      return await this.getActiveRepo().findAll();
    } catch (err: any) {
      console.warn('[CustomerService]: Error in primary repository, falling back to memory store:', err.message);
      return await this.memoryRepo.findAll();
    }
  }

  public static async getClientById(id: string): Promise<CustomerProfile | null> {
    try {
      return await this.getActiveRepo().findById(id);
    } catch (err: any) {
      console.warn('[CustomerService]: Error fetching client by id, falling back to memory store:', err.message);
      return await this.memoryRepo.findById(id);
    }
  }

  public static async saveClient(profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const repo = this.getActiveRepo();
    try {
      if (profile.id) {
        const existing = await repo.findById(profile.id);
        if (existing) {
          const updated = await repo.update(profile.id, profile);
          if (updated) return updated;
        }
      }
      return await repo.create(profile);
    } catch (err: any) {
      console.warn('[CustomerService]: Error saving client to primary repository, falling back to memory store:', err.message);
      if (profile.id) {
        const memExisting = await this.memoryRepo.findById(profile.id);
        if (memExisting) {
          const memUpdated = await this.memoryRepo.update(profile.id, profile);
          if (memUpdated) return memUpdated;
        }
      }
      return await this.memoryRepo.create(profile);
    }
  }

  public static async updateClient(id: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
    try {
      return await this.getActiveRepo().update(id, profile);
    } catch (err: any) {
      console.warn('[CustomerService]: Error updating client in primary repository, falling back to memory store:', err.message);
      return await this.memoryRepo.update(id, profile);
    }
  }

  public static async deleteClient(id: string): Promise<boolean> {
    try {
      return await this.getActiveRepo().delete(id);
    } catch (err: any) {
      console.warn('[CustomerService]: Error deleting client in primary repository, falling back to memory store:', err.message);
      return await this.memoryRepo.delete(id);
    }
  }

  public static async resetToDefault(): Promise<CustomerProfile[]> {
    try {
      const repo = this.getActiveRepo();
      await repo.seedSampleIfNotExists();
      return await repo.findAll();
    } catch (err: any) {
      console.warn('[CustomerService]: Error during sample reset, falling back to memory store:', err.message);
      await this.memoryRepo.seedSampleIfNotExists();
      return await this.memoryRepo.findAll();
    }
  }

  public static getStorageMode(): 'POSTGRESQL' | 'MEMORY_FALLBACK' {
    return this.getActiveRepo().getStorageMode();
  }
}
