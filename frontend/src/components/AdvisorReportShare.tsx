import React, { useState } from 'react';
import {
  Printer,
  Mail,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Palmtree,
  GraduationCap,
  ArrowLeft,
  Sparkles,
  User,
  Clock
} from 'lucide-react';
import { CustomerProfile, AnalysisResultResponse } from '../types';

interface AdvisorReportShareProps {
  customer: CustomerProfile;
  analysisResult: AnalysisResultResponse;
  onBackToAnalysis: () => void;
  onNavigateToStep?: (step: number) => void;
}

export const AdvisorReportShare: React.FC<AdvisorReportShareProps> = ({
  customer,
  analysisResult,
  onBackToAnalysis,
  onNavigateToStep: _onNavigateToStep
}) => {
  const [copiedType, setCopiedType] = useState<'whatsapp' | 'email' | 'txt' | null>(null);

  const { analysis, recommendations, aiInsights } = analysisResult;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Generate WhatsApp summary text
  const generateWhatsAppText = () => {
    const ret = analysis.retirementDetail;
    const goalsCount = (analysis.goalsAnalysis || []).length;

    let text = `*AXIS MAX LIFE ADVISORY - FINANCIAL NEED & GOALS SUMMARY*\n`;
    text += `👤 *Client:* ${customer.name} (Age ${customer.age})\n`;
    text += `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n`;

    text += `📊 *CASHFLOW & LIQUIDITY*\n`;
    text += `• Monthly In-hand Income: ${formatINR(analysis.monthlyIncome)}\n`;
    text += `• Total Commitments (Living + EMIs): ${formatINR(analysis.monthlyCommitments)}\n`;
    text += `• Monthly Net Surplus: ${formatINR(analysis.monthlySurplus)}\n`;
    text += `• Emergency Runway: ${analysis.currentSavingsCoverageMonths} Months (Target: 6 Mos / ${formatINR(analysis.emergencyFundTarget)})\n`;
    text += `• Emergency Shortfall: ${formatINR(analysis.emergencyFundGap)}\n\n`;

    text += `🛡️ *LIFE PROTECTION GAP*\n`;
    text += `• Estimated Protection Need: ${formatINR(analysis.protectionNeed.totalGrossNeed)}\n`;
    text += `• Declared Existing Cover: ${formatINR(analysis.protectionNeed.existingCover)}\n`;
    text += `• Net Unhedged Protection Gap: ${formatINR(analysis.protectionNeed.illustrativeProtectionGap)}\n\n`;

    if (ret) {
      text += `🌴 *RETIREMENT ROADMAP (Target: Age ${ret.retirementAge})*\n`;
      text += `• Required Corpus at Ret: ${formatINR(ret.requiredCorpusAtRetirement)}\n`;
      text += `• Projected Existing Corpus: ${formatINR(ret.totalProjectedCorpus)} (${ret.fundedPercentage}%)\n`;
      text += `• Net Retirement Gap: ${formatINR(ret.corpusGap)}\n`;
      text += `• Additional Monthly SIP Needed: ${formatINR(ret.additionalMonthlyContributionNeeded)}/mo\n\n`;
    }

    if (goalsCount > 0) {
      text += `🎯 *ACTIVE LIFE GOALS (${goalsCount})*\n`;
      analysis.goalsAnalysis?.forEach((g, i) => {
        text += `${i + 1}. *${g.name}* (in ${g.targetYears} yrs): Target ${formatINR(g.futureCost)} | Gap: ${formatINR(g.fundingGap)} | Req SIP: ${formatINR(g.requiredMonthlySavings)}/mo\n`;
      });
      text += `\n`;
    }

    text += `⚡ *PRIORITY RECOMMENDATIONS*\n`;
    recommendations.slice(0, 3).forEach((r) => {
      text += `[Priority ${r.priorityRank}] *${r.title}* (${r.urgency})\n`;
      text += `  Action: ${r.recommendedAction}\n`;
    });

    text += `\n_Prepared for ${customer.name} by Axis Max Life Bancassurance Advisory Suite._`;
    return text;
  };

  // Generate Email text
  const generateEmailText = () => {
    const ret = analysis.retirementDetail;

    let text = `Subject: Financial Need Analysis & Life Goals Strategic Plan - ${customer.name}\n\n`;
    text += `Dear ${customer.name},\n\n`;
    text += `Thank you for taking the time to review your comprehensive financial and insurance roadmap today. Below is an executive summary of our diagnostic findings and prioritized recommendations.\n\n`;

    text += `==========================================================\n`;
    text += `1. CASHFLOW, LIQUIDITY & EMERGENCY READINESS\n`;
    text += `==========================================================\n`;
    text += `• Monthly In-hand Income: ${formatINR(analysis.monthlyIncome)}\n`;
    text += `• Monthly Total Outflows (Living + EMIs): ${formatINR(analysis.monthlyCommitments)}\n`;
    text += `• Net Monthly Investable Surplus: ${formatINR(analysis.monthlySurplus)} (${analysis.savingsRatePercent}% Savings Rate)\n`;
    text += `• Current Liquid Savings: ${formatINR(analysis.currentSavings)} (${analysis.currentSavingsCoverageMonths} months of runway)\n`;
    text += `• 6-Month Emergency Target: ${formatINR(analysis.emergencyFundTarget)}\n`;
    text += `• Net Emergency Fund Shortfall: ${formatINR(analysis.emergencyFundGap)}\n\n`;

    text += `==========================================================\n`;
    text += `2. FAMILY PROTECTION & HUMAN LIFE VALUE (HLV)\n`;
    text += `==========================================================\n`;
    text += `• Gross Income Replacement Need: ${formatINR(analysis.protectionNeed.incomeReplacementAmount)} (${analysis.protectionNeed.incomeReplacementMultiplier}x annual earnings)\n`;
    text += `• Total Family Protection Requirement: ${formatINR(analysis.protectionNeed.totalGrossNeed)}\n`;
    text += `• Declared Existing Life Cover: ${formatINR(analysis.protectionNeed.existingCover)}\n`;
    text += `• Net Unhedged Protection Gap: ${formatINR(analysis.protectionNeed.illustrativeProtectionGap)}\n\n`;

    if (ret) {
      text += `==========================================================\n`;
      text += `3. RETIREMENT PLANNING & CORPUS FORECAST\n`;
      text += `==========================================================\n`;
      text += `• Planned Retirement Age: ${ret.retirementAge} (${ret.yearsToRetirement} years accumulation phase)\n`;
      text += `• Desired Monthly Living Expense Today: ${formatINR(ret.todaysMonthlyExpenses)}\n`;
      text += `• Projected Monthly Expense at Retirement: ${formatINR(ret.projectedRetirementMonthlyExpense)}/mo (Inflated @ ${ret.inflationRatePercent}%)\n`;
      text += `• Target Corpus at Retirement: ${formatINR(ret.requiredCorpusAtRetirement)} (Funds until Age ${ret.planningHorizonAge})\n`;
      text += `• Projected Existing Savings & SIP Accumulation: ${formatINR(ret.totalProjectedCorpus)} (${ret.fundedPercentage}% Funded)\n`;
      text += `• Net Retirement Corpus Shortfall: ${formatINR(ret.corpusGap)}\n`;
      text += `• Recommended Additional Monthly SIP: ${formatINR(ret.additionalMonthlyContributionNeeded)}/month\n\n`;
    }

    if (analysis.goalsAnalysis && analysis.goalsAnalysis.length > 0) {
      text += `==========================================================\n`;
      text += `4. MILESTONE LIFE GOALS\n`;
      text += `==========================================================\n`;
      analysis.goalsAnalysis.forEach(g => {
        text += `• Goal: ${g.name} (${g.targetYears} yrs)\n`;
        text += `  Future Inflated Cost: ${formatINR(g.futureCost)} | Net Gap: ${formatINR(g.fundingGap)} | Req. Monthly SIP: ${formatINR(g.requiredMonthlySavings)}/mo\n`;
      });
      text += `\n`;
    }

    text += `==========================================================\n`;
    text += `5. PRIORITIZED ADVISORY RECOMMENDATIONS\n`;
    text += `==========================================================\n`;
    recommendations.forEach(r => {
      text += `[Priority ${r.priorityRank}] ${r.title} (${r.urgency} Urgency)\n`;
      text += `  Current State: ${r.currentState}\n`;
      text += `  Recommended Action: ${r.recommendedAction}\n`;
      text += `  Rationale: ${r.reasonWhy}\n\n`;
    });

    text += `Compliance Notice: All financial projections and human life value figures are illustrative diagnostic guidelines for advisory discussion, not a contractual proposal or guaranteed return illustration. Policies are subject to insurer underwriting and IRDAI regulations.\n\n`;
    text += `Warm regards,\n`;
    text += `Axis Max Life Bancassurance Solutions Team\n`;
    text += `Axis Bank Priority Banking Relationship Desk\n`;
    return text;
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Use fallback
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyWhatsApp = async () => {
    await copyToClipboard(generateWhatsAppText());
    setCopiedType('whatsapp');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyEmail = async () => {
    await copyToClipboard(generateEmailText());
    setCopiedType('email');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([generateEmailText()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Axis_Max_Life_Need_Analysis_${customer.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setCopiedType('txt');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToAnalysis}
          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Analysis</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy WhatsApp */}
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedType === 'whatsapp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'whatsapp' ? 'WhatsApp Summary Copied!' : 'Copy for WhatsApp'}</span>
          </button>

          {/* Copy Email */}
          <button
            type="button"
            onClick={handleCopyEmail}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedType === 'email' ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            <span>{copiedType === 'email' ? 'Email Text Copied!' : 'Copy for Email'}</span>
          </button>

          {/* Download TXT */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedType === 'txt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedType === 'txt' ? 'Downloaded!' : 'Download TXT'}</span>
          </button>

          {/* Print PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-4 py-2 bg-axis-burgundy hover:bg-axis-burgundy/90 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE DOSSIER CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 printable-report">
        {/* Document Header */}
        <div className="border-b-2 border-axis-burgundy pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-axis-burgundy font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Axis Max Life Bancassurance Advisory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Customer Need & Life Goals Advisory Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Prepared for: <strong>{customer.name}</strong> &bull; Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="text-right text-xs text-slate-600 shrink-0">
            <div className="font-bold text-slate-900">Axis Bank Priority Banking</div>
            <div className="text-slate-500">Wealth & Protection Advisory</div>
            <div className="text-emerald-700 font-semibold mt-0.5">Fiduciary Needs Audit</div>
          </div>
        </div>

        {/* Section 1: Customer Profile & Cashflow Overview */}
        <div>
          <h2 className="text-sm font-bold text-axis-burgundy uppercase tracking-wider mb-3 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>1. Customer Financial Profile & Cashflow Diagnostic</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <div>
              <span className="text-slate-500 block">Customer Name:</span>
              <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Age & Dependants:</span>
              <span className="font-bold text-slate-900 text-sm">{customer.age} Yrs &bull; {customer.dependantsCount} Dependants</span>
            </div>
            <div>
              <span className="text-slate-500 block">Monthly In-hand Income:</span>
              <span className="font-bold text-emerald-700 text-sm">{formatINR(analysis.monthlyIncome)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Monthly Living Expenses:</span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(analysis.monthlyExpenses)}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Monthly EMIs:</span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(analysis.monthlyEmi)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Monthly Commitments:</span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(analysis.monthlyCommitments)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Net Monthly Surplus:</span>
              <span className="font-bold text-emerald-700 text-sm">{formatINR(analysis.monthlySurplus)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Savings Rate:</span>
              <span className="font-bold text-blue-700 text-sm">{analysis.savingsRatePercent}%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Emergency Buffer & Term Life Protection Gap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Emergency Fund Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5 border-b border-slate-200 pb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Emergency Liquidity Runway</span>
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-600">6-Month Emergency Target:</span>
              <span className="font-bold text-slate-900">{formatINR(analysis.emergencyFundTarget)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Current Liquid Savings:</span>
              <span className="font-semibold text-slate-800">{formatINR(analysis.currentSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Current Runway:</span>
              <span className="font-bold text-slate-800">{analysis.currentSavingsCoverageMonths} Months</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="text-rose-700 font-bold">Emergency Fund Gap:</span>
              <span className="font-extrabold text-rose-700">{formatINR(analysis.emergencyFundGap)}</span>
            </div>
          </div>

          {/* Protection Gap Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-axis-burgundy" />
              <span>Life Protection Gap (Human Life Value)</span>
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Protection Requirement:</span>
              <span className="font-bold text-slate-900">{formatINR(analysis.protectionNeed.totalGrossNeed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Declared Existing Life Cover:</span>
              <span className="font-semibold text-slate-800">{formatINR(analysis.protectionNeed.existingCover)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Income Multiplier:</span>
              <span className="font-bold text-slate-800">{analysis.protectionNeed.incomeReplacementMultiplier}x Annual Income</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="text-axis-burgundy font-bold">Unhedged Protection Gap:</span>
              <span className="font-extrabold text-axis-burgundy">{formatINR(analysis.protectionNeed.illustrativeProtectionGap)}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Retirement Planning Roadmap */}
        {analysis.retirementDetail && (
          <div>
            <h2 className="text-sm font-bold text-axis-burgundy uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Palmtree className="w-4 h-4" />
              <span>2. Retirement Planning & Actuarial Annuity Forecast</span>
            </h2>

            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 text-xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block">Retirement Age:</span>
                  <span className="font-bold text-slate-900 text-sm">Age {analysis.retirementDetail.retirementAge} ({analysis.retirementDetail.yearsToRetirement} yrs)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expense at Retirement:</span>
                  <span className="font-bold text-slate-900 text-sm">{formatINR(analysis.retirementDetail.projectedRetirementMonthlyExpense)}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Retirement Corpus:</span>
                  <span className="font-bold text-axis-burgundy text-sm">{formatINR(analysis.retirementDetail.requiredCorpusAtRetirement)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Projected Savings:</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatINR(analysis.retirementDetail.totalProjectedCorpus)} ({analysis.retirementDetail.fundedPercentage}%)</span>
                </div>
              </div>

              <div className="border-t border-amber-200/70 pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-900 font-medium">
                <div>
                  <strong>Net Corpus Shortfall: </strong>
                  <span className="text-rose-700 font-bold">{formatINR(analysis.retirementDetail.corpusGap)}</span>
                </div>
                <div className="mt-1 sm:mt-0 font-bold text-blue-800">
                  Required Additional Monthly SIP: {formatINR(analysis.retirementDetail.additionalMonthlyContributionNeeded)}/month
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Life Goals Summary Table */}
        {analysis.goalsAnalysis && analysis.goalsAnalysis.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-axis-burgundy uppercase tracking-wider mb-3 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>3. Milestone Life Goals & Funding Shortfalls</span>
            </h2>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Goal Name</th>
                  <th className="py-2.5 px-3">Timeline</th>
                  <th className="py-2.5 px-3">Future Cost</th>
                  <th className="py-2.5 px-3">Projected Savings</th>
                  <th className="py-2.5 px-3">Funding Gap</th>
                  <th className="py-2.5 px-3 text-right">Req. Monthly SIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.goalsAnalysis.map((g) => (
                  <tr key={g.goalId}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{g.name}</td>
                    <td className="py-2 px-3 text-slate-600">{g.targetYears} Yrs {g.targetAge ? `(Age ${g.targetAge})` : ''}</td>
                    <td className="py-2 px-3 font-bold text-axis-burgundy">{formatINR(g.futureCost)}</td>
                    <td className="py-2 px-3 text-slate-700">{formatINR(g.totalProjectedAccumulation)}</td>
                    <td className="py-2 px-3 font-bold text-rose-700">{formatINR(g.fundingGap)}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700">{formatINR(g.requiredMonthlySavings)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 5: Prioritized Action Plan */}
        <div>
          <h2 className="text-sm font-bold text-axis-burgundy uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>4. Prioritized Action Recommendations (Urgency Order)</span>
          </h2>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">
                      [Priority {rec.priorityRank}] {rec.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      rec.urgency === 'IMMEDIATE'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : rec.urgency === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {rec.urgency}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-axis-burgundy">{rec.metricValue}</span>
                </div>

                <p className="text-slate-700">
                  <strong>Action: </strong>{rec.recommendedAction}
                </p>
                <p className="text-slate-500 text-[11px]">
                  <strong>Reason: </strong>{rec.reasonWhy}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Footer */}
        <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 space-y-1">
          <p>
            <strong>Compliance Disclaimer: </strong>{aiInsights.complianceSuitabilityNotice}
          </p>
          <p>
            Generated by Axis Max Life Bancassurance Need Analysis Engine &bull; Confidential client diagnostic &bull; Not an official policy contract.
          </p>
        </div>
      </div>
    </div>
  );
};
