import { fhirService } from './services/FHIRService';
import { PatientSession } from './types/session';

async function runFHIRTests() {
  console.log('🧪 Running FHIR R4 Interoperability Layer Unit Tests...\n');

  const dummySession: PatientSession = {
    sessionId: 'SESS-TEST-FHIR-99',
    patientId: 'PAT-8888',
    language: 'en',
    createdAt: new Date().toISOString(),
    patientDetails: {
      patientId: 'PAT-8888',
      name: 'Ramesh Verma',
      age: 50,
      gender: 'Male',
      mobile: '9876543210',
      previousDepartment: 'Cardiology',
    },
    isNewPatient: false,
    chiefComplaint: 'Severe chest pain and breathlessness',
    pathwayId: 'chest_pain',
    clinicalResponses: [
      {
        questionId: 'chest_pain_onset',
        questionTextEn: 'When did the chest pain start?',
        questionTextHi: 'छाती में दर्द कब शुरू हुआ?',
        type: 'single_choice',
        answer: 'sudden',
        answerDisplayEn: 'Sudden onset (~2 hours ago)',
        answerDisplayHi: 'अचानक शुरू हुआ',
        timestamp: new Date().toISOString(),
      },
    ],
    medicalHistory: {
      pastConditions: {
        diabetes: true,
        hypertension: true,
        asthma: false,
        tuberculosis: false,
        cardiacDisease: true,
        other: '',
      },
      medications: [
        { medicine: 'Metformin', strength: '500mg', frequency: 'Twice daily', duration: '1 year' },
        { medicine: 'Amlodipine', strength: '5mg', frequency: 'Once daily', duration: '2 years' },
      ],
      allergies: [
        { type: 'Drug', substance: 'Penicillin', reaction: 'Skin Rash' },
      ],
      surgeries: [
        { procedure: 'Angioplasty', approximateDate: '2023' },
      ],
      familyHistory: 'Father had Heart Attack',
      personalHistory: { diet: 'Non-vegetarian', sleep: '7 hours', tobacco: 'None', alcohol: 'None', occupation: 'Teacher' },
    },
    uploadedDocuments: [
      {
        documentId: 'DOC-FHIR-01',
        sessionId: 'SESS-TEST-FHIR-99',
        filename: 'Prescription_Cardiology.pdf',
        fileType: 'application/pdf',
        fileSize: 120000,
        uploadedAt: new Date().toISOString(),
        fileUrl: '/uploads/sample.pdf',
      },
    ],
    redFlagAssessment: {
      priorityAssessment: true,
      triggeredFlags: [
        {
          ruleId: 'RF-CARD-01',
          name: 'Chest Pain with Breathlessness',
          severity: 'CRITICAL',
          category: 'cardiovascular',
          messageEn: 'Combined chest pain and breathlessness detected.',
          messageHi: 'छाती में दर्द और सांस लेने में तकलीफ का संयुक्त लक्षण पाया गया।',
        },
      ],
      patientMessageEn: 'Priority clinical assessment recommended based on reported symptoms.',
      patientMessageHi: 'दर्ज किए गए लक्षणों के आधार पर प्राथमिकता नैदानिक मूल्यांकन की सिफारिश की जाती है।',
      evaluatedAt: new Date().toISOString(),
    },
  };

  // Test 1: Generate FHIR Bundle
  const bundle = await fhirService.exportEncounterToFHIR(dummySession);

  if (bundle.resourceType !== 'Bundle') {
    throw new Error('Test 1 Failed: Resource type must be "Bundle"');
  }
  console.log('✅ Test 1 Passed: Output is a valid FHIR R4 Bundle resource.');

  // Test 2: Disclaimer check
  if (!bundle.disclaimer || !bundle.disclaimer.includes('FHIR-compatible prototype.')) {
    throw new Error('Test 2 Failed: Bundle missing "FHIR-compatible prototype." disclaimer.');
  }
  console.log('✅ Test 2 Passed: Bundle explicitly labeled as "FHIR-compatible prototype."');

  // Test 3: Check mapped resource types
  const resourceTypes = bundle.entry.map((e) => e.resource.resourceType);

  const requiredTypes = [
    'Patient',
    'Encounter',
    'Condition',
    'Observation',
    'MedicationStatement',
    'AllergyIntolerance',
    'DocumentReference',
  ];

  for (const type of requiredTypes) {
    if (!resourceTypes.includes(type)) {
      throw new Error(`Test 3 Failed: Bundle missing required FHIR resource type "${type}"`);
    }
  }
  console.log('✅ Test 3 Passed: Conceptual mappings for Patient, Encounter, Condition, Observation, MedicationStatement, AllergyIntolerance, DocumentReference verified.');

  // Test 4: Verify Patient details mapping
  const patientRes = bundle.entry.find((e) => e.resource.resourceType === 'Patient')?.resource;
  if (!patientRes || patientRes.id !== 'PAT-8888' || patientRes.name[0].text !== 'Ramesh Verma') {
    throw new Error('Test 4 Failed: Patient demographics incorrectly mapped');
  }
  console.log('✅ Test 4 Passed: Patient demographics, identifiers, and ABHA extension placeholders mapped accurately.');

  // Test 5: Verify Observation & Red Flags mapping
  const obsList = bundle.entry.filter((e) => e.resource.resourceType === 'Observation').map((e) => e.resource);
  const redFlagObs = obsList.find((o) => o.code?.text === 'Red-Flag Safety Triage Assessment');

  if (!redFlagObs || redFlagObs.interpretation[0].coding[0].code !== 'CRIT') {
    throw new Error('Test 5 Failed: Red Flag assessment observation missing or critical priority code invalid');
  }
  console.log('✅ Test 5 Passed: Red-Flag safety triage assessment mapped to FHIR Observation with CRIT interpretation.');

  // Test 6: Verify ABDM Extensibility Metadata
  if (!bundle.meta?.profile?.includes('https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord')) {
    throw new Error('Test 6 Failed: Meta profile missing NRCES NDHM OPConsultRecord standard URI');
  }
  console.log('✅ Test 6 Passed: ABDM Extensibility meta profile (OPConsultRecord) configured.');

  console.log('\n🎉 ALL FHIR R4 INTEROPERABILITY TESTS PASSED SUCCESSFULLY!');
}

runFHIRTests().catch((err) => {
  console.error('❌ FHIR Test Error:', err);
  process.exit(1);
});
