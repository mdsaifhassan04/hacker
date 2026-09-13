import React from 'react';
import { AlertOctagon, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'We encountered an error loading your intake session. Please try again or seek assistance at the OPD desk.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-rose-50/70 border-2 border-rose-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6 ${className}`}>
      <div className="w-20 h-20 rounded-3xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-rose-600 shadow-md">
        <AlertOctagon className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-lg">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
        {onRetry && (
          <Button variant="primary" size="lg" onClick={onRetry} leftIcon={<RefreshCw className="w-5 h-5" />}>
            Try Again
          </Button>
        )}
        <Button variant="outline" size="lg" leftIcon={<HelpCircle className="w-5 h-5 text-slate-600" />}>
          Ask Kiosk Helpdesk
        </Button>
      </div>
    </div>
  );
};
