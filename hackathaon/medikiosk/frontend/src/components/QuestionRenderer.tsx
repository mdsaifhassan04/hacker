import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { QuestionDefinition, ClinicalResponse } from '../types/questionnaire';
import { Button, VoiceButton } from './ui';
import { VoiceInputModal } from './VoiceInputModal';
import { Volume2, VolumeX, ArrowLeft, ArrowRight, CheckCircle2, Edit3 } from 'lucide-react';

export interface QuestionRendererProps {
  question: QuestionDefinition;
  historyResponses: ClinicalResponse[];
  currentResponse?: ClinicalResponse;
  onAnswerSubmit: (response: ClinicalResponse) => void;
  onBack: () => void;
  onChangeAnswerClick: () => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  historyResponses,
  currentResponse,
  onAnswerSubmit,
  onBack,
  onChangeAnswerClick,
}) => {
  const { t, language } = useTranslation();
  const isHi = language === 'hi';

  const questionText = isHi ? question.questionTextHi : question.questionTextEn;

  // Local state for current question input
  const [selectedSingle, setSelectedSingle] = useState<string>(
    currentResponse ? String(currentResponse.answer) : ''
  );
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>(
    currentResponse && Array.isArray(currentResponse.answer) ? currentResponse.answer : []
  );
  const [severityVal, setSeverityVal] = useState<number>(
    currentResponse && typeof currentResponse.answer === 'number' ? currentResponse.answer : 5
  );
  const [textVal, setTextVal] = useState<string>(
    currentResponse ? String(currentResponse.answer) : ''
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if question or currentResponse changes
  useEffect(() => {
    setSelectedSingle(currentResponse ? String(currentResponse.answer) : '');
    setSelectedMultiple(currentResponse && Array.isArray(currentResponse.answer) ? currentResponse.answer : []);
    setSeverityVal(currentResponse && typeof currentResponse.answer === 'number' ? currentResponse.answer : 5);
    setTextVal(currentResponse ? String(currentResponse.answer) : '');
    setError(null);
  }, [question.id, currentResponse]);

  // Clean up Speech Synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleRepeatQuestion = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = isHi ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceConfirmText = (transcript: string) => {
    setTextVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
    setError(null);
  };

  const handleNextSubmit = () => {
    let answerVal: any = null;
    let displayEn = '';
    let displayHi = '';

    if (question.type === 'yes_no') {
      if (!selectedSingle) {
        setError(isHi ? 'कृपया एक विकल्प चुनें' : 'Please select an option');
        return;
      }
      answerVal = selectedSingle;
      displayEn = selectedSingle === 'yes' ? 'Yes' : 'No';
      displayHi = selectedSingle === 'yes' ? 'हाँ' : 'नहीं';
    } else if (question.type === 'single_choice' || question.type === 'duration') {
      if (!selectedSingle) {
        setError(isHi ? 'कृपया एक विकल्प चुनें' : 'Please select an option');
        return;
      }
      answerVal = selectedSingle;
      const opt = question.options?.find((o) => o.value === selectedSingle);
      displayEn = opt ? opt.labelEn : selectedSingle;
      displayHi = opt ? opt.labelHi : selectedSingle;
    } else if (question.type === 'multiple_choice') {
      if (selectedMultiple.length === 0) {
        setError(isHi ? 'कृपया कम से कम एक विकल्प चुनें' : 'Please select at least one option');
        return;
      }
      answerVal = selectedMultiple;
      const selectedOpts = question.options?.filter((o) => selectedMultiple.includes(o.value));
      displayEn = selectedOpts ? selectedOpts.map((o) => o.labelEn).join(', ') : selectedMultiple.join(', ');
      displayHi = selectedOpts ? selectedOpts.map((o) => o.labelHi).join(', ') : selectedMultiple.join(', ');
    } else if (question.type === 'severity') {
      answerVal = severityVal;
      displayEn = `${severityVal} / 10`;
      displayHi = `${severityVal} / 10`;
    } else if (question.type === 'text') {
      if (!textVal.trim()) {
        setError(isHi ? 'कृपया उत्तर दर्ज करें' : 'Please enter an answer');
        return;
      }
      answerVal = textVal.trim();
      displayEn = textVal.trim();
      displayHi = textVal.trim();
    }

    setError(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    const responseRecord: ClinicalResponse = {
      questionId: question.id,
      questionTextEn: question.questionTextEn,
      questionTextHi: question.questionTextHi,
      type: question.type,
      answer: answerVal,
      answerDisplayEn: displayEn,
      answerDisplayHi: displayHi,
      timestamp: new Date().toISOString(),
    };

    onAnswerSubmit(responseRecord);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Question Header & Repeat Control */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-200 inline-block">
            {question.pathwayId.replace('_', ' ').toUpperCase()} • QUESTION
          </span>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {questionText}
          </h2>
        </div>

        {/* REPEAT BUTTON */}
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleRepeatQuestion}
          leftIcon={isSpeaking ? <VolumeX className="w-5 h-5 text-rose-600" /> : <Volume2 className="w-5 h-5 text-teal-600" />}
          className={isSpeaking ? 'border-rose-400 bg-rose-50 text-rose-700 animate-pulse shrink-0' : 'border-teal-300 bg-teal-50 text-teal-900 shrink-0'}
        >
          {isSpeaking ? (isHi ? 'रोकें' : 'Stop') : (isHi ? 'पुनः सुनें' : 'Repeat')}
        </Button>
      </div>

      {/* QUESTION INPUT RENDERER BY TYPE */}
      <div className="py-2 space-y-4">
        {/* TYPE 1: YES / NO */}
        {question.type === 'yes_no' && (
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <button
              type="button"
              onClick={() => {
                setSelectedSingle('yes');
                setError(null);
              }}
              className={`min-h-[72px] p-4 rounded-2xl border-2 font-black text-2xl flex items-center justify-center gap-3 transition-all cursor-pointer select-none active:scale-[0.98] ${
                selectedSingle === 'yes'
                  ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20 ring-4 ring-teal-500/20'
                  : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-900'
              }`}
            >
              <span>{isHi ? 'हाँ (Yes)' : 'Yes'}</span>
              {selectedSingle === 'yes' && <CheckCircle2 className="w-7 h-7 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedSingle('no');
                setError(null);
              }}
              className={`min-h-[72px] p-4 rounded-2xl border-2 font-black text-2xl flex items-center justify-center gap-3 transition-all cursor-pointer select-none active:scale-[0.98] ${
                selectedSingle === 'no'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl ring-4 ring-slate-700/20'
                  : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-900'
              }`}
            >
              <span>{isHi ? 'नहीं (No)' : 'No'}</span>
              {selectedSingle === 'no' && <CheckCircle2 className="w-7 h-7 text-white" />}
            </button>
          </div>
        )}

        {/* TYPE 2: SINGLE CHOICE OR DURATION */}
        {(question.type === 'single_choice' || question.type === 'duration') && question.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt) => {
              const isSelected = selectedSingle === opt.value;
              const label = isHi ? opt.labelHi : opt.labelEn;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedSingle(opt.value);
                    setError(null);
                  }}
                  className={`min-h-[64px] p-5 rounded-2xl border-2 text-left font-bold text-lg flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                    isSelected
                      ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20 ring-4 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-900'
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && <CheckCircle2 className="w-6 h-6 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 3: MULTIPLE CHOICE */}
        {question.type === 'multiple_choice' && question.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((opt) => {
              const isSelected = selectedMultiple.includes(opt.value);
              const label = isHi ? opt.labelHi : opt.labelEn;

              const toggleMultiple = () => {
                let updated: string[];
                if (opt.value === 'none') {
                  updated = ['none'];
                } else {
                  const filtered = selectedMultiple.filter((v) => v !== 'none');
                  if (filtered.includes(opt.value)) {
                    updated = filtered.filter((v) => v !== opt.value);
                  } else {
                    updated = [...filtered, opt.value];
                  }
                }
                setSelectedMultiple(updated);
                setError(null);
              };

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={toggleMultiple}
                  className={`min-h-[64px] p-5 rounded-2xl border-2 text-left font-bold text-lg flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                    isSelected
                      ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20 ring-4 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-900'
                  }`}
                >
                  <span>{label}</span>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'bg-white border-white text-teal-600' : 'border-slate-400'}`}>
                    {isSelected && <CheckCircle2 className="w-5 h-5 fill-current" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 4: SEVERITY RATING (1 to 10 Slider / Buttons) */}
        {question.type === 'severity' && (
          <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {isHi ? 'कम दर्द (Mild)' : 'Mild Pain (1)'}
              </span>
              <span className="text-3xl font-black text-teal-700 font-mono">
                {severityVal} / 10
              </span>
              <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">
                {isHi ? 'अत्यधिक दर्द (Severe)' : 'Severe Pain (10)'}
              </span>
            </div>

            {/* Touch Friendly Rating Buttons 1 to 10 */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeverityVal(num)}
                  className={`min-h-[56px] rounded-xl font-extrabold text-xl flex items-center justify-center transition-all cursor-pointer ${
                    severityVal === num
                      ? num >= 8
                        ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 scale-105'
                        : 'bg-teal-600 text-white ring-4 ring-teal-500/30 scale-105'
                      : 'bg-white border-2 border-slate-300 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TYPE 5: TEXT INPUT WITH VOICE MODAL TRIGGER */}
        {question.type === 'text' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {isHi ? 'उत्तर लिखें या बोलें:' : 'Type or Speak Answer:'}
              </label>

              <VoiceButton
                isListening={isVoiceModalOpen}
                onToggle={() => setIsVoiceModalOpen(true)}
                size="md"
              />
            </div>

            <textarea
              value={textVal}
              onChange={(e) => {
                setTextVal(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              placeholder={isHi ? 'अपना उत्तर यहाँ दर्ज करें...' : 'Type your detailed answer here...'}
              className="w-full p-5 text-xl text-slate-900 bg-white rounded-2xl border-2 border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 transition-all outline-none font-medium leading-relaxed"
            />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* CONTROL ACTIONS: [BACK], [CHANGE ANSWER], [NEXT] */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* BACK BUTTON */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            {t('buttons.back')}
          </Button>

          {/* CHANGE ANSWER BUTTON (History Jump) */}
          {historyResponses.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onChangeAnswerClick}
              leftIcon={<Edit3 className="w-4 h-4 text-slate-600" />}
              className="text-slate-600 hover:text-slate-900"
            >
              {isHi ? 'उत्तर बदलें' : 'Change Answer'}
            </Button>
          )}
        </div>

        {/* NEXT BUTTON */}
        <Button
          type="button"
          variant="primary"
          size="xl"
          onClick={handleNextSubmit}
          rightIcon={<ArrowRight className="w-6 h-6" />}
          className="w-full sm:w-auto shadow-xl shadow-teal-600/30 border-2 border-teal-500"
        >
          {t('buttons.continue')}
        </Button>
      </div>

      {/* VOICE INPUT MODAL WITH CONFIRMATION */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirm={handleVoiceConfirmText}
      />
    </div>
  );
};
