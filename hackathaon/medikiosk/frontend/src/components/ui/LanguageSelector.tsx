import React from 'react';
import { Languages, Globe } from 'lucide-react';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'கன்னட / ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (code: string) => void;
  className?: string;
  variant?: 'select' | 'pills';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  variant = 'select',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-2 overflow-x-auto py-1 ${className}`}>
        <Languages className="w-5 h-5 text-slate-500 shrink-0" />
        {INDIAN_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onLanguageChange(lang.code)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-bold transition-all shrink-0 cursor-pointer ${
              currentLanguage === lang.code
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="absolute left-3.5 pointer-events-none text-teal-700 flex items-center justify-center">
        <Globe className="w-5 h-5" />
      </div>

      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select Language"
        className="min-h-[48px] pl-10 pr-9 bg-teal-50 hover:bg-teal-100 border-2 border-teal-300 text-teal-900 text-base font-bold rounded-xl outline-none focus:ring-4 focus:ring-teal-500/20 transition-all cursor-pointer appearance-none"
      >
        {INDIAN_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-slate-900 font-semibold py-1">
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>

      <div className="absolute right-3 pointer-events-none text-teal-700 text-xs">
        ▼
      </div>
    </div>
  );
};
