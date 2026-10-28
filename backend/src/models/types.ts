export type GoalCategory = 'RETIREMENT' | 'EDUCATION' | 'MARRIAGE' | 'HOME' | 'EMERGENCY' | 'WEALTH' | 'OTHER';

export interface FinancialGoal {
  id: string;
  customerId?: string;
  category: GoalCategory;
  name: string;
  targetAge?: number;
  targetYears: number;
  targetAmount: number; // Normal: estimated cost today. Retirement: desired monthly expenses today
  inflationRate: number; // e.g. 6.0
  expectedReturnPre: number; // e.g. 10.0
  expectedReturnPost?: number; // e.g. 7.0 for retirement
  existingSavings: number;
  monthlyContribution?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  planningHorizonAge?: number; // e.g. 80 for retirement
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  age: number;
  occupation?: string;
  dependantsCount: number;
  monthlyIncome: number;
  monthlyExpenses: number; // Living / household expenses
  monthlyEmi: number; // Monthly loan EMIs / commitments
  existingSavings: number; // Liquid savings, FDs, savings account
  existingLiabilities: number; // Total outstanding debt/liabilities
  existingInsuranceCover: number; // Existing life insurance sum assured
  goals: FinancialGoal[];
  primaryGoal?: string;
  goalTimeline?: number;
  riskAppetite?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationStepExplanation {
  field: string;
  label: string;
  value: number;
  formattedValue: string;
  formula: string;
  inputsUsed: Record<string, number | string>;
  stepByStepMath: string;
  notesAndAssumptions: string;
}

export interface ProtectionNeedComponents {
  incomeReplacementMultiplier: number;
  incomeReplacementAmount: number;
  liabilitiesCoverAmount: number;
  milestoneGoalsAmount: number;
  totalGrossNeed: number;
  existingCover: number;
  illustrativeProtectionGap: number;
  methodology: string;
  assumptions: string[];
}

export interface CalculatedGoalAnalysis {
  goalId: string;
  category: GoalCategory;
  name: string;
  targetYears: number;
  targetAge?: number;
  todaysCost: number;
  futureCost: number;
  existingSavingsFutureValue: number;
  existingContributionsFutureValue: number;
  totalProjectedAccumulation: number;
  fundingGap: number;
  fundedPercentage: number;
  requiredMonthlySavings: number;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityRank: number;
  assumptions: {
    inflationRate: number;
    expectedReturnPre: number;
    expectedReturnPost?: number;
    planningHorizonAge?: number;
    retirementDurationYears?: number;
  };
  explanation: CalculationStepExplanation;
}

export interface RetirementAnalysisDetail {
  currentAge: number;
  retirementAge: number;
  yearsToRetirement: number;
  planningHorizonAge: number;
  retirementDurationYears: number;
  todaysMonthlyExpenses: number;
  todaysAnnualExpenses: number;
  projectedRetirementMonthlyExpense: number;
  projectedRetirementAnnualExpense: number;
  inflationRatePercent: number;
  preRetirementReturnPercent: number;
  postRetirementReturnPercent: number;
  realReturnPercent: number;
  requiredCorpusAtRetirement: number;
  existingSavingsFutureValue: number;
  existingMonthlyContributionsFutureValue: number;
  totalProjectedCorpus: number;
  corpusGap: number;
  fundedPercentage: number;
  additionalMonthlyContributionNeeded: number;
  formulaDescription: string;
  stepByStepMath: string;
}

export interface FinancialAnalysis {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmi: number;
  monthlyCommitments: number; // monthlyExpenses + monthlyEmi
  monthlySurplus: number;
  annualIncome: number;
  annualCommitments: number;
  annualSurplus: number;
  savingsRatePercent: number; // (surplus / income) * 100
  emergencyFundTargetMonths: number;
  emergencyFundTarget: number;
  currentSavings: number;
  emergencyFundGap: number;
  currentSavingsCoverageMonths: number;
  protectionNeed: ProtectionNeedComponents;
  debtToIncomeRatioPercent: number;
  financialHealthScore: number; // 0 - 100
  financialHealthRating: 'CRITICAL' | 'NEEDS_ATTENTION' | 'MODERATE' | 'HEALTHY' | 'EXCELLENT';
  goalsAnalysis?: CalculatedGoalAnalysis[];
  retirementDetail?: RetirementAnalysisDetail;
  totalGoalsFutureCost?: number;
  totalGoalsFundingGap?: number;
  totalRequiredMonthlySavingsForGoals?: number;
  surplusAvailableAfterGoals?: number;
  calculations: Record<string, CalculationStepExplanation>;
  calculatedAt: string;
}

export type UrgencyLevel = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ActionRecommendation {
  id: string;
  urgency: UrgencyLevel;
  priorityRank: number;
  category: 'EMERGENCY_FUND' | 'PROTECTION_GAP' | 'DEBT_MANAGEMENT' | 'MILESTONE_GOAL' | 'SURPLUS_OPTIMIZATION';
  title: string;
  metricLabel: string;
  metricValue: string;
  currentState: string;
  recommendedAction: string;
  reasonWhy: string;
  exactCalculation: string;
  nextSteps: string[];
  disclaimer: string;
}

export interface AiAdvisoryInsight {
  isLiveAi: boolean;
  aiEngine: string;
  generatedAt: string;
  executiveSummary: string;
  advisorTalkingScript: string;
  keyDiscussionPoints: string[];
  clientObjectionsAndResponses: Array<{
    objection: string;
    suggestedResponse: string;
  }>;
  complianceSuitabilityNotice: string;
}

export interface AnalysisResultResponse {
  customer: CustomerProfile;
  analysis: FinancialAnalysis;
  recommendations: ActionRecommendation[];
  aiInsights: AiAdvisoryInsight;
}
