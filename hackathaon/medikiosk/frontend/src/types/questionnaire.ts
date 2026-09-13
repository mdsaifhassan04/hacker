export type QuestionType =
  | 'text'
  | 'yes_no'
  | 'single_choice'
  | 'multiple_choice'
  | 'severity'
  | 'duration';

export type PathwayId =
  | 'chest_pain'
  | 'fever'
  | 'abdominal_pain'
  | 'cough_breathing'
  | 'headache';

export interface QuestionOption {
  value: string;
  labelEn: string;
  labelHi: string;
}

export interface QuestionDefinition {
  id: string;
  pathwayId: PathwayId;
  questionTextEn: string;
  questionTextHi: string;
  type: QuestionType;
  options?: QuestionOption[];
  minSeverity?: number;
  maxSeverity?: number;
  nextQuestionId?: string | null | ((answer: any, allAnswers: Record<string, any>) => string | null);
}

export interface ClinicalResponse {
  questionId: string;
  questionTextEn: string;
  questionTextHi: string;
  type: QuestionType;
  answer: any;
  answerDisplayEn: string;
  answerDisplayHi: string;
  timestamp: string;
}
