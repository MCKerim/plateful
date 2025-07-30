export type SurveyQuestionType = {
  questionKey: string;
  optionKeys: string[];
  type: "single" | "multiple";
  twoColumns?: boolean;
}
