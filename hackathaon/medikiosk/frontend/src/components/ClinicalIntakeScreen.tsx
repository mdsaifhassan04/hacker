import React, { useState } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Header, Modal, Button } from './ui';
import { PatientSession } from '../types/session';
import { ClinicalResponse, QuestionDefinition, PathwayId } from '../types/questionnaire';
import { CLINICAL_QUESTIONNAIRES, getPathwayForComplaint } from '../config/clinicalQuestionnaires';
import { QuestionRenderer } from './QuestionRenderer';
import { Edit3, AlertTriangle } from 'lucide-react';

export interface ClinicalIntakeScreenProps {
  session: PatientSession;
  onBack: () => void;
  onCompleteIntake: (responses: ClinicalResponse[]) => void;
}

export const ClinicalIntakeScreen: React.FC<ClinicalIntakeScreenProps> = ({
  session,
  onBack,
  onCompleteIntake,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const isHi = language === 'hi';

  // Determine pathway from chief complaint
  const pathwayId: PathwayId = (session.pathwayId as PathwayId) || getPathwayForComplaint(session.chiefComplaint || 'chest_pain');
  const questions: QuestionDefinition[] = CLINICAL_QUESTIONNAIRES[pathwayId] || CLINICAL_QUESTIONNAIRES.chest_pain;

  // Active question state & history tracking for branching
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(questions[0].id);
  const [responses, setResponses] = useState<ClinicalResponse[]>(session.clinicalResponses || []);
  const [historyQuestionIds, setHistoryQuestionIds] = useState<string[]>([questions[0].id]);
  const [isChangeAnswerModalOpen, setIsChangeAnswerModalOpen] = useState<boolean>(false);

  const currentQuestion = questions.find((q) => q.id === currentQuestionId) || questions[0];
  const currentResponse = responses.find((r) => r.questionId === currentQuestionId);

  const handleAnswerSubmit = (newResponse: ClinicalResponse) => {
    // Upsert response in list
    const filtered = responses.filter((r) => r.questionId !== newResponse.questionId);
    const updatedResponses = [...filtered, newResponse];
    setResponses(updatedResponses);

    // Resolve next question ID via static ID or conditional branching function
    let nextId: string | null = null;
    if (typeof currentQuestion.nextQuestionId === 'function') {
      const allAnswersObj: Record<string, any> = {};
      updatedResponses.forEach((r) => {
        allAnswersObj[r.questionId] = r.answer;
      });
      nextId = currentQuestion.nextQuestionId(newResponse.answer, allAnswersObj);
    } else if (typeof currentQuestion.nextQuestionId === 'string') {
      nextId = currentQuestion.nextQuestionId;
    }

    if (nextId) {
      setHistoryQuestionIds((prev) => [...prev, nextId!]);
      setCurrentQuestionId(nextId);
    } else {
      // Pathway complete!
      onCompleteIntake(updatedResponses);
    }
  };

  const handlePreviousQuestion = () => {
    if (historyQuestionIds.length > 1) {
      const updatedHistory = [...historyQuestionIds];
      updatedHistory.pop(); // Remove current
      const prevId = updatedHistory[updatedHistory.length - 1];
      setHistoryQuestionIds(updatedHistory);
      setCurrentQuestionId(prevId);
    } else {
      onBack();
    }
  };

  const handleJumpToQuestion = (qId: string) => {
    setCurrentQuestionId(qId);
    setIsChangeAnswerModalOpen(false);
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

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Patient & Complaint Context Header Bar */}
        <div className="p-4 bg-teal-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-0.5">
            <span className="text-xs text-teal-300 uppercase tracking-wider font-bold">
              Active Intake Patient • {session.patientDetails.name} ({session.patientId})
            </span>
            <h4 className="text-lg font-black text-white leading-snug">
              Chief Complaint: "{session.chiefComplaint}"
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-teal-800 text-teal-200 px-3 py-1.5 rounded-lg border border-teal-700 font-bold">
              {responses.length} / {questions.length} Answered
            </span>
          </div>
        </div>

        {/* PATIENT-FACING PRIORITY CLINICAL ASSESSMENT ALERT BANNER */}
        {session.redFlagAssessment?.priorityAssessment && (
          <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-3 text-amber-950 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-extrabold text-base text-amber-950">
                {t('red_flag.patient_priority_banner')}
              </p>
              <p className="text-xs text-amber-800 font-medium">
                {t('red_flag.patient_priority_hint')}
              </p>
            </div>
          </div>
        )}

        {/* QUESTION RENDERER ENGINE */}
        <QuestionRenderer
          question={currentQuestion}
          historyResponses={responses}
          currentResponse={currentResponse}
          onAnswerSubmit={handleAnswerSubmit}
          onBack={handlePreviousQuestion}
          onChangeAnswerClick={() => setIsChangeAnswerModalOpen(true)}
        />
      </main>

      {/* CHANGE ANSWER HISTORY MODAL */}
      <Modal
        isOpen={isChangeAnswerModalOpen}
        onClose={() => setIsChangeAnswerModalOpen(false)}
        title={isHi ? 'पहले दिए गए उत्तर बदलें' : 'Change Answer History'}
        description={isHi ? 'किसी भी प्रश्न पर वापस जाने और अपना उत्तर बदलने के लिए उस पर क्लिक करें:' : 'Click any previously answered question below to modify your response:'}
        footer={
          <Button variant="outline" onClick={() => setIsChangeAnswerModalOpen(false)}>
            {t('buttons.cancel')}
          </Button>
        }
      >
        <div className="space-y-3">
          {responses.length === 0 ? (
            <p className="text-slate-500 text-sm">{isHi ? 'अभी तक कोई उत्तर दर्ज नहीं किया गया है।' : 'No answered questions yet.'}</p>
          ) : (
            responses.map((resp, idx) => (
              <div
                key={resp.questionId}
                onClick={() => handleJumpToQuestion(resp.questionId)}
                className="p-4 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Q{idx + 1}: {isHi ? resp.questionTextHi : resp.questionTextEn}
                  </span>
                  <p className="font-extrabold text-slate-900 text-base">
                    "{isHi ? resp.answerDisplayHi : resp.answerDisplayEn}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs shrink-0">
                  <Edit3 className="w-4 h-4" />
                  <span>{isHi ? 'बदलें' : 'Edit'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>{t('welcome.footer_hint')}</p>
      </footer>
    </div>
  );
};
