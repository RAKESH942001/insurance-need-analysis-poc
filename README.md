# Axis Max Life Customer Need & Life Goals Analysis Platform

A production-grade, explainable customer needs analysis and life goals planning platform architected for Axis Max Life relationship managers and bancassurance advisors.

Separates deterministic actuarial calculations, goal-based funding gap derivations, priority-ranked recommendations, responsible AI copilot capabilities, and a **PostgreSQL 17** persistence layer with resilient local browser fallback.

---

## 🧭 Multi-Screen Advisor Workflow

The application guides the advisor through a seamless 4-screen advisory journey:

```
┌───────────────────────────┐      ┌───────────────────────────┐
│         SCREEN 1          │      │         SCREEN 2          │
│ Customer Profile & Health │ ───> │ Life Goals & Future Plans │
│ Income, Living Costs, EMI │      │ Retirement, College, Wed  │
└───────────────────────────┘      └───────────────────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│         SCREEN 3          │      │         SCREEN 4          │
│   AI Need Analysis & Math │ ───> │  Shareable Advisor Report │
│ Gaps, SIPs & Actuarial PV │      │ WhatsApp, Email & PDF     │
└───────────────────────────┘      └───────────────────────────┘
```

1. **Screen 1 — Customer Profile & Financial Health**:
   - Customer profile details: Name, Age, Occupation, Dependants, Monthly In-hand Income, Monthly Living Expenses, Monthly EMIs, Liquid Savings, Existing Insurance Cover, Advisor Notes.
   - Pre-loads benchmark customer **Rahul Mehta** (`₹85k` income, `₹48k` expenses, `₹12k` EMI, `₹2.5L` savings, `₹20L` cover, 2 dependants).
   - Live Cashflow Diagnostics (Commitments `₹60,000`, Net Surplus `₹25,000`, Savings Runway `4.17 months`).

2. **Screen 2 — Life Goals & Future Plans**:
   - Interactive goal planner supporting multiple goals per customer with dynamic conditional inputs:
     - **Retirement Planning**: Target retirement age, desired monthly living expenses in today's money, life expectancy (planning horizon age 80/85), current retirement corpus, monthly contribution, inflation %, pre- and post-retirement returns.
     - **Children's Education**: Child current age, college start age (18), cost in today's money, existing education savings, monthly SIP, education inflation (8-10%), expected return.
     - **Marriage & Family Milestones**: Planned year/age, budget in today's money, allocated savings, inflation, expected return.
     - **Home Purchase / Custom Goals**: Target timeline, today's cost, existing savings, monthly contribution.
   - Pre-loaded sample goals for Rahul Mehta:
     1. *Comfortable Retirement at 58* (Age 58, life expectancy 80, ₹40k/mo expense, 6% inflation, 10% pre-return, 7% post-return).
     2. *Child College / Higher Education* (In 14 yrs, ₹25 Lakhs cost, 8% inflation, 10% return).

3. **Screen 3 — AI-Powered Need Analysis & Actuarial Calculations**:
   - **Financial Health & Emergency Buffer Dashboard**: 6 core metrics including 6-Month Emergency Target (`₹3,60,000`), Emergency Gap (`₹1,10,000`), Savings Runway (`4.17 months`), and Pure Term Life Protection Gap (`₹82,00,000`).
   - **Retirement Planning Deep-Dive**: Visual timeline (Age 32 -> 58 -> 80), inflated monthly expense at retirement, required corpus using actuarial Annuity Due formula, existing projected accumulation, net shortfall, and required additional monthly SIP.
   - **Life Goals Funding Gap Table**: Detailed goal-by-goal breakdown showing today's cost, inflated future cost, projected savings, net funding gap, and required monthly SIP.
   - **Consolidated Monthly Capital Requirement**: Total monthly SIP required across all goals vs available monthly net surplus (`₹25,000`).
   - **Action Recommendations Ranked in Urgency Order** (Immediate -> High -> Medium -> Low) with rationale, math, and next steps.
   - **AI Advisor Copilot**: Executive summary, advisor talking script, key discussion points, and client objection handlers (deterministic rule engine fallback when no API key is set).

