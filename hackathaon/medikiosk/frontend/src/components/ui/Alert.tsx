import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-blue-50 border-blue-300 text-blue-900',
      icon: <Info className="w-6 h-6 text-blue-600 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-300 text-amber-900',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />,
    },
    error: {
      container: 'bg-rose-50 border-rose-300 text-rose-900',
      icon: <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />,
    },
  };

  const currentVariant = styles[variant];

  return (
    <div className={`p-5 rounded-2xl border-2 flex items-start justify-between gap-4 transition-all shadow-sm ${currentVariant.container} ${className}`} role="alert">
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5">{currentVariant.icon}</div>
        <div className="space-y-1">
          {title && <h4 className="font-extrabold text-lg tracking-tight">{title}</h4>}
          <div className="text-base leading-relaxed font-medium">{children}</div>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-10 h-10 rounded-xl hover:bg-black/5 active:bg-black/10 flex items-center justify-center transition-all cursor-pointer text-slate-500 shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
