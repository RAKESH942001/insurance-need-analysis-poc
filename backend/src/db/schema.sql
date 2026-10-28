-- ==============================================================================
-- Axis Max Life Customer Need Analysis Tool - PostgreSQL 17 Database Schema
-- Idempotent Migration Script (Never drops unrelated tables or databases)
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create customer_profiles table with UUID primary key
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  monthly_income NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_income >= 0),
  expenses NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (expenses >= 0),
  savings NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (savings >= 0),
  emi NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (emi >= 0),
  existing_life_cover NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (existing_life_cover >= 0),
  dependants INTEGER NOT NULL DEFAULT 0 CHECK (dependants >= 0),
  primary_goal VARCHAR(255),
  goal_timeline INTEGER DEFAULT 0 CHECK (goal_timeline >= 0),
  advisor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_customer_profiles_full_name ON customer_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_created_at ON customer_profiles(created_at DESC);

-- 3. Trigger for automatic updated_at maintenance
CREATE OR REPLACE FUNCTION update_customer_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER trg_customer_profiles_updated_at
BEFORE UPDATE ON customer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_customer_profiles_timestamp();

-- 4. Seed Rahul Mehta if and only if sample does not already exist
-- Assignment dummy inputs: income ₹85,000, expenses ₹48,000, savings ₹2,50,000, EMI ₹12,000, existing cover ₹20,00,000, two dependants
INSERT INTO customer_profiles (
  id,
  full_name,
  age,
  monthly_income,
  expenses,
  savings,
  emi,
  existing_life_cover,
  dependants,
  primary_goal,
  goal_timeline,
  advisor_notes
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Rahul Mehta',
  32,
  85000.00,
  48000.00,
  250000.00,
  12000.00,
  2000000.00,
  2,
  'Family Protection & Child Education',
  15,
  'Benchmark sample customer: Income ₹85,000, Expenses ₹48,000, EMI ₹12,000, Savings ₹2,50,000, Cover ₹20,00,000, 2 Dependants.'
WHERE NOT EXISTS (
  SELECT 1 FROM customer_profiles 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid OR full_name = 'Rahul Mehta'
);

-- 5. Create customer_goals table linked to customer_profiles with foreign key
CREATE TABLE IF NOT EXISTS customer_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- 'RETIREMENT', 'EDUCATION', 'MARRIAGE', 'HOME', 'EMERGENCY', 'CUSTOM'
  name VARCHAR(255) NOT NULL,
  target_age INTEGER,
  target_years INTEGER NOT NULL DEFAULT 1 CHECK (target_years >= 0),
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (target_amount >= 0),
  inflation_rate NUMERIC(5, 2) NOT NULL DEFAULT 6.00 CHECK (inflation_rate >= 0),
  expected_return_pre NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (expected_return_pre >= 0),
  expected_return_post NUMERIC(5, 2) DEFAULT 7.00 CHECK (expected_return_post >= 0),
  existing_savings NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (existing_savings >= 0),
  monthly_contribution NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_contribution >= 0),
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  planning_horizon_age INTEGER DEFAULT 80,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_goals_customer_id ON customer_goals(customer_id);

-- 6. Seed sample life goals for Rahul Mehta if not already present
-- Goal 1: Retirement Planning (Age 58, life expectancy 80, ₹40k/mo today's expenses, 6% inflation, 10% pre-return, 7% post-return)
INSERT INTO customer_goals (
  id,
  customer_id,
  goal_type,
  name,
  target_age,
  target_years,
  target_amount,
  inflation_rate,
  expected_return_pre,
  expected_return_post,
  existing_savings,
  monthly_contribution,
  priority,
  planning_horizon_age,
  metadata
)
SELECT
  '00000000-0000-0000-0000-000000000011'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'RETIREMENT',
  'Comfortable Retirement at 58',
  58,
  26,
  40000.00,
  6.00,
  10.00,
  7.00,
  50000.00,
  3000.00,
  'HIGH',
  80,
  '{"desiredMonthlyExpenses": 40000, "lifestyleDescription": "Standard post-retirement living"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM customer_goals 
  WHERE id = '00000000-0000-0000-0000-000000000011'::uuid
);

-- Goal 2: Child Higher Education (In 14 years, ₹25 Lakhs today's cost, 8% inflation, 10% expected return)
INSERT INTO customer_goals (
  id,
  customer_id,
  goal_type,
  name,
  target_age,
  target_years,
  target_amount,
  inflation_rate,
  expected_return_pre,
  existing_savings,
  monthly_contribution,
  priority,
  metadata
)
SELECT
  '00000000-0000-0000-0000-000000000012'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'EDUCATION',
  'Child College / Higher Education',
  18,
  14,
  2500000.00,
  8.00,
  10.00,
  100000.00,
  2000.00,
  'HIGH',
  '{"childCurrentAge": 4, "collegeAge": 18, "stream": "Engineering / Management"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM customer_goals 
  WHERE id = '00000000-0000-0000-0000-000000000012'::uuid
);

