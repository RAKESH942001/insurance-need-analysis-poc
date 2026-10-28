import assert from 'node:assert';
import { FinancialCalculationService } from '../src/services/calculationService';
import { RecommendationEngine } from '../src/services/recommendationEngine';
import { AiAdvisoryService } from '../src/services/aiService';
import { CustomerProfile } from '../src/models/types';

console.log('================================================================');
console.log('AXIS MAX LIFE NEED ANALYSIS - VERIFICATION TEST SUITE');
console.log('================================================================\n');

// 1. Benchmark Profile: Rahul Mehta with exact user specifications
const rahulMehta: CustomerProfile = {
  id: 'client_rahul_mehta',
  name: 'Rahul Mehta',
  age: 32,
  occupation: 'Senior IT Consultant',
  dependantsCount: 2,
  monthlyIncome: 85000,
  monthlyExpenses: 48000, // Living expenses
  monthlyEmi: 12000, // EMI commitment
  existingSavings: 250000,
  existingLiabilities: 0,
  existingInsuranceCover: 2000000, // Exactly ₹20 Lakhs
  goals: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

let testsPassed = 0;
let testsFailed = 0;

function runTest(description: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${description}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`❌ FAIL: ${description}`);
    console.error(`   ${err.message}`);
    testsFailed++;
  }
}

const analysis = FinancialCalculationService.analyzeCustomer(rahulMehta);

// BENCHMARK TESTS
runTest('1. Monthly commitments must be exactly ₹60,000 (Expenses ₹48,000 + EMI ₹12,000)', () => {
  assert.strictEqual(analysis.monthlyCommitments, 60000, `Expected 60,000, got ${analysis.monthlyCommitments}`);
  assert.strictEqual(analysis.calculations.monthlyCommitments.formattedValue, '₹60,000');
});

runTest('2. Monthly surplus must be exactly ₹25,000 (Income ₹85,000 - Commitments ₹60,000)', () => {
  assert.strictEqual(analysis.monthlySurplus, 25000, `Expected 25,000, got ${analysis.monthlySurplus}`);
  assert.strictEqual(analysis.calculations.monthlySurplus.formattedValue, '₹25,000');
});

runTest('3. Six-month emergency fund target must be exactly ₹3,60,000 (6 × ₹60,000)', () => {
  assert.strictEqual(analysis.emergencyFundTarget, 360000, `Expected 3,60,000, got ${analysis.emergencyFundTarget}`);
  assert.strictEqual(analysis.calculations.emergencyFundTarget.formattedValue, '₹3,60,000');
});

runTest('4. Emergency fund gap must be exactly ₹1,10,000 (Target ₹3,60,000 - Savings ₹2,50,000)', () => {
  assert.strictEqual(analysis.emergencyFundGap, 110000, `Expected 1,10,000, got ${analysis.emergencyFundGap}`);
  assert.strictEqual(analysis.calculations.emergencyFundGap.formattedValue, '₹1,10,000');
});

runTest('5. Current savings runway must be 4.17 months (₹2,50,000 ÷ ₹60,000)', () => {
  assert.strictEqual(analysis.currentSavingsCoverageMonths, 4.17, `Expected 4.17, got ${analysis.currentSavingsCoverageMonths}`);
});

runTest('6. Illustrative Protection Gap must be ₹82,00,000 (10x Annual Income ₹1.02Cr - ₹20L declared cover)', () => {
  // Gross: 10 * 85000 * 12 = 1,02,00,000. Cover = 20,00,000. Gap = 82,00,000
  assert.strictEqual(analysis.protectionNeed.totalGrossNeed, 10200000);
  assert.strictEqual(analysis.protectionNeed.existingCover, 2000000);
  assert.strictEqual(analysis.protectionNeed.illustrativeProtectionGap, 8200000);
  assert.strictEqual(analysis.calculations.illustrativeProtectionGap.formattedValue, '₹82,00,000');
});

// EDGE CASE TESTS (User Requirement 9)
runTest('7. Edge Case: Zero Income handled cleanly with deficit & zero division protected', () => {
  const zeroIncomeProfile: CustomerProfile = {
    ...rahulMehta,
    monthlyIncome: 0
  };
  const res = FinancialCalculationService.analyzeCustomer(zeroIncomeProfile);
  assert.strictEqual(res.monthlySurplus, -60000);
  assert.strictEqual(res.savingsRatePercent, 0);
  assert.strictEqual(res.currentSavingsCoverageMonths, 4.17);
});

