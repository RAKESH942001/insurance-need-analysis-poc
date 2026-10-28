import { FinancialCalculationService } from '../src/services/calculationService';
import { RecommendationEngine } from '../src/services/recommendationEngine';
import { CustomerProfile } from '../src/models/types';

describe('FinancialCalculationService & RecommendationEngine', () => {
  const rahulMehta: CustomerProfile = {
    id: 'client_rahul_mehta',
    name: 'Rahul Mehta',
    age: 32,
    occupation: 'Senior IT Consultant',
    dependantsCount: 2,
    monthlyIncome: 85000,
    monthlyExpenses: 60000,
    existingSavings: 250000,
    existingLiabilities: 1600000,
    existingInsuranceCover: 5000000,
    goals: [
      {
        id: 'goal_education',
        name: 'Child Higher Education Fund',
        targetAmount: 1000000,
        targetYears: 15,
        priority: 'HIGH',
        category: 'EDUCATION'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  test('Benchmark Test 1: Rahul Mehta Monthly Surplus must be exactly ₹25,000', () => {
    const analysis = FinancialCalculationService.analyzeCustomer(rahulMehta);
    expect(analysis.monthlySurplus).toBe(25000);
    expect(analysis.calculations.monthlySurplus.formattedValue).toBe('₹25,000');
  });

  test('Benchmark Test 2: Six-month emergency fund target must be exactly ₹3,60,000', () => {
    const analysis = FinancialCalculationService.analyzeCustomer(rahulMehta);
    expect(analysis.emergencyFundTarget).toBe(360000);
    expect(analysis.calculations.emergencyFundTarget.formattedValue).toBe('₹3,60,000');
  });

  test('Benchmark Test 3: Emergency fund gap must be exactly ₹1,10,000', () => {
    const analysis = FinancialCalculationService.analyzeCustomer(rahulMehta);
    expect(analysis.emergencyFundGap).toBe(110000);
    expect(analysis.calculations.emergencyFundGap.formattedValue).toBe('₹1,10,000');
  });

  test('Benchmark Test 4: Current savings coverage must be approximately 4.17 months', () => {
    const analysis = FinancialCalculationService.analyzeCustomer(rahulMehta);
    expect(analysis.currentSavingsCoverageMonths).toBe(4.17);
  });

  test('Benchmark Test 5: Illustrative protection gap must be exactly ₹78,00,000', () => {
    const analysis = FinancialCalculationService.analyzeCustomer(rahulMehta);
    // Gross: (10 * 85000 * 12 = 1,02,00,000) + 16,00,000 + 10,00,000 = 1,28,00,000
    // Net: 1,28,00,000 - 50,00,000 = 78,00,000
    expect(analysis.protectionNeed.totalGrossNeed).toBe(12800000);
    expect(analysis.protectionNeed.illustrativeProtectionGap).toBe(7800000);
    expect(analysis.calculations.illustrativeProtectionGap.formattedValue).toBe('₹78,00,000');
  });

  test('Edge Case 1: Negative Surplus / Deficit Cashflow', () => {
    const deficitProfile: CustomerProfile = {
      ...rahulMehta,
      monthlyIncome: 50000,
      monthlyExpenses: 65000
    };
    const analysis = FinancialCalculationService.analyzeCustomer(deficitProfile);
    expect(analysis.monthlySurplus).toBe(-15000);
    expect(analysis.financialHealthRating).toMatch(/CRITICAL|NEEDS_ATTENTION/);

    const recs = RecommendationEngine.generateRecommendations(deficitProfile, analysis);
    expect(recs[0].category).toBe('SURPLUS_OPTIMIZATION');
    expect(recs[0].urgency).toBe('IMMEDIATE');
    expect(recs[0].title).toContain('Cashflow Deficit');
  });

  test('Edge Case 2: Zero Expenses handled without division by zero', () => {
    const zeroExpenseProfile: CustomerProfile = {
      ...rahulMehta,
      monthlyExpenses: 0,
      existingSavings: 50000
    };
    const analysis = FinancialCalculationService.analyzeCustomer(zeroExpenseProfile);
    expect(analysis.emergencyFundTarget).toBe(0);
    expect(analysis.emergencyFundGap).toBe(0);
    expect(isFinite(analysis.currentSavingsCoverageMonths)).toBe(true);
  });

  test('Edge Case 3: Overfunded Insurance Cover should yield zero protection gap', () => {
    const highCoverProfile: CustomerProfile = {
      ...rahulMehta,
      existingInsuranceCover: 20000000 // 2 Crores
    };
    const analysis = FinancialCalculationService.analyzeCustomer(highCoverProfile);
    expect(analysis.protectionNeed.illustrativeProtectionGap).toBe(0);
  });

  test('Edge Case 4: Overfunded Liquid Savings should yield zero emergency gap', () => {
    const highSavingsProfile: CustomerProfile = {
      ...rahulMehta,
      existingSavings: 500000 // > 3,60,000 target
    };
    const analysis = FinancialCalculationService.analyzeCustomer(highSavingsProfile);
    expect(analysis.emergencyFundGap).toBe(0);
    expect(analysis.currentSavingsCoverageMonths).toBe(8.33);
  });
});

