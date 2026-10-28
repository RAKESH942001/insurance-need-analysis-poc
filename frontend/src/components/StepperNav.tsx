import React from 'react';
import { User, Target, Cpu, FileText, Check } from 'lucide-react';

interface StepperNavProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  completedSteps?: number[];
}

export const StepperNav: React.FC<StepperNavProps> = ({
  currentStep,
  onStepChange,
  completedSteps = []
}) => {
  const steps = [
    {
      number: 1,
      title: 'Profile & Finances',
      subtitle: 'Income, EMIs & Cover',
      icon: User
    },
    {
      number: 2,
      title: 'Life Goals',
      subtitle: 'Retirement & Education',
      icon: Target
    },
    {
      number: 3,
      title: 'AI Need Analysis',
      subtitle: 'Gaps, Math & Insights',
      icon: Cpu
    },
    {
      number: 4,
      title: 'Advisor Report',
      subtitle: 'Share & Print PDF',
      icon: FileText
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        <nav aria-label="Progress">
          <ol className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {steps.map((step) => {
              const isCurrent = currentStep === step.number;
              const isCompleted = completedSteps.includes(step.number) || currentStep > step.number;
              const Icon = step.icon;

              return (
                <li key={step.number} className="relative">
                  <button
                    type="button"
                    onClick={() => onStepChange(step.number)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center space-x-3 cursor-pointer ${
                      isCurrent
                        ? 'border-axis-burgundy bg-axis-burgundy/5 ring-2 ring-axis-burgundy/20 shadow-xs'
                        : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-500'
                    }`}
                  >
                    {/* Step Icon Badge */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 font-semibold text-xs transition-colors ${
                        isCurrent
                          ? 'bg-axis-burgundy text-white shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent ? 'text-axis-burgundy' : isCompleted ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          Screen {step.number}
                        </span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-axis-burgundy animate-pulse" />
                        )}
                      </div>
                      <div className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate hidden sm:block">
                        {step.subtitle}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};

