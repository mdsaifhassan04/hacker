export type AuditEventType =
  | 'AI_GENERATION'
  | 'EDITING'
  | 'OCR_CORRECTION'
  | 'VERIFICATION'
  | 'RECORD_ACCESS';

export interface AuditLogEntry {
  logId: string;
  eventType: AuditEventType;
  sessionId: string;
  patientId: string;
  actorId: string; // e.g. "DOC-OPD-101" or "MEDIKIOSK-AI"
  timestamp: string;
  details: string;
  previousValue?: any;
  newValue?: any;
}
