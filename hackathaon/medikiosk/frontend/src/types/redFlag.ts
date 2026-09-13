export type RedFlagSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE';
export type RedFlagCategory = 'cardiovascular' | 'neurological' | 'respiratory' | 'abdominal' | 'general';

export interface RedFlagItem {
  ruleId: string;
  name: string;
  severity: RedFlagSeverity;
  category: RedFlagCategory;
  messageEn: string;
  messageHi: string;
}

export interface RedFlagAssessment {
  priorityAssessment: boolean;
  triggeredFlags: RedFlagItem[];
  patientMessageEn: string;
  patientMessageHi: string;
  evaluatedAt: string;
}

export interface RedFlagRule {
  id: string;
  name: string;
  severity: RedFlagSeverity;
  category: RedFlagCategory;
  evaluate: (context: {
    chiefComplaint: string;
    responses: Record<string, any>;
  }) => boolean;
  messageEn: string;
  messageHi: string;
}
