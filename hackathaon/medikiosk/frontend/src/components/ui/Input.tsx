import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-lg font-bold text-slate-800 tracking-tight">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`w-full min-h-[56px] px-5 text-lg text-slate-900 bg-white rounded-2xl border-2 ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-teal-500/20'
          } ${leftIcon ? 'pl-13' : ''} ${rightIcon ? 'pr-13' : ''} transition-all outline-none focus:ring-4 placeholder:text-slate-400 font-medium ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-4 text-slate-400 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm font-semibold text-rose-600 flex items-center gap-1.5 mt-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-sm text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
