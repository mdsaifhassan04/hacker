import { QuestionDefinition, PathwayId } from '../types/questionnaire';

export const CLINICAL_QUESTIONNAIRES: Record<PathwayId, QuestionDefinition[]> = {
  // 1. CHEST PAIN PATHWAY
  chest_pain: [
    {
      id: 'cp_onset',
      pathwayId: 'chest_pain',
      questionTextEn: 'When did the chest pain start?',
      questionTextHi: 'छाती में दर्द कब शुरू हुआ?',
      type: 'duration',
      options: [
        { value: 'less_than_1h', labelEn: 'Less than 1 hour ago', labelHi: '1 घंटे से भी कम समय पहले' },
        { value: 'today', labelEn: 'Earlier today', labelHi: 'आज दिन में' },
        { value: '1_to_3_days', labelEn: '1 - 3 days ago', labelHi: '1 से 3 दिन पहले' },
        { value: 'over_a_week', labelEn: 'More than a week ago', labelHi: 'एक सप्ताह से अधिक समय पहले' },
      ],
      nextQuestionId: 'cp_location',
    },
    {
      id: 'cp_location',
      pathwayId: 'chest_pain',
      questionTextEn: 'Where is the chest pain located?',
      questionTextHi: 'दर्द छाती में किस स्थान पर है?',
      type: 'single_choice',
      options: [
        { value: 'center', labelEn: 'Center of chest', labelHi: 'छाती के बीच में' },
        { value: 'left_side', labelEn: 'Left side of chest', labelHi: 'छाती की बाईं तरफ' },
        { value: 'right_side', labelEn: 'Right side of chest', labelHi: 'छाती की दाहिनी तरफ' },
        { value: 'spreading_arm_jaw', labelEn: 'Spreading to left arm, neck, or jaw', labelHi: 'बाएं हाथ, गर्दन या जबड़े में फैल रहा है' },
      ],
      nextQuestionId: 'cp_severity',
    },
    {
      id: 'cp_severity',
      pathwayId: 'chest_pain',
      questionTextEn: 'How severe is the chest pain on a scale of 1 to 10?',
      questionTextHi: 'दर्द कितना गंभीर है (1 से 10 के पैमाने पर)?',
      type: 'severity',
      minSeverity: 1,
      maxSeverity: 10,
      nextQuestionId: 'cp_breathlessness',
    },
    {
      id: 'cp_breathlessness',
      pathwayId: 'chest_pain',
      questionTextEn: 'Do you also feel shortness of breath or sweating?',
      questionTextHi: 'क्या आपको सांस लेने में तकलीफ या पसीना आ रहा है?',
      type: 'yes_no',
      nextQuestionId: (answer, _all) => (answer === 'yes' ? 'cp_cardiac_history' : 'cp_associated_notes'),
    },
    {
      id: 'cp_cardiac_history',
      pathwayId: 'chest_pain',
      questionTextEn: 'Select any existing health conditions you have:',
      questionTextHi: 'अपनी मौजूदा स्वास्थ्य स्थितियों का चयन करें:',
      type: 'multiple_choice',
      options: [
        { value: 'high_bp', labelEn: 'High Blood Pressure', labelHi: 'उच्च रक्तचाप (High BP)' },
        { value: 'diabetes', labelEn: 'Diabetes', labelHi: 'मधुमेह (Diabetes)' },
        { value: 'heart_disease', labelEn: 'Previous Heart Disease', labelHi: 'पहले से हृदय रोग' },
        { value: 'smoking', labelEn: 'Smoking / Tobacco History', labelHi: 'धूम्रपान / तंबाकू' },
        { value: 'none', labelEn: 'None of the above', labelHi: 'इनमें से कोई नहीं' },
      ],
      nextQuestionId: 'cp_associated_notes',
    },
    {
      id: 'cp_associated_notes',
      pathwayId: 'chest_pain',
      questionTextEn: 'Describe any additional details about your chest pain:',
      questionTextHi: 'अपनी छाती के दर्द के बारे में कोई अन्य विवरण लिखें:',
      type: 'text',
      nextQuestionId: null,
    },
  ],

  // 2. FEVER PATHWAY
  fever: [
    {
      id: 'fvr_duration',
      pathwayId: 'fever',
      questionTextEn: 'How many days have you had a fever?',
      questionTextHi: 'आपको कितने दिनों से बुखार है?',
      type: 'duration',
      options: [
        { value: '1_2_days', labelEn: '1 - 2 days', labelHi: '1 से 2 दिन' },
        { value: '3_5_days', labelEn: '3 - 5 days', labelHi: '3 से 5 दिन' },
        { value: 'over_1_week', labelEn: 'Over 1 week', labelHi: '1 सप्ताह से अधिक' },
      ],
      nextQuestionId: 'fvr_severity',
    },
    {
      id: 'fvr_severity',
      pathwayId: 'fever',
      questionTextEn: 'How high does the fever feel (1 to 10)?',
      questionTextHi: 'बुखार कितना तेज महसूस हो रहा है (1 से 10)?',
      type: 'severity',
      minSeverity: 1,
      maxSeverity: 10,
      nextQuestionId: 'fvr_chills',
    },
    {
      id: 'fvr_chills',
      pathwayId: 'fever',
      questionTextEn: 'Are you experiencing chills or shivering?',
      questionTextHi: 'क्या आपको ठंड या कपकपी महसूस हो रही है?',
      type: 'yes_no',
      nextQuestionId: 'fvr_symptoms',
    },
    {
      id: 'fvr_symptoms',
      pathwayId: 'fever',
      questionTextEn: 'Select any accompanying symptoms:',
      questionTextHi: 'साथ में होने वाले लक्षणों का चयन करें:',
      type: 'multiple_choice',
      options: [
        { value: 'body_ache', labelEn: 'Severe Body Ache', labelHi: 'शरीर में तेज दर्द' },
        { value: 'vomiting', labelEn: 'Nausea or Vomiting', labelHi: 'उल्टी या जी मिचलाना' },
        { value: 'skin_rash', labelEn: 'Skin Rash', labelHi: 'त्वचा पर चकत्ते' },
        { value: 'cough', labelEn: 'Cough or Sore Throat', labelHi: 'खांसी या गले में खराश' },
      ],
      nextQuestionId: 'fvr_notes',
    },
    {
      id: 'fvr_notes',
      pathwayId: 'fever',
      questionTextEn: 'Additional notes about your fever:',
      questionTextHi: 'बुखार के बारे में अतिरिक्त टिप्पणी:',
      type: 'text',
      nextQuestionId: null,
    },
  ],

  // 3. ABDOMINAL PAIN PATHWAY
  abdominal_pain: [
    {
      id: 'ab_location',
      pathwayId: 'abdominal_pain',
      questionTextEn: 'Which area of your stomach hurts most?',
      questionTextHi: 'पेट के किस हिस्से में सबसे ज्यादा दर्द है?',
      type: 'single_choice',
      options: [
        { value: 'upper_abdomen', labelEn: 'Upper stomach', labelHi: 'ऊपरी पेट में' },
        { value: 'lower_abdomen', labelEn: 'Lower stomach', labelHi: 'निचले पेट में' },
        { value: 'right_lower', labelEn: 'Right lower side', labelHi: 'दाहिनी ओर नीचे' },
        { value: 'whole_stomach', labelEn: 'All over stomach', labelHi: 'पूरे पेट में' },
      ],
      nextQuestionId: 'ab_onset',
    },
    {
      id: 'ab_onset',
      pathwayId: 'abdominal_pain',
      questionTextEn: 'When did the stomach pain begin?',
      questionTextHi: 'पेट का दर्द कब शुरू हुआ?',
      type: 'duration',
      options: [
        { value: 'sudden_today', labelEn: 'Sudden onset today', labelHi: 'आज अचानक शुरू हुआ' },
        { value: '2_3_days', labelEn: '2 - 3 days ago', labelHi: '2 से 3 दिन पहले' },
        { value: 'chronic_weeks', labelEn: 'Ongoing for weeks', labelHi: 'हफ्तों से जारी है' },
      ],
      nextQuestionId: 'ab_severity',
    },
    {
      id: 'ab_severity',
      pathwayId: 'abdominal_pain',
      questionTextEn: 'Rate the stomach pain severity from 1 to 10:',
      questionTextHi: 'पेट दर्द की गंभीरता को 1 से 10 रेटिंग दें:',
      type: 'severity',
      minSeverity: 1,
      maxSeverity: 10,
      nextQuestionId: 'ab_vomiting',
    },
    {
      id: 'ab_vomiting',
      pathwayId: 'abdominal_pain',
      questionTextEn: 'Are you experiencing nausea, vomiting, or diarrhea?',
      questionTextHi: 'क्या आपको उल्टी, जी मिचलाना या दस्त की शिकायत है?',
      type: 'yes_no',
      nextQuestionId: null,
    },
  ],

  // 4. COUGH / BREATHLESSNESS PATHWAY
  cough_breathing: [
    {
      id: 'cgh_duration',
      pathwayId: 'cough_breathing',
      questionTextEn: 'How long have you had cough or breathing trouble?',
      questionTextHi: 'आपको खांसी या सांस की तकलीफ कितने समय से है?',
      type: 'duration',
      options: [
        { value: '1_3_days', labelEn: '1 - 3 days', labelHi: '1 से 3 दिन' },
        { value: '1_2_weeks', labelEn: '1 - 2 weeks', labelHi: '1 से 2 सप्ताह' },
        { value: 'over_1_month', labelEn: 'More than a month', labelHi: 'एक महीने से अधिक' },
      ],
      nextQuestionId: 'cgh_type',
    },
    {
      id: 'cgh_type',
      pathwayId: 'cough_breathing',
      questionTextEn: 'What type of cough are you experiencing?',
      questionTextHi: 'आपको किस प्रकार की खांसी आ रही है?',
      type: 'single_choice',
      options: [
        { value: 'dry_cough', labelEn: 'Dry cough without phlegm', labelHi: 'सूखी खांसी' },
        { value: 'wet_cough', labelEn: 'Cough with phlegm/sputum', labelHi: 'बलगम वाली खांसी' },
        { value: 'blood_in_sputum', labelEn: 'Cough with blood in phlegm', labelHi: 'बलगम में खून आना' },
      ],
      nextQuestionId: 'cgh_breathlessness',
    },
    {
      id: 'cgh_breathlessness',
      pathwayId: 'cough_breathing',
      questionTextEn: 'Rate your difficulty in breathing from 1 to 10:',
      questionTextHi: 'सांस लेने में कठिनाई को 1 से 10 तक रेट करें:',
      type: 'severity',
      minSeverity: 1,
      maxSeverity: 10,
      nextQuestionId: 'cgh_fever',
    },
    {
      id: 'cgh_fever',
      pathwayId: 'cough_breathing',
      questionTextEn: 'Do you also have fever or chest congestion?',
      questionTextHi: 'क्या आपको बुखार या छाती में जकड़न भी है?',
      type: 'yes_no',
      nextQuestionId: null,
    },
  ],

  // 5. HEADACHE PATHWAY
  headache: [
    {
      id: 'hd_onset',
      pathwayId: 'headache',
      questionTextEn: 'How long have you had this headache?',
      questionTextHi: 'यह सिरदर्द कितने समय से है?',
      type: 'duration',
      options: [
        { value: 'sudden_today', labelEn: 'Sudden severe today', labelHi: 'आज अचानक तेज दर्द' },
        { value: '2_3_days', labelEn: '2 - 3 days', labelHi: '2 से 3 दिन' },
        { value: 'recurrent', labelEn: 'Recurrent / Migraine history', labelHi: 'माइग्रेन / बार-बार होने वाला' },
      ],
      nextQuestionId: 'hd_location',
    },
    {
      id: 'hd_location',
      pathwayId: 'headache',
      questionTextEn: 'Where is the headache centered?',
      questionTextHi: 'सिरदर्द कहाँ केंद्रित है?',
      type: 'single_choice',
      options: [
        { value: 'forehead', labelEn: 'Frontal / Forehead', labelHi: 'माथे पर' },
        { value: 'one_side', labelEn: 'One side of head', labelHi: 'सिर के एक तरफ' },
        { value: 'back_of_head', labelEn: 'Back of neck / head', labelHi: 'गर्दन या सिर के पीछे' },
        { value: 'whole_head', labelEn: 'Entire head', labelHi: 'पूरे सिर में' },
      ],
      nextQuestionId: 'hd_severity',
    },
    {
      id: 'hd_severity',
      pathwayId: 'headache',
      questionTextEn: 'Rate the headache pain severity from 1 to 10:',
      questionTextHi: 'सिरदर्द की तीव्रता को 1 से 10 रेटिंग दें:',
      type: 'severity',
      minSeverity: 1,
      maxSeverity: 10,
      nextQuestionId: 'hd_vision',
    },
    {
      id: 'hd_vision',
      pathwayId: 'headache',
      questionTextEn: 'Are you experiencing blurry vision, dizziness, or vomiting?',
      questionTextHi: 'क्या आपको धुंधला दिखाई देना, चक्कर या उल्टी महसूस हो रही है?',
      type: 'yes_no',
      nextQuestionId: null,
    },
  ],
};

export const getPathwayForComplaint = (complaint: string): PathwayId => {
  const lower = complaint.toLowerCase();
  if (lower.includes('chest') || lower.includes('heart') || lower.includes('छाती')) return 'chest_pain';
  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('बुखार')) return 'fever';
  if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('abdominal') || lower.includes('पेट')) return 'abdominal_pain';
  if (lower.includes('cough') || lower.includes('breath') || lower.includes('breathlessness') || lower.includes('खांसी') || lower.includes('सांस')) return 'cough_breathing';
  if (lower.includes('head') || lower.includes('headache') || lower.includes('सिर')) return 'headache';
  return 'chest_pain'; // Default fallback
};
