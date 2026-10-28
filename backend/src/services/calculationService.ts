import {
  CustomerProfile,
  FinancialAnalysis,
  ProtectionNeedComponents,
  CalculationStepExplanation,
  FinancialGoal,
  CalculatedGoalAnalysis,
  RetirementAnalysisDetail
} from '../models/types';

export class FinancialCalculationService {
  /**
   * Format currency in Indian Numbering System (Lakhs & Crores)
   * e.g. 8200000 -> "₹82,00,000"
   */
  public static formatINR(amount: number): string {
    if (isNaN(amount)) return '₹0';
    const isNegative = amount < 0;
    const absVal = Math.round(Math.abs(amount));
    const str = absVal.toString();
    
    let lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `${isNegative ? '-' : ''}₹${formatted}`;
  }

  /**
   * Compounded Future Value: PV * (1 + r)^N
   */
  public static calculateFutureValue(presentValue: number, annualRatePercent: number, years: number): number {
    if (years <= 0 || presentValue <= 0) return Math.max(0, presentValue);
    const rate = annualRatePercent / 100;
    return Math.round(presentValue * Math.pow(1 + rate, years));
  }

  /**
   * Future Value of Monthly SIP (Annuity Due / beginning of month)
   */
  public static calculateSIPFutureValue(monthlyAmount: number, annualRatePercent: number, years: number): number {
    if (monthlyAmount <= 0 || years <= 0) return 0;
    const months = years * 12;
    const monthlyRate = Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
    if (monthlyRate <= 0.00001) return monthlyAmount * months;
    const fv = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    return Math.round(fv);
  }

