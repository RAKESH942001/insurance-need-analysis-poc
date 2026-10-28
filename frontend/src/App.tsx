import React, { useState, useEffect, useCallback } from 'react';
import { CustomerProfile, AnalysisResultResponse, FinancialGoal } from './types';
import { ApiService } from './services/api';
import { Header } from './components/Header';
import { StepperNav } from './components/StepperNav';
import { CustomerForm } from './components/CustomerForm';
import { LifeGoalsManager } from './components/LifeGoalsManager';
import { KeyMetricsGrid } from './components/KeyMetricsGrid';
import { RetirementAnalysisCard } from './components/RetirementAnalysisCard';
import { GoalsSummaryTable } from './components/GoalsSummaryTable';
import { ActionRecommendations } from './components/ActionRecommendations';
import { AiAdvisorCopilot } from './components/AiAdvisorCopilot';
import { AdvisorReportShare } from './components/AdvisorReportShare';
import { CalculationBreakdownModal } from './components/CalculationBreakdownModal';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { ClientManagerModal } from './components/ClientManagerModal';
import { AlertCircle, RefreshCw, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'axis_max_life_clients_cache_v3';

const DEFAULT_RAHUL_MEHTA: CustomerProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Rahul Mehta',
  age: 32,
  occupation: 'Senior IT Consultant',
  dependantsCount: 2,
  monthlyIncome: 85000,
  monthlyExpenses: 48000,
  monthlyEmi: 12000,
  existingSavings: 250000,
  existingLiabilities: 0,
  existingInsuranceCover: 2000000, // ₹20 Lakhs
  primaryGoal: 'Family Protection & Child Education',
  goalTimeline: 15,
  goals: [
    {
      id: '00000000-0000-0000-0000-000000000011',
      customerId: '00000000-0000-0000-0000-000000000001',
      category: 'RETIREMENT',
      name: 'Comfortable Retirement at 58',
      targetAge: 58,
      targetYears: 26,
      targetAmount: 40000,
      inflationRate: 6.0,
      expectedReturnPre: 10.0,
      expectedReturnPost: 7.0,
      existingSavings: 50000,
      monthlyContribution: 3000,
      priority: 'HIGH',
      planningHorizonAge: 80,
      metadata: { desiredMonthlyExpenses: 40000 }
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      customerId: '00000000-0000-0000-0000-000000000001',
      category: 'EDUCATION',
      name: 'Child College / Higher Education',
      targetAge: 18,
      targetYears: 14,
      targetAmount: 2500000,
      inflationRate: 8.0,
      expectedReturnPre: 10.0,
      existingSavings: 100000,
      monthlyContribution: 2000,
      priority: 'HIGH',
      metadata: { childCurrentAge: 4, collegeAge: 18 }
    }
  ],
  riskAppetite: 'MODERATE',
  notes: 'Benchmark customer: Income ₹85,000, Expenses ₹48,000, EMI ₹12,000, Savings ₹2,50,000, Cover ₹20,00,000, 2 Dependants.'
};

