import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Modal, Button } from './ui';
import { OCRResult } from '../types/ocr';
import { auditLogService } from '../services/AuditLogService';
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Pill,
  Activity,
  FileCheck2,
  AlertCircle,
  Loader2,
  Edit3,
  XCircle,
  Save,
} from 'lucide-react';

export interface OCRResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  ocrResult: OCRResult | null;
  isScanning: boolean;
  error: string | null;
  onRetry: (forceFail?: boolean) => void;
  onSaveOCRCorrection?: (updatedResult: OCRResult) => void;
}

export const OCRResultModal: React.FC<OCRResultModalProps> = ({
  isOpen,
  onClose,
  documentName,
  ocrResult,
  isScanning,
  error,
  onRetry,
  onSaveOCRCorrection,
}) => {
  const { t, language } = useTranslation();
  const isHi = language === 'hi';

  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [isEditingOCR, setIsEditingOCR] = useState<boolean>(false);
  const [editableResult, setEditableResult] = useState<OCRResult | null>(ocrResult);

  React.useEffect(() => {
    setEditableResult(ocrResult);
  }, [ocrResult]);

  const formatConfidence = (conf: number): string => {
    return `${Math.round(conf * 100)}%`;
  };

  const getConfidenceBadge = (conf: number) => {
    const pct = Math.round(conf * 100);
    if (pct >= 90) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
          {pct}% {t('ocr.confidence_label')}
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-amber-100 text-amber-800 border border-amber-300">
          {pct}% {t('ocr.confidence_label')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300">
        {pct}% {t('ocr.confidence_label')}
      </span>
    );
  };

  const handleSaveCorrection = async () => {
    if (!editableResult) return;

    if (onSaveOCRCorrection) {
      onSaveOCRCorrection(editableResult);
    }

    // Audit Log for OCR Correction
    await auditLogService.logEvent({
      eventType: 'OCR_CORRECTION',
      sessionId: editableResult.documentId,
      patientId: editableResult.documentId,
      actorId: 'DOC-OPD-101',
      details: `Physician corrected OCR extractions for document ${documentName}.`,
      previousValue: ocrResult,
      newValue: editableResult,
    });

    setIsEditingOCR(false);
  };

  const handleRejectItem = async (type: 'rx' | 'lab', idx: number) => {
    if (!editableResult) return;

    const updated = JSON.parse(JSON.stringify(editableResult)) as OCRResult;
    if (type === 'rx') {
      updated.structuredInfo.prescriptions[idx].medicine.value = '[REJECTED BY PHYSICIAN]';
    } else {
      updated.structuredInfo.labReports[idx].test.value = '[REJECTED BY PHYSICIAN]';
    }

    setEditableResult(updated);

    // Audit Log for OCR Rejection
    await auditLogService.logEvent({
      eventType: 'OCR_CORRECTION',
      sessionId: editableResult.documentId,
      patientId: editableResult.documentId,
      actorId: 'DOC-OPD-101',
      details: `Physician rejected incorrect OCR item #${idx + 1} on document ${documentName}.`,
      previousValue: ocrResult,
      newValue: updated,
    });
  };

  const currentResult = editableResult || ocrResult;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('ocr.title')}
      description={`${t('ocr.source_doc_label')}: ${documentName}`}
      maxWidth="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => onRetry(false)}
              disabled={isScanning}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />}
            >
              {t('ocr.retry_button')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => onRetry(true)}
              disabled={isScanning}
              className="text-xs text-rose-600 hover:text-rose-800"
            >
              {t('ocr.simulate_fail')}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingOCR ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsEditingOCR(true)}
                leftIcon={<Edit3 className="w-4 h-4 text-teal-700" />}
              >
                {isHi ? 'ओसीआर सुधारें (Correct OCR)' : 'Correct OCR Data'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={handleSaveCorrection}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isHi ? 'सुधार सहेजें (Save Changes)' : 'Save Corrections'}
              </Button>
            )}

            <Button variant="primary" size="lg" onClick={onClose}>
              {t('buttons.confirm')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* SCANNING STATE */}
        {isScanning && (
          <div className="p-10 text-center space-y-4 bg-teal-50/60 border border-teal-200 rounded-3xl">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
            <div>
              <p className="font-extrabold text-slate-900 text-lg">{t('ocr.scanning_status')}</p>
              <p className="text-xs text-slate-500 mt-1">Extracting text & identifying structured medical records...</p>
            </div>
          </div>
        )}

        {/* ERROR STATE WITH RETRY */}
        {!isScanning && error && (
          <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-3xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-rose-950 text-lg">{t('ocr.error_title')}</h4>
                <p className="text-sm text-rose-800 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => onRetry(false)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {t('ocr.retry_button')}
              </Button>
            </div>
          </div>
        )}

        {/* SUCCESS RESULT VIEW */}
        {!isScanning && !error && currentResult && (
          <>
            {/* MEDICAL DISCLAIMER BANNER */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-amber-950">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-extrabold uppercase tracking-wide text-amber-900">
                  {t('ocr.disclaimer_title')}
                </p>
                <p className="text-amber-900 leading-relaxed">
                  {t('ocr.disclaimer_text')}
                </p>
              </div>
            </div>

            {/* OVERVIEW SCORE BADGE */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-400" />
                <span>Doc ID: <strong className="text-teal-300 font-sans">{currentResult.documentId}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-sans">Avg Confidence:</span>
                <span className="font-bold text-emerald-400 text-sm">{formatConfidence(currentResult.confidenceAverage)}</span>
              </div>
            </div>

            {/* PRESCRIPTION ITEMS SECTION */}
            {currentResult.structuredInfo.prescriptions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  <span>{t('ocr.prescription_title')} ({currentResult.structuredInfo.prescriptions.length})</span>
                </h4>

                <div className="space-y-3">
                  {currentResult.structuredInfo.prescriptions.map((item, idx) => {
                    const isRejected = item.medicine.value.includes('REJECTED');

                    return (
                      <div key={idx} className={`p-4 bg-white border rounded-2xl shadow-sm space-y-3 ${isRejected ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-900 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {isEditingOCR ? (
                              <input
                                type="text"
                                value={item.medicine.value}
                                onChange={(e) => {
                                  const updated = JSON.parse(JSON.stringify(currentResult)) as OCRResult;
                                  updated.structuredInfo.prescriptions[idx].medicine.value = e.target.value;
                                  setEditableResult(updated);
                                }}
                                className="px-2 py-1 bg-white border border-teal-300 rounded-lg text-sm font-black"
                              />
                            ) : (
                              <span className={`font-black text-base ${isRejected ? 'text-rose-700 line-through' : 'text-slate-900'}`}>
                                {item.medicine.value}
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-500">
                              ({item.strength.value})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {getConfidenceBadge(item.medicine.confidence)}
                            <button
                              type="button"
                              onClick={() => handleRejectItem('rx', idx)}
                              className="text-xs text-rose-600 hover:text-rose-800 p-1 flex items-center gap-1 font-bold cursor-pointer"
                              title="Reject Incorrect OCR Item"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>

                        {/* Extraction Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-xs font-medium border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.dose')}</span>
                            <span className="text-slate-900 font-extrabold">{item.dose.value}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.frequency')}</span>
                            <span className="text-slate-900 font-extrabold">{item.frequency.value}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.duration')}</span>
                            <span className="text-slate-900 font-extrabold">{item.duration.value}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.date')}</span>
                            <span className="text-slate-900 font-extrabold">{item.date.value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LAB REPORTS SECTION */}
            {currentResult.structuredInfo.labReports.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Activity className="w-5 h-5 text-rose-600" />
                  <span>{t('ocr.lab_report_title')} ({currentResult.structuredInfo.labReports.length})</span>
                </h4>

                <div className="space-y-3">
                  {currentResult.structuredInfo.labReports.map((item, idx) => {
                    const isRejected = item.test.value.includes('REJECTED');

                    return (
                      <div key={idx} className={`p-4 bg-white border rounded-2xl shadow-sm space-y-3 ${isRejected ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-900 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {isEditingOCR ? (
                              <input
                                type="text"
                                value={item.test.value}
                                onChange={(e) => {
                                  const updated = JSON.parse(JSON.stringify(currentResult)) as OCRResult;
                                  updated.structuredInfo.labReports[idx].test.value = e.target.value;
                                  setEditableResult(updated);
                                }}
                                className="px-2 py-1 bg-white border border-rose-300 rounded-lg text-sm font-black"
                              />
                            ) : (
                              <span className={`font-black text-base ${isRejected ? 'text-rose-700 line-through' : 'text-slate-900'}`}>
                                {item.test.value}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {getConfidenceBadge(item.test.confidence)}
                            <button
                              type="button"
                              onClick={() => handleRejectItem('lab', idx)}
                              className="text-xs text-rose-600 hover:text-rose-800 p-1 flex items-center gap-1 font-bold cursor-pointer"
                              title="Reject Incorrect Lab OCR Item"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>

                        {/* Lab Extraction Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-xs font-medium border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.test_value')}</span>
                            <span className="text-rose-700 font-black text-sm">{item.value.value} {item.unit.value}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.ref_range')}</span>
                            <span className="text-slate-800 font-bold">{item.referenceRange.value}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.unit')}</span>
                            <span className="text-slate-800 font-bold">{item.unit.value}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('ocr.date')}</span>
                            <span className="text-slate-800 font-bold">{item.date.value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RAW EXTRACTED TEXT ACCORDION */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>{t('ocr.raw_text_title')}</span>
                </span>
                {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRawText && (
                <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap border-t border-slate-800">
                  {currentResult.rawText}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
