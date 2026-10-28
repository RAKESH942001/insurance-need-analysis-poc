import React, { useState } from 'react';
import { CustomerProfile, FinancialGoal } from '../types';
import { User, Wallet, ShieldAlert, Target, Plus, Trash2, Save, RotateCcw } from 'lucide-react';

interface CustomerFormProps {
  customer: CustomerProfile;
  onChange: (updated: CustomerProfile) => void;
  onSaveCustomer: () => void;
  onResetCustomer: () => void;
  isSaving: boolean;
  onProceedToGoals?: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onChange,
  onSaveCustomer,
  onResetCustomer,
  isSaving,
  onProceedToGoals
}) => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'balanceSheet' | 'goals' | 'basics'>('cashflow');

  const updateField = (field: keyof CustomerProfile, value: any) => {
    onChange({
      ...customer,
      [field]: value
    });
  };

  const handleAddGoal = () => {
    const newGoal: FinancialGoal = {
      id: `goal_${Date.now()}`,
      name: 'New Milestone Goal',
      targetAmount: 500000,
      targetYears: 10,
      inflationRate: 6.0,
      expectedReturnPre: 10.0,
      existingSavings: 0,
      monthlyContribution: 0,
      priority: 'MEDIUM',
      category: 'WEALTH'
    };
    updateField('goals', [...(customer.goals || []), newGoal]);
  };

  const handleUpdateGoal = (index: number, key: keyof FinancialGoal, val: any) => {
    const goals = [...(customer.goals || [])];
    goals[index] = { ...goals[index], [key]: val };
    updateField('goals', goals);
  };

  const handleRemoveGoal = (index: number) => {
    const goals = (customer.goals || []).filter((_, i) => i !== index);
    updateField('goals', goals);
  };

  const totalCommitments = (Number(customer.monthlyExpenses) || 0) + (Number(customer.monthlyEmi) || 0);
  const surplus = (Number(customer.monthlyIncome) || 0) - totalCommitments;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Form Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-axis-burgundy/10 text-axis-burgundy flex items-center justify-center font-bold text-sm">
            {customer.name ? customer.name.charAt(0) : 'C'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>{customer.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                Age {customer.age} &bull; {customer.dependantsCount} Dependants
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">Live Interactive Financial Profile Input</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetCustomer}
            title="Reload baseline values"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onSaveCustomer}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-axis-burgundy text-white text-xs font-semibold rounded-lg hover:bg-axis-deepBurgundy shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-600 bg-white">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'cashflow'
              ? 'border-axis-burgundy text-axis-burgundy bg-rose-50/40'
              : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Cash Flow</span>
        </button>
        <button
          onClick={() => setActiveTab('balanceSheet')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'balanceSheet'
              ? 'border-axis-burgundy text-axis-burgundy bg-rose-50/40'
              : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Assets & Liabilities</span>
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'goals'
              ? 'border-axis-burgundy text-axis-burgundy bg-rose-50/40'
              : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Goals ({customer.goals?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('basics')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'basics'
              ? 'border-axis-burgundy text-axis-burgundy bg-rose-50/40'
              : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Demographics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* TAB 1: Cash Flow */}
        {activeTab === 'cashflow' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Income (₹)
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customer.monthlyIncome}
                    onChange={(e) => updateField('monthlyIncome', Number(e.target.value))}
                    className="block w-full pl-7 pr-2.5 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                    placeholder="85,000"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">In-hand salary / earnings</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Living Expenses (₹)
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customer.monthlyExpenses}
                    onChange={(e) => updateField('monthlyExpenses', Number(e.target.value))}
                    className="block w-full pl-7 pr-2.5 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                    placeholder="48,000"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Household essentials</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly EMI / Debt (₹)
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customer.monthlyEmi}
                    onChange={(e) => updateField('monthlyEmi', Number(e.target.value))}
                    className="block w-full pl-7 pr-2.5 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                    placeholder="12,000"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Ongoing loan payments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Total Monthly Commitments:</span>
                  <p className="text-[10px] text-slate-400">Living Expenses + EMIs</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">
                    ₹{totalCommitments.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Monthly Net Surplus:</span>
                  <p className="text-[10px] text-slate-400">Income minus commitments</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${surplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {surplus >= 0 ? '+' : ''}₹{surplus.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {customer.monthlyIncome > 0
                      ? `${((surplus / customer.monthlyIncome) * 100).toFixed(1)}% savings rate`
                      : '0% rate'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Balance Sheet */}
        {activeTab === 'balanceSheet' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Liquid Savings (₹)
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customer.existingSavings}
                    onChange={(e) => updateField('existingSavings', Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                    placeholder="2,50,000"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Bank savings, liquid FDs, emergency pool</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Existing Life Cover (₹)
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customer.existingInsuranceCover}
                    onChange={(e) => updateField('existingInsuranceCover', Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                    placeholder="20,00,000"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Declared existing term & traditional life cover</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Outstanding Debt / Principal Liabilities (₹)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  value={customer.existingLiabilities}
                  onChange={(e) => updateField('existingLiabilities', Number(e.target.value))}
                  className="block w-full pl-8 pr-3 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                  placeholder="0"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Outstanding loan balance to be covered in life protection</p>
            </div>
          </div>
        )}

        {/* TAB 3: Goals & Horizon */}
        {activeTab === 'goals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Client Declared Milestone Goals</span>
              <button
                type="button"
                onClick={handleAddGoal}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-axis-burgundy hover:text-axis-deepBurgundy hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </div>

            {(!customer.goals || customer.goals.length === 0) ? (
              <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                No custom milestone goals declared. (Optional: Add child education or retirement goals to factor into gross protection need).
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {customer.goals.map((goal, idx) => (
                  <div key={goal.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={goal.name}
                        onChange={(e) => handleUpdateGoal(idx, 'name', e.target.value)}
                        className="font-semibold text-slate-800 bg-transparent border-b border-slate-300 focus:outline-hidden focus:border-axis-burgundy w-full"
                        placeholder="Goal Name"
                      />
                      <button
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-slate-400 hover:text-red-500"
                        title="Remove Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Target (₹)</span>
                        <input
                          type="number"
                          value={goal.targetAmount}
                          onChange={(e) => handleUpdateGoal(idx, 'targetAmount', Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Horizon (Years)</span>
                        <input
                          type="number"
                          value={goal.targetYears}
                          onChange={(e) => handleUpdateGoal(idx, 'targetYears', Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Priority</span>
                        <select
                          value={goal.priority}
                          onChange={(e) => handleUpdateGoal(idx, 'priority', e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Demographics */}
        {activeTab === 'basics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                placeholder="Rahul Mehta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Age (Years)</label>
              <input
                type="number"
                value={customer.age}
                onChange={(e) => updateField('age', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                placeholder="32"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Dependants</label>
              <input
                type="number"
                value={customer.dependantsCount}
                onChange={(e) => updateField('dependantsCount', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
                placeholder="2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Appetite</label>
              <select
                value={customer.riskAppetite || 'MODERATE'}
                onChange={(e) => updateField('riskAppetite', e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy text-slate-900"
              >
                <option value="CONSERVATIVE">Conservative (Capital Safety)</option>
                <option value="MODERATE">Moderate (Balanced Protection & Growth)</option>
                <option value="AGGRESSIVE">Aggressive (Wealth Maximization)</option>
              </select>
            </div>
          </div>
        )}
        {/* Bottom Stepper Action */}
        {onProceedToGoals && (
          <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Step 1 of 4: Customer Profile & Financial Health
            </div>
            <button
              type="button"
              onClick={onProceedToGoals}
              className="px-5 py-2.5 bg-axis-burgundy hover:bg-axis-burgundy/95 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs transition-transform hover:translate-x-0.5 cursor-pointer"
            >
              <span>Next: Life Goals & Future Plans</span>
              <span className="text-base leading-none">&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
