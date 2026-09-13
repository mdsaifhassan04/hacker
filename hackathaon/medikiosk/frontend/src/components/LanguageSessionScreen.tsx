import React from 'react';
import { Button, Header, INDIAN_LANGUAGES } from './ui';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Volume2 } from 'lucide-react';

export interface LanguageSessionScreenProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const LanguageSessionScreen: React.FC<LanguageSessionScreenProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onBack,
  onContinue,
}) => {
  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === selectedLanguage) || INDIAN_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Kiosk Header */}
      <Header
        hospitalName="AIIMS New Delhi OPD"
        kioskId="Kiosk #01 - Session Start"
      />

      {/* Main Content */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="md"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back / वापस
          </Button>

          <div className="flex items-center gap-2 text-sm font-bold text-teal-800 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200">
            <Globe className="w-4 h-4 text-teal-600" />
            <span>Session Language / भाषा</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Select Your Language / अपनी भाषा चुनें
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Choose the language you prefer for voice guidance and symptom recording.
          </p>
        </div>

        {/* Large Accessible Language Selection Grid (Kiosk Touch Optimized) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {INDIAN_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className={`min-h-[110px] p-5 rounded-3xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20 ring-4 ring-teal-500/30'
                    : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {lang.nativeName}
                  </span>
                  {isSelected && <CheckCircle2 className="w-6 h-6 text-teal-200 shrink-0" />}
                </div>

                <div className="flex items-center justify-between w-full pt-2 border-t border-current/10">
                  <span className={`text-sm font-bold ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                    {lang.name}
                  </span>
                  <Volume2 className={`w-4 h-4 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirmation Summary Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Language</span>
            <h4 className="text-2xl font-extrabold text-slate-900">
              {currentLangObj.nativeName} ({currentLangObj.name})
            </h4>
            <p className="text-sm text-slate-500">
              MediKiosk will display instructions and accept voice input in {currentLangObj.name}.
            </p>
          </div>

          <Button
            size="xl"
            variant="primary"
            onClick={onContinue}
            rightIcon={<ArrowRight className="w-6 h-6" />}
            className="w-full sm:w-auto min-w-[240px] shadow-lg shadow-teal-600/20"
          >
            Continue / आगे बढ़ें
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>Press any language card to change audio & text output • Smart India Hackathon 2026</p>
      </footer>
    </div>
  );
};