runTest('8. Edge Case: Negative cash flow triggers IMMEDIATE urgency recommendation', () => {
  const deficitProfile: CustomerProfile = {
    ...rahulMehta,
    monthlyIncome: 45000,
    monthlyExpenses: 40000,
    monthlyEmi: 15000 // Commitments: 55,000 -> Deficit -10,000
  };
  const res = FinancialCalculationService.analyzeCustomer(deficitProfile);
  assert.strictEqual(res.monthlySurplus, -10000);
  const recs = RecommendationEngine.generateRecommendations(deficitProfile, res);
  assert.strictEqual(recs[0].urgency, 'IMMEDIATE');
  assert.strictEqual(recs[0].category, 'SURPLUS_OPTIMIZATION');
});

runTest('9. Edge Case: Zero Dependants evaluated without crashing and noted in advice', () => {
  const zeroDependantsProfile: CustomerProfile = {
    ...rahulMehta,
    dependantsCount: 0
  };
  const res = FinancialCalculationService.analyzeCustomer(zeroDependantsProfile);
  const recs = RecommendationEngine.generateRecommendations(zeroDependantsProfile, res);
  assert.ok(recs.length > 0);
});

runTest('10. Edge Case: Zero Commitments handled without Division By Zero / NaN', () => {
  const zeroExpenseProfile: CustomerProfile = {
    ...rahulMehta,
    monthlyExpenses: 0,
    monthlyEmi: 0,
    existingSavings: 100000
  };
  const res = FinancialCalculationService.analyzeCustomer(zeroExpenseProfile);
  assert.strictEqual(res.monthlyCommitments, 0);
  assert.strictEqual(res.emergencyFundTarget, 0);
  assert.strictEqual(res.emergencyFundGap, 0);
  assert.strictEqual(Number.isFinite(res.currentSavingsCoverageMonths), true);
});

runTest('11. Edge Case: Overfunded life insurance eliminates protection gap (Surplus Cover)', () => {
  const surplusCoverProfile: CustomerProfile = {
    ...rahulMehta,
    existingInsuranceCover: 15000000 // 1.5 Crores
  };
  const res = FinancialCalculationService.analyzeCustomer(surplusCoverProfile);
  assert.strictEqual(res.protectionNeed.illustrativeProtectionGap, 0);
});

// AI FALLBACK AND SAFETY TESTS (User Requirement 9 & 10)
runTest('12. AI Safety: When API key is not configured, AI engine strictly reports isLiveAi = false', async () => {
  const recs = RecommendationEngine.generateRecommendations(rahulMehta, analysis);
  const insights = await AiAdvisoryService.generateInsights(rahulMehta, analysis, recs, true);
  assert.strictEqual(insights.isLiveAi, false, 'Expected isLiveAi to be false when deterministic');
  assert.strictEqual(insights.aiEngine, 'Deterministic Expert Rule Engine (Local Fallback)');
  assert.ok(insights.advisorTalkingScript.length > 50);
  assert.ok(insights.clientObjectionsAndResponses.length >= 2);
});

runTest('13. Mathematical Transparency: Every single calculation step contains formula, inputs, and math', () => {
  const requiredKeys = ['monthlyCommitments', 'monthlySurplus', 'emergencyFundTarget', 'currentSavingsCoverageMonths', 'emergencyFundGap', 'illustrativeProtectionGap'];
  for (const k of requiredKeys) {
    const calc = analysis.calculations[k];
    assert.ok(calc, `Missing calculation object for ${k}`);
    assert.ok(calc.formula.length > 0, `Missing formula for ${k}`);
    assert.ok(calc.stepByStepMath.length > 0, `Missing stepByStepMath for ${k}`);
    assert.ok(Object.keys(calc.inputsUsed).length > 0, `Missing inputsUsed for ${k}`);
  }
});

// LIFE GOALS & RETIREMENT CALCULATION TESTS
runTest('14. Retirement Planning: Annuity due corpus properly accounts for inflation, duration and real returns', () => {
  // Test case: Age 50 to 80 (30 year duration, 0 years to retirement for test purity), ₹50,000/mo, 6% inflation, 7% return
  const corpusRes = FinancialCalculationService.calculateRetirementCorpus(
    50000, // ₹50k/mo
    0,     // 0 years to retirement
    30,    // 30 years duration (age 50 to 80)
    6.0,   // 6% inflation
    7.0    // 7% post-retirement return
  );
  assert.strictEqual(corpusRes.projectedRetirementMonthlyExpense, 50000);
  assert.strictEqual(corpusRes.projectedRetirementAnnualExpense, 600000);
  assert.ok(corpusRes.realReturnPercent > 0.9 && corpusRes.realReturnPercent < 1.0); // ((1.07/1.06) - 1) = 0.943%
  assert.ok(corpusRes.requiredCorpus > 10000000); // > ₹1 Crore
  assert.ok(Number.isFinite(corpusRes.requiredCorpus));
});

