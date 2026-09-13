import { PatientSession } from '../types/session';
import { StructuredClinicalSummary } from '../types/summary';
import { auditLogService } from './AuditLogService';

export class LLMService {
  private static instance: LLMService;

  private constructor() {}

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  public async generateClinicalSummary(
    session: PatientSession
  ): Promise<StructuredClinicalSummary> {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    let summary: StructuredClinicalSummary;

    try {
      const response = await fetch(`${apiBaseUrl}/api/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          summary = data.summary;
        } else {
          summary = this.buildDemoClinicalSummary(session);
        }
      } else {
        summary = this.buildDemoClinicalSummary(session);
      }
    } catch (err) {
      console.warn('Backend LLM Summary API offline, using DEMO_MODE deterministic summary generator:', err);
      summary = this.buildDemoClinicalSummary(session);
    }

    // Audit Log for AI Generation
    await auditLogService.logEvent({
      eventType: 'AI_GENERATION',
      sessionId: session.sessionId,
      patientId: session.patientId,
      actorId: 'MEDIKIOSK-AI',
      details: `Generated structured 11-section clinical summary draft for patient ${session.patientDetails.name}.`,
    });

    return summary;
  }

  public async verifySummary(
    sessionId: string,
    doctorId: string = 'DOC-OPD-101'
  ): Promise<{ status: string; verifiedAt: string }> {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const verifiedAt = new Date().toISOString();

    try {
      await fetch(`${apiBaseUrl}/api/summary/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, doctorId, verifiedAt }),
      });
    } catch (err) {
      console.warn('Backend summary verification save failed or offline:', err);
    }

    // Audit Log for Verification Sign-Off
    await auditLogService.logEvent({
      eventType: 'VERIFICATION',
      sessionId,
      patientId: sessionId,
      actorId: doctorId,
      details: `Physician '${doctorId}' verified and signed off clinical summary for encounter ${sessionId}.`,
    });

    return { status: 'ok', verifiedAt };
  }

  private buildDemoClinicalSummary(session: PatientSession): StructuredClinicalSummary {
    const generatedAt = new Date().toISOString();

    // 1. Chief Complaint
    const chiefComplaint = session.chiefComplaint?.trim() || 'Not reported';

    // 2. History of Present Illness (HPI)
    let historyOfPresentIllness = 'Not reported';
    if (session.clinicalResponses && session.clinicalResponses.length > 0) {
      const hpiItems = session.clinicalResponses.map((r) => `${r.questionTextEn}: ${r.answerDisplayEn}`);
      historyOfPresentIllness = hpiItems.join(' • ');
    }

    // 3. Past Medical History
    let pastMedicalHistory = 'Not reported';
    if (session.medicalHistory?.pastConditions) {
      const pc = session.medicalHistory.pastConditions;
      if (typeof pc === 'object') {
        const conditions: string[] = [];
        if (pc.diabetes) conditions.push('Diabetes');
        if (pc.hypertension) conditions.push('Hypertension');
        if (pc.asthma) conditions.push('Asthma');
        if (pc.tuberculosis) conditions.push('Tuberculosis');
        if (pc.cardiacDisease) conditions.push('Cardiac Disease');
        if (pc.other) conditions.push(pc.other);
        pastMedicalHistory = conditions.length > 0 ? conditions.join(', ') : 'Not reported';
      } else if (typeof pc === 'string' && pc.trim() !== '') {
        pastMedicalHistory = pc;
      }
    }

    // 4. Medication History
    let medicationHistory = 'Not reported';
    if (session.medicalHistory?.medications) {
      const meds = session.medicalHistory.medications;
      if (Array.isArray(meds) && meds.length > 0) {
        medicationHistory = meds
          .map((m) => `${m.medicine} (${m.strength || 'strength not reported'}, ${m.frequency || 'freq not reported'}, ${m.duration || 'duration not reported'})`)
          .join('; ');
      } else if (typeof meds === 'string' && meds.trim() !== '') {
        medicationHistory = meds;
      }
    }

    // 5. Allergy History
    let allergyHistory = 'Not reported';
    if (session.medicalHistory?.allergies) {
      const alg = session.medicalHistory.allergies;
      if (Array.isArray(alg) && alg.length > 0) {
        allergyHistory = alg
          .map((a) => `${a.type || 'Allergy'}: ${a.substance || 'substance not reported'} (Reaction: ${a.reaction || 'not reported'})`)
          .join('; ');
      } else if (typeof alg === 'string' && alg.trim() !== '') {
        allergyHistory = alg;
      }
    }

    // 6. Surgical History
    let surgicalHistory = 'Not reported';
    if (session.medicalHistory?.surgeries) {
      const surg = session.medicalHistory.surgeries;
      if (Array.isArray(surg) && surg.length > 0) {
        surgicalHistory = surg
          .map((s) => `${s.procedure || 'Procedure'} (Date: ${s.approximateDate || 'date not reported'})`)
          .join('; ');
      } else if (typeof surg === 'string' && surg.trim() !== '') {
        surgicalHistory = surg;
      }
    }

    // 7. Family History
    let familyHistory = 'Not reported';
    if (session.medicalHistory?.familyHistory && session.medicalHistory.familyHistory.trim() !== '') {
      familyHistory = session.medicalHistory.familyHistory;
    }

    // 8. Personal History
    let personalHistory = 'Not reported';
    if (session.medicalHistory?.personalHistory) {
      const ph = session.medicalHistory.personalHistory;
      if (typeof ph === 'object') {
        const phParts: string[] = [];
        if (ph.diet) phParts.push(`Diet: ${ph.diet}`);
        if (ph.sleep) phParts.push(`Sleep: ${ph.sleep}`);
        if (ph.tobacco) phParts.push(`Tobacco: ${ph.tobacco}`);
        if (ph.alcohol) phParts.push(`Alcohol: ${ph.alcohol}`);
        if (ph.occupation) phParts.push(`Occupation: ${ph.occupation}`);
        personalHistory = phParts.length > 0 ? phParts.join(' • ') : 'Not reported';
      } else if (typeof ph === 'string' && ph.trim() !== '') {
        personalHistory = ph;
      }
    }

    // 9. Relevant Investigations (OCR document findings)
    let relevantInvestigations = 'Not reported';
    if (session.uploadedDocuments && session.uploadedDocuments.length > 0) {
      const ocrItems: string[] = [];
      session.uploadedDocuments.forEach((doc) => {
        if (doc.ocrResult) {
          const res = doc.ocrResult;
          if (res.structuredInfo.prescriptions.length > 0) {
            const rxNames = res.structuredInfo.prescriptions.map((p) => p.medicine.value).join(', ');
            ocrItems.push(`OCR Prescription (${doc.filename}): ${rxNames}`);
          }
          if (res.structuredInfo.labReports.length > 0) {
            const labResults = res.structuredInfo.labReports.map((l) => `${l.test.value}: ${l.value.value} ${l.unit.value}`).join(', ');
            ocrItems.push(`OCR Lab Report (${doc.filename}): ${labResults}`);
          }
        } else {
          ocrItems.push(`Attached Document: ${doc.filename} (OCR pending/unprocessed)`);
        }
      });
      if (ocrItems.length > 0) {
        relevantInvestigations = ocrItems.join(' | ');
      }
    }

    // 10. Red Flags
    let redFlags = 'No red flags triggered';
    if (session.redFlagAssessment?.priorityAssessment && session.redFlagAssessment.triggeredFlags.length > 0) {
      redFlags = session.redFlagAssessment.triggeredFlags
        .map((f) => `⚠️ ${f.name} (${f.severity}) - ${f.messageEn}`)
        .join('; ');
    }

    // 11. Information Requiring Verification
    const infoRequiringVerification: string[] = [];
    if (chiefComplaint.length < 5) {
      infoRequiringVerification.push('Chief complaint description is short; verify symptom details with patient.');
    }
    if (session.uploadedDocuments) {
      session.uploadedDocuments.forEach((doc) => {
        if (doc.ocrResult && doc.ocrResult.confidenceAverage < 0.90) {
          infoRequiringVerification.push(`Low OCR confidence (${Math.round(doc.ocrResult.confidenceAverage * 100)}%) on document '${doc.filename}'; physical prescription review required.`);
        }
      });
    }
    if (session.redFlagAssessment?.priorityAssessment) {
      infoRequiringVerification.push('Priority symptom combination detected; immediate clinical triage verification required.');
    }
    if (infoRequiringVerification.length === 0) {
      infoRequiringVerification.push('Verify self-reported symptom duration and current drug dosage details.');
    }

    return {
      chiefComplaint,
      historyOfPresentIllness,
      pastMedicalHistory,
      medicationHistory,
      allergyHistory,
      surgicalHistory,
      familyHistory,
      personalHistory,
      relevantInvestigations,
      redFlags,
      informationRequiringVerification: infoRequiringVerification,
      isDoctorVerified: false, // Mandatory FALSE default
      verificationStatus: 'UNVERIFIED_DRAFT',
      encounterId: session.sessionId,
      generatedAt,
      verifiedAt: null,
      verifiedByDoctorId: null,
    };
  }
}

export const llmService = LLMService.getInstance();