4. **Screen 4 — Shareable Advisor Report**:
   - Executive presentation ready for client meetings.
   - Comprehensive customer dossier.
   - One-click **Copy for WhatsApp** (formatted plain text with clean bullet points and emojis).
   - One-click **Copy for Email** (formal email text with subject line, greeting, and advisor sign-off).
   - One-click **Download TXT Report**.
   - One-click **Print / Save as PDF** (`window.print()` with `@media print` styling).

---

## 📐 Actuarial & Mathematical Formulas

Every displayed financial figure is mathematically derived from customer inputs without hardcoding:

### 1. Cashflow & Emergency Reserves
- $\text{Monthly Commitments} = \text{Monthly Expenses} + \text{Monthly EMI}$
  - Rahul Mehta: $₹48,000 + ₹12,000 = ₹60,000$
- $\text{Monthly Net Surplus} = \text{Monthly Income} - \text{Monthly Commitments}$
  - Rahul Mehta: $₹85,000 - ₹60,000 = ₹25,000$
- $\text{6-Month Emergency Target} = \text{Monthly Commitments} \times 6 = ₹60,000 \times 6 = ₹3,60,000$
- $\text{Emergency Fund Gap} = \max(0, ₹3,60,000 - ₹2,50,000) = ₹1,10,000$
- $\text{Savings Runway} = \frac{₹2,50,000}{₹60,000} \approx 4.17\text{ months}$

### 2. Pure Term Life Protection Gap (Human Life Value)
- Multiplier guideline: $\le 45\text{ yrs} \to 10\times$; $46-55\text{ yrs} \to 7\times$; $56+\text{ yrs} \to 5\times$.
- Gross Protection Need: $10 \times \text{Annual Income} = 10 \times ₹10,20,000 = ₹1,02,00,000$.
- Net Protection Gap: $\max(0, ₹1,02,00,000 - ₹20,00,000\text{ cover}) = ₹82,00,000$.

### 3. Retirement Corpus (Actuarial Annuity Due)
- Years to Retirement: $N = \text{Target Retirement Age} - \text{Current Age}$.
- Retirement Duration: $M = \text{Planning Horizon Age} - \text{Target Retirement Age}$.
- Inflated Annual Expense at Retirement: $E_{ret} = (\text{Monthly Expense Today} \times 12) \times (1 + i)^N$.
- Real Rate of Return in Retirement: $r_{real} = \frac{1 + r_{post}}{1 + i} - 1$.
- Required Corpus at Retirement:
  $$\text{Corpus} = E_{ret} \times \left[\frac{1 - (1 + r_{real})^{-M}}{r_{real}}\right] \times (1 + r_{real})$$
- Projected Value of Current Retirement Savings: $S_0 \times (1 + r_{pre})^N$.
- Projected Value of Existing Retirement SIP ($T = 12N$, $r_m = (1+r_{pre})^{1/12}-1$):
  $$FV_{SIP} = \text{SIP} \times \frac{(1 + r_m)^T - 1}{r_m} \times (1 + r_m)$$
- Net Corpus Gap: $\max(0, \text{Corpus} - (FV_{savings} + FV_{SIP}))$.
- Additional Monthly SIP Needed:
  $$\text{Req SIP} = \text{Corpus Gap} \times \frac{r_m}{((1 + r_m)^T - 1) \times (1 + r_m)}$$

### 4. Milestone Life Goals (Future Value & SIP)
- Inflated Future Cost: $FV = \text{Cost Today} \times (1 + i)^N$.
- Funding Gap: $\max(0, FV - (FV_{existing} + FV_{SIP}))$.
- Required Monthly SIP: $\text{Req SIP} = \text{Gap} \times \frac{r_m}{((1 + r_m)^T - 1) \times (1 + r_m)}$.

---