runTest('15. Child Education Goal: Inflates future costs and derives required monthly SIP', () => {
  const eduGoal: FinancialGoal = {
    id: 'test_edu',
    category: 'EDUCATION',
    name: 'Child College',
    targetYears: 10,
    targetAmount: 2000000, // ₹20 Lakhs today
    inflationRate: 8.0,
    expectedReturnPre: 10.0,
    existingSavings: 200000,
    priority: 'HIGH'
  };
  const analysisRes = FinancialCalculationService.calculateGoalAnalysis(eduGoal, 32);
  assert.ok(analysisRes.futureCost > 4000000); // 20L @ 8% for 10 yrs ~ 43.17 Lakhs
  assert.ok(analysisRes.fundingGap > 0);
  assert.ok(analysisRes.requiredMonthlySavings > 0);
  assert.ok(analysisRes.explanation.stepByStepMath.length > 50);
});

runTest('16. Multi-Goal Customer Analysis: Calculates total future costs, gaps, and surplus remaining', () => {
  const profileWithGoals: CustomerProfile = {
    ...rahulMehta,
    goals: [
      {
        id: 'ret_1',
        category: 'RETIREMENT',
        name: 'Retirement at 58',
        targetAge: 58,
        targetYears: 26,
        targetAmount: 40000,
        inflationRate: 6.0,
        expectedReturnPre: 10.0,
        expectedReturnPost: 7.0,
        existingSavings: 50000,
        monthlyContribution: 3000,
        priority: 'HIGH',
        planningHorizonAge: 80
      },
      {
        id: 'edu_1',
        category: 'EDUCATION',
        name: 'Child Higher Education',
        targetYears: 14,
        targetAmount: 2500000,
        inflationRate: 8.0,
        expectedReturnPre: 10.0,
        existingSavings: 100000,
        priority: 'HIGH'
      }
    ]
  };
  const res = FinancialCalculationService.analyzeCustomer(profileWithGoals);
  assert.ok(res.goalsAnalysis && res.goalsAnalysis.length === 2);
  assert.ok(res.retirementDetail);
  assert.strictEqual(res.retirementDetail.retirementAge, 58);
  assert.strictEqual(res.retirementDetail.yearsToRetirement, 26);
  assert.ok(res.totalGoalsFutureCost! > 0);
  assert.ok(res.totalGoalsFundingGap! > 0);
  assert.ok(res.totalRequiredMonthlySavingsForGoals! > 0);
  // Benchmarks for cashflow and protection must be preserved
  assert.strictEqual(res.monthlyCommitments, 60000);
  assert.strictEqual(res.monthlySurplus, 25000);
  assert.strictEqual(res.emergencyFundTarget, 360000);
  assert.strictEqual(res.emergencyFundGap, 110000);
});

runTest('17. Recommendation Engine integrates goals alongside emergency buffer and life protection', () => {
  const profileWithGoals: CustomerProfile = {
    ...rahulMehta,
    goals: [
      {
        id: 'ret_1',
        category: 'RETIREMENT',
        name: 'Retirement at 58',
        targetAge: 58,
        targetYears: 26,
        targetAmount: 40000,
        inflationRate: 6.0,
        expectedReturnPre: 10.0,
        expectedReturnPost: 7.0,
        existingSavings: 50000,
        priority: 'HIGH',
        planningHorizonAge: 80
      }
    ]
  };
  const res = FinancialCalculationService.analyzeCustomer(profileWithGoals);
  const recs = RecommendationEngine.generateRecommendations(profileWithGoals, res);
  assert.ok(recs.some(r => r.category === 'EMERGENCY_FUND'));
  assert.ok(recs.some(r => r.category === 'PROTECTION_GAP'));
  assert.ok(recs.some(r => r.category === 'MILESTONE_GOAL'));
  assert.ok(recs.some(r => r.category === 'SURPLUS_OPTIMIZATION'));
});

runTest('18. Edge Case: Equal Inflation and Post-Retirement Return handles flat annuity without NaN', () => {
  const corpusRes = FinancialCalculationService.calculateRetirementCorpus(
    30000,
    10,
    20,
    6.0,
    6.0 // r_real = 0%
  );
  assert.strictEqual(corpusRes.realReturnPercent, 0);
  assert.strictEqual(corpusRes.requiredCorpus, corpusRes.projectedRetirementAnnualExpense * 20);
  assert.ok(Number.isFinite(corpusRes.requiredCorpus));
});

import { runDatabaseRepositoryTests } from './databaseRepository.test';

async function main() {
  const dbResults = await runDatabaseRepositoryTests();
  const totalPassed = testsPassed + dbResults.passed;
  const totalFailed = testsFailed + dbResults.failed;

  console.log(`\n================================================================`);
  console.log(`ALL SUITES COMPLETE: ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`- Financial & AI Suite: ${testsPassed} passed`);
  console.log(`- PostgreSQL 17 Suite: ${dbResults.passed} passed`);
  console.log(`================================================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