export const App: React.FC = () => {
  // Stepper: 1 (Profile) | 2 (Goals) | 3 (Analysis) | 4 (Report)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Initialize from localStorage if available to guarantee refresh survival
  const [clients, setClients] = useState<CustomerProfile[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [DEFAULT_RAHUL_MEHTA];
  });

  const [currentCustomer, setCurrentCustomer] = useState<CustomerProfile>(() => {
    return clients[0] || DEFAULT_RAHUL_MEHTA;
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResultResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; storageMode: string }>({
    connected: false,
    storageMode: 'LOCAL_BROWSER'
  });

  // Modals state
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [selectedCalcField, setSelectedCalcField] = useState('monthlyCommitments');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [clientManagerOpen, setClientManagerOpen] = useState(false);

  // Sync clients to localStorage
  const persistClientsLocally = (clientList: CustomerProfile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientList));
    } catch {
      // ignore storage quota issues
    }
  };

  // Load clients on initial mount from API and sync
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const health = await ApiService.checkHealth();
        if (health && health.database) {
          setDbStatus({
            connected: health.database.connected,
            storageMode: health.database.storageMode
          });
        }
        const loadedClients = await ApiService.getClients();
        if (loadedClients && loadedClients.length > 0) {
          setClients(loadedClients);
          persistClientsLocally(loadedClients);
          const active = loadedClients.find(c => c.id === currentCustomer.id) || loadedClients[0];
          setCurrentCustomer(active);
        }
      } catch (err: any) {
        console.warn('Backend clients endpoint unavailable, relying on local storage cache:', err.message);
      }
    };
    fetchInitialData();
  }, []);

  // Trigger analysis immediately whenever currentCustomer changes
  const runAnalysis = useCallback(async (customer: CustomerProfile, forceDeterministic = false) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await ApiService.analyzeCustomer(customer, forceDeterministic);
      setAnalysisResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to complete financial analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    runAnalysis(currentCustomer);
  }, [currentCustomer, runAnalysis]);

  const handleCustomerChange = (updated: CustomerProfile) => {
    setCurrentCustomer(updated);
    // Also update in clients list locally
    setClients(prev => {
      const idx = prev.findIndex(c => c.id === updated.id);
      let nextList: CustomerProfile[];
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = updated;
      } else {
        nextList = [...prev, updated];
      }
      persistClientsLocally(nextList);
      return nextList;
    });
  };

  const handleUpdateGoals = (newGoals: FinancialGoal[]) => {
    const updated = {
      ...currentCustomer,
      goals: newGoals
    };
    handleCustomerChange(updated);
  };

  const handleSaveCustomer = async () => {
    setIsSaving(true);
    try {
      let saved = currentCustomer;
      try {
        saved = await ApiService.saveClient(currentCustomer);
      } catch (err) {
        console.warn('Remote save failed, using local browser persistence:', err);
      }

      setClients(prev => {
        const idx = prev.findIndex(c => c.id === saved.id || c.id === currentCustomer.id);
        const nextList = [...prev];
        if (idx >= 0) {
          nextList[idx] = saved;
        } else {
          nextList.push(saved);
        }
        persistClientsLocally(nextList);
        return nextList;
      });

      setCurrentCustomer(saved);
      setSuccessToast(`Client "${saved.name}" saved successfully to ${dbStatus.connected ? 'PostgreSQL 17' : 'Browser Storage'}.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setError(`Failed to save client: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerProfile) => {
    setCurrentCustomer(customer);
    setSuccessToast(`Loaded profile: ${customer.name}`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await ApiService.deleteClient(id).catch(() => {});
      const remaining = clients.filter(c => c.id !== id);
      const nextList = remaining.length > 0 ? remaining : [DEFAULT_RAHUL_MEHTA];
      setClients(nextList);
      persistClientsLocally(nextList);
      if (currentCustomer.id === id) {
        setCurrentCustomer(nextList[0]);
      }
      setSuccessToast('Client profile deleted.');
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err: any) {
      setError(`Failed to delete client: ${err.message}`);
    }
  };

  const handleCreateNewClient = () => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
    const newClient: CustomerProfile = {
      id: newId,
      name: 'New Customer',
      age: 35,
      occupation: 'Salaried Professional',
      dependantsCount: 1,
      monthlyIncome: 100000,
      monthlyExpenses: 50000,
      monthlyEmi: 15000,
      existingSavings: 300000,
      existingLiabilities: 0,
      existingInsuranceCover: 2500000,
      goals: [],
      riskAppetite: 'MODERATE',
      notes: 'New client consultation draft'
    };
    setCurrentCustomer(newClient);
    setClients(prev => {
      const nextList = [...prev, newClient];
      persistClientsLocally(nextList);
      return nextList;
    });
    setCurrentStep(1);
    setSuccessToast('Created new client profile.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleResetDefaults = async () => {
    try {
      let fresh = [DEFAULT_RAHUL_MEHTA];
      try {
        fresh = await ApiService.resetClients();
      } catch {
        // fallback
      }
      setClients(fresh);
      persistClientsLocally(fresh);
      setCurrentCustomer(fresh[0] || DEFAULT_RAHUL_MEHTA);
      setCurrentStep(1);
      setSuccessToast('Reset to factory benchmark sample: Rahul Mehta');
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err: any) {
      setError(`Reset failed: ${err.message}`);
    }
  };

  const handleOpenCalculationAudit = (fieldName: string) => {
    setSelectedCalcField(fieldName);
    setCalcModalOpen(true);
  };

  const handleRefreshAiInsights = () => {
    runAnalysis(currentCustomer, false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        currentCustomer={currentCustomer}
        clients={clients}
        onSelectCustomer={handleSelectCustomer}
        onOpenClientManager={() => setClientManagerOpen(true)}
        onOpenExportModal={() => setCurrentStep(4)}
        onPrint={handlePrint}
        isLiveAi={Boolean(analysisResult?.aiInsights?.isLiveAi)}
        onResetDefaults={handleResetDefaults}
        dbStatus={dbStatus}
      />

      {/* 4-Step Progress Navigation Bar */}
      <div className="no-print">
        <StepperNav
          currentStep={currentStep}
          onStepChange={(step) => setCurrentStep(step)}
          completedSteps={[1, 2, 3].filter(s => s < currentStep)}
        />
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between no-print">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => runAnalysis(currentCustomer)}
              className="text-red-700 underline font-semibold hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            SCREEN 1: Customer Profile and Financial Health
           ========================================================================= */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className="lg:col-span-8 space-y-6">
              <CustomerForm
                customer={currentCustomer}
                onChange={handleCustomerChange}
                onSaveCustomer={handleSaveCustomer}
                onResetCustomer={() => {
                  const found = clients.find(c => c.id === currentCustomer.id);
                  if (found) setCurrentCustomer({ ...found });
                }}
                isSaving={isSaving}
                onProceedToGoals={() => setCurrentStep(2)}
              />
            </div>

            {/* Sidebar: Interview Scenarios & Live Cashflow Snapshot */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Health Summary Card */}
              {analysisResult && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Financial Health Snapshot
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Monthly In-hand:</span>
                      <span className="font-bold text-emerald-700">₹{currentCustomer.monthlyIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Living Expenses + EMIs:</span>
                      <span className="font-bold text-slate-800">
                        ₹{((currentCustomer.monthlyExpenses || 0) + (currentCustomer.monthlyEmi || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Net Monthly Surplus:</span>
                      <span className="font-extrabold text-axis-burgundy">
                        ₹{(currentCustomer.monthlyIncome - ((currentCustomer.monthlyExpenses || 0) + (currentCustomer.monthlyEmi || 0))).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Liquid Savings Runway:</span>
                      <span className="font-bold text-blue-700">{analysisResult.analysis.currentSavingsCoverageMonths} Months</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full mt-2 py-2.5 bg-axis-burgundy text-white hover:bg-axis-burgundy/95 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Proceed to Life Goals (Screen 2)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Demo Scenario Switcher Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Demo Customer Profiles:</span>
                  <span className="text-[10px] text-slate-400">One-click test switch</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {clients.map(c => {
                    const commitments = (c.monthlyExpenses || 0) + (c.monthlyEmi || 0);
                    const surplus = (c.monthlyIncome || 0) - commitments;
                    const isSelected = c.id === currentCustomer.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'border-axis-burgundy bg-rose-50/50 font-bold text-axis-burgundy ring-1 ring-axis-burgundy'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="block font-semibold">{c.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Age {c.age} &bull; Inc: ₹{(c.monthlyIncome / 1000).toFixed(0)}k | Cover: ₹{(c.existingInsuranceCover / 100000).toFixed(0)}L
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200">
                          {c.id.includes('rahul') || c.name === 'Rahul Mehta' ? 'Benchmark' : surplus < 0 ? 'Deficit' : 'Affluent'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: Life Goals and Financial Planning
           ========================================================================= */}
        {currentStep === 2 && (
          <LifeGoalsManager
            customer={currentCustomer}
            onUpdateGoals={handleUpdateGoals}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            onSaveCustomer={handleSaveCustomer}
            isSaving={isSaving}
          />
        )}

        {/* =========================================================================
            SCREEN 3: Goal Calculations and AI Analysis
           ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Top Stepper Bar for Screen 3 */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Life Goals</span>
              </button>

              <div className="text-xs text-slate-500 font-medium">
                Analysis for: <strong>{currentCustomer.name}</strong> (Age {currentCustomer.age})
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 bg-axis-burgundy text-white hover:bg-axis-burgundy/90 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <span>Proceed to Shareable Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {analysisResult ? (
              <>
                {/* 1. Six Core Financial Health Benchmarks */}
                <KeyMetricsGrid
                  analysis={analysisResult.analysis}
                  onOpenCalculationModal={handleOpenCalculationAudit}
                />

                {/* 2. Retirement Planning Deep-Dive Card (if retirement goal is present) */}
                {analysisResult.analysis.retirementDetail && (
                  <RetirementAnalysisCard
                    detail={analysisResult.analysis.retirementDetail}
                    onExplainCalculation={handleOpenCalculationAudit}
                  />
                )}

                {/* 3. Milestone Life Goals Summary & Gap Table */}
                {analysisResult.analysis.goalsAnalysis && analysisResult.analysis.goalsAnalysis.length > 0 && (
                  <GoalsSummaryTable
                    goalsAnalysis={analysisResult.analysis.goalsAnalysis}
                    monthlySurplus={analysisResult.analysis.monthlySurplus}
                    totalRequiredMonthlySavings={analysisResult.analysis.totalRequiredMonthlySavingsForGoals}
                    onExplainCalculation={handleOpenCalculationAudit}
                  />
                )}

                {/* 4. AI Advisor Copilot */}
                <AiAdvisorCopilot
                  insights={analysisResult.aiInsights}
                  onRefresh={handleRefreshAiInsights}
                  isLoading={isAnalyzing}
                />

                {/* 5. Prioritized Action Recommendations */}
                <ActionRecommendations
                  recommendations={analysisResult.recommendations}
                />
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-axis-burgundy animate-spin" />
                <h3 className="text-sm font-bold text-slate-800">Calculating Financial Need Analysis...</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Computing retirement annuity due projections, inflation-adjusted future costs, and priority action recommendations.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SCREEN 4: Shareable Advisor Report
           ========================================================================= */}
        {currentStep === 4 && analysisResult && (
          <AdvisorReportShare
            customer={currentCustomer}
            analysisResult={analysisResult}
            onBackToAnalysis={() => setCurrentStep(3)}
            onNavigateToStep={(step) => setCurrentStep(step)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Axis Max Life Insurance Need Analysis Tool &bull; Multi-Screen Life Goals Advisory Suite</span>
          <span className="text-[11px] text-slate-400">
            Fiduciary-ready architecture with deterministic math and transparent actuarial models
          </span>
        </div>
      </footer>

      {/* Modals */}
      {analysisResult && (
        <>
          <CalculationBreakdownModal
            analysis={analysisResult.analysis}
            initialFieldKey={selectedCalcField}
            isOpen={calcModalOpen}
            onClose={() => setCalcModalOpen(false)}
          />

          <ExportSummaryModal
            data={analysisResult}
            isOpen={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            onPrint={handlePrint}
          />
        </>
      )}

      <ClientManagerModal
        clients={clients}
        currentClientId={currentCustomer.id}
        isOpen={clientManagerOpen}
        onClose={() => setClientManagerOpen(false)}
        onSelectClient={handleSelectCustomer}
        onDeleteClient={handleDeleteClient}
        onCreateNewClient={handleCreateNewClient}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};

export default App;
