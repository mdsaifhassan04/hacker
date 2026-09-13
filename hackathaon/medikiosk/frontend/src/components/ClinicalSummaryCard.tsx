import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { StructuredClinicalSummary } from '../types/summary';
import { Button } from './ui';
import { auditLogService } from '../services/AuditLogService';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Stethoscope,
  Pill,
  Activity,
  Heart,
  AlertCircle,
  HelpCircle,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export interface ClinicalSummaryCardProps {
  summary: StructuredClinicalSummary;
  onVerifySummary: (updatedSummary?: StructuredClinicalSummary) => void;
  onSaveEditedSummary?: (editedSummary: StructuredClinicalSummary) => void;
  isVerifying?: boolean;
}

export const ClinicalSummaryCard: React.FC<ClinicalSummaryCardProps> = ({
  summary,
  onVerifySummary,
  onSaveEditedSummary,
  isVerifying = false,
}) => {
  const { t, language } = useTranslation();
  const isHi = language === 'hi';

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeVersionView, setActiveVersionView] = useState<'current' | 'ai_original'>('current');
  const [draftSummary, setDraftSummary] = useState<StructuredClinicalSummary>(summary);

  const handleStartEdit = () => {
    setDraftSummary({ ...summary });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const previous = { ...summary };
    const updated: StructuredClinicalSummary = {
      ...draftSummary,
      aiOriginalSummary: summary.aiOriginalSummary || { ...summary },
    };

    if (onSaveEditedSummary) {
      onSaveEditedSummary(updated);
    }

    // Log Audit Trail for Editing
    await auditLogService.logEvent({
      eventType: 'EDITING',
      sessionId: summary.encounterId || 'SESSION-UNKNOWN',
      patientId: summary.encounterId || 'PAT-UNKNOWN',
      actorId: 'DOC-OPD-101',
      details: 'Physician modified AI clinical summary draft text fields.',
      previousValue: previous,
      newValue: updated,
    });

    setIsEditing(false);
  };

  const handleVerify = async () => {
    const verifiedAt = new Date().toISOString();
    const verifiedRecord: StructuredClinicalSummary = {
      ...draftSummary,
      isDoctorVerified: true,
      verificationStatus: 'PHYSICIAN_VERIFIED',
      verifiedAt,
      verifiedByDoctorId: 'DOC-OPD-101',
      aiOriginalSummary: summary.aiOriginalSummary || { ...summary },
    };

    // Log Audit Trail for Verification
    await auditLogService.logEvent({
      eventType: 'VERIFICATION',
      sessionId: summary.encounterId || 'SESSION-UNKNOWN',
      patientId: summary.encounterId || 'PAT-UNKNOWN',
      actorId: 'DOC-OPD-101',
      details: 'Physician verified and signed off the final clinical summary.',
      newValue: verifiedRecord,
    });

    onVerifySummary(verifiedRecord);
  };

  const displayedSummary =
    activeVersionView === 'ai_original' && summary.aiOriginalSummary
      ? (summary.aiOriginalSummary as StructuredClinicalSummary)
      : isEditing
      ? draftSummary
      : summary;

  return (
    <div className="bg-white rounded-3xl border-2 border-teal-100 p-6 sm:p-8 shadow-sm space-y-6">
      {/* HEADER & DOCTOR VERIFICATION BADGE BAR */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black">
              <Stethoscope className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('clinical_summary.title')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {t('clinical_summary.subtitle')}
          </p>
        </div>

        {/* VERSION SWITCHER & DOCTOR ACTIONS: [Edit], [Save], [Verify] */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Version Switcher Tabs (Keep AI and Verified versions distinguishable) */}
          {summary.aiOriginalSummary && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold mr-2">
              <button
                type="button"
                onClick={() => setActiveVersionView('current')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeVersionView === 'current' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Verified Record</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveVersionView('ai_original')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeVersionView === 'ai_original' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>AI Original Draft</span>
                </span>
              </button>
            </div>
          )}

          {/* VERIFICATION BADGE */}
          {summary.isDoctorVerified || summary.verificationStatus === 'PHYSICIAN_VERIFIED' ? (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-900 border-2 border-emerald-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Physician Verified</span>
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{t('clinical_summary.pending_verification')}</span>
            </span>
          )}

          {/* ACTION BUTTONS: [Edit], [Save], [Verify] */}
          {!isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={handleStartEdit}
                leftIcon={<Edit3 className="w-4 h-4 text-teal-700" />}
                className="border-teal-300 text-teal-900 bg-teal-50"
              >
                {isHi ? 'संपादित करें (Edit)' : 'Edit Summary'}
              </Button>

              {(!summary.isDoctorVerified && summary.verificationStatus !== 'PHYSICIAN_VERIFIED') && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleVerify}
                  isLoading={isVerifying}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  className="bg-teal-700 hover:bg-teal-800 text-white shadow-md font-extrabold"
                >
                  {t('clinical_summary.verify_button')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsEditing(false)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                {t('buttons.cancel')}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleSaveEdit}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isHi ? 'ड्राफ्ट सहेजें (Save Draft)' : 'Save Draft'}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleVerify}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="bg-teal-700 hover:bg-teal-800 text-white shadow-md font-extrabold"
              >
                Verify Final Summary
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SAFETY NOTICE BANNER */}
      <div className="p-3.5 bg-slate-900 text-teal-300 rounded-2xl text-xs flex items-start gap-2.5 font-medium">
        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <span>{t('clinical_summary.safety_notice')}</span>
      </div>

      {/* EDITING INDICATOR BANNER */}
      {isEditing && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-bold text-amber-950 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-700 animate-bounce" />
            <span>Physician Editing Mode Active. Modify summary fields below, then click Save or Verify.</span>
          </span>
        </div>
      )}

      {/* 11 STRUCTURED CLINICAL SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* 1. Chief Complaint */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block">
            1. {t('chief_complaint.step_label')}
          </span>
          {isEditing ? (
            <textarea
              value={draftSummary.chiefComplaint}
              onChange={(e) => setDraftSummary({ ...draftSummary, chiefComplaint: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-extrabold outline-none"
              rows={2}
            />
          ) : (
            <p className="font-extrabold text-slate-900 text-sm">
              "{displayedSummary.chiefComplaint}"
            </p>
          )}
        </div>

        {/* 2. HPI */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block">
            2. {t('clinical_summary.hpi')}
          </span>
          {isEditing ? (
            <textarea
              value={draftSummary.historyOfPresentIllness}
              onChange={(e) => setDraftSummary({ ...draftSummary, historyOfPresentIllness: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
              rows={3}
            />
          ) : (
            <p className="text-slate-800 font-medium leading-relaxed">
              {displayedSummary.historyOfPresentIllness}
            </p>
          )}
        </div>

        {/* 3. Past Medical History */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-teal-600" />
            <span>3. {t('clinical_summary.past_history')}</span>
          </span>
          {isEditing ? (
            <input
              type="text"
              value={draftSummary.pastMedicalHistory}
              onChange={(e) => setDraftSummary({ ...draftSummary, pastMedicalHistory: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
            />
          ) : (
            <p className="text-slate-800 font-medium">{displayedSummary.pastMedicalHistory}</p>
          )}
        </div>

        {/* 4. Medication History */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block flex items-center gap-1">
            <Pill className="w-3.5 h-3.5 text-teal-600" />
            <span>4. {t('clinical_summary.medication_history')}</span>
          </span>
          {isEditing ? (
            <input
              type="text"
              value={draftSummary.medicationHistory}
              onChange={(e) => setDraftSummary({ ...draftSummary, medicationHistory: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
            />
          ) : (
            <p className="text-slate-800 font-medium">{displayedSummary.medicationHistory}</p>
          )}
        </div>

        {/* 5. Allergy History */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block">
            5. {t('clinical_summary.allergy_history')}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={draftSummary.allergyHistory}
              onChange={(e) => setDraftSummary({ ...draftSummary, allergyHistory: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
            />
          ) : (
            <p className="text-slate-800 font-medium">{displayedSummary.allergyHistory}</p>
          )}
        </div>

        {/* 6. Surgical History */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block">
            6. {t('clinical_summary.surgical_history')}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={draftSummary.surgicalHistory}
              onChange={(e) => setDraftSummary({ ...draftSummary, surgicalHistory: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
            />
          ) : (
            <p className="text-slate-800 font-medium">{displayedSummary.surgicalHistory}</p>
          )}
        </div>

        {/* 7. Family History */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block">
            7. {t('clinical_summary.family_history')}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={draftSummary.familyHistory}
              onChange={(e) => setDraftSummary({ ...draftSummary, familyHistory: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
            />
          ) : (
            <p className="text-slate-800 font-medium">{displayedSummary.familyHistory}</p>
          )}
        </div>

        {/* 8. Personal History */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <span className="font-extrabold uppercase tracking-wider text-teal-800 text-[11px] block">
            8. {t('clinical_summary.personal_history')}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={draftSummary.personalHistory}
              onChange={(e) => setDraftSummary({ ...draftSummary, personalHistory: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
            />
          ) : (
            <p className="text-slate-800 font-medium">{displayedSummary.personalHistory}</p>
          )}
        </div>

        {/* 9. Relevant Investigations (OCR) */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1.5 md:col-span-2">
          <span className="font-extrabold uppercase tracking-wider text-teal-900 text-[11px] block flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-teal-700" />
            <span>9. {t('clinical_summary.investigations')}</span>
          </span>
          {isEditing ? (
            <textarea
              value={draftSummary.relevantInvestigations}
              onChange={(e) => setDraftSummary({ ...draftSummary, relevantInvestigations: e.target.value })}
              className="w-full p-2 bg-white border border-teal-300 rounded-xl text-xs font-medium outline-none"
              rows={2}
            />
          ) : (
            <p className="text-slate-900 font-medium leading-relaxed">
              {displayedSummary.relevantInvestigations}
            </p>
          )}
        </div>

        {/* 10. Red Flags Assessment */}
        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5 md:col-span-2">
          <span className="font-extrabold uppercase tracking-wider text-rose-900 text-[11px] block flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>10. {t('clinical_summary.red_flags')}</span>
          </span>
          {isEditing ? (
            <textarea
              value={draftSummary.redFlags}
              onChange={(e) => setDraftSummary({ ...draftSummary, redFlags: e.target.value })}
              className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-bold outline-none"
              rows={2}
            />
          ) : (
            <p className="text-rose-950 font-bold leading-relaxed">{displayedSummary.redFlags}</p>
          )}
        </div>

        {/* 11. Information Requiring Verification */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 md:col-span-2">
          <span className="font-extrabold uppercase tracking-wider text-amber-900 text-[11px] block flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>11. {t('clinical_summary.verification_required')}</span>
          </span>
          <ul className="list-disc list-inside space-y-1 text-amber-950 font-semibold">
            {displayedSummary.informationRequiringVerification.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* VERIFIED TIMESTAMP FOOTER */}
      {(summary.isDoctorVerified || summary.verificationStatus === 'PHYSICIAN_VERIFIED') && summary.verifiedAt && (
        <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-emerald-800 border-t border-emerald-100 bg-emerald-50/40 p-3 rounded-2xl">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('clinical_summary.verified_at')}: <strong>{new Date(summary.verifiedAt).toLocaleString()}</strong></span>
          </span>
          <span>{t('clinical_summary.verified_by')}: <strong>{summary.verifiedByDoctorId || 'DOC-OPD-101'}</strong></span>
        </div>
      )}
    </div>
  );
};
