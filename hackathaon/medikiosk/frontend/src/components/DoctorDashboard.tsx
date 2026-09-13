import React, { useState, useEffect } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { PatientSession, DocumentRecord } from '../types/session';
import { ClinicalSummaryCard } from './ClinicalSummaryCard';
import { OCRResultModal } from './OCRResultModal';
import { FHIRViewerModal } from './FHIRViewerModal';
import { auditLogService } from '../services/AuditLogService';
import { AuditLogEntry } from '../types/audit';
import { Button, Modal } from './ui';
import {
  Stethoscope,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  FileText,
  User,
  HeartPulse,
  ArrowLeft,
  ChevronRight,
  Scan,
  Filter,
  History,
  Code2,
} from 'lucide-react';

export interface DoctorDashboardProps {
  onSwitchToKiosk: () => void;
  currentActiveSession?: PatientSession | null;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  onSwitchToKiosk,
  currentActiveSession,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const [queue, setQueue] = useState<PatientSession[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    currentActiveSession?.sessionId || null
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'red_flags' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);

  // OCR Modal view state for attached documents
  const [viewingDocForOCR, setViewingDocForOCR] = useState<DocumentRecord | null>(null);
  const [showFHIRModal, setShowFHIRModal] = useState<boolean>(false);

  const fetchQueueFromBackend = async () => {
    setIsLoadingQueue(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiBaseUrl}/api/intake`);
      if (response.ok) {
        const data = await response.json();
        if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
          // Deduplicate and combine with current session if available
          const fetched: PatientSession[] = data.sessions;
          if (currentActiveSession && !fetched.some((s) => s.sessionId === currentActiveSession.sessionId)) {
            fetched.unshift(currentActiveSession);
          }
          setQueue(fetched);
          if (!selectedPatientId && fetched.length > 0) {
            setSelectedPatientId(fetched[0].sessionId);
          }
          setIsLoadingQueue(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API queue fetch offline, loading DEMO_MODE queue:', err);
    }

    // DEMO_MODE Pre-populated Queue Fallback
    const demoQueue: PatientSession[] = [
      currentActiveSession || {
        sessionId: 'SESS-1001-DEMO',
        patientId: 'PAT-1001',
        language: 'en',
        createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
        patientDetails: {
          patientId: 'PAT-1001',
          name: 'Rahul Sharma',
          age: 45,
          gender: 'Male',
          mobile: '9876543210',
          lastVisit: '2025-11-10',
          previousDepartment: 'Cardiology',
        },
        isNewPatient: false,
        consentRecord: {
          sessionId: 'SESS-1001-DEMO',
          consentStatus: 'ACCEPTED',
          timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
          consentVersion: 'v1.0-SIH2026',
        },
        chiefComplaint: 'Severe chest pain radiating to left shoulder and breathlessness',
        pathwayId: 'chest_pain',
        clinicalResponses: [
          {
            questionId: 'associated_breathlessness',
            questionTextEn: 'Are you experiencing breathlessness?',
            questionTextHi: 'क्या आपको सांस लेने में तकलीफ है?',
            type: 'yes_no',
            answer: 'yes',
            answerDisplayEn: 'Yes',
            answerDisplayHi: 'हाँ',
            timestamp: new Date().toISOString(),
          },
          {
            questionId: 'chest_pain_onset',
            questionTextEn: 'When did the chest pain start?',
            questionTextHi: 'छाती में दर्द कब शुरू हुआ?',
            type: 'single_choice',
            answer: 'sudden',
            answerDisplayEn: 'Sudden onset (~2 hours ago)',
            answerDisplayHi: 'अचानक शुरू हुआ (~2 घंटे पहले)',
            timestamp: new Date().toISOString(),
          },
        ],
        medicalHistory: {
          pastConditions: {
            diabetes: true,
            hypertension: true,
            asthma: false,
            tuberculosis: false,
            cardiacDisease: true,
            other: '',
          },
          medications: [
            { medicine: 'Metformin', strength: '500mg', frequency: 'Twice daily', duration: '1 year' },
            { medicine: 'Amlodipine', strength: '5mg', frequency: 'Once daily', duration: '2 years' },
          ],
          allergies: [{ type: 'Drug', substance: 'Penicillin', reaction: 'Skin Rash' }],
          surgeries: [{ procedure: 'Angioplasty', approximateDate: '2023' }],
          familyHistory: 'Father had Heart Attack at age 58',
          personalHistory: { diet: 'Non-vegetarian', sleep: '6 hours', tobacco: 'Former smoker', alcohol: 'Occasional', occupation: 'Accountant' },
        },
        uploadedDocuments: [
          {
            documentId: 'DOC-901',
            sessionId: 'SESS-1001-DEMO',
            filename: 'AIIMS_Prescription_Cardiology.pdf',
            fileType: 'application/pdf',
            fileSize: 245000,
            uploadedAt: new Date().toISOString(),
            fileUrl: '/uploads/sample.pdf',
            ocrResult: {
              documentId: 'DOC-901',
              sourceDocument: 'AIIMS_Prescription_Cardiology.pdf',
              rawText: 'AIIMS CARDIOLOGY OPD\nRx: Tab Metformin 500mg BD, Tab Amlodipine 5mg OD\nDate: 10/09/2026',
              structuredInfo: {
                docType: 'prescription',
                prescriptions: [
                  {
                    medicine: { value: 'Metformin', confidence: 0.96, sourceDocument: 'AIIMS_Prescription_Cardiology.pdf' },
                    strength: { value: '500mg', confidence: 0.98, sourceDocument: 'AIIMS_Prescription_Cardiology.pdf' },
                    dose: { value: '1 Tab', confidence: 0.95, sourceDocument: 'AIIMS_Prescription_Cardiology.pdf' },
                    frequency: { value: 'Twice daily', confidence: 0.94, sourceDocument: 'AIIMS_Prescription_Cardiology.pdf' },
                    duration: { value: '30 days', confidence: 0.92, sourceDocument: 'AIIMS_Prescription_Cardiology.pdf' },
                    date: { value: '2026-09-10', confidence: 0.97, sourceDocument: 'AIIMS_Prescription_Cardiology.pdf' },
                  },
                ],
                labReports: [],
              },
              confidenceAverage: 0.95,
              processedAt: new Date().toISOString(),
              disclaimer: 'Preliminary AI/OCR extraction. Final doctor verification required.',
            },
          },
        ],
        redFlagAssessment: {
          priorityAssessment: true,
          triggeredFlags: [
            {
              ruleId: 'RF-CARD-01',
              name: 'Chest Pain with Breathlessness',
              severity: 'CRITICAL',
              category: 'cardiovascular',
              messageEn: 'Combined chest pain and breathlessness detected.',
              messageHi: 'छाती में दर्द और सांस लेने में तकलीफ का संयुक्त लक्षण पाया गया।',
            },
          ],
          patientMessageEn: 'Priority clinical assessment recommended based on reported symptoms.',
          patientMessageHi: 'दर्ज किए गए लक्षणों के आधार पर प्राथमिकता नैदानिक मूल्यांकन की सिफारिश की जाती है।',
          evaluatedAt: new Date().toISOString(),
        },
      },
      {
        sessionId: 'SESS-1002-DEMO',
        patientId: 'PAT-1002',
        language: 'hi',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        patientDetails: {
          patientId: 'PAT-1002',
          name: 'Sunita Devi',
          age: 52,
          gender: 'Female',
          mobile: '9812345678',
          lastVisit: '2026-01-15',
          previousDepartment: 'General Medicine',
        },
        isNewPatient: false,
        consentRecord: {
          sessionId: 'SESS-1002-DEMO',
          consentStatus: 'ACCEPTED',
          timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
          consentVersion: 'v1.0-SIH2026',
        },
        chiefComplaint: 'High fever for 3 days with shivering and mild headache',
        pathwayId: 'fever',
        clinicalResponses: [],
        medicalHistory: {
          pastConditions: { diabetes: false, hypertension: true, asthma: false, tuberculosis: false, cardiacDisease: false, other: '' },
          medications: 'Not reported',
          allergies: 'Not reported',
          surgeries: 'Not reported',
          familyHistory: 'Not reported',
          personalHistory: 'Not reported',
        },
        uploadedDocuments: [],
        redFlagAssessment: {
          priorityAssessment: false,
          triggeredFlags: [],
          patientMessageEn: 'Standard clinical intake recorded.',
          patientMessageHi: 'सामान्य नैदानिक जांच दर्ज की गई।',
          evaluatedAt: new Date().toISOString(),
        },
      },
      {
        sessionId: 'SESS-1003-DEMO',
        patientId: 'PAT-1003',
        language: 'en',
        createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
        patientDetails: {
          patientId: 'PAT-1003',
          name: 'Amit Patel',
          age: 38,
          gender: 'Male',
          mobile: '9711223344',
          lastVisit: 'First Visit',
          previousDepartment: 'General Medicine',
        },
        isNewPatient: true,
        consentRecord: {
          sessionId: 'SESS-1003-DEMO',
          consentStatus: 'ACCEPTED',
          timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
          consentVersion: 'v1.0-SIH2026',
        },
        chiefComplaint: 'Sudden weakness on right arm and slurred speech difficulty',
        pathwayId: 'headache',
        clinicalResponses: [],
        medicalHistory: {
          pastConditions: 'Not reported',
          medications: 'Not reported',
          allergies: 'Not reported',
          surgeries: 'Not reported',
          familyHistory: 'Not reported',
          personalHistory: 'Not reported',
        },
        uploadedDocuments: [],
        redFlagAssessment: {
          priorityAssessment: true,
          triggeredFlags: [
            {
              ruleId: 'RF-NEURO-01',
              name: 'Sudden Weakness with Speech Difficulty',
              severity: 'CRITICAL',
              category: 'neurological',
              messageEn: 'Combined sudden weakness and speech difficulty detected.',
              messageHi: 'अचानक कमजोरी और बोलने में कठिनाई का संयुक्त लक्षण पाया गया।',
            },
          ],
          patientMessageEn: 'Priority clinical assessment recommended based on reported symptoms.',
          patientMessageHi: 'दर्ज किए गए लक्षणों के आधार पर प्राथमिकता नैदानिक मूल्यांकन की सिफारिश की जाती है।',
          evaluatedAt: new Date().toISOString(),
        },
      },
    ];

    // Auto generate AI clinical summary for each demo patient if not present
    const enrichedQueue = demoQueue.map((item) => {
      if (!item.clinicalSummary) {
        // Construct basic demo summary
        item.clinicalSummary = {
          chiefComplaint: item.chiefComplaint || 'Not reported',
          historyOfPresentIllness: item.clinicalResponses && item.clinicalResponses.length > 0 ? item.clinicalResponses.map((r) => `${r.questionTextEn}: ${r.answerDisplayEn}`).join(' • ') : 'Not reported',
          pastMedicalHistory: typeof item.medicalHistory?.pastConditions === 'object' ? 'Diabetes, Hypertension' : 'Not reported',
          medicationHistory: Array.isArray(item.medicalHistory?.medications) ? item.medicalHistory.medications.map((m) => `${m.medicine} (${m.strength})`).join(', ') : 'Not reported',
          allergyHistory: 'Penicillin Allergy',
          surgicalHistory: 'Angioplasty (2023)',
          familyHistory: 'Father had Cardiac disease',
          personalHistory: 'Non-vegetarian • Former smoker',
          relevantInvestigations: item.uploadedDocuments && item.uploadedDocuments.length > 0 ? `Attached: ${item.uploadedDocuments[0].filename}` : 'Not reported',
          redFlags: item.redFlagAssessment?.priorityAssessment ? '⚠️ Chest Pain & Breathlessness (CRITICAL)' : 'No red flags triggered',
          informationRequiringVerification: ['Verify drug dosage and allergies during OPD consultation.'],
          isDoctorVerified: false,
          verificationStatus: 'UNVERIFIED_DRAFT',
          encounterId: item.sessionId,
          doctorNotes: '',
          aiOriginalSummary: undefined,
          generatedAt: new Date().toISOString(),
          verifiedAt: null,
          verifiedByDoctorId: null,
        };
      }
      return item;
    });

    // Pre-populate initial AI_GENERATION log for demo sessions
    demoQueue.forEach(async (item) => {
      await auditLogService.logEvent({
        eventType: 'AI_GENERATION',
        sessionId: item.sessionId,
        patientId: item.patientId,
        actorId: 'MEDIKIOSK-AI',
        details: `Generated structured 11-section clinical summary draft for patient ${item.patientDetails.name}.`,
      });
    });

    setQueue(enrichedQueue);
    if (!selectedPatientId && enrichedQueue.length > 0) {
      setSelectedPatientId(enrichedQueue[0].sessionId);
    }
    setIsLoadingQueue(false);
  };

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);

  useEffect(() => {
    fetchQueueFromBackend();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      auditLogService.getLogsForSession(selectedPatientId).then((logs) => setAuditLogs(logs));
    }
  }, [selectedPatientId]);

  const handleSelectPatient = async (session: PatientSession) => {
    setSelectedPatientId(session.sessionId);

    // Log Audit Event for RECORD_ACCESS
    await auditLogService.logEvent({
      eventType: 'RECORD_ACCESS',
      sessionId: session.sessionId,
      patientId: session.patientId,
      actorId: 'DOC-OPD-101',
      details: `Physician Dr. A. K. Sharma opened and accessed clinical record for patient ${session.patientDetails.name}.`,
    });

    // Load Audit logs
    const logs = await auditLogService.getLogsForSession(session.sessionId);
    setAuditLogs(logs);
  };

  const selectedPatient = queue.find((p) => p.sessionId === selectedPatientId) || queue[0];

  const handleSaveEditedSummary = (edited: any) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.sessionId === selectedPatient.sessionId
          ? { ...item, clinicalSummary: edited }
          : item
      )
    );
  };

  const handleVerifySummaryClick = async (verifiedRecord?: any) => {
    if (selectedPatient) {
      const recordToSave = verifiedRecord || {
        ...selectedPatient.clinicalSummary,
        isDoctorVerified: true,
        verificationStatus: 'PHYSICIAN_VERIFIED',
        verifiedAt: new Date().toISOString(),
        verifiedByDoctorId: 'DOC-OPD-101',
      };

      setQueue((prev) =>
        prev.map((item) =>
          item.sessionId === selectedPatient.sessionId
            ? { ...item, clinicalSummary: recordToSave }
            : item
        )
      );

      // Refresh Audit logs
      const logs = await auditLogService.getLogsForSession(selectedPatient.sessionId);
      setAuditLogs(logs);
    }
  };

  const getWaitingTimeMins = (createdAt: string): number => {
    const created = new Date(createdAt).getTime();
    const diffMs = Date.now() - created;
    return Math.max(1, Math.round(diffMs / 60000));
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.patientDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.chiefComplaint || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'red_flags') {
      return item.redFlagAssessment?.priorityAssessment === true;
    }
    if (activeFilter === 'completed') {
      return item.clinicalSummary !== undefined;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      {/* DESKTOP TOP BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-teal-500/20">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{t('doctor_dashboard.title')}</span>
              <span className="text-xs bg-teal-950 text-teal-400 border border-teal-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                OPD Desk
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {t('doctor_dashboard.doctor_name')} • {t('doctor_dashboard.department')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="min-h-[44px] px-3 bg-slate-900 border border-slate-700 rounded-xl text-teal-300 font-bold text-xs outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>

          <Button
            variant="outline"
            size="md"
            onClick={fetchQueueFromBackend}
            disabled={isLoadingQueue}
            leftIcon={<RefreshCw className={`w-4 h-4 text-teal-400 ${isLoadingQueue ? 'animate-spin' : ''}`} />}
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            {t('doctor_dashboard.refresh_queue')}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onSwitchToKiosk}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20"
          >
            {t('doctor_dashboard.switch_kiosk')}
          </Button>
        </div>
      </header>

      {/* DUAL-PANE DESKTOP WORKSPACE */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden max-w-[1920px] w-full mx-auto">
        
        {/* LEFT PANE: PATIENT QUEUE TABLE & FILTERS */}
        <aside className="w-full lg:w-[460px] xl:w-[500px] border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          
          {/* QUEUE CONTROLS BAR */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('doctor_dashboard.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-medium outline-none focus:border-teal-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFilter === 'all' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('doctor_dashboard.all_queue')} ({queue.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('red_flags')}
                className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFilter === 'red_flags' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('doctor_dashboard.red_flags_only')} ({queue.filter((q) => q.redFlagAssessment?.priorityAssessment).length})
              </button>
            </div>
          </div>

          {/* PATIENT QUEUE LIST */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-800/60 p-2">
            {filteredQueue.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs italic space-y-2">
                <Filter className="w-8 h-8 mx-auto text-slate-600" />
                <p>No patients match the current queue filter.</p>
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = item.sessionId === selectedPatient?.sessionId;
                const hasRedFlag = item.redFlagAssessment?.priorityAssessment === true;
                const waitingMins = getWaitingTimeMins(item.createdAt);

                return (
                  <div
                    key={item.sessionId}
                    onClick={() => handleSelectPatient(item)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border mb-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-teal-500 shadow-md ring-1 ring-teal-500'
                        : hasRedFlag
                        ? 'bg-rose-950/20 border-rose-800/80 hover:bg-rose-950/30 animate-pulse'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-base truncate">
                            {item.patientDetails.name}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            ({item.patientDetails.age}y • {item.patientDetails.gender})
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-bold truncate">
                          "{item.chiefComplaint || 'No complaint recorded'}"
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Wait: <strong>{waitingMins}m</strong></span>
                          </span>
                          <span>•</span>
                          <span className="text-teal-400 font-sans font-bold">
                            ID: {item.patientId}
                          </span>
                        </div>
                      </div>

                      {/* HIGHLY VISIBLE RED-FLAG TRIAGE BADGE */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {hasRedFlag ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-rose-600/40 animate-pulse border border-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{t('doctor_dashboard.priority_red_flag')}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            {t('doctor_dashboard.clear_status')}
                          </span>
                        )}

                        <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-teal-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANE: PATIENT CLINICAL DETAILS VIEW */}
        <main className="flex-grow bg-slate-950 overflow-y-auto p-6 lg:p-8 space-y-6">
          {!selectedPatient ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-500 space-y-3">
              <User className="w-16 h-16 text-slate-700" />
              <p className="text-base font-bold">{t('doctor_dashboard.select_patient_prompt')}</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* PATIENT HEADER CARD */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-900/80 border border-teal-700 text-teal-300 flex items-center justify-center font-black text-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {selectedPatient.patientDetails.name}
                      </h2>
                      <p className="text-xs text-slate-400 flex items-center gap-3 font-mono">
                        <span>Age: <strong>{selectedPatient.patientDetails.age} Yrs</strong></span>
                        <span>•</span>
                        <span>Gender: <strong>{selectedPatient.patientDetails.gender}</strong></span>
                        <span>•</span>
                        <span>Mobile: <strong>{selectedPatient.patientDetails.mobile}</strong></span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowAuditDrawer(true)}
                    leftIcon={<History className="w-4 h-4 text-teal-400" />}
                    className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 text-xs font-sans font-bold py-2.5 px-3.5"
                  >
                    Audit Trail ({auditLogs.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowFHIRModal(true)}
                    leftIcon={<Code2 className="w-4 h-4 text-teal-400" />}
                    className="border-teal-800 bg-slate-950 text-teal-300 hover:bg-slate-800 text-xs font-sans font-bold py-2.5 px-3.5"
                  >
                    Export FHIR R4
                  </Button>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-right">
                    <span className="text-[10px] text-slate-500 block">PATIENT ID</span>
                    <span className="font-bold text-teal-400 text-sm">{selectedPatient.patientId}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-right">
                    <span className="text-[10px] text-slate-500 block">SESSION ID</span>
                    <span className="font-bold text-slate-300 text-sm">{selectedPatient.sessionId}</span>
                  </div>
                </div>
              </div>

              {/* HIGHLY VISIBLE RED-FLAG ALERT BANNER FOR DOCTOR */}
              {selectedPatient.redFlagAssessment?.priorityAssessment && (
                <div className="p-6 bg-rose-950/60 border-2 border-rose-600 rounded-3xl space-y-4 shadow-xl shadow-rose-950/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-wide uppercase">
                          {t('red_flag.doctor_alert_title')}
                        </h3>
                        <p className="text-xs text-rose-200 font-semibold mt-0.5">
                          {t('red_flag.doctor_alert_subtitle')}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-mono font-black text-xs uppercase tracking-wider">
                      PRIORITY TRIAGE
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-rose-800/60">
                    <span className="text-xs font-bold uppercase text-rose-300 tracking-wider block">
                      {t('red_flag.triggered_rules_label')}:
                    </span>
                    <div className="space-y-2">
                      {selectedPatient.redFlagAssessment.triggeredFlags.map((flag) => (
                        <div
                          key={flag.ruleId}
                          className="p-3 bg-slate-900 border border-rose-800/80 rounded-2xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-rose-200 text-sm block">{flag.name}</span>
                            <span className="text-slate-300 font-medium block">
                              {language === 'hi' ? flag.messageHi : flag.messageEn}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 bg-rose-900 text-rose-200 rounded-lg font-mono font-bold text-xs border border-rose-700">
                            {flag.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CHIEF COMPLAINT & HPI CARD */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <HeartPulse className="w-5 h-5 text-teal-400" />
                  <span>Chief Complaint & History of Present Illness (HPI)</span>
                </h3>

                <div className="p-4 bg-teal-950/40 border border-teal-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                    Chief Complaint Summary
                  </span>
                  <p className="text-lg font-black text-white leading-snug">
                    "{selectedPatient.chiefComplaint}"
                  </p>
                </div>

                {/* HPI Q&A Responses */}
                {selectedPatient.clinicalResponses && selectedPatient.clinicalResponses.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Clinical Questionnaire Responses ({selectedPatient.clinicalResponses.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPatient.clinicalResponses.map((resp, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                          <span className="text-slate-400 font-medium block">{resp.questionTextEn}</span>
                          <span className="font-bold text-teal-300 text-sm block">{resp.answerDisplayEn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PREVIOUS MEDICAL DOCUMENTS & OCR RESULTS */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <span>Previous Medical Records & OCR Results ({selectedPatient.uploadedDocuments?.length || 0})</span>
                  </h3>
                </div>

                {!selectedPatient.uploadedDocuments || selectedPatient.uploadedDocuments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">
                    No documents uploaded by patient for this session.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.uploadedDocuments.map((doc) => (
                      <div
                        key={doc.documentId}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                            <FileText className="w-5 h-5 text-teal-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{doc.filename}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              ID: {doc.documentId} • {doc.fileType}
                            </p>
                          </div>
                        </div>

                        {doc.ocrResult && (
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => setViewingDocForOCR(doc)}
                            leftIcon={<Scan className="w-4 h-4 text-teal-400" />}
                            className="border-slate-700 bg-slate-900 text-teal-300 hover:bg-slate-800 text-xs"
                          >
                            View OCR Data ({Math.round(doc.ocrResult.confidenceAverage * 100)}%)
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI CLINICAL SUMMARY CARD & DOCTOR SIGN-OFF */}
              {selectedPatient.clinicalSummary && (
                <div className="bg-slate-900 p-2 rounded-3xl border border-slate-800">
                  <ClinicalSummaryCard
                    summary={selectedPatient.clinicalSummary}
                    onVerifySummary={handleVerifySummaryClick}
                    onSaveEditedSummary={handleSaveEditedSummary}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* OCR DETAILS MODAL VIEW */}
      {viewingDocForOCR && (
        <OCRResultModal
          isOpen={!!viewingDocForOCR}
          onClose={() => setViewingDocForOCR(null)}
          documentName={viewingDocForOCR.filename}
          ocrResult={viewingDocForOCR.ocrResult || null}
          isScanning={false}
          error={null}
          onRetry={() => {}}
        />
      )}

      {/* AUDIT TRAIL LOG MODAL */}
      {showAuditDrawer && selectedPatient && (
        <Modal
          isOpen={showAuditDrawer}
          onClose={() => setShowAuditDrawer(false)}
          title={`Clinical Audit Trail — ${selectedPatient.patientDetails.name} (${selectedPatient.sessionId})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-slate-100">
            <p className="text-xs text-slate-400">
              Immutable clinical audit trail recording AI summary generation, physician access, OCR corrections, manual edits, and sign-off verification events.
            </p>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No audit logs recorded for this session yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {auditLogs.map((log) => {
                  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
                  let icon = '📌';
                  if (log.eventType === 'AI_GENERATION') {
                    badgeStyle = 'bg-purple-950/80 text-purple-300 border-purple-800';
                    icon = '🤖';
                  } else if (log.eventType === 'RECORD_ACCESS') {
                    badgeStyle = 'bg-blue-950/80 text-blue-300 border-blue-800';
                    icon = '👁️';
                  } else if (log.eventType === 'EDITING') {
                    badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-800';
                    icon = '✏️';
                  } else if (log.eventType === 'OCR_CORRECTION') {
                    badgeStyle = 'bg-orange-950/80 text-orange-300 border-orange-800';
                    icon = '🔍';
                  } else if (log.eventType === 'VERIFICATION') {
                    badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                    icon = '✅';
                  }

                  return (
                    <div
                      key={log.logId}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-[11px] flex items-center gap-1 ${badgeStyle}`}>
                            <span>{icon}</span>
                            <span>{log.eventType}</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Actor: <strong>{log.actorId}</strong>
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-200 font-medium leading-relaxed">
                        {log.details}
                      </p>

                      {log.previousValue && log.newValue && (
                        <div className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-[11px] font-mono">
                          <div className="text-rose-400 line-through">
                            Previous: {typeof log.previousValue === 'object' ? JSON.stringify(log.previousValue) : log.previousValue}
                          </div>
                          <div className="text-emerald-400">
                            Updated: {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : log.newValue}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* FHIR R4 EXPORT MODAL */}
      {showFHIRModal && selectedPatient && (
        <FHIRViewerModal
          isOpen={showFHIRModal}
          onClose={() => setShowFHIRModal(false)}
          session={selectedPatient}
        />
      )}
    </div>
  );
};
