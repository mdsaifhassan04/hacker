import { PatientSession } from '../types/session';

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FHIRBundleEntry {
  fullUrl: string;
  resource: FHIRResource;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    profile: string[];
    tag: Array<{ system: string; code: string; display: string }>;
  };
  type: 'collection';
  timestamp: string;
  identifier: { system: string; value: string };
  disclaimer: string;
  abdmExtensibility: {
    readyForAbdmM1M2M3: boolean;
    targetProfile: string;
    abhaAddressPlaceholder: string;
  };
  total: number;
  entry: FHIRBundleEntry[];
}

export class FHIRService {
  private static instance: FHIRService;
  public static readonly DISCLAIMER = 'FHIR-compatible prototype.';

  private constructor() {}

  public static getInstance(): FHIRService {
    if (!FHIRService.instance) {
      FHIRService.instance = new FHIRService();
    }
    return FHIRService.instance;
  }

  public async exportEncounterToFHIR(session: PatientSession): Promise<FHIRBundle> {
    const apiBaseUrl =
      typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL
        : 'http://localhost:8000';

    try {
      const response = await fetch(`${apiBaseUrl}/api/integration/fhir/encounter/${session.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });

      if (response.ok) {
        const bundle: FHIRBundle = await response.json();
        return bundle;
      }
    } catch (err) {
      console.warn('Backend FHIR API offline, generating client-side FHIR-compatible prototype bundle:', err);
    }

    return this.buildClientSideFHIRBundle(session);
  }

  private buildClientSideFHIRBundle(session: PatientSession): FHIRBundle {
    const patientId = session.patientId || session.patientDetails.patientId || 'PAT-1001';
    const sessionId = session.sessionId || 'SESS-1001-DEMO';
    const patientRef = `Patient/${patientId}`;
    const encounterRef = `Encounter/${sessionId}`;
    const now = new Date().toISOString();

    const resources: FHIRResource[] = [];

    // 1. Patient
    resources.push({
      resourceType: 'Patient',
      id: patientId,
      meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'] },
      identifier: [
        { system: 'https://medikiosk.health/fhir/patient-id', value: patientId },
        { system: 'https://healthid.ndhm.gov.in', value: `91-${session.patientDetails.mobile || '0000000000'}-ABHA` },
      ],
      active: true,
      name: [{ use: 'official', text: session.patientDetails.name }],
      gender: session.patientDetails.gender.toLowerCase(),
      telecom: session.patientDetails.mobile ? [{ system: 'phone', value: session.patientDetails.mobile, use: 'mobile' }] : [],
      extension: [
        {
          url: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Age',
          valueQuantity: { value: session.patientDetails.age, unit: 'years', system: 'http://unitsofmeasure.org', code: 'a' },
        },
      ],
      disclaimer: FHIRService.DISCLAIMER,
    });

    // 2. Encounter
    resources.push({
      resourceType: 'Encounter',
      id: sessionId,
      meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter'] },
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
      subject: { reference: patientRef },
      period: { start: session.createdAt },
      serviceType: { text: session.patientDetails.previousDepartment || 'General OPD' },
      disclaimer: FHIRService.DISCLAIMER,
    });

    // 3. Condition (Past Conditions)
    if (session.medicalHistory?.pastConditions) {
      const pc = session.medicalHistory.pastConditions;
      const conds: string[] = [];
      if (typeof pc === 'object') {
        if (pc.diabetes) conds.push('Diabetes Mellitus');
        if (pc.hypertension) conds.push('Hypertension');
        if (pc.asthma) conds.push('Bronchial Asthma');
        if (pc.tuberculosis) conds.push('Tuberculosis');
        if (pc.cardiacDisease) conds.push('Cardiac Disease');
        if (pc.other) conds.push(pc.other);
      } else if (typeof pc === 'string' && pc.trim() !== '' && pc !== 'Not reported') {
        conds.push(...pc.split(',').map((s) => s.trim()));
      }

      conds.forEach((c, idx) => {
        resources.push({
          resourceType: 'Condition',
          id: `COND-${idx + 101}`,
          meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition'] },
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
          verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }] },
          code: { text: c },
          subject: { reference: patientRef },
          encounter: { reference: encounterRef },
          recordedDate: now,
          disclaimer: FHIRService.DISCLAIMER,
        });
      });
    }

    // 4. Observation (Chief Complaint & Red Flags)
    if (session.chiefComplaint && session.chiefComplaint !== 'Not reported') {
      resources.push({
        resourceType: 'Observation',
        id: `OBS-CC-${Math.floor(100 + Math.random() * 900)}`,
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '10154-3', display: 'Chief complaint Narrative' }], text: 'Chief Complaint' },
        subject: { reference: patientRef },
        encounter: { reference: encounterRef },
        valueString: session.chiefComplaint,
        disclaimer: FHIRService.DISCLAIMER,
      });
    }

    if (session.redFlagAssessment) {
      resources.push({
        resourceType: 'Observation',
        id: `OBS-RF-${Math.floor(100 + Math.random() * 900)}`,
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '69730-0', display: 'Emergency medical triage assessment' }], text: 'Red-Flag Safety Triage Assessment' },
        subject: { reference: patientRef },
        encounter: { reference: encounterRef },
        valueString: session.redFlagAssessment.patientMessageEn,
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: session.redFlagAssessment.priorityAssessment ? 'CRIT' : 'N',
                display: session.redFlagAssessment.priorityAssessment ? 'Critical Priority' : 'Normal',
              },
            ],
          },
        ],
        disclaimer: FHIRService.DISCLAIMER,
      });
    }

    // 5. MedicationStatement
    if (session.medicalHistory?.medications) {
      const meds = session.medicalHistory.medications;
      if (Array.isArray(meds)) {
        meds.forEach((m, idx) => {
          resources.push({
            resourceType: 'MedicationStatement',
            id: `MED-${idx + 101}`,
            status: 'active',
            medicationCodeableConcept: { text: m.medicine },
            subject: { reference: patientRef },
            context: { reference: encounterRef },
            dosage: [{ text: `${m.strength} ${m.frequency} x ${m.duration}` }],
            disclaimer: FHIRService.DISCLAIMER,
          });
        });
      }
    }

    // 6. AllergyIntolerance
    if (session.medicalHistory?.allergies) {
      const algs = session.medicalHistory.allergies;
      if (Array.isArray(algs)) {
        algs.forEach((a, idx) => {
          resources.push({
            resourceType: 'AllergyIntolerance',
            id: `ALG-${idx + 101}`,
            clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
            code: { text: a.substance },
            patient: { reference: patientRef },
            reaction: [{ manifestation: [{ text: a.reaction }] }],
            disclaimer: FHIRService.DISCLAIMER,
          });
        });
      }
    }

    // 7. DocumentReference
    if (session.uploadedDocuments) {
      session.uploadedDocuments.forEach((doc) => {
        resources.push({
          resourceType: 'DocumentReference',
          id: doc.documentId,
          status: 'current',
          docStatus: 'preliminary',
          subject: { reference: patientRef },
          content: [
            {
              attachment: {
                contentType: doc.fileType,
                url: doc.fileUrl,
                title: doc.filename,
                size: doc.fileSize,
              },
            },
          ],
          disclaimer: FHIRService.DISCLAIMER,
        });
      });
    }

    const entries: FHIRBundleEntry[] = resources.map((r) => ({
      fullUrl: `urn:uuid:${r.id}`,
      resource: r,
    }));

    return {
      resourceType: 'Bundle',
      id: `BUNDLE-${sessionId}`,
      meta: {
        versionId: '1',
        lastUpdated: now,
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord'],
        tag: [{ system: 'https://medikiosk.health/fhir/meta', code: 'FHIR_PROTOTYPE', display: FHIRService.DISCLAIMER }],
      },
      type: 'collection',
      timestamp: now,
      identifier: { system: 'https://medikiosk.health/fhir/bundle', value: `BUNDLE-${sessionId}` },
      disclaimer: FHIRService.DISCLAIMER,
      abdmExtensibility: {
        readyForAbdmM1M2M3: true,
        targetProfile: 'ABDM OP Consult Record (R4)',
        abhaAddressPlaceholder: `${patientId.toLowerCase()}@sbx`,
      },
      total: entries.length,
      entry: entries,
    };
  }
}

export const fhirService = FHIRService.getInstance();
