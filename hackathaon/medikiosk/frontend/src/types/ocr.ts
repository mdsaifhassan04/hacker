export interface ExtractedField<T = string> {
  value: T;
  confidence: number; // Decimal confidence score e.g. 0.96 (range 0 to 1)
  sourceDocument: string; // Filename or document ID from which this value was extracted
}

export interface ExtractedPrescriptionItem {
  medicine: ExtractedField<string>;
  strength: ExtractedField<string>;
  dose: ExtractedField<string>;
  frequency: ExtractedField<string>;
  duration: ExtractedField<string>;
  date: ExtractedField<string>;
}

export interface ExtractedLabReportItem {
  test: ExtractedField<string>;
  value: ExtractedField<string>;
  unit: ExtractedField<string>;
  referenceRange: ExtractedField<string>;
  date: ExtractedField<string>;
}

export interface StructuredMedicalInfo {
  docType: 'prescription' | 'lab_report' | 'unknown';
  prescriptions: ExtractedPrescriptionItem[];
  labReports: ExtractedLabReportItem[];
}

export interface OCRResult {
  documentId: string;
  sourceDocument: string;
  rawText: string;
  structuredInfo: StructuredMedicalInfo;
  confidenceAverage: number; // e.g. 0.94
  processedAt: string;
  disclaimer: string;
}
