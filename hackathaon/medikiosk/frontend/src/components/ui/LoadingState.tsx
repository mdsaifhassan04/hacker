import React from 'react';
import { Loader2, HeartPulse } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading MediKiosk System...',
  submessage = 'Please wait while we prepare your clinical intake setup.',
  className = '',
}) => {
  return (
    <div className={`p-10 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-600 shadow-lg shadow-teal-500/10">
          <HeartPulse className="w-10 h-10 animate-pulse" />
        </div>
        <Loader2 className="absolute -inset-2 w-24 h-24 text-teal-600 animate-spin opacity-40" />
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{message}</h3>
        {submessage && <p className="text-base text-slate-600 font-medium leading-relaxed">{submessage}</p>}
      </div>

      {/* Skeleton Loading Card Mock */}
      <div className="w-full max-w-lg space-y-3 pt-4">
        <div className="h-4 bg-slate-200 rounded-full w-3/4 animate-pulse mx-auto" />
        <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse mx-auto" />
      </div>
    </div>
  );
};
