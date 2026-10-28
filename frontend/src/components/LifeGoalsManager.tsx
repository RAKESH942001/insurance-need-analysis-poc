import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Palmtree,
  Heart,
  Home,
  Save
} from 'lucide-react';
import { CustomerProfile, FinancialGoal, GoalCategory } from '../types';

interface LifeGoalsManagerProps {
  customer: CustomerProfile;
  onUpdateGoals: (goals: FinancialGoal[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveCustomer?: () => void;
  isSaving?: boolean;
}

export const LifeGoalsManager: React.FC<LifeGoalsManagerProps> = ({
  customer,
  onUpdateGoals,
  onNext,
  onBack,
  onSaveCustomer,
  isSaving = false
}) => {
  const [goals, setGoals] = useState<FinancialGoal[]>(customer.goals || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<GoalCategory>('RETIREMENT');
  const [name, setName] = useState('');
  const [targetAge, setTargetAge] = useState<number>(58);
  const [targetYears, setTargetYears] = useState<number>(26);
  const [targetAmount, setTargetAmount] = useState<number>(40000);
  const [inflationRate, setInflationRate] = useState<number>(6.0);
  const [expectedReturnPre, setExpectedReturnPre] = useState<number>(10.0);
  const [expectedReturnPost, setExpectedReturnPost] = useState<number>(7.0);
  const [existingSavings, setExistingSavings] = useState<number>(50000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(3000);
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [planningHorizonAge, setPlanningHorizonAge] = useState<number>(80);
  
  // Specific metadata fields
  const [childCurrentAge, setChildCurrentAge] = useState<number>(4);
  const [collegeAge, setCollegeAge] = useState<number>(18);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Open modal for new goal
  const handleOpenAddModal = (presetCategory?: GoalCategory) => {
    setEditingGoalId(null);
    const cat = presetCategory || 'RETIREMENT';
    setCategory(cat);

    if (cat === 'RETIREMENT') {
      setName(`Retirement at ${customer.age < 50 ? 58 : customer.age + 10}`);
      const tAge = customer.age < 55 ? 58 : 65;
      setTargetAge(tAge);
      setTargetYears(Math.max(1, tAge - customer.age));
      setTargetAmount(40000); // desired monthly living expense today
      setInflationRate(6.0);
      setExpectedReturnPre(10.0);
      setExpectedReturnPost(7.0);
      setExistingSavings(50000);
      setMonthlyContribution(3000);
      setPriority('HIGH');
      setPlanningHorizonAge(80);
    } else if (cat === 'EDUCATION') {
      setName('Child College & Higher Education');
      setChildCurrentAge(4);
      setCollegeAge(18);
      const yrs = 14;
      setTargetYears(yrs);
      setTargetAge(18);
      setTargetAmount(2500000); // 25 Lakhs
      setInflationRate(8.0);
      setExpectedReturnPre(10.0);
      setExistingSavings(100000);
      setMonthlyContribution(2000);
      setPriority('HIGH');
    } else if (cat === 'MARRIAGE') {
      setName('Child Marriage & Family Milestone');
      setTargetYears(18);
      setTargetAmount(1500000); // 15 Lakhs
      setInflationRate(6.0);
      setExpectedReturnPre(10.0);
      setExistingSavings(0);
      setMonthlyContribution(1500);
      setPriority('MEDIUM');
    } else if (cat === 'HOME') {
      setName('Home Down Payment / Renovation');
      setTargetYears(5);
      setTargetAmount(2000000);
      setInflationRate(6.0);
      setExpectedReturnPre(9.0);
      setExistingSavings(200000);
      setMonthlyContribution(10000);
      setPriority('MEDIUM');
    } else {
      setName('Custom Financial Milestone');
      setTargetYears(7);
      setTargetAmount(1000000);
      setInflationRate(6.0);
      setExpectedReturnPre(10.0);
      setExistingSavings(0);
      setMonthlyContribution(2000);
      setPriority('LOW');
    }
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditGoal = (goal: FinancialGoal) => {
    setEditingGoalId(goal.id);
    setCategory(goal.category);
    setName(goal.name);
    setTargetAge(goal.targetAge || 60);
    setTargetYears(goal.targetYears);
    setTargetAmount(goal.targetAmount);
    setInflationRate(goal.inflationRate);
    setExpectedReturnPre(goal.expectedReturnPre);
    setExpectedReturnPost(goal.expectedReturnPost || 7.0);
    setExistingSavings(goal.existingSavings);
    setMonthlyContribution(goal.monthlyContribution || 0);
    setPriority(goal.priority);
    setPlanningHorizonAge(goal.planningHorizonAge || 80);
    if (goal.metadata?.childCurrentAge) setChildCurrentAge(goal.metadata.childCurrentAge);
    if (goal.metadata?.collegeAge) setCollegeAge(goal.metadata.collegeAge);
    setIsModalOpen(true);
  };

  // Save goal (Create or Update)
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const isRet = category === 'RETIREMENT';
    const computedTargetYears = isRet
      ? Math.max(1, targetAge - customer.age)
      : (category === 'EDUCATION' ? Math.max(1, collegeAge - childCurrentAge) : targetYears);

    const goalPayload: FinancialGoal = {
      id: editingGoalId || `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerId: customer.id,
      category,
      name: name.trim() || `${category} Goal`,
      targetAge: isRet ? targetAge : (category === 'EDUCATION' ? collegeAge : undefined),
      targetYears: computedTargetYears,
      targetAmount: Number(targetAmount) || 0,
      inflationRate: Number(inflationRate) || 6.0,
      expectedReturnPre: Number(expectedReturnPre) || 10.0,
      expectedReturnPost: isRet ? Number(expectedReturnPost) : undefined,
      existingSavings: Number(existingSavings) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      priority,
      planningHorizonAge: isRet ? Number(planningHorizonAge) : undefined,
      metadata: category === 'EDUCATION' ? { childCurrentAge, collegeAge } : undefined
    };

    let updatedList: FinancialGoal[];
    if (editingGoalId) {
      updatedList = goals.map(g => g.id === editingGoalId ? goalPayload : g);
    } else {
      updatedList = [...goals, goalPayload];
    }

    setGoals(updatedList);
    onUpdateGoals(updatedList);
    setIsModalOpen(false);
  };

  // Delete goal
  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    onUpdateGoals(updated);
  };

  // Helper to preview future cost
  const previewFutureCost = (amount: number, inf: number, yrs: number, isRet: boolean) => {
    if (isRet) {
      // Annual expense at retirement
      const annualAtRet = amount * 12 * Math.pow(1 + inf / 100, yrs);
      const realR = ((1 + expectedReturnPost / 100) / (1 + inf / 100)) - 1;
      const duration = Math.max(1, planningHorizonAge - targetAge);
      if (Math.abs(realR) < 0.0001) return annualAtRet * duration;
      const factor = (1 - Math.pow(1 + realR, -duration)) / realR;
      return Math.round(annualAtRet * factor * (1 + realR));
    }
    return Math.round(amount * Math.pow(1 + inf / 100, yrs));
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

  const getCategoryColor = (cat: GoalCategory) => {
    switch (cat) {
      case 'RETIREMENT': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'EDUCATION': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MARRIAGE': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HOME': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Context */}
      <div className="bg-gradient-to-r from-axis-burgundy/10 via-max-blue/10 to-transparent border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-axis-burgundy uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 2: Life Goals & Milestone Planning</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Future Aspirations: {customer.name} (Age {customer.age})
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Map out client milestone priorities including retirement runway, child education, and major life milestones. The system computes inflation-adjusted corpus requirements and derives exact monthly SIP contributions.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAddModal('RETIREMENT')}
              className="px-3.5 py-2 bg-white text-slate-800 border border-slate-300 hover:border-axis-burgundy hover:text-axis-burgundy rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Palmtree className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Add Retirement</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('EDUCATION')}
              className="px-3.5 py-2 bg-white text-slate-800 border border-slate-300 hover:border-axis-burgundy hover:text-axis-burgundy rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Add Education</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('OTHER')}
              className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Goal</span>
            </button>
            {onSaveCustomer && (
              <button
                type="button"
                onClick={onSaveCustomer}
                disabled={isSaving}
                className="px-4 py-2 bg-axis-burgundy text-white hover:bg-axis-burgundy/90 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Goals to DB'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Life Goals Added Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Life goals allow you to calculate exact inflation-adjusted capital shortfalls and advise suitable retirement or savings products for {customer.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAddModal('RETIREMENT')}
              className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-2 cursor-pointer"
            >
              <Palmtree className="w-4 h-4" />
              <span>Add Standard Retirement Plan</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('EDUCATION')}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Add Child College Fund</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const Icon = getCategoryIcon(goal.category);
            const colorClass = getCategoryColor(goal.category);
            const isRet = goal.category === 'RETIREMENT';
            const futureCostEstimate = previewFutureCost(
              goal.targetAmount,
              goal.inflationRate,
              goal.targetYears,
              isRet
            );

            return (
              <div
                key={goal.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl border ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {goal.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                          {goal.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditGoal(goal)}
                        className="p-1.5 text-slate-400 hover:text-axis-burgundy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Parameters */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs mb-4">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Timeline:</span>
                      <span className="font-semibold text-slate-800">
                        {goal.targetYears} Years {goal.targetAge ? `(Age ${goal.targetAge})` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>{isRet ? "Today's Monthly Expense:" : "Today's Cost:"}</span>
                      <span className="font-semibold text-slate-800">
                        {formatINR(goal.targetAmount)}{isRet ? '/mo' : ''}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Assumed Inflation:</span>
                      <span className="font-semibold text-slate-800">{goal.inflationRate}% p.a.</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Expected Return:</span>
                      <span className="font-semibold text-slate-800">
                        {goal.expectedReturnPre}% {isRet ? `(Post: ${goal.expectedReturnPost}%)` : ''}
                      </span>
                    </div>

                    <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-slate-600">
                      <span>Existing Allocated Savings:</span>
                      <span className="font-semibold text-emerald-700">
                        {formatINR(goal.existingSavings)}
                      </span>
                    </div>

                    {goal.monthlyContribution ? (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Current Monthly SIP:</span>
                        <span className="font-semibold text-blue-700">
                          {formatINR(goal.monthlyContribution)}/mo
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Future Inflated Projection Box */}
                <div className="bg-gradient-to-r from-axis-burgundy/5 to-max-blue/5 border border-axis-burgundy/15 rounded-xl p-3">
                  <div className="text-[11px] font-medium text-slate-500">
                    {isRet ? 'Target Retirement Corpus Needed:' : 'Projected Future Inflated Cost:'}
                  </div>
                  <div className="text-lg font-extrabold text-axis-burgundy mt-0.5">
                    {formatINR(futureCostEstimate)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {isRet
                      ? `Inflated living cost funded until age ${goal.planningHorizonAge || 80}`
                      : `Compounded over ${goal.targetYears} yrs @ ${goal.inflationRate}% inflation`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back: Customer Profile</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-axis-burgundy hover:bg-axis-burgundy/95 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-sm transition-all hover:translate-x-0.5 cursor-pointer"
        >
          <span>Proceed to AI Need Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal for Add / Edit Goal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingGoalId ? 'Edit Life Goal' : 'Add New Life Goal'}
                </h3>
                <p className="text-xs text-slate-500">
                  Client: {customer.name} (Current Age: {customer.age})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Goal Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'RETIREMENT', label: 'Retirement', icon: Palmtree },
                    { id: 'EDUCATION', label: 'Education', icon: GraduationCap },
                    { id: 'MARRIAGE', label: 'Marriage', icon: Heart },
                    { id: 'HOME', label: 'Home / Other', icon: Home }
                  ].map(catItem => {
                    const CatIcon = catItem.icon;
                    const isSelected = category === catItem.id;
                    return (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => {
                          setCategory(catItem.id as GoalCategory);
                          if (!editingGoalId) handleOpenAddModal(catItem.id as GoalCategory);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center space-y-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-axis-burgundy bg-axis-burgundy/10 text-axis-burgundy ring-2 ring-axis-burgundy/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CatIcon className="w-4 h-4" />
                        <span>{catItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Goal Name / Description
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-axis-burgundy/20 focus:border-axis-burgundy"
                  placeholder="e.g. Comfortable Retirement at 58"
                />
              </div>

              {/* CONDITIONAL FIELDS BASED ON CATEGORY */}
              {category === 'RETIREMENT' ? (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                    <Palmtree className="w-4 h-4 text-amber-700" />
                    <span>Retirement Planning Parameters</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Target Retirement Age
                      </label>
                      <input
                        type="number"
                        min={customer.age + 1}
                        max={85}
                        value={targetAge}
                        onChange={e => setTargetAge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                      <span className="text-[11px] text-slate-500">
                        {Math.max(1, targetAge - customer.age)} years to retirement
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Planning Horizon (Life Expectancy)
                      </label>
                      <input
                        type="number"
                        min={targetAge + 1}
                        max={100}
                        value={planningHorizonAge}
                        onChange={e => setPlanningHorizonAge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                      <span className="text-[11px] text-slate-500">
                        {Math.max(1, planningHorizonAge - targetAge)} yrs in retirement
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Desired Monthly Living Expenses in Retirement (Today's Money)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={targetAmount}
                        onChange={e => setTargetAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        placeholder="e.g. 40000"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Standard assumption: 70-80% of current living expenses ({formatINR(customer.monthlyExpenses)})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Inflation (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={inflationRate}
                        onChange={e => setInflationRate(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Pre-Ret Return (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={expectedReturnPre}
                        onChange={e => setExpectedReturnPre(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Post-Ret Return (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={expectedReturnPost}
                        onChange={e => setExpectedReturnPost(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : category === 'EDUCATION' ? (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/70 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    <span>Education Milestones</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Child's Current Age
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={childCurrentAge}
                        onChange={e => setChildCurrentAge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Planned College / Higher Ed Age
                      </label>
                      <input
                        type="number"
                        min={childCurrentAge + 1}
                        max={30}
                        value={collegeAge}
                        onChange={e => setCollegeAge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                      <span className="text-[11px] text-slate-500">
                        {Math.max(1, collegeAge - childCurrentAge)} years to college
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Estimated Education Cost Today
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={targetAmount}
                        onChange={e => setTargetAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Education Inflation (% p.a.)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={inflationRate}
                        onChange={e => setInflationRate(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500">Benchmark: 8% - 10%</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Assumed Investment Return (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={expectedReturnPre}
                        onChange={e => setExpectedReturnPre(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Other Goals: Marriage, Home, Custom */
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Time Horizon (Years)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={40}
                        value={targetYears}
                        onChange={e => setTargetYears(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Estimated Cost Today
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          value={targetAmount}
                          onChange={e => setTargetAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Inflation Rate (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={inflationRate}
                        onChange={e => setInflationRate(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Assumed Return (%)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={expectedReturnPre}
                        onChange={e => setExpectedReturnPre(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Existing Savings & Ongoing SIP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Existing Savings Allocated (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={existingSavings}
                    onChange={e => setExistingSavings(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm"
                  />
                  <span className="text-[10px] text-slate-500">Lump sum already accumulated</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Monthly Contribution (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={monthlyContribution}
                    onChange={e => setMonthlyContribution(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm"
                  />
                  <span className="text-[10px] text-slate-500">Ongoing monthly SIP</span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Goal Urgency / Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        priority === p
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p} Priority
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-axis-burgundy text-white rounded-xl text-xs font-semibold hover:bg-axis-burgundy/90 cursor-pointer shadow-xs"
                >
                  {editingGoalId ? 'Update Goal' : 'Save Goal to Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
