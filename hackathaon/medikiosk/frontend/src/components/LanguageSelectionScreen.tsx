import React from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Button, Header } from './ui';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Volume2 } from 'lucide-react';

export interface LanguageSelectionScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const { language, setLanguage, t } = useTranslation();

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header hospitalName={t('header.hospital')} kioskId={t('header.kiosk_id')} />

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col justify-between">
        
        {/* Navigation Top Row */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="md"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            {t('buttons.back')}
          </Button>

          <div className="flex items-center gap-2 text-sm font-bold text-teal-800 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200">
            <Globe className="w-4 h-4 text-teal-600" />
            <span>{language === 'hi' ? 'भाषा चयन' : 'Language Selection'}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {t('language_select.title')}
          </h2>
          <p className="text-lg text-slate-600 font-medium">
            {t('language_select.subtitle')}
          </p>
        </div>

        {/* English & Hindi Primary Selection Buttons (Large Kiosk Touch Targets) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
          {/* English Button */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`min-h-[140px] p-6 rounded-3xl border-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
              language === 'en'
                ? 'bg-teal-600 border-teal-600 text-white shadow-2xl shadow-teal-600/30 ring-4 ring-teal-500/30'
                : 'bg-white border-slate-300 hover:border-teal-500 text-slate-900 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-3xl font-black tracking-tight">
                {t('language_select.english')}
              </span>
              {language === 'en' && <CheckCircle2 className="w-8 h-8 text-teal-200 shrink-0" />}
            </div>

            <div className="flex items-center justify-between w-full pt-3 border-t border-current/15">
              <span className={`text-base font-bold ${language === 'en' ? 'text-teal-100' : 'text-slate-500'}`}>
                {t('language_select.english_sub')}
              </span>
              <Volume2 className={`w-5 h-5 ${language === 'en' ? 'text-teal-200' : 'text-slate-400'}`} />
            </div>
          </button>

          {/* Hindi Button */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('hi')}
            className={`min-h-[140px] p-6 rounded-3xl border-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
              language === 'hi'
                ? 'bg-teal-600 border-teal-600 text-white shadow-2xl shadow-teal-600/30 ring-4 ring-teal-500/30'
                : 'bg-white border-slate-300 hover:border-teal-500 text-slate-900 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-3xl font-black tracking-tight">
                {t('language_select.hindi')}
              </span>
              {language === 'hi' && <CheckCircle2 className="w-8 h-8 text-teal-200 shrink-0" />}
            </div>

            <div className="flex items-center justify-between w-full pt-3 border-t border-current/15">
              <span className={`text-base font-bold ${language === 'hi' ? 'text-teal-100' : 'text-slate-500'}`}>
                {t('language_select.hindi_sub')}
              </span>
              <Volume2 className={`w-5 h-5 ${language === 'hi' ? 'text-teal-200' : 'text-slate-400'}`} />
            </div>
          </button>
        </div>

        {/* Selected Language Confirmation & Continue Action */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl mx-auto w-full">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('language_select.selected_label')}
            </span>
            <h4 className="text-2xl font-extrabold text-slate-900">
              {language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
            </h4>
            <p className="text-sm text-slate-500">
              {t('language_select.desc_text')}
            </p>
          </div>

          <Button
            size="xl"
            variant="primary"
            onClick={onContinue}
            rightIcon={<ArrowRight className="w-6 h-6" />}
            className="w-full sm:w-auto min-w-[220px] shadow-lg shadow-teal-600/20"
          >
            {t('buttons.continue')}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>{t('welcome.footer_hint')}</p>
      </footer>
    </div>
  );
};