  /**
   * Required Monthly SIP to accumulate target amount over N years (Annuity Due)
   */
  public static calculateRequiredMonthlySIP(targetGap: number, annualRatePercent: number, years: number): number {
    if (targetGap <= 0 || years <= 0) return 0;
    const months = years * 12;
    const monthlyRate = Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
    if (monthlyRate <= 0.00001) return Math.round(targetGap / months);
    const sip = (targetGap * monthlyRate) / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));
    return Math.round(sip);
  }

  /**
   * Actuarial Annuity Due formula for Retirement Corpus
   */
  public static calculateRetirementCorpus(
    todaysMonthlyExpense: number,
    yearsToRetirement: number,
    retirementDurationYears: number,
    inflationRatePercent: number,
    postRetirementReturnPercent: number
  ): {
    projectedRetirementMonthlyExpense: number;
    projectedRetirementAnnualExpense: number;
    realReturnPercent: number;
    requiredCorpus: number;
  } {
    const infRate = inflationRatePercent / 100;
    const postReturn = postRetirementReturnPercent / 100;
    
    // Monthly & Annual living expense inflated to retirement age
    const projectedRetirementMonthlyExpense = Math.round(todaysMonthlyExpense * Math.pow(1 + infRate, yearsToRetirement));
    const projectedRetirementAnnualExpense = projectedRetirementMonthlyExpense * 12;

    // Real rate of return adjusted for inflation during retirement
    // r_real = (1 + postReturn) / (1 + infRate) - 1
    const realReturn = (1 + postReturn) / (1 + infRate) - 1;
    const realReturnPercent = Number((realReturn * 100).toFixed(2));

    let requiredCorpus: number;
    if (Math.abs(realReturn) < 0.0001) {
      requiredCorpus = projectedRetirementAnnualExpense * retirementDurationYears;
    } else {
      // Annuity Due factor: [1 - (1 + r)^(-M)] / r * (1 + r)
      const discountFactor = (1 - Math.pow(1 + realReturn, -retirementDurationYears)) / realReturn;
      requiredCorpus = Math.round(projectedRetirementAnnualExpense * discountFactor * (1 + realReturn));
    }

    return {
      projectedRetirementMonthlyExpense,
      projectedRetirementAnnualExpense,
      realReturnPercent,
      requiredCorpus: Math.max(0, requiredCorpus)
    };
  }

  /**
   * Calculates individual goal funding metrics and step-by-step math
   */
  public static calculateGoalAnalysis(goal: FinancialGoal, customerAge: number): CalculatedGoalAnalysis {
    const isRetirement = goal.category === 'RETIREMENT';
    const currentAge = Math.max(18, customerAge || 30);
    const targetAge = goal.targetAge || (isRetirement ? 60 : currentAge + (goal.targetYears || 5));
    const targetYears = Math.max(1, goal.targetYears || (targetAge - currentAge));
    const inflationRate = goal.inflationRate !== undefined ? Number(goal.inflationRate) : 6.0;
    const expectedReturnPre = goal.expectedReturnPre !== undefined ? Number(goal.expectedReturnPre) : 10.0;
    const expectedReturnPost = goal.expectedReturnPost !== undefined ? Number(goal.expectedReturnPost) : 7.0;
    const planningHorizonAge = goal.planningHorizonAge || 80;
    const retirementDurationYears = Math.max(1, planningHorizonAge - targetAge);

    const todaysCost = Math.max(0, Number(goal.targetAmount) || 0);
    const existingSavings = Math.max(0, Number(goal.existingSavings) || 0);
    const monthlyContribution = Math.max(0, Number(goal.monthlyContribution) || 0);

    let futureCost = 0;
    let explanationMath = '';
    let formulaDesc = '';

    if (isRetirement) {
      const corpusResult = this.calculateRetirementCorpus(
        todaysCost,
        targetYears,
        retirementDurationYears,
        inflationRate,
        expectedReturnPost
      );
      futureCost = corpusResult.requiredCorpus;
      formulaDesc = `Retirement Annuity Due PV of ${this.formatINR(corpusResult.projectedRetirementAnnualExpense)}/yr for ${retirementDurationYears} yrs at real return ${corpusResult.realReturnPercent}%`;
      explanationMath = `Current Expense: ${this.formatINR(todaysCost)}/mo -> Inflated Expense at Age ${targetAge} (${targetYears} yrs @ ${inflationRate}%): ${this.formatINR(corpusResult.projectedRetirementMonthlyExpense)}/mo (${this.formatINR(corpusResult.projectedRetirementAnnualExpense)}/yr).\nRetirement Duration: ${retirementDurationYears} yrs (Age ${targetAge} to ${planningHorizonAge}).\nReal Return: ${corpusResult.realReturnPercent}%. Required Corpus: ${this.formatINR(futureCost)}.`;
    } else {
      futureCost = this.calculateFutureValue(todaysCost, inflationRate, targetYears);
      formulaDesc = `Today's Cost × (1 + Inflation Rate)^Years (${todaysCost} × (1 + ${inflationRate}%)^${targetYears})`;
      explanationMath = `Today's Estimated Cost: ${this.formatINR(todaysCost)} compounded at ${inflationRate}% annual inflation over ${targetYears} years = ${this.formatINR(futureCost)}.`;
    }

    const existingSavingsFutureValue = this.calculateFutureValue(existingSavings, expectedReturnPre, targetYears);
    const existingContributionsFutureValue = this.calculateSIPFutureValue(monthlyContribution, expectedReturnPre, targetYears);
    const totalProjectedAccumulation = existingSavingsFutureValue + existingContributionsFutureValue;
    const fundingGap = Math.max(0, futureCost - totalProjectedAccumulation);
    const fundedPercentage = futureCost > 0
      ? Math.min(100, Number(((totalProjectedAccumulation / futureCost) * 100).toFixed(1)))
      : 100;

    const requiredMonthlySavings = this.calculateRequiredMonthlySIP(fundingGap, expectedReturnPre, targetYears);

    // Urgency determination
    let urgency: CalculatedGoalAnalysis['urgency'] = 'MEDIUM';
    if (fundedPercentage < 40 && targetYears <= 5) urgency = 'IMMEDIATE';
    else if (fundedPercentage < 60 && targetYears <= 10) urgency = 'HIGH';
    else if (fundedPercentage < 80) urgency = 'MEDIUM';
    else urgency = 'LOW';

    let priorityRank = 3;
    if (urgency === 'IMMEDIATE') priorityRank = 1;
    else if (urgency === 'HIGH') priorityRank = 2;
    else if (urgency === 'MEDIUM') priorityRank = 3;
    else priorityRank = 4;

    const explanation: CalculationStepExplanation = {
      field: `goal_${goal.id}`,
      label: goal.name,
      value: fundingGap,
      formattedValue: this.formatINR(fundingGap),
      formula: formulaDesc,
      inputsUsed: {
        todaysCost: this.formatINR(todaysCost),
        targetYears,
        inflationRate: `${inflationRate}%`,
        expectedReturnPre: `${expectedReturnPre}%`,
        existingSavings: this.formatINR(existingSavings),
        monthlyContribution: this.formatINR(monthlyContribution),
        futureCost: this.formatINR(futureCost),
        totalAccumulated: this.formatINR(totalProjectedAccumulation)
      },
      stepByStepMath: `${explanationMath}\nExisting Corpus Compounded: ${this.formatINR(existingSavings)} @ ${expectedReturnPre}% = ${this.formatINR(existingSavingsFutureValue)}.\nOngoing SIP Compounded: ${this.formatINR(monthlyContribution)}/mo @ ${expectedReturnPre}% = ${this.formatINR(existingContributionsFutureValue)}.\nNet Goal Shortfall: ${this.formatINR(futureCost)} - ${this.formatINR(totalProjectedAccumulation)} = ${this.formatINR(fundingGap)}.\nRequired New Monthly SIP: ${this.formatINR(requiredMonthlySavings)}/mo.`,
      notesAndAssumptions: `Assumes pre-event return of ${expectedReturnPre}% p.a. and inflation rate of ${inflationRate}% p.a. Projections are illustrative.`
    };

    return {
      goalId: goal.id,
      category: goal.category,
      name: goal.name,
      targetYears,
      targetAge,
      todaysCost,
      futureCost,
      existingSavingsFutureValue,
      existingContributionsFutureValue,
      totalProjectedAccumulation,
      fundingGap,
      fundedPercentage,
      requiredMonthlySavings,
      urgency,
      priorityRank,
      assumptions: {
        inflationRate,
        expectedReturnPre,
        expectedReturnPost: isRetirement ? expectedReturnPost : undefined,
        planningHorizonAge: isRetirement ? planningHorizonAge : undefined,
        retirementDurationYears: isRetirement ? retirementDurationYears : undefined
      },
      explanation
    };
  }

  /**
   * Builds detailed retirement planning report object
   */
  public static calculateRetirementDetail(retirementGoal: FinancialGoal, customerAge: number): RetirementAnalysisDetail {
    const currentAge = Math.max(18, customerAge || 30);
    const retirementAge = retirementGoal.targetAge || 60;
    const yearsToRetirement = Math.max(1, retirementGoal.targetYears || (retirementAge - currentAge));
    const planningHorizonAge = retirementGoal.planningHorizonAge || 80;
    const retirementDurationYears = Math.max(1, planningHorizonAge - retirementAge);
    const todaysMonthlyExpenses = Math.max(0, Number(retirementGoal.targetAmount) || 40000);
    const todaysAnnualExpenses = todaysMonthlyExpenses * 12;
    const inflationRatePercent = retirementGoal.inflationRate !== undefined ? Number(retirementGoal.inflationRate) : 6.0;
    const preRetirementReturnPercent = retirementGoal.expectedReturnPre !== undefined ? Number(retirementGoal.expectedReturnPre) : 10.0;
    const postRetirementReturnPercent = retirementGoal.expectedReturnPost !== undefined ? Number(retirementGoal.expectedReturnPost) : 7.0;

    const corpusResult = this.calculateRetirementCorpus(
      todaysMonthlyExpenses,
      yearsToRetirement,
      retirementDurationYears,
      inflationRatePercent,
      postRetirementReturnPercent
    );

    const existingSavings = Math.max(0, Number(retirementGoal.existingSavings) || 0);
    const monthlyContribution = Math.max(0, Number(retirementGoal.monthlyContribution) || 0);

    const existingSavingsFutureValue = this.calculateFutureValue(existingSavings, preRetirementReturnPercent, yearsToRetirement);
    const existingMonthlyContributionsFutureValue = this.calculateSIPFutureValue(monthlyContribution, preRetirementReturnPercent, yearsToRetirement);
    const totalProjectedCorpus = existingSavingsFutureValue + existingMonthlyContributionsFutureValue;
    const corpusGap = Math.max(0, corpusResult.requiredCorpus - totalProjectedCorpus);
    const fundedPercentage = corpusResult.requiredCorpus > 0
      ? Math.min(100, Number(((totalProjectedCorpus / corpusResult.requiredCorpus) * 100).toFixed(1)))
      : 100;
    const additionalMonthlyContributionNeeded = this.calculateRequiredMonthlySIP(corpusGap, preRetirementReturnPercent, yearsToRetirement);

    const formulaDescription = `Annuity Due PV of inflated expenses (${this.formatINR(corpusResult.projectedRetirementAnnualExpense)}/yr) discounted at real return ${corpusResult.realReturnPercent}% for ${retirementDurationYears} years`;
    const stepByStepMath = `1. Monthly Living Expense Today: ${this.formatINR(todaysMonthlyExpenses)}\n2. Inflated Monthly Expense at Age ${retirementAge} (${yearsToRetirement} yrs @ ${inflationRatePercent}%): ${this.formatINR(corpusResult.projectedRetirementMonthlyExpense)} (${this.formatINR(corpusResult.projectedRetirementAnnualExpense)}/yr)\n3. Real Rate of Return: ((1 + ${postRetirementReturnPercent}%) / (1 + ${inflationRatePercent}%)) - 1 = ${corpusResult.realReturnPercent}%\n4. Target Retirement Corpus Needed: ${this.formatINR(corpusResult.requiredCorpus)}\n5. Projected Value of Current Retirement Savings: ${this.formatINR(existingSavingsFutureValue)}\n6. Projected Value of Existing Contributions: ${this.formatINR(existingMonthlyContributionsFutureValue)}\n7. Total Projected Corpus: ${this.formatINR(totalProjectedCorpus)} (${fundedPercentage}% funded)\n8. Net Retirement Corpus Shortfall: ${this.formatINR(corpusGap)}\n9. Additional Monthly Contribution Required: ${this.formatINR(additionalMonthlyContributionNeeded)}/month`;

    return {
      currentAge,
      retirementAge,
      yearsToRetirement,
      planningHorizonAge,
      retirementDurationYears,
      todaysMonthlyExpenses,
      todaysAnnualExpenses,
      projectedRetirementMonthlyExpense: corpusResult.projectedRetirementMonthlyExpense,
      projectedRetirementAnnualExpense: corpusResult.projectedRetirementAnnualExpense,
      inflationRatePercent,
      preRetirementReturnPercent,
      postRetirementReturnPercent,
      realReturnPercent: corpusResult.realReturnPercent,
      requiredCorpusAtRetirement: corpusResult.requiredCorpus,
      existingSavingsFutureValue,
      existingMonthlyContributionsFutureValue,
      totalProjectedCorpus,
      corpusGap,
      fundedPercentage,
      additionalMonthlyContributionNeeded,
      formulaDescription,
      stepByStepMath
    };
  }

  /**
   * Performs transparent, deterministic financial need analysis.
   * Derives all figures from customer inputs without hardcoding.
   */
  public static analyzeCustomer(profile: CustomerProfile): FinancialAnalysis {
    const monthlyIncome = Math.max(0, Number(profile.monthlyIncome) || 0);
    const monthlyExpenses = Math.max(0, Number(profile.monthlyExpenses) || 0);
    const monthlyEmi = Math.max(0, Number(profile.monthlyEmi) || 0);
    const currentSavings = Math.max(0, Number(profile.existingSavings) || 0);
    const existingLiabilities = Math.max(0, Number(profile.existingLiabilities) || 0);
    const existingInsuranceCover = Math.max(0, Number(profile.existingInsuranceCover) || 0);
    const dependantsCount = Math.max(0, Number(profile.dependantsCount) || 0);
    const age = Math.max(18, Number(profile.age) || 30);

    // 1. Monthly Commitments and Surplus
    const monthlyCommitments = monthlyExpenses + monthlyEmi;
    const monthlySurplus = monthlyIncome - monthlyCommitments;
    const annualIncome = monthlyIncome * 12;
    const annualCommitments = monthlyCommitments * 12;
    const annualSurplus = monthlySurplus * 12;

    const savingsRatePercent = monthlyIncome > 0
      ? Number(((monthlySurplus / monthlyIncome) * 100).toFixed(1))
      : 0;

    // 2. Emergency Fund Calculation (6 months of total commitments: expenses + EMIs)
    const emergencyFundTargetMonths = 6;
    const emergencyFundTarget = monthlyCommitments * emergencyFundTargetMonths;
    const emergencyFundGap = Math.max(0, emergencyFundTarget - currentSavings);
    
    // Savings coverage runway in months (safe guard against divide by zero)
    const currentSavingsCoverageMonths = monthlyCommitments > 0
      ? Number((currentSavings / monthlyCommitments).toFixed(2))
      : currentSavings > 0 ? 99 : 0;

    // 3. Illustrative Protection Gap (Human Life Value + Liabilities Method)
    // Multiplier guideline based on age: <= 45 -> 10x; 46-55 -> 7x; 56+ -> 5x
    const incomeReplacementMultiplier = age <= 45 ? 10 : (age <= 55 ? 7 : 5);
    const incomeReplacementAmount = annualIncome * incomeReplacementMultiplier;
    const liabilitiesCoverAmount = existingLiabilities;

    // Sum of only explicitly declared milestone goals flagged for term cover addition
    const milestoneGoalsAmount = (profile.goals || []).reduce((acc, goal) => {
      return acc + (goal.metadata?.includeInTermCover ? (Number(goal.targetAmount) || 0) : 0);
    }, 0);

    const totalGrossNeed = incomeReplacementAmount + liabilitiesCoverAmount + milestoneGoalsAmount;
    const illustrativeProtectionGap = Math.max(0, totalGrossNeed - existingInsuranceCover);

    const protectionNeed: ProtectionNeedComponents = {
      incomeReplacementMultiplier,
      incomeReplacementAmount,
      liabilitiesCoverAmount,
      milestoneGoalsAmount,
      totalGrossNeed,
      existingCover: existingInsuranceCover,
      illustrativeProtectionGap,
      methodology: `Human Life Value (HLV) Method: (${incomeReplacementMultiplier}x Annual Income) + Declared Liabilities + Declared Goals - Declared Cover`,
      assumptions: [
        `Income Replacement Multiplier: ${incomeReplacementMultiplier}x annual earnings based on customer age (${age}) to replace earnings for ${dependantsCount} dependant(s).`,
        existingLiabilities > 0
          ? `Outstanding declared liabilities of ${this.formatINR(existingLiabilities)} included to insulate family from debt claims.`
          : `Zero additional outstanding liabilities declared by customer.`,
        milestoneGoalsAmount > 0
          ? `Customer-declared goals totaling ${this.formatINR(milestoneGoalsAmount)} factored into capital requirement.`
          : `No additional future milestone goals declared by customer.`,
        `Declared existing life insurance cover of ${this.formatINR(existingInsuranceCover)} credited against gross protection need.`,
        `Illustrative financial planning guideline only; formal policy underwriting is subject to insurer guidelines and medical assessment.`
      ]
    };

    // 4. Debt-to-Income Ratio
    const debtToIncomeRatioPercent = annualIncome > 0
      ? Number((((monthlyEmi * 12 + existingLiabilities) / annualIncome) * 100).toFixed(1))
      : 0;

    // 5. Goals & Retirement Analysis
    const goals = profile.goals || [];
    const goalsAnalysis: CalculatedGoalAnalysis[] = goals.map(g => this.calculateGoalAnalysis(g, age));

    const retirementGoal = goals.find(g => g.category === 'RETIREMENT');
    const retirementDetail = retirementGoal ? this.calculateRetirementDetail(retirementGoal, age) : undefined;

    const totalGoalsFutureCost = goalsAnalysis.reduce((sum, g) => sum + g.futureCost, 0);
    const totalGoalsFundingGap = goalsAnalysis.reduce((sum, g) => sum + g.fundingGap, 0);
    const totalRequiredMonthlySavingsForGoals = goalsAnalysis.reduce((sum, g) => sum + g.requiredMonthlySavings, 0);
    const surplusAvailableAfterGoals = monthlySurplus - totalRequiredMonthlySavingsForGoals;

    // 6. Financial Health Scoring (0 - 100)
    let score = 50; // baseline
    if (monthlySurplus > 0) {
      if (savingsRatePercent >= 30) score += 30;
      else if (savingsRatePercent >= 20) score += 20;
      else score += 10;
    } else {
      score -= 25; // deficit penalty
    }

    if (currentSavingsCoverageMonths >= 6) score += 25;
    else if (currentSavingsCoverageMonths >= 3) score += 15;
    else score += 5;

    if (totalGrossNeed > 0) {
      const protectionRatio = existingInsuranceCover / totalGrossNeed;
      if (protectionRatio >= 0.8) score += 25;
      else if (protectionRatio >= 0.4) score += 15;
      else score += 5;
    } else {
      score += 25;
    }

    if (existingLiabilities === 0 && monthlyEmi === 0) score += 20;
    else if (monthlyIncome > 0 && (monthlyEmi / monthlyIncome) < 0.3) score += 10;
    else score -= 10;

    // Bonus/penalty based on goals funding
    if (goalsAnalysis.length > 0) {
      const avgFunding = goalsAnalysis.reduce((sum, g) => sum + g.fundedPercentage, 0) / goalsAnalysis.length;
      if (avgFunding >= 75) score += 10;
      else if (avgFunding < 30) score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    let financialHealthRating: FinancialAnalysis['financialHealthRating'] = 'MODERATE';
    if (score >= 80) financialHealthRating = 'EXCELLENT';
    else if (score >= 65) financialHealthRating = 'HEALTHY';
    else if (score >= 45) financialHealthRating = 'MODERATE';
    else if (score >= 25) financialHealthRating = 'NEEDS_ATTENTION';
    else financialHealthRating = 'CRITICAL';

    // 7. Explicit step-by-step explanations for mathematical transparency
    const calculations: Record<string, CalculationStepExplanation> = {
      monthlyCommitments: {
        field: 'monthlyCommitments',
        label: 'Monthly Total Commitments',
        value: monthlyCommitments,
        formattedValue: this.formatINR(monthlyCommitments),
        formula: 'Monthly Living Expenses + Monthly EMIs',
        inputsUsed: {
          monthlyExpenses: this.formatINR(monthlyExpenses),
          monthlyEmi: this.formatINR(monthlyEmi)
        },
        stepByStepMath: `${this.formatINR(monthlyExpenses)} (Expenses) + ${this.formatINR(monthlyEmi)} (EMIs) = ${this.formatINR(monthlyCommitments)}`,
        notesAndAssumptions: 'Total fixed monthly outflows required to sustain household living standards and service ongoing debt commitments.'
      },
      monthlySurplus: {
        field: 'monthlySurplus',
        label: 'Monthly Net Surplus',
        value: monthlySurplus,
        formattedValue: this.formatINR(monthlySurplus),
        formula: 'Monthly Income - Monthly Total Commitments',
        inputsUsed: {
          monthlyIncome: this.formatINR(monthlyIncome),
          monthlyCommitments: this.formatINR(monthlyCommitments)
        },
        stepByStepMath: `${this.formatINR(monthlyIncome)} (Income) - ${this.formatINR(monthlyCommitments)} (Commitments) = ${this.formatINR(monthlySurplus)}`,
        notesAndAssumptions: monthlySurplus >= 0
          ? `Positive monthly investable surplus of ${this.formatINR(monthlySurplus)} available for emergency reserves and life goals.`
          : `Deficit of ${this.formatINR(Math.abs(monthlySurplus))} per month. Immediate expense rationalization required.`
      },
      emergencyFundTarget: {
        field: 'emergencyFundTarget',
        label: '6-Month Emergency Fund Target',
        value: emergencyFundTarget,
        formattedValue: this.formatINR(emergencyFundTarget),
        formula: 'Monthly Total Commitments × 6 Months',
        inputsUsed: {
          monthlyCommitments: this.formatINR(monthlyCommitments),
          emergencyFundTargetMonths
        },
        stepByStepMath: `${this.formatINR(monthlyCommitments)} × ${emergencyFundTargetMonths} months = ${this.formatINR(emergencyFundTarget)}`,
        notesAndAssumptions: 'Standard financial planning norm: 6 months of mandatory living commitments held in liquid instruments.'
      },
      currentSavingsCoverageMonths: {
        field: 'currentSavingsCoverageMonths',
        label: 'Savings Coverage Runway',
        value: currentSavingsCoverageMonths,
        formattedValue: `${currentSavingsCoverageMonths} Months`,
        formula: 'Current Liquid Savings / Monthly Total Commitments',
        inputsUsed: {
          currentSavings: this.formatINR(currentSavings),
          monthlyCommitments: this.formatINR(monthlyCommitments)
        },
        stepByStepMath: `${this.formatINR(currentSavings)} ÷ ${this.formatINR(monthlyCommitments)} = ${currentSavingsCoverageMonths} Months`,
        notesAndAssumptions: currentSavingsCoverageMonths >= 6
          ? 'Emergency buffer is fully funded.'
          : `Client has ${currentSavingsCoverageMonths} months of expense buffer, which is ${(6 - currentSavingsCoverageMonths).toFixed(2)} months below the 6-month safety benchmark.`
      },
      emergencyFundGap: {
        field: 'emergencyFundGap',
        label: 'Emergency Fund Shortfall',
        value: emergencyFundGap,
        formattedValue: this.formatINR(emergencyFundGap),
        formula: 'Max(0, 6-Month Emergency Target - Current Liquid Savings)',
        inputsUsed: {
          emergencyFundTarget: this.formatINR(emergencyFundTarget),
          currentSavings: this.formatINR(currentSavings)
        },
        stepByStepMath: `${this.formatINR(emergencyFundTarget)} - ${this.formatINR(currentSavings)} = ${this.formatINR(emergencyFundGap)}`,
        notesAndAssumptions: emergencyFundGap > 0
          ? `A capital shortfall of ${this.formatINR(emergencyFundGap)} exists before the client attains full financial safety.`
          : 'Zero shortfall. Liquid buffer is fully capitalized.'
      },
      illustrativeProtectionGap: {
        field: 'illustrativeProtectionGap',
        label: 'Illustrative Life Protection Gap',
        value: illustrativeProtectionGap,
        formattedValue: this.formatINR(illustrativeProtectionGap),
        formula: 'Total Gross Need - Existing Life Insurance Cover',
        inputsUsed: {
          annualIncome: this.formatINR(annualIncome),
          incomeReplacementMultiplier: `${incomeReplacementMultiplier}x`,
          incomeReplacementAmount: this.formatINR(incomeReplacementAmount),
          liabilitiesCoverAmount: this.formatINR(liabilitiesCoverAmount),
          milestoneGoalsAmount: this.formatINR(milestoneGoalsAmount),
          totalGrossNeed: this.formatINR(totalGrossNeed),
          existingInsuranceCover: this.formatINR(existingInsuranceCover)
        },
        stepByStepMath: `Step 1 (Income Replacement): ${this.formatINR(annualIncome)} × ${incomeReplacementMultiplier} = ${this.formatINR(incomeReplacementAmount)}\nStep 2 (Liabilities): ${this.formatINR(liabilitiesCoverAmount)}\nStep 3 (Declared Goals): ${this.formatINR(milestoneGoalsAmount)}\nStep 4 (Total Gross Need): ${this.formatINR(incomeReplacementAmount)} + ${this.formatINR(liabilitiesCoverAmount)} + ${this.formatINR(milestoneGoalsAmount)} = ${this.formatINR(totalGrossNeed)}\nStep 5 (Net Protection Gap): ${this.formatINR(totalGrossNeed)} - ${this.formatINR(existingInsuranceCover)} = ${this.formatINR(illustrativeProtectionGap)}`,
        notesAndAssumptions: 'Illustrative rule-of-thumb model. Underwriting eligibility is subject to insurer medical grid, age, and verified income documentation.'
      }
    };

    // Attach explanations for all goals
    goalsAnalysis.forEach(g => {
      calculations[`goal_${g.goalId}`] = g.explanation;
    });

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlyEmi,
      monthlyCommitments,
      monthlySurplus,
      annualIncome,
      annualCommitments,
      annualSurplus,
      savingsRatePercent,
      emergencyFundTargetMonths,
      emergencyFundTarget,
      currentSavings,
      emergencyFundGap,
      currentSavingsCoverageMonths,
      protectionNeed,
      debtToIncomeRatioPercent,
      financialHealthScore: score,
      financialHealthRating,
      goalsAnalysis,
      retirementDetail,
      totalGoalsFutureCost,
      totalGoalsFundingGap,
      totalRequiredMonthlySavingsForGoals,
      surplusAvailableAfterGoals,
      calculations,
      calculatedAt: new Date().toISOString()
    };
  }
}