## 🗄️ PostgreSQL 17 Database Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             POSTGRESQL 17 SCHEMA                                 │
│                                                                                  │
│   TABLE: customer_profiles                                                       │
│   • id: UUID PRIMARY KEY (gen_random_uuid)                                       │
│   • full_name: VARCHAR(255) NOT NULL                                             │
│   • age: INTEGER NOT NULL (CHECK 18-100)                                         │
│   • monthly_income: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                         │
│   • expenses: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                               │
│   • savings: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                                │
│   • emi: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                                    │
│   • existing_life_cover: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                    │
│   • dependants: INTEGER NOT NULL DEFAULT 0                                       │
│   • primary_goal: VARCHAR(255)                                                   │
│   • goal_timeline: INTEGER DEFAULT 0                                             │
│   • advisor_notes: TEXT                                                          │
│   • created_at: TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP                   │
│   • updated_at: TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP                   │
│                                                                                  │
│   TABLE: customer_goals (Foreign Key -> customer_profiles.id ON DELETE CASCADE)  │
│   • id: UUID PRIMARY KEY (gen_random_uuid)                                       │
│   • customer_id: UUID REFERENCES customer_profiles(id) ON DELETE CASCADE         │
│   • goal_type: VARCHAR(50) ('RETIREMENT', 'EDUCATION', 'MARRIAGE', 'HOME', etc)  │
│   • name: VARCHAR(255) NOT NULL                                                  │
│   • target_age: INTEGER                                                          │
│   • target_years: INTEGER NOT NULL DEFAULT 1                                     │
│   • target_amount: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                          │
│   • inflation_rate: NUMERIC(5, 2) NOT NULL DEFAULT 6.00                          │
│   • expected_return_pre: NUMERIC(5, 2) NOT NULL DEFAULT 10.00                    │
│   • expected_return_post: NUMERIC(5, 2) DEFAULT 7.00                             │
│   • existing_savings: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                       │
│   • monthly_contribution: NUMERIC(15, 2) NOT NULL DEFAULT 0.00                  │
│   • priority: VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'                              │
│   • planning_horizon_age: INTEGER DEFAULT 80                                     │
│   • metadata: JSONB                                                              │
│   • created_at, updated_at: TIMESTAMPTZ                                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Launch Instructions

### Prerequisites
- Node.js v18+ (tested on v22.23.3)
- PostgreSQL 17 (port 5433 or 5432)

### 1. Database Initialization
```powershell
npm run db:init
```
Applies migrations and seeds Rahul Mehta with default sample goals.

### 2. Start Backend API
```powershell
npm run start:backend
```
Runs on `http://localhost:5000`. Connects to PostgreSQL 17 on `localhost:5433`.

### 3. Start Frontend UI
```powershell
npm run start:frontend
```
Opens the React 19 application at `http://localhost:3000`.

---

## 🧪 Verification & Automated Test Results

Run all 27 unit, integration, and database tests:
```powershell
npm test
```

