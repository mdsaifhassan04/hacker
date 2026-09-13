import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Button, Header } from './ui';
import { Play, Mic, Clock, ShieldCheck, HeartPulse } from 'lucide-react';

export interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans selection:bg-teal-500 selection:text-white">
      {/* Real Hospital Kiosk Header */}
      <Header
        hospitalName={t('header.hospital')}
        kioskId={t('header.kiosk_id')}
        languageSelector={
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                language === 'en' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                language === 'hi' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        }
      />

      {/* Main Kiosk Welcome Banner */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-between items-center text-center space-y-8">
        
        {/* Kiosk Hero Title Section */}
        <div className="space-y-4 max-w-4xl pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-bold tracking-wide">
            <HeartPulse className="w-4 h-4 text-teal-400" />
            <span>{t('welcome.badge')}</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase font-mono">
            {t('welcome.title')}
          </h1>

          <p className="text-xl sm:text-3xl text-slate-200 font-bold max-w-3xl mx-auto leading-snug">
            "{t('welcome.tagline')}"
          </p>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Feature Highlights for Kiosk Patients */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">{t('welcome.voice_feature')}</h3>
            <p className="text-sm text-slate-300">{t('welcome.voice_desc')}</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">{t('welcome.time_feature')}</h3>
            <p className="text-sm text-slate-300">{t('welcome.time_desc')}</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">{t('welcome.privacy_feature')}</h3>
            <p className="text-sm text-slate-300">{t('welcome.privacy_desc')}</p>
          </div>
        </div>

        {/* Language Selection Row */}
        <div className="w-full max-w-md bg-slate-800/90 p-4 rounded-3xl border border-slate-700 space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            {t('language_select.title')}
          </label>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-teal-600 text-white shadow-lg ring-2 ring-teal-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-teal-600 text-white shadow-lg ring-2 ring-teal-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Primary Action - LARGE START BUTTON */}
        <div className="w-full max-w-xl pb-6">
          <Button
            size="xl"
            variant="primary"
            fullWidth={true}
            onClick={onStart}
            rightIcon={<Play className="w-8 h-8 fill-current" />}
            className="min-h-[72px] text-2xl tracking-wide uppercase shadow-2xl shadow-teal-500/30 hover:scale-[1.01] active:scale-[0.99] border-2 border-teal-400"
          >
            {t('welcome.start_button')}
          </Button>
          <p className="text-xs text-slate-400 mt-3 font-semibold">
            {t('welcome.footer_hint')}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 MediKiosk — Smart India Hackathon 2026</p>
        <p className="font-mono text-teal-400">Touchscreen Kiosk Terminal #01 • OPD Registration</p>
      </footer>
    </div>
  );
};
