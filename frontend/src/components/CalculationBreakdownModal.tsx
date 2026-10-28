import React, { useState } from 'react';
import { FinancialAnalysis } from '../types';
import { X, Calculator, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CalculationBreakdownModalProps {
  analysis: FinancialAnalysis;
  initialFieldKey?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CalculationBreakdownModal: React.FC<CalculationBreakdownModalProps> = ({
  analysis,
  initialFieldKey = 'monthlyCommitments',
  isOpen,
  onClose
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(initialFieldKey);

  if (!isOpen) return null;

  const currentCalc = analysis.calculations[selectedKey] || analysis.calculations.monthlyCommitments;

  const calcKeys = [
    { key: 'monthlyCommitments', label: '1. Commitments (Exp + EMI)' },
    { key: 'monthlySurplus', label: '2. Monthly Surplus' },
    { key: 'emergencyFundTarget', label: '3. 6-Mo. Emergency Target' },
    { key: 'currentSavingsCoverageMonths', label: '4. Savings Runway' },
    { key: 'emergencyFundGap', label: '5. Emergency Shortfall' },
    { key: 'illustrativeProtectionGap', label: '6. Life Protection Gap' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-axis-burgundy text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mathematical Transparency & Formula Audit
              </h3>
              <p className="text-xs text-slate-500">
                Verifiable step-by-step arithmetic derived directly from customer inputs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex overflow-x-auto p-3 bg-slate-100/70 border-b border-slate-200 gap-1.5 text-xs font-semibold">
          {calcKeys.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedKey(item.key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                selectedKey === item.key
                  ? 'bg-axis-burgundy text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Hero Value */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-semibold block">{currentCalc.label}</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {currentCalc.formattedValue}
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Deterministic Output</span>
            </div>
          </div>

          {/* Core Formula Box */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Mathematical Formula
            </span>
            <div className="p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-lg border border-slate-800 shadow-inner">
              {currentCalc.formula}
            </div>
          </div>

          {/* Inputs Used */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Customer Inputs Employed
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs">
              {Object.entries(currentCalc.inputsUsed).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">{k}:</span>
                  <span className="font-bold text-slate-800">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step by Step Execution */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Step-by-Step Derivation
            </span>
            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {currentCalc.stepByStepMath}
            </div>
          </div>

          {/* Assumptions & Compliance Notes */}
          <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start space-x-2.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-[11px]">Underwriting & Actuarial Assumptions:</span>
              <p className="text-[11px] leading-normal">{currentCalc.notesAndAssumptions}</p>
            </div>
          </div>

          {/* Protection gap methodology note if applicable */}
          {selectedKey === 'illustrativeProtectionGap' && (
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] space-y-1.5">
              <span className="font-bold block flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>IRDAI Advisory Governance Notice</span>
              </span>
              <ul className="list-disc pl-4 space-y-1 text-blue-800">
                {analysis.protectionNeed.assumptions.map((assump, i) => (
                  <li key={i}>{assump}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
