import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Modal, Button } from './ui';
import { SpeechService } from '../services/SpeechService';
import { Mic, MicOff, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transcript: string) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t, language } = useTranslation();
  const speechServiceRef = useRef<SpeechService | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    if (!speechServiceRef.current) {
      speechServiceRef.current = new SpeechService();
    }
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setIsListening(true);

    if (speechServiceRef.current) {
      setIsDemoMode(speechServiceRef.current.isDemoMode);

      speechServiceRef.current.start({
        language: language as 'en' | 'hi',
        onResult: (text) => {
          setTranscript(text);
          setErrorMessage(null);
        },
        onError: (err) => {
          setIsListening(false);
          setErrorMessage(err);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      if (speechServiceRef.current) {
        speechServiceRef.current.stop();
      }
      setIsListening(false);
    }
  }, [isOpen]);

  const handleTryAgain = () => {
    if (speechServiceRef.current) {
      speechServiceRef.current.stop();
    }
    startListening();
  };

  const handleConfirmClick = () => {
    if (!transcript.trim()) {
      setErrorMessage(t('voice_modal.empty_speech_warning'));
      return;
    }
    onConfirm(transcript.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (speechServiceRef.current) speechServiceRef.current.stop();
        onClose();
      }}
      title={t('voice_modal.title')}
      maxWidth="md"
      footer={
        <div className="flex items-center gap-3 w-full justify-between flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleTryAgain}
            leftIcon={<RefreshCw className="w-5 h-5" />}
          >
            {t('voice_modal.try_again_button')}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="xl"
            disabled={!transcript.trim() || isListening}
            onClick={handleConfirmClick}
            leftIcon={<CheckCircle2 className="w-6 h-6" />}
            className="shadow-xl shadow-teal-600/30 border-2 border-teal-500"
          >
            {t('voice_modal.confirm_button')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-center">
        {/* DEMO MODE BADGE */}
        {isDemoMode && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-extrabold border border-amber-300">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{t('voice_modal.demo_mode_badge')}</span>
          </div>
        )}

        {/* VOICE RECORDING STATE ANIMATION */}
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={isListening ? () => speechServiceRef.current?.stop() : handleTryAgain}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all cursor-pointer border-4 ${
              isListening
                ? 'bg-rose-600 border-rose-600 text-white shadow-2xl shadow-rose-600/40 animate-pulse ring-8 ring-rose-500/20'
                : 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100 shadow-md'
            }`}
          >
            {isListening ? (
              <Mic className="w-14 h-14 animate-bounce" />
            ) : (
              <MicOff className="w-14 h-14 text-slate-400" />
            )}
          </button>
        </div>

        <p className="text-sm font-bold text-slate-500">
          {isListening ? t('voice_modal.listening_status') : 'Recognition complete. Review below:'}
        </p>

        {/* RECOGNIZED TEXT DISPLAY: "You said: ..." */}
        <div className="p-6 bg-slate-900 text-white rounded-3xl border-2 border-slate-800 text-left space-y-2 shadow-inner">
          <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider block">
            {t('voice_modal.recognized_prefix')}
          </span>

          <p className="text-2xl font-black text-white leading-relaxed min-h-[60px] font-sans">
            {transcript ? `"${transcript}"` : <span className="text-slate-500 text-lg font-normal italic">...</span>}
          </p>
        </div>

        {/* ERROR WARNING DISPLAY */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">{errorMessage}</p>
              <p className="text-xs text-rose-600 font-normal mt-0.5">
                Press 'Try Again' to retry speech input or use key-touch controls.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
