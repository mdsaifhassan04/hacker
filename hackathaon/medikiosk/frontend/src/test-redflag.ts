import assert from 'node:assert';
import { evaluateRedFlags, PATIENT_PRIORITY_MESSAGE_EN } from './services/RedFlagEngine.js';
import { ClinicalResponse } from './types/questionnaire.js';

console.log('🧪 Running Deterministic Red-Flag Engine Unit Tests...\n');

// Test 1: Chest pain + Breathlessness (Rule 1)
{
  const mockResp: ClinicalResponse = {
    questionId: 'associated_breathlessness',
    questionTextEn: 'Do you have breathlessness?',
    questionTextHi: 'क्या आपको सांस लेने में तकलीफ है?',
    type: 'yes_no',
    answer: 'yes',
    answerDisplayEn: 'Yes',
    answerDisplayHi: 'हाँ',
    timestamp: new Date().toISOString(),
  };

  const result = evaluateRedFlags({
    chiefComplaint: 'Severe chest pain radiating to left arm',
    clinicalResponses: [mockResp],
  });

  assert.strictEqual(result.priorityAssessment, true, 'Rule 1 should trigger priorityAssessment = true');
  assert.strictEqual(result.triggeredFlags.length, 1, 'Rule 1 should trigger 1 flag');
  assert.strictEqual(result.triggeredFlags[0].ruleId, 'RF-CARD-01');
  assert.strictEqual(result.patientMessageEn, PATIENT_PRIORITY_MESSAGE_EN);
  console.log('✅ Test 1 Passed: Chest Pain + Breathlessness triggers priority assessment.');
}

// Test 2: Sudden weakness + Speech difficulty (Rule 2)
{
  const result = evaluateRedFlags({
    chiefComplaint: 'Sudden weakness on right arm and slurred speech difficulty',
    clinicalResponses: [],
  });

  assert.strictEqual(result.priorityAssessment, true, 'Rule 2 should trigger priorityAssessment = true');
  assert.strictEqual(result.triggeredFlags[0].ruleId, 'RF-NEURO-01');
  assert.strictEqual(result.patientMessageEn, PATIENT_PRIORITY_MESSAGE_EN);
  console.log('✅ Test 2 Passed: Sudden Weakness + Speech Difficulty triggers priority assessment.');
}

// Test 3: High fever + Stiff neck (Rule 3)
{
  const mockResp: ClinicalResponse = {
    questionId: 'stiff_neck',
    questionTextEn: 'Do you have stiff neck?',
    questionTextHi: 'क्या आपकी गर्दन में जकड़न है?',
    type: 'yes_no',
    answer: true,
    answerDisplayEn: 'Yes',
    answerDisplayHi: 'हाँ',
    timestamp: new Date().toISOString(),
  };

  const result = evaluateRedFlags({
    chiefComplaint: 'High fever for 2 days',
    clinicalResponses: [mockResp],
  });

  assert.strictEqual(result.priorityAssessment, true, 'Rule 3 should trigger priorityAssessment = true');
  assert.strictEqual(result.triggeredFlags[0].ruleId, 'RF-INF-01');
  console.log('✅ Test 3 Passed: Fever + Stiff Neck triggers priority assessment.');
}

// Test 4: Negative Control (Mild headache only - No red flags)
{
  const mockResp: ClinicalResponse = {
    questionId: 'headache_severity',
    questionTextEn: 'Headache severity',
    questionTextHi: 'सिरदर्द की तीव्रता',
    type: 'severity',
    answer: 'mild',
    answerDisplayEn: 'Mild',
    answerDisplayHi: 'हल्का',
    timestamp: new Date().toISOString(),
  };

  const result = evaluateRedFlags({
    chiefComplaint: 'Mild headache since morning',
    clinicalResponses: [mockResp],
  });

  assert.strictEqual(result.priorityAssessment, false, 'Mild headache should NOT trigger priorityAssessment');
  assert.strictEqual(result.triggeredFlags.length, 0, 'No flags should be triggered for mild headache');
  console.log('✅ Test 4 Passed: Negative Control (Mild headache) yields priorityAssessment = false.');
}

// Test 5: Verify strict non-diagnostic messaging
{
  const result = evaluateRedFlags({
    chiefComplaint: 'Chest pain and shortness of breath',
    clinicalResponses: [],
  });

  // Ensure output message contains zero medical diagnosis terms like 'stroke', 'infarction', etc.
  const lowerMsg = result.patientMessageEn.toLowerCase();
  assert.ok(!lowerMsg.includes('infarction'), 'Message must not contain diagnosis (infarction)');
  assert.ok(!lowerMsg.includes('stroke'), 'Message must not contain diagnosis (stroke)');
  assert.strictEqual(result.patientMessageEn, 'Priority clinical assessment recommended based on reported symptoms.');
  console.log('✅ Test 5 Passed: Patient-facing message is strictly non-diagnostic.');
}

console.log('\n🎉 ALL DETERMINISTIC RED-FLAG ENGINE TESTS PASSED SUCCESSFULLY!');
