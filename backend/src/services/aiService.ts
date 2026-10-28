import {
  CustomerProfile,
  FinancialAnalysis,
  ActionRecommendation,
  AiAdvisoryInsight
} from '../models/types';
import { FinancialCalculationService } from './calculationService';
import { z } from 'zod';

const AiInsightSchema = z.object({
  executiveSummary: z.string().min(20),
  advisorTalkingScript: z.string().min(20),
  keyDiscussionPoints: z.array(z.string()).min(2),
  clientObjectionsAndResponses: z.array(
    z.object({
      objection: z.string(),
      suggestedResponse: z.string()
    })
  ).min(1),
  complianceSuitabilityNotice: z.string().min(10)
});

export class AiAdvisoryService {
  /**
   * Generates advisor-ready insights, talking scripts, and objection handlers.
   * If an API key is available and responsive, utilizes live Gemini model.
   * Gracefully and deterministically falls back on failure, timeout, or missing credentials.
   * NEVER permits LLM to calculate or alter financial numbers.
   */
  public static async generateInsights(
    profile: CustomerProfile,
    analysis: FinancialAnalysis,
    recommendations: ActionRecommendation[],
    forceDeterministic = false
  ): Promise<AiAdvisoryInsight> {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    // If no key is configured or deterministic mode requested, return local engine immediately
    if (forceDeterministic || !apiKey) {
      return this.generateDeterministicInsight(profile, analysis, recommendations);
    }

    try {
      const liveInsight = await this.callGeminiApi(apiKey, profile, analysis, recommendations);
      if (liveInsight) {
        return liveInsight;
      }
    } catch (err: any) {
      console.warn('[AiAdvisoryService] Live Gemini API unavailable, falling back to deterministic engine:', err.message);
    }

    return this.generateDeterministicInsight(profile, analysis, recommendations);
  }

