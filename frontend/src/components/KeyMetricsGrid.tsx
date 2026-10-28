import React from 'react';
import { FinancialAnalysis } from '../types';
import { Calculator, Info } from 'lucide-react';

interface KeyMetricsGridProps {
  analysis: FinancialAnalysis;
  onOpenCalculationModal: (fieldKey: string) => void;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  analysis,
  onOpenCalculationModal
}) => {
  const formatINR = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? '-' : ''}₹${Math.abs(Math.round(val)).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Financial Health Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg text-white shadow-md ${
            analysis.financialHealthRating === 'EXCELLENT' ? 'bg-emerald-600' :
            analysis.financialHealthRating === 'HEALTHY' ? 'bg-teal-600' :
            analysis.financialHealthRating === 'MODERATE' ? 'bg-amber-500' : 'bg-red-600'
          }`}>
            {analysis.financialHealthScore}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Overall Financial Health Score
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                analysis.financialHealthRating === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800' :
                analysis.financialHealthRating === 'HEALTHY' ? 'bg-teal-100 text-teal-800' :
                analysis.financialHealthRating === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {analysis.financialHealthRating.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Derived from net surplus, commitment coverage runway, and family capital protection.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenCalculationModal('monthlyCommitments')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Calculator className="w-3.5 h-3.5 text-axis-burgundy" />
          <span>Audit Mathematical Formulas (6 Metrics)</span>
        </button>
      </div>

      {/* Required Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Metric 1: Monthly Commitments */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative group hover:border-axis-burgundy/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-600">Monthly Commitments</span>
            <button
              onClick={() => onOpenCalculationModal('monthlyCommitments')}
              title="Click to view step-by-step formula"
              className="text-slate-400 hover:text-axis-burgundy"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {formatINR(analysis.monthlyCommitments)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Breakdown:</span>
            <span className="font-semibold text-slate-700">₹{(analysis.monthlyExpenses / 1000).toFixed(0)}k Exp + ₹{(analysis.monthlyEmi / 1000).toFixed(0)}k EMI</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Expenses + EMIs</span>
            <span className="text-axis-burgundy font-semibold cursor-pointer" onClick={() => onOpenCalculationModal('monthlyCommitments')}>
              Inspect Math &rarr;
            </span>
          </div>
        </div>

        {/* Metric 2: Monthly Surplus */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative group hover:border-axis-burgundy/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-600">Monthly Net Surplus</span>
            <button
              onClick={() => onOpenCalculationModal('monthlySurplus')}
              title="Click to view formula"
              className="text-slate-400 hover:text-axis-burgundy"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={`text-xl font-bold tracking-tight ${analysis.monthlySurplus >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatINR(analysis.monthlySurplus)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Savings Rate:</span>
            <span className="font-semibold text-slate-700">{analysis.savingsRatePercent}%</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Income - Commitments</span>
            <span className="text-axis-burgundy font-semibold cursor-pointer" onClick={() => onOpenCalculationModal('monthlySurplus')}>
              Inspect Math &rarr;
            </span>
          </div>
        </div>

        {/* Metric 3: 6-Month Emergency Target */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative group hover:border-axis-burgundy/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-600">6-Mo. Emergency Target</span>
            <button
              onClick={() => onOpenCalculationModal('emergencyFundTarget')}
              title="Click to view formula"
              className="text-slate-400 hover:text-axis-burgundy"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {formatINR(analysis.emergencyFundTarget)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Norm:</span>
            <span className="font-semibold text-slate-700">6 × Monthly Commitments</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>6 × {formatINR(analysis.monthlyCommitments)}</span>
            <span className="text-axis-burgundy font-semibold cursor-pointer" onClick={() => onOpenCalculationModal('emergencyFundTarget')}>
              Inspect Math &rarr;
            </span>
          </div>
        </div>

        {/* Metric 4: Savings Runway (Months) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative group hover:border-axis-burgundy/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-600">Savings Runway</span>
            <button
              onClick={() => onOpenCalculationModal('currentSavingsCoverageMonths')}
              title="Click to view formula"
              className="text-slate-400 hover:text-axis-burgundy"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xl font-bold tracking-tight text-blue-700 flex items-baseline space-x-1">
            <span>{analysis.currentSavingsCoverageMonths}</span>
            <span className="text-xs font-semibold text-slate-500">Months</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Current Pool:</span>
            <span className="font-semibold text-slate-700">{formatINR(analysis.currentSavings)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Savings ÷ Commitments</span>
            <span className="text-axis-burgundy font-semibold cursor-pointer" onClick={() => onOpenCalculationModal('currentSavingsCoverageMonths')}>
              Inspect Math &rarr;
            </span>
          </div>
        </div>

        {/* Metric 5: Emergency Fund Gap */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative group hover:border-axis-burgundy/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-600">Emergency Fund Gap</span>
            <button
              onClick={() => onOpenCalculationModal('emergencyFundGap')}
              title="Click to view formula"
              className="text-slate-400 hover:text-axis-burgundy"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={`text-xl font-bold tracking-tight ${analysis.emergencyFundGap > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {formatINR(analysis.emergencyFundGap)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status:</span>
            <span className={`font-semibold ${analysis.emergencyFundGap > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {analysis.emergencyFundGap > 0 ? 'Shortfall Identified' : 'Fully Funded'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Target - Current</span>
            <span className="text-axis-burgundy font-semibold cursor-pointer" onClick={() => onOpenCalculationModal('emergencyFundGap')}>
              Inspect Math &rarr;
            </span>
          </div>
        </div>

        {/* Metric 6: Illustrative Protection Gap */}
        <div className="bg-gradient-to-br from-axis-deepBurgundy to-axis-burgundy text-white rounded-xl p-4 shadow-md relative group">
          <div className="flex items-center justify-between text-white/80 text-xs mb-1">
            <span className="font-semibold text-white">Illustrative Protection Gap</span>
            <button
              onClick={() => onOpenCalculationModal('illustrativeProtectionGap')}
              title="Click to view formula"
              className="text-white/70 hover:text-white"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-white">
            {formatINR(analysis.protectionNeed.illustrativeProtectionGap)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/80">
            <span>Declared Cover:</span>
            <span className="font-semibold text-white">{formatINR(analysis.protectionNeed.existingCover)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/20 text-[10px] text-white/70 font-mono flex items-center justify-between">
            <span>Gross Need - Declared Cover</span>
            <span className="text-amber-300 font-semibold cursor-pointer hover:underline" onClick={() => onOpenCalculationModal('illustrativeProtectionGap')}>
              Inspect Math &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