### Actual Test Results (27/27 PASSING)
```text
================================================================
ALL SUITES COMPLETE: 27 passed, 0 failed
- Financial & AI Suite: 18 passed
- PostgreSQL 17 Suite: 9 passed
================================================================

Financial Engine & AI Safety:
✅ PASS: 1. Monthly commitments must be exactly ₹60,000 (Expenses ₹48,000 + EMI ₹12,000)
✅ PASS: 2. Monthly surplus must be exactly ₹25,000 (Income ₹85,000 - Commitments ₹60,000)
✅ PASS: 3. Six-month emergency fund target must be exactly ₹3,60,000 (6 × ₹60,000)
✅ PASS: 4. Emergency fund gap must be exactly ₹1,10,000 (Target ₹3,60,000 - Savings ₹2,50,000)
✅ PASS: 5. Current savings runway must be 4.17 months (₹2,50,000 ÷ ₹60,000)
✅ PASS: 6. Illustrative Protection Gap must be ₹82,00,000 (10x Annual Income ₹1.02Cr - ₹20L declared cover)
✅ PASS: 7. Edge Case: Zero Income handled cleanly with deficit & zero division protected
✅ PASS: 8. Edge Case: Negative cash flow triggers IMMEDIATE urgency recommendation
✅ PASS: 9. Edge Case: Zero Dependants evaluated without crashing and noted in advice
✅ PASS: 10. Edge Case: Zero Commitments handled without Division By Zero / NaN
✅ PASS: 11. Edge Case: Overfunded life insurance eliminates protection gap (Surplus Cover)
✅ PASS: 12. AI Safety: When API key is not configured, AI engine strictly reports isLiveAi = false
✅ PASS: 13. Mathematical Transparency: Every single calculation step contains formula, inputs, and math
✅ PASS: 14. Retirement Planning: Annuity due corpus properly accounts for inflation, duration and real returns
✅ PASS: 15. Child Education Goal: Inflates future costs and derives required monthly SIP
✅ PASS: 16. Multi-Goal Customer Analysis: Calculates total future costs, gaps, and surplus remaining
✅ PASS: 17. Recommendation Engine integrates goals alongside emergency buffer and life protection
✅ PASS: 18. Edge Case: Equal Inflation and Post-Retirement Return handles flat annuity without NaN

PostgreSQL 17 Repository:
✅ PASS: DB 1: Seed Rahul Mehta idempotently into customer_profiles
✅ PASS: DB 2: Duplicate seeding does not duplicate sample records
✅ PASS: DB 3: Parameterized Create inserts customer with UUID primary key
✅ PASS: DB 4: Parameterized Update updates customer data and timestamp
✅ PASS: DB 5: Re-initializing repository against storage persists all profiles
✅ PASS: DB 6: Invalid non-UUID ID queries return null cleanly without SQL error
✅ PASS: DB 7: Parameterized Delete removes customer cleanly
✅ PASS: DB 8: Database connection failure triggers clean fallback to in-memory store
✅ PASS: DB 9: mapRowToProfile handles numeric strings, null goals and dates
```

---

## 🎙️ Short Interview Demo Script (2-3 Minutes)

1. **Introduction**:
   > *"Good morning. I've designed this Customer Need & Life Goals Analysis Tool for Axis Max Life relationship managers. Rather than just calculating expenses, it guides the advisor through a complete 4-screen advisory journey that uncovers financial gaps, projects future milestones, and creates an advisor-ready action plan."*

2. **Screen 1 — Profile & Financial Health**:
   > *"Here on Screen 1, we preload Rahul Mehta, our benchmark IT consultant earning ₹85,000/month with ₹48,000 living costs and ₹12,000 EMI. The tool immediately flags that while he has a healthy monthly surplus of ₹25,000, his ₹2.5 Lakhs savings cover only 4.17 months of commitments against the 6-month safety benchmark."*

3. **Screen 2 — Life Goals & Future Plans**:
   > *"Moving to Screen 2, we map his future milestones. Rahul plans to retire at 58 with ₹40,000/month in today's money and has a college education goal for his child in 14 years costing ₹25 Lakhs. The advisor can add custom goals with inflation rates and expected returns, using conditional fields for each category."*

4. **Screen 3 — AI Need Analysis & Actuarial Math**:
   > *"On Screen 3, our deterministic engine calculates the exact gap:
   > - First, an unhedged life protection gap of ₹82 Lakhs based on Human Life Value.
   > - Second, an actuarial Annuity Due model that accounts for 6% inflation, 26 years to retirement, and 22 years of post-retirement drawdown at a 7% return, deriving a required corpus of ₹2.07 Crores and an additional monthly SIP of ₹12,189/month.
   > - Notice that every single calculation has a 'Show Math' modal with transparent inputs, formulas, and assumptions. The AI copilot explains the results and provides talking scripts without ever altering the numbers."*

5. **Screen 4 — Shareable Advisor Report**:
   > *"Finally, on Screen 4, the advisor can copy a structured WhatsApp summary, generate a formal client email, download a text dossier, or print a client-facing PDF with one click."*
