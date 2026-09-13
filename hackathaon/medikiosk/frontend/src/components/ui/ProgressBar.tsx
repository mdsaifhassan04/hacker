import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: string | number;
  label: string;
}

export interface ProgressBarProps {
  currentStep: number;
  steps: Step[];
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  steps,
  className = '',
}) => {
  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100));

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Top Track & Progress Bar */}
      <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center min-w-[70px] text-center space-y-1.5 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${
                  isCompleted
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : isCurrent
                    ? 'bg-white border-teal-600 text-teal-700 shadow-md ring-4 ring-teal-500/20'
                    : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : stepNumber}
              </div>
              
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 ${
                  isCurrent ? 'text-teal-800 font-extrabold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