  /**
   * Safe live Gemini API call with strict schema validation and 5s timeout
   */
  private static async callGeminiApi(
    apiKey: string,
    profile: CustomerProfile,
    analysis: FinancialAnalysis,
    _recommendations: ActionRecommendation[]
  ): Promise<AiAdvisoryInsight | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const promptPayload = {
      role: 'Senior Axis Max Life Bancassurance Solutions Architect',
      instruction: `Analyze this customer's validated financial balance sheet and life goals to generate strategic advisor dialogue.
DO NOT recalculate or modify any numbers. Use strictly the provided financial values.
Output MUST be a valid JSON object matching this schema:
{
  "executiveSummary": string,
  "advisorTalkingScript": string,
  "keyDiscussionPoints": string[],
  "clientObjectionsAndResponses": [{"objection": string, "suggestedResponse": string}],
  "complianceSuitabilityNotice": string
}`,
      validatedCustomerData: {
        name: profile.name,
        age: profile.age,
        dependants: profile.dependantsCount,
        monthlyIncome: FinancialCalculationService.formatINR(analysis.monthlyIncome),
        monthlyExpenses: FinancialCalculationService.formatINR(analysis.monthlyExpenses),
        monthlyEmi: FinancialCalculationService.formatINR(analysis.monthlyEmi),
        monthlyTotalCommitments: FinancialCalculationService.formatINR(analysis.monthlyCommitments),
        monthlySurplus: FinancialCalculationService.formatINR(analysis.monthlySurplus),
        emergencyFundTarget: FinancialCalculationService.formatINR(analysis.emergencyFundTarget),
        currentLiquidSavings: FinancialCalculationService.formatINR(analysis.currentSavings),
        currentSavingsCoverage: `${analysis.currentSavingsCoverageMonths} months`,
        emergencyFundGap: FinancialCalculationService.formatINR(analysis.emergencyFundGap),
        declaredExistingCover: FinancialCalculationService.formatINR(analysis.protectionNeed.existingCover),
        illustrativeProtectionGap: FinancialCalculationService.formatINR(analysis.protectionNeed.illustrativeProtectionGap),
        retirementGoal: analysis.retirementDetail ? {
          retirementAge: analysis.retirementDetail.retirementAge,
          yearsRemaining: analysis.retirementDetail.yearsToRetirement,
          requiredCorpus: FinancialCalculationService.formatINR(analysis.retirementDetail.requiredCorpusAtRetirement),
          corpusGap: FinancialCalculationService.formatINR(analysis.retirementDetail.corpusGap),
          requiredMonthlySIP: FinancialCalculationService.formatINR(analysis.retirementDetail.additionalMonthlyContributionNeeded)
        } : null,
        goalsSummary: (analysis.goalsAnalysis || []).map(g => ({
          name: g.name,
          futureCost: FinancialCalculationService.formatINR(g.futureCost),
          gap: FinancialCalculationService.formatINR(g.fundingGap),
          monthlySIP: FinancialCalculationService.formatINR(g.requiredMonthlySavings)
        }))
      }
    };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an executive insurance solution architect. Return ONLY valid JSON (no markdown formatting).
Data:\n${JSON.stringify(promptPayload, null, 2)}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini HTTP error ${response.status}`);
      }

      const jsonResponse: any = await response.json();
      const rawText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(rawText.trim().replace(/^```json/, '').replace(/```$/, ''));
      const validated = AiInsightSchema.parse(parsed);

      return {
        isLiveAi: true,
        aiEngine: 'Google Gemini 1.5 Flash (Live LLM Integration)',
        generatedAt: new Date().toISOString(),
        executiveSummary: validated.executiveSummary,
        advisorTalkingScript: validated.advisorTalkingScript,
        keyDiscussionPoints: validated.keyDiscussionPoints,
        clientObjectionsAndResponses: validated.clientObjectionsAndResponses,
        complianceSuitabilityNotice: validated.complianceSuitabilityNotice
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Deterministic, reliable rule-based advisory generator
   */
  public static generateDeterministicInsight(
    profile: CustomerProfile,
    analysis: FinancialAnalysis,
    _recommendations: ActionRecommendation[]
  ): AiAdvisoryInsight {
    const surplusFormatted = FinancialCalculationService.formatINR(analysis.monthlySurplus);
    const commitmentsFormatted = FinancialCalculationService.formatINR(analysis.monthlyCommitments);
    const savingsMonths = analysis.currentSavingsCoverageMonths;
    const emergencyGapFormatted = FinancialCalculationService.formatINR(analysis.emergencyFundGap);
    const protectionGapFormatted = FinancialCalculationService.formatINR(analysis.protectionNeed.illustrativeProtectionGap);
    const existingCoverFormatted = FinancialCalculationService.formatINR(analysis.protectionNeed.existingCover);

    const isDeficit = analysis.monthlySurplus < 0;
    const hasDependants = profile.dependantsCount > 0;

    let executiveSummary = '';
    let advisorTalkingScript = '';

    if (isDeficit) {
      executiveSummary = `${profile.name} (Age ${profile.age}) is currently operating at a monthly cash deficit of ${FinancialCalculationService.formatINR(Math.abs(analysis.monthlySurplus))}. Total commitments (${commitmentsFormatted}) exceed in-hand income (${FinancialCalculationService.formatINR(analysis.monthlyIncome)}). Immediate focus must be on cashflow stabilization before long-term capital lock-in.`;
      advisorTalkingScript = `“Good morning ${profile.name}. Reviewing your current cashflow, your monthly commitments stand at ${commitmentsFormatted} against in-hand income of ${FinancialCalculationService.formatINR(analysis.monthlyIncome)}. Before discussing long-term investments, our fiduciary priority is to restructure existing outflows and eliminate the monthly ${FinancialCalculationService.formatINR(Math.abs(analysis.monthlySurplus))} drain to protect your liquid reserves.”`;
    } else {
      const goalsCount = (analysis.goalsAnalysis || []).length;
      executiveSummary = `${profile.name} (Age ${profile.age}) demonstrates strong savings capability of ${surplusFormatted}/month (${analysis.savingsRatePercent}% savings rate). However, an emergency fund gap of ${emergencyGapFormatted} (holding ${savingsMonths} months vs 6 months target) and an unhedged life protection gap of ${protectionGapFormatted} (${hasDependants ? `protecting ${profile.dependantsCount} dependant(s)` : 'protecting future earnings and liabilities'}) represent immediate planning priorities. ${goalsCount > 0 ? `Analysis covers ${goalsCount} active life goal(s) requiring structured capital allocation.` : ''}`;
      advisorTalkingScript = `“Good morning ${profile.name}. Congratulations on maintaining a healthy monthly surplus of ${surplusFormatted} after covering your ${commitmentsFormatted} in living costs and commitments. You are in the top tier of disciplined savers. Our goal today is to ensure your family's future milestones are insulated against life shocks. Currently, your savings provide ${savingsMonths} months of runway against the recommended 6-month safety net of ${FinancialCalculationService.formatINR(analysis.emergencyFundTarget)}. More importantly, your declared cover of ${existingCoverFormatted} leaves an illustrative protection gap of ${protectionGapFormatted} that can be efficiently closed using a fraction of your monthly surplus.”`;
    }

    const keyDiscussionPoints = [
      `Liquidity Health: Bridge the ${emergencyGapFormatted} emergency shortfall using high-liquidity sweep or liquid instruments before committing surplus into illiquid assets.`,
      `Human Life Value Protection: Address the ${protectionGapFormatted} gap with pure term insurance (ensuring ${hasDependants ? `${profile.dependantsCount} dependant(s)` : 'estate'} protection and income continuation).`,
      `Cashflow Optimization: Channel the ${surplusFormatted} net surplus systematically: priority allocation to emergency liquidity, followed by disciplined wealth accumulation.`,
      `Commitment Coverage: Ensure the ${commitmentsFormatted}/month outflow can be sustained uninterrupted even during health or employment disruptions.`
    ];

    if (analysis.retirementDetail && analysis.retirementDetail.corpusGap > 0) {
      const ret = analysis.retirementDetail;
      keyDiscussionPoints.push(
        `Retirement Roadmap: At age ${ret.retirementAge} (${ret.yearsToRetirement} years away), inflation will raise your monthly living expenses to ${FinancialCalculationService.formatINR(ret.projectedRetirementMonthlyExpense)}. Funding this until age ${ret.planningHorizonAge} requires a target corpus of ${FinancialCalculationService.formatINR(ret.requiredCorpusAtRetirement)} (current gap: ${FinancialCalculationService.formatINR(ret.corpusGap)}, requiring ${FinancialCalculationService.formatINR(ret.additionalMonthlyContributionNeeded)}/month).`
      );
    }

    if (analysis.goalsAnalysis && analysis.goalsAnalysis.length > 0) {
      const eduGoal = analysis.goalsAnalysis.find(g => g.category === 'EDUCATION');
      if (eduGoal) {
        keyDiscussionPoints.push(
          `Child Higher Education: In ${eduGoal.targetYears} years, college expenses will inflate from ${FinancialCalculationService.formatINR(eduGoal.todaysCost)} to ${FinancialCalculationService.formatINR(eduGoal.futureCost)}. Closing the ${FinancialCalculationService.formatINR(eduGoal.fundingGap)} gap requires ${FinancialCalculationService.formatINR(eduGoal.requiredMonthlySavings)}/month.`
        );
      }
    }

    const clientObjectionsAndResponses = [
      {
        objection: '“I already have ₹20 Lakhs life cover from an endowment / employer group policy. Isn’t that sufficient?”',
        suggestedResponse: `“₹20 Lakhs provides a helpful base, but against your household commitments of ${commitmentsFormatted}/month, it represents only ${Math.round(2000000 / (analysis.monthlyCommitments * 12))} years of family income replacement. If anything happened, your family would face an income cliff. Pure term insurance closes the remaining ${protectionGapFormatted} gap for a nominal premium without straining your cashflow.”`
      },
      {
        objection: '“Should I prioritize my child’s college education or my own retirement planning?”',
        suggestedResponse: '“A child can secure scholarships or an education loan for college, but no institution provides a loan for retirement. Our fiduciary recommendation is to balance both: secure the child’s college fund with a term policy with waiver-of-premium rider, while systematically investing for retirement to avoid becoming financially dependent in later years.”'
      },
      {
        objection: '“Can I wait a few years before starting on my long-term life goals and retirement?”',
        suggestedResponse: '“Every 5-year delay doubles the required monthly investment needed to achieve the same retirement corpus due to loss of compounding years. Starting with even a modest monthly SIP today locks in compounding and protects your future lifestyle.”'
      }
    ];

    return {
      isLiveAi: false,
      aiEngine: 'Deterministic Expert Rule Engine (Local Fallback)',
      generatedAt: new Date().toISOString(),
      executiveSummary,
      advisorTalkingScript,
      keyDiscussionPoints,
      clientObjectionsAndResponses,
      complianceSuitabilityNotice: 'Advisory Discussion Framework for Internal Training & Demo. Not a contractual policy proposal or guaranteed return illustration. All financial products subject to IRDAI guidelines and individual underwriting.'
    };
  }
}
