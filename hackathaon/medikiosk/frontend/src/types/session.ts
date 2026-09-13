import { ClinicalResponse } from './questionnaire';
import { OCRResult } from './ocr';
import { RedFlagAssessment } from './redFlag';
import { StructuredClinicalSummary } from './summary';

export interface DemoPatient {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  lastVisit?: string;
  previousDepartment?: string;
}

export interface ConsentRecord {
  sessionId: string;
  consentStatus: 'ACCEPTED' | 'DECLINED';
  timestamp: string;
  consentVersion: string;
}

export interface DocumentRecord {
  documentId: string;
  sessionId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  fileUrl: string;
  ocrResult?: OCRResult;
}

export interface PastConditions {
  diabetes: boolean;
  hypertension: boolean;
  asthma: boolean;
  tuberculosis: boolean;
  cardiacDisease: boolean;
  other: string;
}

export interface MedicationItem {
  medicine: string;
  strength: string;
  frequency: string;
  duration: string;
}

export interface AllergyItem {
  type: string;
  substance: string;
  reaction: string;
}

export interface SurgeryItem {
  procedure: string;
  approximateDate: string;
}

export interface PersonalHistory {
  diet: string;
  sleep: string;
  tobacco: string;
  alcohol: string;
  occupation: string;
}

export interface MedicalHistory {
  pastConditions: PastConditions | string;
  medications: MedicationItem[] | string;
  allergies: AllergyItem[] | string;
  surgeries: SurgeryItem[] | string;
  familyHistory: string;
  personalHistory: PersonalHistory | string;
}

export interface PatientSession {
  sessionId: string;
  patientId: string;
  language: string;
  createdAt: string;
  patientDetails: DemoPatient;
  isNewPatient: boolean;
  consentRecord?: ConsentRecord;
  chiefComplaint?: string;
  pathwayId?: string;
  clinicalResponses?: ClinicalResponse[];
  medicalHistory?: MedicalHistory;
  uploadedDocuments?: DocumentRecord[];
  redFlagAssessment?: RedFlagAssessment;
  clinicalSummary?: StructuredClinicalSummary;
}
