import {
  CustomerProfile,
  FinancialAnalysis,
  ActionRecommendation,
  UrgencyLevel
} from '../models/types';
import { FinancialCalculationService } from './calculationService';

export class RecommendationEngine {
  /**
   * Generates prioritized, explainable action recommendations in order of urgency.
   * Completely decoupled from raw calculations and AI text generation.
   */
  public static generateRecommendations(
    profile: CustomerProfile,
    analysis: FinancialAnalysis
  ): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];
    let priorityCounter = 1;

    // RULE 1: Negative Surplus / Cashflow Deficit (Critical Urgency)
    if (analysis.monthlySurplus < 0) {
      recommendations.push({
        id: 'rec_deficit_control',
        urgency: 'IMMEDIATE',
        priorityRank: priorityCounter++,
        category: 'SURPLUS_OPTIMIZATION',
        title: 'Halt Monthly Cashflow Deficit',
        metricLabel: 'Monthly Cash Burn',
        metricValue: FinancialCalculationService.formatINR(analysis.monthlySurplus),
        currentState: `Monthly commitments exceed income by ${FinancialCalculationService.formatINR(Math.abs(analysis.monthlySurplus))}, depleting liquid reserves.`,
        recommendedAction: `Immediately restructure non-discretionary spending and suspend non-essential capital commitments until monthly cash flow turns positive.`,
        reasonWhy: 'No sustainable investment or insurance program can survive while drawing down capital for daily operational commitments.',
        exactCalculation: `${FinancialCalculationService.formatINR(analysis.monthlyIncome)} Income - ${FinancialCalculationService.formatINR(analysis.monthlyCommitments)} Commitments = -${FinancialCalculationService.formatINR(Math.abs(analysis.monthlySurplus))}`,
        nextSteps: [
          'Conduct 30-day bank statement audit for subscription and discretionary leaks.',
          'Consolidate high-interest unsecured revolving credit.',
          'Re-evaluate lifestyle expense budget to restore at least 15% positive savings rate.'
        ],
        disclaimer: 'Advisory guidance for cash flow management; advisor should not advise liquidation of locked assets without tax appraisal.'
      });
    }

    // RULE 2: Emergency Fund Gap (Immediate or High Urgency)
    if (analysis.emergencyFundGap > 0) {
      const isUrgent = analysis.currentSavingsCoverageMonths < 3;
      recommendations.push({
        id: 'rec_emergency_fund',
        urgency: isUrgent ? 'IMMEDIATE' : 'HIGH',
        priorityRank: priorityCounter++,
        category: 'EMERGENCY_FUND',
        title: 'Bridge Emergency Buffer Shortfall',
        metricLabel: 'Emergency Fund Gap',
        metricValue: FinancialCalculationService.formatINR(analysis.emergencyFundGap),
        currentState: `Current liquid savings of ${FinancialCalculationService.formatINR(analysis.currentSavings)} cover only ${analysis.currentSavingsCoverageMonths} months of commitments (Target: 6 months / ${FinancialCalculationService.formatINR(analysis.emergencyFundTarget)}).`,
        recommendedAction: analysis.monthlySurplus > 0
          ? `Allocate ${FinancialCalculationService.formatINR(Math.min(analysis.monthlySurplus, Math.ceil(analysis.emergencyFundGap / 6)))}/month from current surplus to reach the 6-month buffer within ${Math.ceil(analysis.emergencyFundGap / Math.max(1, analysis.monthlySurplus))} months.`
          : `Reallocate low-yielding dormant bank balances into high-liquidity sweep-in accounts or liquid funds.`,
        reasonWhy: 'An unexpected income shock or hospitalization could force distress selling of long-term investments or high-interest personal borrowing.',
        exactCalculation: `Target (${FinancialCalculationService.formatINR(analysis.monthlyCommitments)} × 6 = ${FinancialCalculationService.formatINR(analysis.emergencyFundTarget)}) - Current Savings (${FinancialCalculationService.formatINR(analysis.currentSavings)}) = Shortfall of ${FinancialCalculationService.formatINR(analysis.emergencyFundGap)}`,
        nextSteps: [
          'Set up automated monthly recurring transfer into an emergency liquid instrument.',
          'Keep funds segregated in a high-yield savings or overnight liquid fund.',
          'Do not lock emergency funds in long-term illiquid endowment or real estate.'
        ],
        disclaimer: 'Emergency reserves should prioritize capital preservation and instant liquidity over yield.'
      });
    }

    // RULE 3: Life Protection Gap (Immediate/High if Dependants exist & Gap is substantial)
    if (analysis.protectionNeed.illustrativeProtectionGap > 0) {
      const hasDependants = profile.dependantsCount > 0;
      recommendations.push({
        id: 'rec_protection_gap',
        urgency: hasDependants ? 'HIGH' : 'MEDIUM',
        priorityRank: priorityCounter++,
        category: 'PROTECTION_GAP',
        title: 'Secure Pure Term Life Protection',
        metricLabel: 'Unhedged Protection Gap',
        metricValue: FinancialCalculationService.formatINR(analysis.protectionNeed.illustrativeProtectionGap),
        currentState: `Family protection requirement is ${FinancialCalculationService.formatINR(analysis.protectionNeed.totalGrossNeed)} against declared cover of ${FinancialCalculationService.formatINR(analysis.protectionNeed.existingCover)}, leaving ${FinancialCalculationService.formatINR(analysis.protectionNeed.illustrativeProtectionGap)} unhedged.`,
        recommendedAction: `Procure a comprehensive pure term life insurance policy for ${FinancialCalculationService.formatINR(analysis.protectionNeed.illustrativeProtectionGap)} with waiver of premium and critical illness rider options.`,
        reasonWhy: hasDependants
          ? `${profile.dependantsCount} dependant(s) face immediate living expense deprivation and debt liabilities in the event of an untimely demise of the breadwinner.`
          : `Protects outstanding financial liabilities and locks in low mortality premium at age ${profile.age}.`,
        exactCalculation: `[Income Replacement (${FinancialCalculationService.formatINR(analysis.protectionNeed.incomeReplacementAmount)}) + Debt (${FinancialCalculationService.formatINR(analysis.protectionNeed.liabilitiesCoverAmount)}) + Goals (${FinancialCalculationService.formatINR(analysis.protectionNeed.milestoneGoalsAmount)})] - Declared Cover (${FinancialCalculationService.formatINR(analysis.protectionNeed.existingCover)}) = ${FinancialCalculationService.formatINR(analysis.protectionNeed.illustrativeProtectionGap)}`,
        nextSteps: [
          'Obtain verified medical and underwriting quotes for pure term life insurance.',
          'Ensure policy tenure aligns with active working horizon (up to age 60-65).',
          'Evaluate Axis Max Life term plans based on client risk suitability and affordability.'
        ],
        disclaimer: 'Illustrative recommendation. Suitability check, medical underwriting, and IRDAI compliance documentation required before issuing any policy proposal.'
      });
    }

    // RULE 4: Retirement Planning Gap (if Retirement Detail is present)
    if (analysis.retirementDetail && analysis.retirementDetail.corpusGap > 0) {
      const ret = analysis.retirementDetail;
      const isUrgent = ret.yearsToRetirement <= 10 && ret.fundedPercentage < 50;
      recommendations.push({
        id: 'rec_retirement_planning',
        urgency: isUrgent ? 'IMMEDIATE' : 'HIGH',
        priorityRank: priorityCounter++,
        category: 'MILESTONE_GOAL',
        title: `Bridge Retirement Corpus Gap (${ret.yearsToRetirement} Yrs to Age ${ret.retirementAge})`,
        metricLabel: 'Retirement Corpus Gap',
        metricValue: FinancialCalculationService.formatINR(ret.corpusGap),
        currentState: `Estimated corpus required at age ${ret.retirementAge} is ${FinancialCalculationService.formatINR(ret.requiredCorpusAtRetirement)} (to sustain ${FinancialCalculationService.formatINR(ret.projectedRetirementMonthlyExpense)}/mo until age ${ret.planningHorizonAge}). Projected existing accumulation is ${FinancialCalculationService.formatINR(ret.totalProjectedCorpus)} (${ret.fundedPercentage}% funded).`,
        recommendedAction: `Start an additional monthly retirement SIP of ${FinancialCalculationService.formatINR(ret.additionalMonthlyContributionNeeded)}/month at an assumed ${ret.preRetirementReturnPercent}% return to bridge the ${FinancialCalculationService.formatINR(ret.corpusGap)} corpus deficit.`,
        reasonWhy: `Delaying retirement savings sharply increases the monthly capital required due to loss of compounding years (${ret.yearsToRetirement} years remaining).`,
        exactCalculation: `Target Corpus (${FinancialCalculationService.formatINR(ret.requiredCorpusAtRetirement)}) - Projected Value of Savings (${FinancialCalculationService.formatINR(ret.totalProjectedCorpus)}) = Shortfall of ${FinancialCalculationService.formatINR(ret.corpusGap)} -> Requires ${FinancialCalculationService.formatINR(ret.additionalMonthlyContributionNeeded)}/mo SIP.`,
        nextSteps: [
          `Allocate monthly surplus towards diversified long-term equity/hybrid retirement funds.`,
          `Explore Axis Max Life guaranteed pension / annuity solutions for guaranteed floor income post-retirement.`,
          `Increase retirement contributions annually by 10% step-up with annual salary increments.`
        ],
        disclaimer: 'Projections assume constant inflation and return rates; actual market returns and longevity may vary.'
      });
    }

    // RULE 5: Milestone Financial Goals (Education, Marriage, Custom)
    if (analysis.goalsAnalysis && analysis.goalsAnalysis.length > 0) {
      // Exclude retirement if already handled separately above
      const nonRetirementGoals = analysis.goalsAnalysis.filter(g => g.category !== 'RETIREMENT');
      nonRetirementGoals.forEach(g => {
        if (g.fundingGap > 0) {
          recommendations.push({
            id: `rec_goal_${g.goalId}`,
            urgency: g.urgency,
            priorityRank: priorityCounter++,
            category: 'MILESTONE_GOAL',
            title: `Fund Goal: ${g.name}`,
            metricLabel: `Funding Gap in ${g.targetYears} Yrs`,
            metricValue: FinancialCalculationService.formatINR(g.fundingGap),
            currentState: `Inflated future cost is ${FinancialCalculationService.formatINR(g.futureCost)} (Today: ${FinancialCalculationService.formatINR(g.todaysCost)} @ ${g.assumptions.inflationRate}% inf). Projected savings: ${FinancialCalculationService.formatINR(g.totalProjectedAccumulation)} (${g.fundedPercentage}% funded).`,
            recommendedAction: `Initiate a monthly SIP of ${FinancialCalculationService.formatINR(g.requiredMonthlySavings)}/month to bridge the ${FinancialCalculationService.formatINR(g.fundingGap)} gap over the next ${g.targetYears} years.`,
            reasonWhy: `Securing future milestone capital early prevents distress borrowing or compromising family education and lifecycle events.`,
            exactCalculation: `Inflated Cost (${FinancialCalculationService.formatINR(g.futureCost)}) - Projected Accumulation (${FinancialCalculationService.formatINR(g.totalProjectedAccumulation)}) = Gap of ${FinancialCalculationService.formatINR(g.fundingGap)} -> Requires ${FinancialCalculationService.formatINR(g.requiredMonthlySavings)}/mo.`,
            nextSteps: [
              `Select appropriate asset allocation aligned with the ${g.targetYears}-year time horizon.`,
              `Consider child education insurance plans with waiver of premium to ensure goal completion even upon untimely demise.`
            ],
            disclaimer: 'Investment figures are illustrative estimates; subject to market volatility and taxation.'
          });
        }
      });
    } else if (profile.goals && profile.goals.length > 0) {
      // Fallback for legacy goals
      profile.goals.forEach((goal) => {
        const annualRequired = goal.targetYears > 0 ? Math.round(goal.targetAmount / goal.targetYears) : goal.targetAmount;
        const monthlyRequired = Math.round(annualRequired / 12);
        recommendations.push({
          id: `rec_goal_${goal.id}`,
          urgency: goal.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
          priorityRank: priorityCounter++,
          category: 'MILESTONE_GOAL',
          title: `Fund Goal: ${goal.name}`,
          metricLabel: `Target in ${goal.targetYears} Yrs`,
          metricValue: FinancialCalculationService.formatINR(goal.targetAmount),
          currentState: `Target capital of ${FinancialCalculationService.formatINR(goal.targetAmount)} earmarked over ${goal.targetYears} years (${goal.priority} priority).`,
          recommendedAction: `Initiate disciplined goal-linked SIP of approx. ${FinancialCalculationService.formatINR(monthlyRequired)}/month to accumulate the corpus before deadline.`,
          reasonWhy: `Securing future milestones prevents last-minute debt financing or emergency liquidation of retirement capital.`,
          exactCalculation: `Goal Target (${FinancialCalculationService.formatINR(goal.targetAmount)}) ÷ ${goal.targetYears * 12} Months = ~${FinancialCalculationService.formatINR(monthlyRequired)}/Month`,
          nextSteps: [
            `Select suitable asset allocation based on ${goal.targetYears}-year horizon.`,
            'Review annual step-up contribution by 10% to account for inflation.'
          ],
          disclaimer: 'Target investment figures assume zero return illustrative baseline.'
        });
      });
    }

    // RULE 6: Monthly Surplus Optimization & Capital Allocation (Low / Medium Urgency)
    if (analysis.monthlySurplus > 0) {
      const remainingSurplus = analysis.surplusAvailableAfterGoals !== undefined ? analysis.surplusAvailableAfterGoals : analysis.monthlySurplus;
      recommendations.push({
        id: 'rec_surplus_allocation',
        urgency: 'LOW',
        priorityRank: priorityCounter++,
        category: 'SURPLUS_OPTIMIZATION',
        title: remainingSurplus >= 0 ? 'Deploy Monthly Net Surplus Systematically' : 'Prioritize Capital Allocation Across Life Goals',
        metricLabel: remainingSurplus >= 0 ? 'Remaining Investable Surplus' : 'Monthly Surplus Deficit for Goals',
        metricValue: FinancialCalculationService.formatINR(Math.abs(remainingSurplus)),
        currentState: remainingSurplus >= 0
          ? `Healthy monthly surplus of ${FinancialCalculationService.formatINR(analysis.monthlySurplus)} (Investable unallocated: ${FinancialCalculationService.formatINR(remainingSurplus)}/mo).`
          : `Current monthly surplus of ${FinancialCalculationService.formatINR(analysis.monthlySurplus)} is lower than total goals requirement (${FinancialCalculationService.formatINR(analysis.totalRequiredMonthlySavingsForGoals || 0)}/mo) by ${FinancialCalculationService.formatINR(Math.abs(remainingSurplus))}/mo.`,
        recommendedAction: remainingSurplus >= 0
          ? `Channel surplus into an automated portfolio: priority allocation towards emergency buffer until full, followed by systematic wealth accumulation.`
          : `Stagger and prioritize goals by urgency: fully fund emergency reserve and child education first, while phasing in retirement SIP with annual step-ups.`,
        reasonWhy: 'Disciplined automated cash allocation ensures goals are funded consistently without relying on discretionary month-end balances.',
        exactCalculation: `Monthly Surplus (${FinancialCalculationService.formatINR(analysis.monthlySurplus)}) - Goals Monthly Requirement (${FinancialCalculationService.formatINR(analysis.totalRequiredMonthlySavingsForGoals || 0)}) = ${FinancialCalculationService.formatINR(remainingSurplus)}/month`,
        nextSteps: [
          'Set up standing instructions on salary credit date.',
          'Review portfolio diversification annually with financial advisor.'
        ],
        disclaimer: 'Asset allocation should reflect client risk tolerance and capacity for loss.'
      });
    }

    return recommendations;
  }
}
