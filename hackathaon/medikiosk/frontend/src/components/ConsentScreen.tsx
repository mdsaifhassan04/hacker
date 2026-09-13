import React, { useState, useEffect } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Button, Header, Modal, ProgressBar } from './ui';
import { PatientSession, ConsentRecord } from '../types/session';
import { Volume2, VolumeX, CheckCircle, XCircle, ShieldCheck, Stethoscope, Cpu, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';

export interface ConsentScreenProps {
  session: PatientSession;
  onBack: () => void;
  onConsentAccepted: (consent: ConsentRecord) => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  session,
  onBack,
  onConsentAccepted,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [isReading, setIsReading] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, label: t('navigation.step_1') },
    { id: 2, label: t('navigation.step_2') },
    { id: 3, label: t('navigation.step_3') },
    { id: 4, label: t('navigation.step_4') },
  ];

  // Clean up Web Speech Synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported in this browser environment.');
      return;
    }

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const textToRead = `
      ${t('consent.title')}.
      ${t('consent.info_collected_title')}: ${t('consent.info_collected_desc')}.
      ${t('consent.why_collected_title')}: ${t('consent.why_collected_desc')}.
      ${t('consent.ai_role_title')}: ${t('consent.ai_role_desc')}.
      ${t('consent.doctor_review_title')}: ${t('consent.doctor_review_desc')}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;

    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    setIsReading(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const postConsentToAPI = async (status: 'ACCEPTED' | 'DECLINED'): Promise<ConsentRecord> => {
    const record: ConsentRecord = {
      sessionId: session.sessionId,
      consentStatus: status,
      timestamp: new Date().toISOString(),
      consentVersion: 'v1.0-SIH2026',
    };

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      await fetch(`${apiBaseUrl}/api/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch {
      // Graceful fallback for demo when backend is offline
    }

    return record;
  };

  const handleAgree = async () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
    setIsSubmitting(true);

    const consentData = await postConsentToAPI('ACCEPTED');
    setIsSubmitting(false);
    onConsentAccepted(consentData);
  };

  const handleDeclineClick = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
    setIsDeclineModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header
        hospitalName={t('header.hospital')}
        kioskId={t('header.kiosk_id')}
        languageSelector={
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="min-h-[44px] px-3 bg-teal-50 border border-teal-300 rounded-xl text-teal-900 font-bold text-sm outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        }
      />

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Step Progress Bar */}
        <ProgressBar currentStep={3} steps={steps} />

        {/* Title & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>{t('consent.step_label')}</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('consent.title')}
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              {t('consent.subtitle')}
            </p>
          </div>

          {/* READ ALOUD BUTTON */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReadAloud}
            leftIcon={isReading ? <VolumeX className="w-5 h-5 text-rose-600" /> : <Volume2 className="w-5 h-5 text-teal-600" />}
            className={isReading ? 'border-rose-400 bg-rose-50 text-rose-700 animate-pulse' : 'border-teal-300 bg-teal-50 text-teal-900'}
          >
            {isReading ? t('consent.stop_reading') : t('consent.read_aloud')}
          </Button>
        </div>

        {/* 4 CLEAR INFORMATIONAL CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1: What Info Collected */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">{t('consent.info_collected_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {t('consent.info_collected_desc')}
            </p>
          </div>

          {/* Card 2: Why Info Collected */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">{t('consent.why_collected_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {t('consent.why_collected_desc')}
            </p>
          </div>

          {/* Card 3: Role of AI */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">{t('consent.ai_role_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {t('consent.ai_role_desc')}
            </p>
          </div>

          {/* Card 4: Doctor Review */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">{t('consent.doctor_review_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {t('consent.doctor_review_desc')}
            </p>
          </div>
        </div>

        {/* Consent Protocol Version Note */}
        <div className="px-4 py-2 bg-slate-200/60 rounded-xl text-center text-xs text-slate-500 font-mono">
          {t('consent.version_label')}: <span className="font-bold text-slate-700">v1.0-SIH2026</span> • Session ID: <span className="font-bold text-slate-700">{session.sessionId}</span>
        </div>

        {/* PRIMARY CONSENT ACTION BUTTONS */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            {t('buttons.back')}
          </Button>

          <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
            {/* DECLINE BUTTON */}
            <Button
              type="button"
              variant="danger"
              size="xl"
              onClick={handleDeclineClick}
              leftIcon={<XCircle className="w-6 h-6" />}
              className="flex-1 sm:flex-none"
            >
              {t('consent.decline_button')}
            </Button>

            {/* AGREE BUTTON */}
            <Button
              type="button"
              variant="primary"
              size="xl"
              isLoading={isSubmitting}
              onClick={handleAgree}
              leftIcon={<CheckCircle className="w-6 h-6" />}
              className="flex-1 sm:flex-none shadow-xl shadow-teal-600/30 border-2 border-teal-500"
            >
              {t('consent.agree_button')}
            </Button>
          </div>
        </div>
      </main>

      {/* DECLINED CONSENT WARNING MODAL */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        title={t('consent.decline_modal_title')}
        description={t('consent.decline_modal_desc')}
        footer={
          <div className="flex items-center gap-3 w-full justify-between flex-wrap">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setIsDeclineModalOpen(false);
                onBack();
              }}
            >
              {t('consent.manual_counter')}
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setIsDeclineModalOpen(false);
                handleAgree();
              }}
              leftIcon={<CheckCircle className="w-5 h-5" />}
            >
              {t('consent.retry_consent')}
            </Button>
          </div>
        }
      >
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-extrabold text-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <span>Consent is mandatory for MediKiosk automated intake.</span>
          </div>
          <ul className="text-sm font-medium space-y-2 list-disc pl-5 text-amber-900">
            <li>{t('consent.decline_advice_1')}</li>
            <li>{t('consent.decline_advice_2')}</li>
          </ul>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>{t('welcome.footer_hint')}</p>
      </footer>
    </div>
  );
};
