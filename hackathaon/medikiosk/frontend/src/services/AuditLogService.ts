import { AuditLogEntry } from '../types/audit';

export class AuditLogService {
  private static instance: AuditLogService;
  private logs: AuditLogEntry[] = [];

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  public async logEvent(
    entry: Omit<AuditLogEntry, 'logId' | 'timestamp'>
  ): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      logId: `AUDIT-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(fullEntry);
    console.log(`[CLINICAL AUDIT LOG - ${fullEntry.eventType}]:`, fullEntry);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      await fetch(`${apiBaseUrl}/api/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullEntry),
      });
    } catch (err) {
      console.warn('Backend Audit log endpoint offline, keeping local audit record:', err);
    }

    return fullEntry;
  }

  public async getLogsForSession(sessionId: string): Promise<AuditLogEntry[]> {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiBaseUrl}/api/audit/logs/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          return data.logs;
        }
      }
    } catch (err) {
      console.warn('Backend fetch logs failed, returning local audit memory:', err);
    }

    return this.logs.filter((l) => l.sessionId === sessionId);
  }
}

export const auditLogService = AuditLogService.getInstance();
