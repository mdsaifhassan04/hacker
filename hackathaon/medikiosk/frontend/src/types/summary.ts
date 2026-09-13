export type SummaryVerificationStatus = 'UNVERIFIED_DRAFT' | 'PHYSICIAN_VERIFIED' | 'REJECTED';

export interface StructuredClinicalSummary {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medicationHistory: string;
  allergyHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  personalHistory: string;
  relevantInvestigations: string;
  redFlags: string;
  informationRequiringVerification: string[];
  isDoctorVerified: boolean; // MUST be false by default
  verificationStatus: SummaryVerificationStatus;
  encounterId?: string;
  generatedAt: string;
  verifiedAt?: string | null;
  verifiedByDoctorId?: string | null;
  doctorNotes?: string;
  aiOriginalSummary?: Omit<StructuredClinicalSummary, 'aiOriginalSummary'>;
}
