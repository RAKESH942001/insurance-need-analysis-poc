import React from 'react';
import { ActionRecommendation, UrgencyLevel } from '../types';
import { CheckSquare, Award } from 'lucide-react';

interface ActionRecommendationsProps {
  recommendations: ActionRecommendation[];
}

export const ActionRecommendations: React.FC<ActionRecommendationsProps> = ({
  recommendations
}) => {
  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>IMMEDIATE ACTION</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>HIGH PRIORITY</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>MEDIUM PRIORITY</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>DISCRETIONARY / WEALTH</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-axis-burgundy/10 text-axis-burgundy flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Advisor Action Plan in Urgency Order
            </h2>
            <p className="text-[11px] text-slate-500">
              Mathematically sequenced interventions with specific advisor next steps
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-2xs">
          {recommendations.length} Action Items
        </span>
      </div>

      {/* Recommendations Cards */}
      <div className="p-4 sm:p-5 space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition space-y-3"
          >
            {/* Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {rec.priorityRank}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                {getUrgencyBadge(rec.urgency)}
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {rec.metricLabel}: {rec.metricValue}
                </span>
              </div>
            </div>

            {/* Current State & Recommended Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Observed Financial State
                </span>
                <p className="text-slate-800 leading-relaxed">{rec.currentState}</p>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                <span className="font-bold text-axis-burgundy uppercase tracking-wider text-[10px] block mb-1">
                  Prescribed Strategic Action
                </span>
                <p className="text-slate-900 font-medium leading-relaxed">{rec.recommendedAction}</p>
              </div>
            </div>

            {/* Why This Matters & Exact Calculation */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start space-x-2 text-slate-700">
                <span className="font-bold text-slate-500 shrink-0">Why:</span>
                <span>{rec.reasonWhy}</span>
              </div>
              <div className="flex items-start space-x-2 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-axis-burgundy shrink-0">Math:</span>
                <span className="break-all">{rec.exactCalculation}</span>
              </div>
            </div>

            {/* Action Checklist */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 text-[11px] block">
                Advisor Action Checklist:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {rec.nextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-1.5 bg-slate-50/70 p-2 rounded-md border border-slate-100 text-[11px] text-slate-700"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-axis-burgundy shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Disclaimer */}
            <p className="text-[10px] text-slate-400 italic pt-1">
              &bull; {rec.disclaimer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
