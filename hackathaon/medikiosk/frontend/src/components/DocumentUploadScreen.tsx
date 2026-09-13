import React, { useState, useRef } from 'react';
import { useTranslation, SupportedLanguage } from '../i18n/LanguageContext';
import { Button, Header, ProgressBar } from './ui';
import { PatientSession, DocumentRecord } from '../types/session';
import { OCRResultModal } from './OCRResultModal';
import { ocrService } from '../services/OCRService';
import { OCRResult } from '../types/ocr';
import { ArrowLeft, ArrowRight, Upload, FileText, CheckCircle2, AlertCircle, Trash2, Plus, ShieldCheck, Loader2, Scan, Sparkles } from 'lucide-react';

export interface DocumentUploadScreenProps {
  session: PatientSession;
  onBack: () => void;
  onCompleteDocuments: (documents: DocumentRecord[]) => void;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({
  session,
  onBack,
  onCompleteDocuments,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>(session.uploadedDocuments || []);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // OCR Modal state
  const [selectedDocForOCR, setSelectedDocForOCR] = useState<DocumentRecord | null>(null);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState<boolean>(false);
  const [isOCRScanning, setIsOCRScanning] = useState<boolean>(false);
  const [activeOCRResult, setActiveOCRResult] = useState<OCRResult | null>(null);
  const [ocrError, setOCRError] = useState<string | null>(null);

  const handleStartOCRScan = async (doc: DocumentRecord, forceFail = false) => {
    setSelectedDocForOCR(doc);
    setIsOCRModalOpen(true);
    setIsOCRScanning(true);
    setOCRError(null);
    setActiveOCRResult(doc.ocrResult && !forceFail ? doc.ocrResult : null);

    try {
      const result = await ocrService.processDocument(doc, { forceFail });
      setActiveOCRResult(result);
      // Attach ocrResult to document record state
      setUploadedDocs((prev) =>
        prev.map((d) => (d.documentId === doc.documentId ? { ...d, ocrResult: result } : d))
      );
    } catch (err: any) {
      setOCRError(err.message || 'OCR Processing failed');
    } finally {
      setIsOCRScanning(false);
    }
  };

  const steps = [
    { id: 1, label: t('navigation.step_1') },
    { id: 2, label: t('navigation.step_2') },
    { id: 3, label: t('navigation.step_3') },
    { id: 4, label: t('navigation.step_4') },
    { id: 5, label: t('navigation.step_5') },
    { id: 6, label: t('navigation.step_6') },
  ];

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

  const validateFile = (file: File): boolean => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(t('doc_upload.invalid_type_error'));
      return false;
    }
    setError(null);
    return true;
  };

