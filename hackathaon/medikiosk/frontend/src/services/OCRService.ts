import { DocumentRecord } from '../types/session';
import { OCRResult } from '../types/ocr';

export interface OCRProcessOptions {
  forceFail?: boolean;
}

export class OCRService {
  private static instance: OCRService;

  private constructor() {}

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  public async processDocument(
    doc: DocumentRecord | File,
    options?: OCRProcessOptions
  ): Promise<OCRResult> {
    const documentId = 'documentId' in doc ? doc.documentId : `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const filename = 'filename' in doc ? doc.filename : doc.name;

    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulated failure scenario for unreadable/blurry scans
    if (options?.forceFail || filename.toLowerCase().includes('fail') || filename.toLowerCase().includes('corrupt')) {
      throw new Error(
        'OCR Error: Unable to recognize medical text from this document. The image may be too blurry, rotated, or low-contrast. Please ensure good lighting and retry.'
      );
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Attempt real backend call
    try {
      const formData = new FormData();
      formData.append('documentId', documentId);
      formData.append('filename', filename);

      const response = await fetch(`${apiBaseUrl}/api/ocr/process`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ocrResult) {
          return data.ocrResult;
        }
      }
    } catch (err) {
      console.warn('Backend OCR endpoint offline, falling back to DEMO_MODE simulation:', err);
    }

    // DEMO_MODE Fallback
    return this.getDemoOCRResult(documentId, filename);
  }

  private getDemoOCRResult(documentId: string, filename: string): OCRResult {
    const isLabReport =
      filename.toLowerCase().includes('lab') ||
      filename.toLowerCase().includes('blood') ||
      filename.toLowerCase().includes('report') ||
      filename.toLowerCase().includes('test');

    const processedAt = new Date().toISOString();
    const disclaimer =
      'Preliminary AI/OCR extraction for pre-consultation summary. Final verification by attending OPD physician required.';

    if (isLabReport) {
      return {
        documentId,
        sourceDocument: filename,
        rawText: `MAX PATHOLOGY LABORATORY - OPD DIAGNOSTICS\nDate: 12/09/2026 | Patient ID: PAT-1001\n----------------------------------------\nTEST NAME              RESULT    UNIT    REF RANGE\n----------------------------------------\nFasting Blood Sugar    110       mg/dL   (70 - 100)\nHbA1c                  6.8       %       (< 5.7)\nHemoglobin             13.5      g/dL    (12.0 - 15.5)\n----------------------------------------`,
        structuredInfo: {
          docType: 'lab_report',
          prescriptions: [],
          labReports: [
            {
              test: { value: 'Fasting Blood Sugar', confidence: 0.97, sourceDocument: filename },
              value: { value: '110', confidence: 0.99, sourceDocument: filename },
              unit: { value: 'mg/dL', confidence: 0.98, sourceDocument: filename },
              referenceRange: { value: '70 - 100 mg/dL', confidence: 0.93, sourceDocument: filename },
              date: { value: '2026-09-12', confidence: 0.96, sourceDocument: filename },
            },
            {
              test: { value: 'HbA1c', confidence: 0.98, sourceDocument: filename },
              value: { value: '6.8', confidence: 0.99, sourceDocument: filename },
              unit: { value: '%', confidence: 0.97, sourceDocument: filename },
              referenceRange: { value: '< 5.7 %', confidence: 0.94, sourceDocument: filename },
              date: { value: '2026-09-12', confidence: 0.96, sourceDocument: filename },
            },
            {
              test: { value: 'Hemoglobin', confidence: 0.96, sourceDocument: filename },
              value: { value: '13.5', confidence: 0.98, sourceDocument: filename },
              unit: { value: 'g/dL', confidence: 0.97, sourceDocument: filename },
              referenceRange: { value: '12.0 - 15.5 g/dL', confidence: 0.92, sourceDocument: filename },
              date: { value: '2026-09-12', confidence: 0.96, sourceDocument: filename },
            },
          ],
        },
        confidenceAverage: 0.96,
        processedAt,
        disclaimer,
      };
    }

    // Default: Prescription
    return {
      documentId,
      sourceDocument: filename,
      rawText: `AIIMS NEW DELHI - DEPT OF GENERAL MEDICINE\nDate: 10/09/2026 | Dr. A. K. Sharma, MD\n----------------------------------------\nRx:\n1. Tab Metformin 500mg - 1 Tab twice daily x 30 days\n2. Cap Amoxicillin 250mg - 1 Cap thrice daily x 5 days\n3. Tab Paracetamol 650mg - 1 Tab SOS x 3 days\n----------------------------------------`,
      structuredInfo: {
        docType: 'prescription',
        prescriptions: [
          {
            medicine: { value: 'Metformin', confidence: 0.96, sourceDocument: filename },
            strength: { value: '500mg', confidence: 0.98, sourceDocument: filename },
            dose: { value: '1 Tab', confidence: 0.95, sourceDocument: filename },
            frequency: { value: 'Twice daily', confidence: 0.94, sourceDocument: filename },
            duration: { value: '30 days', confidence: 0.92, sourceDocument: filename },
            date: { value: '2026-09-10', confidence: 0.97, sourceDocument: filename },
          },
          {
            medicine: { value: 'Amoxicillin', confidence: 0.93, sourceDocument: filename },
            strength: { value: '250mg', confidence: 0.95, sourceDocument: filename },
            dose: { value: '1 Cap', confidence: 0.94, sourceDocument: filename },
            frequency: { value: 'Thrice daily', confidence: 0.91, sourceDocument: filename },
            duration: { value: '5 days', confidence: 0.90, sourceDocument: filename },
            date: { value: '2026-09-10', confidence: 0.97, sourceDocument: filename },
          },
        ],
        labReports: [],
      },
      confidenceAverage: 0.94,
      processedAt,
      disclaimer,
    };
  }
}

export const ocrService = OCRService.getInstance();
