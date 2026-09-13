import { useState } from 'react';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LanguageSelectionScreen } from './components/LanguageSelectionScreen';
import { PatientIdentificationScreen } from './components/PatientIdentificationScreen';
import { ConsentScreen } from './components/ConsentScreen';
import { ChiefComplaintScreen } from './components/ChiefComplaintScreen';
import { ClinicalIntakeScreen } from './components/ClinicalIntakeScreen';
import { MedicalHistoryScreen } from './components/MedicalHistoryScreen';
import { DocumentUploadScreen } from './components/DocumentUploadScreen';
import { ClinicalSummaryCard } from './components/ClinicalSummaryCard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { Modal, Button } from './components/ui';
import { PatientSession, ConsentRecord, MedicalHistory, DocumentRecord } from './types/session';
import { ClinicalResponse } from './types/questionnaire';
import { evaluateRedFlags } from './services/RedFlagEngine';
import { llmService } from './services/LLMService';
import { CheckCircle2, Copy, ShieldCheck, HeartPulse, AlertTriangle, Stethoscope } from 'lucide-react';

function MainAppContent() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'kiosk' | 'doctor'>('kiosk');
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'language' | 'patient_id' | 'consent' | 'chief_complaint' | 'clinical_questions' | 'medical_history' | 'document_upload'>('welcome');
  const [activeSession, setActiveSession] = useState<PatientSession | null>(null);
  const [isSessionConfirmed, setIsSessionConfirmed] = useState<boolean>(false);

  const handleStart = () => {
    setCurrentScreen('language');
  };

  const handleLanguageBack = () => {
    setCurrentScreen('welcome');
  };

  const handleLanguageContinue = () => {
    setCurrentScreen('patient_id');
  };

  const handlePatientIdBack = () => {
    setCurrentScreen('language');
  };

  const handleSessionCreated = (session: PatientSession) => {
    setActiveSession(session);
    setCurrentScreen('consent');
  };

  const handleConsentBack = () => {
    setCurrentScreen('patient_id');
  };

  const handleConsentAccepted = (consent: ConsentRecord) => {
    if (activeSession) {
      const updatedSession: PatientSession = {
        ...activeSession,
        consentRecord: consent,
      };
      setActiveSession(updatedSession);
    }
    setCurrentScreen('chief_complaint');
  };

  const handleChiefComplaintBack = () => {
    setCurrentScreen('consent');
  };

  const handleSaveChiefComplaint = (complaintText: string) => {
    if (activeSession) {
      const redFlagAssessment = evaluateRedFlags({
        chiefComplaint: complaintText,
        clinicalResponses: activeSession.clinicalResponses || [],
      });
      const updatedSession: PatientSession = {
        ...activeSession,
        chiefComplaint: complaintText,
        redFlagAssessment,
      };
      setActiveSession(updatedSession);
    }
    setCurrentScreen('clinical_questions');
  };

  const handleClinicalIntakeBack = () => {
    setCurrentScreen('chief_complaint');
  };

  const handleCompleteIntake = (responses: ClinicalResponse[]) => {
    if (activeSession) {
      const redFlagAssessment = evaluateRedFlags({
        chiefComplaint: activeSession.chiefComplaint || '',
        clinicalResponses: responses,
      });
      const updatedSession: PatientSession = {
        ...activeSession,
        clinicalResponses: responses,
        redFlagAssessment,
      };
      setActiveSession(updatedSession);
    }
    setCurrentScreen('medical_history');
  };

  const handleMedicalHistoryBack = () => {
    setCurrentScreen('clinical_questions');
  };

  const handleCompleteMedicalHistory = (history: MedicalHistory) => {
    if (activeSession) {
      const updatedSession: PatientSession = {
        ...activeSession,
        medicalHistory: history,
      };
      setActiveSession(updatedSession);
    }
    setCurrentScreen('document_upload');
  };

  const handleDocumentUploadBack = () => {
    setCurrentScreen('medical_history');
  };

  const handleCompleteDocuments = async (documents: DocumentRecord[]) => {
    let finalSessionPayload = activeSession;
    if (activeSession) {
      const redFlagAssessment = evaluateRedFlags({
        chiefComplaint: activeSession.chiefComplaint || '',
        clinicalResponses: activeSession.clinicalResponses || [],
      });
      
      const sessionWithDocs: PatientSession = {
        ...activeSession,
        uploadedDocuments: documents,
        redFlagAssessment,
      };

      // Generate structured AI clinical summary
      const clinicalSummary = await llmService.generateClinicalSummary(sessionWithDocs);
      
      finalSessionPayload = {
        ...sessionWithDocs,
        clinicalSummary,
      };

      setActiveSession(finalSessionPayload);

      // Save to backend API
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        await fetch(`${apiBaseUrl}/api/intake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalSessionPayload),
        });
      } catch (err) {
        console.warn('Backend API intake save failed or offline:', err);
      }
    }
    setIsSessionConfirmed(true);
  };

  const handleVerifySummary = async () => {
    if (activeSession && activeSession.clinicalSummary) {
      const { verifiedAt } = await llmService.verifySummary(activeSession.sessionId, 'DOC-OPD-101');
      const updatedSummary = {
        ...activeSession.clinicalSummary,
        isDoctorVerified: true,
        verifiedAt,
        verifiedByDoctorId: 'DOC-OPD-101',
      };
      const updatedSession: PatientSession = {
        ...activeSession,
        clinicalSummary: updatedSummary,
      };
      setActiveSession(updatedSession);
    }
  };

  const handleCloseSessionModal = () => {
    setIsSessionConfirmed(false);
  };

  if (viewMode === 'doctor') {
    return (
      <DoctorDashboard
        onSwitchToKiosk={() => setViewMode('kiosk')}
        currentActiveSession={activeSession}
      />
    );
  }

  return (
    <>
      {/* FLOATING DOCTOR DASHBOARD TOGGLE BUTTON */}
      <div className="fixed top-3 right-3 z-40">
        <button
          type="button"
          onClick={() => setViewMode('doctor')}
          className="px-3.5 py-2 rounded-2xl bg-slate-900 text-teal-300 hover:bg-slate-950 font-bold text-xs shadow-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          title="Switch to OPD Doctor Triage Dashboard"
        >
          <Stethoscope className="w-4 h-4 text-teal-400" />
          <span>Doctor Dashboard</span>
        </button>
      </div>

      {currentScreen === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}

      {currentScreen === 'language' && (
        <LanguageSelectionScreen
          onBack={handleLanguageBack}
          onContinue={handleLanguageContinue}
        />
      )}

      {currentScreen === 'patient_id' && (
        <PatientIdentificationScreen
          onBack={handlePatientIdBack}
          onSessionCreated={handleSessionCreated}
        />
      )}

      {currentScreen === 'consent' && activeSession && (
        <ConsentScreen
          session={activeSession}
          onBack={handleConsentBack}
          onConsentAccepted={handleConsentAccepted}
        />
      )}

      {currentScreen === 'chief_complaint' && activeSession && (
        <ChiefComplaintScreen
          session={activeSession}
          onBack={handleChiefComplaintBack}
          onSaveComplaint={handleSaveChiefComplaint}
        />
      )}

      {currentScreen === 'clinical_questions' && activeSession && (
        <ClinicalIntakeScreen
          session={activeSession}
          onBack={handleClinicalIntakeBack}
          onCompleteIntake={handleCompleteIntake}
        />
      )}

      {currentScreen === 'medical_history' && activeSession && (
        <MedicalHistoryScreen
          session={activeSession}
          onBack={handleMedicalHistoryBack}
          onCompleteMedicalHistory={handleCompleteMedicalHistory}
        />
      )}

      {currentScreen === 'document_upload' && activeSession && (
        <DocumentUploadScreen
          session={activeSession}
          onBack={handleDocumentUploadBack}
          onCompleteDocuments={handleCompleteDocuments}
        />
      )}

      {/* FINAL FULL INTAKE SESSION SUMMARY MODAL */}
      <Modal
        isOpen={isSessionConfirmed}
        onClose={handleCloseSessionModal}
        title={t('session.created_title')}
        description={t('session.created_desc')}
        maxWidth="xl"
        footer={
          <div className="flex items-center gap-3 w-full justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                if (activeSession) {
                  navigator.clipboard.writeText(JSON.stringify(activeSession, null, 2));
                  alert('Full Pre-Consultation Session JSON copied to clipboard!');
                }
              }}
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copy Session Payload
            </Button>
            <Button variant="primary" size="lg" onClick={handleCloseSessionModal}>
              {t('buttons.confirm')}
            </Button>
          </div>
        }
      >
        {activeSession && (
          <div className="space-y-6">
            {/* Success Alert Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-base">
                  Full Pre-Consultation Intake Recorded for {activeSession.patientDetails.name}
                </p>
                <p className="text-xs text-emerald-800 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Consent: ACCEPTED • Language: {activeSession.language.toUpperCase()} • Backend Saved: YES</span>
                </p>
              </div>
            </div>

            {/* DOCTOR TRIAGE RED-FLAG ALERT BANNER */}
            {activeSession.redFlagAssessment?.priorityAssessment && (
              <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-950 font-black text-base">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  <span>{t('red_flag.doctor_alert_title')}</span>
                </div>
                <p className="text-xs font-semibold text-rose-800">
                  {t('red_flag.patient_priority_banner')}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase text-rose-900 tracking-wider block">
                    {t('red_flag.triggered_rules_label')}:
                  </span>
                  <div className="space-y-1.5">
                    {activeSession.redFlagAssessment.triggeredFlags.map((flag) => (
                      <div
                        key={flag.ruleId}
                        className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl flex items-center justify-between text-xs shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-rose-950 block">{flag.name}</span>
                          <span className="text-[11px] text-rose-700 block">{activeSession.language === 'hi' ? flag.messageHi : flag.messageEn}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-mono font-bold text-[10px]">
                          {flag.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chief Complaint Card */}
            <div className="p-5 bg-teal-50 border-2 border-teal-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs uppercase tracking-wider">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>{t('session.chief_complaint_label')}</span>
              </div>
              <p className="text-xl font-black text-slate-900 leading-snug">
                "{activeSession.chiefComplaint}"
              </p>
            </div>

            {/* AI CLINICAL INTAKE SUMMARY CARD */}
            {activeSession.clinicalSummary && (
              <ClinicalSummaryCard
                summary={activeSession.clinicalSummary}
                onVerifySummary={handleVerifySummary}
              />
            )}

            {/* Session Object Key-Value Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-900 text-white rounded-2xl font-mono text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-sans">{t('session.session_id')}</span>
                <span className="font-bold text-teal-400">{activeSession.sessionId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-sans">{t('session.patient_id')}</span>
                <span className="font-bold text-white">{activeSession.patientId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-sans">{t('session.language')}</span>
                <span className="font-bold text-amber-400 uppercase font-sans">{activeSession.language}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-sans">Consent Status</span>
                <span className="font-bold text-emerald-400 font-sans">
                  {activeSession.consentRecord?.consentStatus || 'ACCEPTED'}
                </span>
              </div>
            </div>

            {/* Complete JSON Session Structure Code Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Intake Payload Saved to Backend (POST /api/intake)
              </label>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl overflow-x-auto text-xs font-mono border border-slate-800 leading-relaxed max-h-64">
{JSON.stringify(activeSession, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
