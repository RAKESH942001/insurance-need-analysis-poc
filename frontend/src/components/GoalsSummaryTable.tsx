import React from 'react';
import {
  Target,
  Calculator,
  GraduationCap,
  Palmtree,
  Heart,
  Home
} from 'lucide-react';
import { CalculatedGoalAnalysis, GoalCategory } from '../types';

interface GoalsSummaryTableProps {
  goalsAnalysis: CalculatedGoalAnalysis[];
  monthlySurplus: number;
  totalRequiredMonthlySavings?: number;
  onExplainCalculation: (fieldName: string) => void;
}

export const GoalsSummaryTable: React.FC<GoalsSummaryTableProps> = ({
  goalsAnalysis,
  monthlySurplus,
  totalRequiredMonthlySavings = 0,
  onExplainCalculation
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const totalFutureCost = goalsAnalysis.reduce((sum, g) => sum + g.futureCost, 0);
  const totalFundingGap = goalsAnalysis.reduce((sum, g) => sum + g.fundingGap, 0);
  const remainingSurplus = monthlySurplus - totalRequiredMonthlySavings;
  const isSurplusDeficit = remainingSurplus < 0;

  const getUrgencyBadge = (urgency: CalculatedGoalAnalysis['urgency']) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getCategoryIcon = (cat: GoalCategory) => {
    switch (cat) {
      case 'RETIREMENT': return Palmtree;
      case 'EDUCATION': return GraduationCap;
      case 'MARRIAGE': return Heart;
      case 'HOME': return Home;
      default: return Target;
    }
  };

  if (goalsAnalysis.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-axis-burgundy/10 text-axis-burgundy border border-axis-burgundy/20 px-2 py-0.5 rounded-full">
              Capital Allocation
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {goalsAnalysis.length} Active Financial Milestones
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            Life Goals Funding Shortfalls & Required Monthly SIPs
          </h3>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-3">Goal & Category</th>
              <th className="py-3 px-3">Timeline</th>
              <th className="py-3 px-3">Today's Cost</th>
              <th className="py-3 px-3">Future Inflated Cost</th>
              <th className="py-3 px-3">Projected Savings</th>
              <th className="py-3 px-3">Net Funding Gap</th>
              <th className="py-3 px-3 text-right">Required Monthly SIP</th>
              <th className="py-3 px-3 text-center">Urgency</th>
              <th className="py-3 px-3 text-center">Math</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {goalsAnalysis.map((g) => {
              const Icon = getCategoryIcon(g.category);
              const urgencyBadge = getUrgencyBadge(g.urgency);

              return (
                <tr key={g.goalId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{g.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {g.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 font-medium text-slate-700">
                    {g.targetYears} Yrs {g.targetAge ? `(Age ${g.targetAge})` : ''}
                  </td>

                  <td className="py-3.5 px-3 text-slate-600">
                    {formatINR(g.todaysCost)}{g.category === 'RETIREMENT' ? '/mo' : ''}
                  </td>

                  <td className="py-3.5 px-3 font-bold text-axis-burgundy">
                    {formatINR(g.futureCost)}
                  </td>

                  <td className="py-3.5 px-3 text-slate-700">
                    <div>{formatINR(g.totalProjectedAccumulation)}</div>
                    <div className="text-[10px] text-slate-400">{g.fundedPercentage}% Funded</div>
                  </td>

                  <td className="py-3.5 px-3 font-bold text-rose-700">
                    {g.fundingGap > 0 ? formatINR(g.fundingGap) : 'Fully Funded ✅'}
                  </td>

                  <td className="py-3.5 px-3 text-right font-extrabold text-blue-700">
                    {g.requiredMonthlySavings > 0 ? `${formatINR(g.requiredMonthlySavings)}/mo` : '₹0'}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgencyBadge}`}>
                      {g.urgency}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onExplainCalculation(`goal_${g.goalId}`)}
                      className="text-axis-burgundy hover:text-axis-burgundy/80 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="View step-by-step formula math"
                    >
                      <Calculator className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Consolidated Capital Allocation Box */}
      <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Future Goals Cost</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {formatINR(totalFutureCost)}
            </div>
            <div className="text-[10px] text-slate-500">Across {goalsAnalysis.length} life milestones</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Funding Deficit</div>
            <div className="text-base font-extrabold text-rose-700 mt-0.5">
              {formatINR(totalFundingGap)}
            </div>
            <div className="text-[10px] text-slate-500">Net capital gap to accumulate</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Required Monthly SIP</div>
            <div className="text-base font-extrabold text-blue-700 mt-0.5">
              {formatINR(totalRequiredMonthlySavings)}/month
            </div>
            <div className="text-[10px] text-slate-500">To bridge all milestone shortfalls</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-medium">Available Monthly Surplus</div>
            <div className="text-base font-extrabold text-emerald-700 mt-0.5">
              {formatINR(monthlySurplus)}/month
            </div>
            <div className={`text-[10px] font-medium ${isSurplusDeficit ? 'text-amber-700' : 'text-slate-500'}`}>
              {isSurplusDeficit
                ? `Shortfall of ${formatINR(Math.abs(remainingSurplus))}/mo`
                : `Leaves ${formatINR(remainingSurplus)}/mo investable`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
