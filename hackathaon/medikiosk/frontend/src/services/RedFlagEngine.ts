import { RedFlagRule, RedFlagAssessment, RedFlagItem } from '../types/redFlag';
import { ClinicalResponse } from '../types/questionnaire';

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: 'RF-CARD-01',
    name: 'Chest Pain with Breathlessness',
    severity: 'CRITICAL',
    category: 'cardiovascular',
    evaluate: ({ chiefComplaint, responses }) => {
      const c = chiefComplaint.toLowerCase();
      const hasChestPain =
        c.includes('chest') ||
        c.includes('cardiac') ||
        c.includes('heart') ||
        responses['chest_pain'] === true ||
        responses['complaint_type'] === 'chest_pain';

      const hasBreathlessness =
        c.includes('breath') ||
        c.includes('dyspnea') ||
        c.includes('shortness') ||
        responses['associated_breathlessness'] === 'yes' ||
        responses['breathlessness'] === true ||
        responses['shortness_of_breath'] === true;

      return hasChestPain && hasBreathlessness;
    },
    messageEn: 'Combined chest pain and breathlessness detected.',
    messageHi: 'छाती में दर्द और सांस लेने में तकलीफ का संयुक्त लक्षण पाया गया।',
  },
  {
    id: 'RF-NEURO-01',
    name: 'Sudden Weakness with Speech Difficulty',
    severity: 'CRITICAL',
    category: 'neurological',
    evaluate: ({ chiefComplaint, responses }) => {
      const c = chiefComplaint.toLowerCase();
      const hasSuddenWeakness =
        c.includes('weakness') ||
        c.includes('paralysis') ||
        c.includes('numbness') ||
        responses['sudden_weakness'] === true ||
        responses['weakness'] === true;

      const hasSpeechDifficulty =
        c.includes('speech') ||
        c.includes('slurred') ||
        c.includes('talking') ||
        responses['speech_difficulty'] === true ||
        responses['slurred_speech'] === true;

      return hasSuddenWeakness && hasSpeechDifficulty;
    },
    messageEn: 'Combined sudden weakness and speech difficulty detected.',
    messageHi: 'अचानक कमजोरी और बोलने में कठिनाई का संयुक्त लक्षण पाया गया।',
  },
  {
    id: 'RF-INF-01',
    name: 'High Fever with Stiff Neck or Severe Headache',
    severity: 'HIGH',
    category: 'general',
    evaluate: ({ chiefComplaint, responses }) => {
      const c = chiefComplaint.toLowerCase();
      const hasFever =
        c.includes('fever') ||
        c.includes('temperature') ||
        c.includes('chills') ||
        responses['complaint_type'] === 'fever' ||
        responses['fever'] === true;

      const hasNeckOrHeadache =
        c.includes('neck') ||
        c.includes('stiff') ||
        c.includes('severe headache') ||
        responses['stiff_neck'] === true ||
        responses['headache_severity'] === 'severe' ||
        responses['severe_headache'] === true;

      return hasFever && hasNeckOrHeadache;
    },
    messageEn: 'High fever associated with neck stiffness or severe headache detected.',
    messageHi: 'गर्दन में जकड़न या तेज सिरदर्द के साथ तेज बुखार पाया गया।',
  },
  {
    id: 'RF-RESP-01',
    name: 'Severe Breathlessness or Hemoptysis',
    severity: 'CRITICAL',
    category: 'respiratory',
    evaluate: ({ chiefComplaint, responses }) => {
      const c = chiefComplaint.toLowerCase();
      return (
        c.includes('coughing blood') ||
        c.includes('blood in sputum') ||
        c.includes('severe breathlessness') ||
        c.includes('unable to breathe') ||
        responses['cough_blood'] === true ||
        responses['severe_breathlessness'] === true
      );
    },
    messageEn: 'Severe respiratory distress or hemoptysis reported.',
    messageHi: 'गंभीर सांस की तकलीफ या खांसी में खून आने का लक्षण दर्ज किया गया।',
  },
  {
    id: 'RF-GI-01',
    name: 'Acute Severe Abdominal Pain with Hematemesis',
    severity: 'HIGH',
    category: 'abdominal',
    evaluate: ({ chiefComplaint, responses }) => {
      const c = chiefComplaint.toLowerCase();
      const hasAbdominalPain =
        c.includes('abdominal') ||
        c.includes('stomach') ||
        c.includes('belly') ||
        responses['complaint_type'] === 'abdominal_pain' ||
        responses['abdominal_pain'] === true;

      const hasVomitingBlood =
        c.includes('vomiting blood') ||
        c.includes('blood in vomit') ||
        c.includes('hematemesis') ||
        responses['vomiting_blood'] === true;

      return hasAbdominalPain && hasVomitingBlood;
    },
    messageEn: 'Acute abdominal pain with gastrointestinal bleeding symptoms detected.',
    messageHi: 'पेट दर्द के साथ उल्टी में खून का लक्षण पाया गया।',
  },
];

export interface EvaluateRedFlagsParams {
  chiefComplaint?: string;
  clinicalResponses?: ClinicalResponse[];
}

export const PATIENT_PRIORITY_MESSAGE_EN =
  'Priority clinical assessment recommended based on reported symptoms.';

export const PATIENT_PRIORITY_MESSAGE_HI =
  'दर्ज किए गए लक्षणों के आधार पर प्राथमिकता नैदानिक मूल्यांकन की सिफारिश की जाती है।';

export function evaluateRedFlags({
  chiefComplaint = '',
  clinicalResponses = [],
}: EvaluateRedFlagsParams): RedFlagAssessment {
  const normalizedComplaint = chiefComplaint || '';

  // Flatten array of ClinicalResponse into key-value map
  const responseMap: Record<string, any> = {};
  for (const resp of clinicalResponses) {
    responseMap[resp.questionId] = resp.answer;
    if (typeof resp.answer === 'string') {
      responseMap[resp.answer.toLowerCase()] = true;
    }
  }

  const triggeredFlags: RedFlagItem[] = [];

  for (const rule of RED_FLAG_RULES) {
    if (
      rule.evaluate({
        chiefComplaint: normalizedComplaint,
        responses: responseMap,
      })
    ) {
      triggeredFlags.push({
        ruleId: rule.id,
        name: rule.name,
        severity: rule.severity,
        category: rule.category,
        messageEn: rule.messageEn,
        messageHi: rule.messageHi,
      });
    }
  }

  return {
    priorityAssessment: triggeredFlags.length > 0,
    triggeredFlags,
    patientMessageEn: PATIENT_PRIORITY_MESSAGE_EN,
    patientMessageHi: PATIENT_PRIORITY_MESSAGE_HI,
    evaluatedAt: new Date().toISOString(),
  };
}
