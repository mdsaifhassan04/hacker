import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  helperText,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={selectId} className="block text-lg font-bold text-slate-800 tracking-tight">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full min-h-[56px] pl-5 pr-12 text-lg text-slate-900 bg-white rounded-2xl border-2 ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-teal-500/20'
          } appearance-none transition-all outline-none focus:ring-4 font-medium cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="py-2 text-base text-slate-900">
              {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
            </option>
          ))}
        </select>

        <div className="absolute right-4 pointer-events-none text-slate-500 flex items-center justify-center">
          <ChevronDown className="w-6 h-6" />
        </div>
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

Select.displayName = 'Select';