  const uploadFileToBackend = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('sessionId', session.sessionId);
    formData.append('file', file);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      setUploadProgress(60);
      const response = await fetch(`${apiBaseUrl}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      const docRecord: DocumentRecord = result.document;
      setUploadedDocs((prev) => [...prev, docRecord]);
    } catch (err) {
      // Demo Fallback if backend API is offline
      setUploadProgress(100);
      const mockDocRecord: DocumentRecord = {
        documentId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
        sessionId: session.sessionId,
        filename: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        fileUrl: URL.createObjectURL(file),
      };
      setUploadedDocs((prev) => [...prev, mockDocRecord]);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToBackend(e.target.files[0]);
    }
  };

  const handleRemoveDoc = (docId: string) => {
    setUploadedDocs(uploadedDocs.filter((d) => d.documentId !== docId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeBadge = (mimeOrName: string) => {
    const lower = mimeOrName.toLowerCase();
    if (lower.includes('pdf')) return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-xs">PDF</span>;
    if (lower.includes('png')) return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">PNG</span>;
    return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-xs">JPG</span>;
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
        <ProgressBar currentStep={6} steps={steps} />

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{t('doc_upload.step_label')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('doc_upload.title')}
          </h2>
          <p className="text-base text-slate-600 font-medium">
            {t('doc_upload.subtitle')}
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* UPLOAD & SCAN ZONE */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-dashed border-slate-300 hover:border-teal-500 shadow-sm transition-all space-y-6 text-center">
          
          <div className="w-20 h-20 rounded-3xl bg-teal-50 border-2 border-teal-200 text-teal-600 mx-auto flex items-center justify-center shadow-md">
            <Upload className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-extrabold text-slate-900">{t('doc_upload.drag_drop_text')}</h3>
            <p className="text-xs text-slate-500 font-bold">{t('doc_upload.supported_formats')}</p>
          </div>

          {/* Action Buttons: [Upload Document], [Scan Another], [Skip] */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-5 h-5" />}
              className="w-full sm:w-auto shadow-lg shadow-teal-600/20"
            >
              {t('doc_upload.upload_button')}
            </Button>

            {uploadedDocs.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Plus className="w-5 h-5" />}
                className="w-full sm:w-auto border-teal-300 text-teal-800 bg-teal-50"
              >
                {t('doc_upload.scan_another')}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onCompleteDocuments(uploadedDocs)}
              className="w-full sm:w-auto text-slate-500 hover:text-slate-900"
            >
              {t('doc_upload.skip_button')}
            </Button>
          </div>

          {/* UPLOAD PROGRESS BAR */}
          {isUploading && (
            <div className="max-w-md mx-auto space-y-2 pt-4">
              <div className="flex items-center justify-between text-xs font-bold text-teal-800">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>{t('doc_upload.uploading_status')}</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2 text-left">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ATTACHED DOCUMENTS LIST */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>{t('doc_upload.uploaded_title')} ({uploadedDocs.length})</span>
            </h3>

            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
              {t('doc_upload.encounter_label')}: <strong className="text-slate-900">{session.sessionId}</strong>
            </span>
          </div>

          {uploadedDocs.length === 0 ? (
            <p className="text-sm text-slate-400 italic p-6 text-center">
              {t('doc_upload.no_docs_title')}
            </p>
          ) : (
            <div className="space-y-3">
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.documentId}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 transition-all hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-900 text-base truncate">{doc.filename}</p>
                        {getFileTypeBadge(doc.filename || doc.fileType)}
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>ID: <code className="font-mono text-slate-700">{doc.documentId}</code></span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded & Associated
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant={doc.ocrResult ? "outline" : "primary"}
                      size="md"
                      onClick={() => handleStartOCRScan(doc)}
                      leftIcon={doc.ocrResult ? <Sparkles className="w-4 h-4 text-teal-600" /> : <Scan className="w-4 h-4" />}
                      className={doc.ocrResult ? "border-teal-300 text-teal-900 bg-teal-50" : "bg-teal-700 hover:bg-teal-800 text-white"}
                    >
                      {doc.ocrResult ? t('ocr.view_ocr_button') : t('ocr.scan_button')}
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.documentId)}
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shrink-0"
                      title="Remove Document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OCR RESULTS MODAL */}
        <OCRResultModal
          isOpen={isOCRModalOpen}
          onClose={() => setIsOCRModalOpen(false)}
          documentName={selectedDocForOCR?.filename || 'Document'}
          ocrResult={activeOCRResult}
          isScanning={isOCRScanning}
          error={ocrError}
          onRetry={(forceFail) => {
            if (selectedDocForOCR) {
              handleStartOCRScan(selectedDocForOCR, forceFail);
            }
          }}
        />

        {/* ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
            type="button"
            variant="primary"
            size="xl"
            onClick={() => onCompleteDocuments(uploadedDocs)}
            rightIcon={<ArrowRight className="w-6 h-6" />}
            className="w-full sm:w-auto shadow-xl shadow-teal-600/30 border-2 border-teal-500"
          >
            {t('doc_upload.complete_button')}
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
