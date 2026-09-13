import React, { useState } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Button, Header, ProgressBar, VoiceButton } from './ui';
import { PatientSession } from '../types/session';
import { VoiceInputModal } from './VoiceInputModal';
import { ArrowLeft, ArrowRight, Activity, Flame, HeartPulse, Stethoscope, Brain, Sparkles, MessageSquare } from 'lucide-react';

export interface ChiefComplaintScreenProps {
  session: PatientSession;
  onBack: () => void;
  onSaveComplaint: (complaintText: string) => void;
}

export const ChiefComplaintScreen: React.FC<ChiefComplaintScreenProps> = ({
  session,
  onBack,
  onSaveComplaint,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [complaintText, setComplaintText] = useState(session.chiefComplaint || '');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, label: t('navigation.step_1') },
    { id: 2, label: t('navigation.step_2') },
    { id: 3, label: t('navigation.step_3') },
    { id: 4, label: t('navigation.step_4') },
  ];

  // Common quick chips with icons
  const commonChips = [
    { id: 'chest_pain', label: t('chief_complaint.chest_pain'), icon: <HeartPulse className="w-5 h-5 text-rose-500" /> },
    { id: 'fever', label: t('chief_complaint.fever'), icon: <Flame className="w-5 h-5 text-amber-500" /> },
    { id: 'abdominal_pain', label: t('chief_complaint.abdominal_pain'), icon: <Activity className="w-5 h-5 text-indigo-500" /> },
    { id: 'cough_breathing', label: t('chief_complaint.cough_breathing'), icon: <Stethoscope className="w-5 h-5 text-teal-500" /> },
    { id: 'headache', label: t('chief_complaint.headache'), icon: <Brain className="w-5 h-5 text-purple-500" /> },
  ];

  const handleToggleChip = (chipLabel: string) => {
    let updated: string[];
    if (selectedChips.includes(chipLabel)) {
      updated = selectedChips.filter((c) => c !== chipLabel);
    } else {
      updated = [...selectedChips, chipLabel];
    }
    setSelectedChips(updated);
    setComplaintText(updated.join(', '));
    if (error) setError(null);
  };

  const handleVoiceConfirm = (recognizedTranscript: string) => {
    setComplaintText((prev) => (prev ? `${prev}, ${recognizedTranscript}` : recognizedTranscript));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalComplaint = complaintText.trim();
    if (!finalComplaint) {
      setError(t('errors.complaint_required'));
      return;
    }
    setError(null);
    onSaveComplaint(finalComplaint);
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
        <ProgressBar currentStep={4} steps={steps} />

        {/* Question Header & Voice Assistant Trigger */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>{t('chief_complaint.step_label')}</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {t('chief_complaint.question')}
              </h2>
              
              <p className="text-base text-slate-600 font-medium">
                {t('chief_complaint.subtitle')}
              </p>
            </div>

            {/* Voice Input Modal Trigger */}
            <VoiceButton
              isListening={isVoiceModalOpen}
              onToggle={() => setIsVoiceModalOpen(true)}
              size="lg"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* COMMON COMPLAINT CHIPS */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                {t('chief_complaint.quick_chips_label')}
              </label>

              <div className="flex items-center gap-3 flex-wrap">
                {commonChips.map((chip) => {
                  const isSelected = selectedChips.includes(chip.label);

                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleToggleChip(chip.label)}
                      className={`min-h-[56px] px-5 py-3 rounded-2xl font-extrabold text-base flex items-center gap-3 transition-all cursor-pointer select-none active:scale-[0.98] border-2 ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20'
                          : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-900 shadow-sm'
                      }`}
                    >
                      {chip.icon}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM COMPLAINT TEXT AREA */}
            <div className="space-y-2">
              <label className="block text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <span>{t('chief_complaint.custom_input_label')}</span>
              </label>

              <textarea
                value={complaintText}
                onChange={(e) => {
                  setComplaintText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('chief_complaint.custom_input_placeholder')}
                rows={4}
                className={`w-full p-5 text-xl text-slate-900 bg-white rounded-2xl border-2 ${
                  error
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-teal-500/20'
                } transition-all outline-none focus:ring-4 placeholder:text-slate-400 font-medium leading-relaxed resize-y`}
              />

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>🎤</span>
                <span>{t('chief_complaint.voice_instruction')}</span>
              </p>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* ACTION BAR */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onBack}
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              >
                {t('buttons.back')}
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="xl"
                rightIcon={<ArrowRight className="w-6 h-6" />}
                className="w-full sm:w-auto shadow-xl shadow-teal-600/30 border-2 border-teal-500"
              >
                {t('chief_complaint.continue_button')}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* VOICE INPUT MODAL WITH CONFIRMATION */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirm={handleVoiceConfirm}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>{t('welcome.footer_hint')}</p>
      </footer>
    </div>
  );
};
