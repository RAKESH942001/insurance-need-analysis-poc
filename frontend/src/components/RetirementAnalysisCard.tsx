import React, { useState } from 'react';
import {
  Palmtree,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator
} from 'lucide-react';
import { RetirementAnalysisDetail } from '../types';

interface RetirementAnalysisCardProps {
  detail: RetirementAnalysisDetail;
  onExplainCalculation: (fieldName: string) => void;
}

export const RetirementAnalysisCard: React.FC<RetirementAnalysisCardProps> = ({
  detail,
  onExplainCalculation: _onExplainCalculation
}) => {
  const [showFormula, setShowFormula] = useState(false);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Life Milestone &bull; Actuarial Model
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {detail.yearsToRetirement} Years to Retirement
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Retirement Planning & Corpus Gap Analysis
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="self-start sm:self-center text-xs font-semibold text-axis-burgundy hover:text-axis-burgundy/80 flex items-center space-x-1 cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showFormula ? 'Hide Actuarial Math' : 'Show Actuarial Math'}</span>
          {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Visual Timeline Bar */}
      <div className="my-5 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>Current Age: {detail.currentAge}</span>
          <span className="text-axis-burgundy font-bold">Retirement: Age {detail.retirementAge}</span>
          <span>Life Expectancy: Age {detail.planningHorizonAge}</span>
        </div>
        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-axis-burgundy transition-all"
            style={{ width: `${Math.min(100, (detail.yearsToRetirement / (detail.planningHorizonAge - detail.currentAge)) * 100)}%` }}
            title="Accumulation Phase"
          />
          <div
            className="h-full bg-amber-400 transition-all flex-1"
            title="Distribution / Annuity Phase"
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
          <span>{detail.yearsToRetirement} yrs wealth accumulation</span>
          <span>{detail.retirementDurationYears} yrs post-retirement drawdown</span>
        </div>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Metric 1: Inflated Monthly Expense */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">Monthly Living Expense at Ret.</div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
            {formatINR(detail.projectedRetirementMonthlyExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Inflated from {formatINR(detail.todaysMonthlyExpenses)}/mo (@ {detail.inflationRatePercent}%)
          </div>
        </div>

        {/* Metric 2: Required Corpus */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">Required Corpus at Age {detail.retirementAge}</div>
          <div className="text-base sm:text-lg font-extrabold text-axis-burgundy mt-1">
            {formatINR(detail.requiredCorpusAtRetirement)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Funds {detail.retirementDurationYears} yrs @ real return {detail.realReturnPercent}%
          </div>
        </div>

        {/* Metric 3: Projected Corpus */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">Projected Savings Accumulation</div>
          <div className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1">
            {formatINR(detail.totalProjectedCorpus)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {detail.fundedPercentage}% Funded against target
          </div>
        </div>

        {/* Metric 4: Net Gap & Additional SIP */}
        <div className={`rounded-xl p-3.5 border ${
          detail.corpusGap > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="text-[11px] font-medium text-slate-600">
            {detail.corpusGap > 0 ? 'Net Corpus Shortfall' : 'Retirement Status'}
          </div>
          <div className={`text-base sm:text-lg font-extrabold mt-1 ${
            detail.corpusGap > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {detail.corpusGap > 0 ? formatINR(detail.corpusGap) : 'Fully Funded ✅'}
          </div>
          <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
            {detail.corpusGap > 0
              ? `Requires +${formatINR(detail.additionalMonthlyContributionNeeded)}/mo SIP`
              : 'Target achieved'}
          </div>
        </div>
      </div>

      {/* Collapsible Step-by-Step Math Box */}
      {showFormula && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono space-y-2 mb-4 border border-slate-800">
          <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1.5">
            <span>Actuarial Annuity Due Calculation & Assumptions</span>
            <span className="text-[10px] text-slate-400 uppercase">Deterministic Engine</span>
          </div>
          <p className="text-slate-300 whitespace-pre-line leading-relaxed font-mono">
            {detail.stepByStepMath}
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Formula: {detail.formulaDescription}
          </div>
        </div>
      )}

      {/* Advisory Insight Banner */}
      <div className="flex items-start space-x-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Advisor Key Takeaway: </span>
          {detail.corpusGap > 0 ? (
            <span>
              Client has an unhedged retirement shortfall of <strong>{formatINR(detail.corpusGap)}</strong>. An additional monthly systematic allocation of <strong>{formatINR(detail.additionalMonthlyContributionNeeded)}/month</strong> over the next {detail.yearsToRetirement} years will compound into the target corpus and secure guaranteed lifetime financial independence.
            </span>
          ) : (
            <span>
              Client retirement plan is on track. Recommend exploring guaranteed annuity options to lock in lifetime non-market-linked pension floor.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
