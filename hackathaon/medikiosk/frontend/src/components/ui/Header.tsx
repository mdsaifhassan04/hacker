import React from 'react';
import { HeartPulse, PhoneCall, ShieldCheck } from 'lucide-react';

export interface HeaderProps {
  hospitalName?: string;
  kioskId?: string;
  languageSelector?: React.ReactNode;
  voiceTrigger?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  hospitalName = 'AIIMS New Delhi',
  kioskId = 'Kiosk #04 - OPD Main Lobby',
  languageSelector,
  voiceTrigger,
}) => {
  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Location Info */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">Medi<span className="text-teal-600">Kiosk</span></span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="text-slate-800 font-bold">{hospitalName}</span> • <span>{kioskId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Emergency Badge */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* Emergency Hotline Button */}
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-sm transition-all shrink-0"
          >
            <PhoneCall className="w-4 h-4 text-rose-600 animate-bounce" />
            <span>Emergency 108</span>
          </a>

          {/* Voice Assistant Slot */}
          {voiceTrigger}

          {/* Language Selector Slot */}
          {languageSelector}
        </div>
      </div>

      {/* Trust & Assistance Notice Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
        <span>Pre-consultation clinical data intake platform for fast-track OPD registration.</span>
      </div>
    </header>
  );
};
