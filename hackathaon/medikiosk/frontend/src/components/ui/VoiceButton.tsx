import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  onToggle,
  label = 'Voice Assistant',
  className = '',
  size = 'lg',
}) => {
  const sizeClasses = {
    md: 'min-h-[48px] px-4 text-sm gap-2',
    lg: 'min-h-[56px] px-6 text-base gap-3',
    xl: 'min-h-[64px] px-8 text-lg gap-4 font-bold',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isListening}
      aria-label={label}
      className={`inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 cursor-pointer select-none border-2 ${
        isListening
          ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-600/30 ring-4 ring-rose-500/30 animate-pulse'
          : 'bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100 hover:border-teal-400 active:bg-teal-200 shadow-sm'
      } ${sizeClasses[size]} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isListening ? (
          <>
            <Mic className="w-6 h-6 text-white animate-bounce shrink-0" />
            <span className="absolute -inset-1 rounded-full bg-rose-400 opacity-75 animate-ping pointer-events-none" />
          </>
        ) : (
          <Mic className="w-6 h-6 text-teal-700 shrink-0" />
        )}
      </div>

      <span>{isListening ? 'Listening...' : label}</span>

      {isListening && <MicOff className="w-4 h-4 opacity-75 shrink-0" />}
    </button>
  );
};
