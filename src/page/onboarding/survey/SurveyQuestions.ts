import { SurveyQuestionType } from "./QuestionType";

export const SURVEY_QUESTIONS: SurveyQuestionType[] = [
  // Q1: Was ist dein Ziel?
  {
    questionKey: "question1",
    optionKeys: ["option1", "option2", "option3", "option4", "option5"],
    type: "multiple",
  },
  // Q2: Wie alt bist du?
  {
    questionKey: "question2",
    optionKeys: ["option1", "option2", "option3", "option4", "option5"],
    type: "single",
  },
  // Q3: Für wie viele Personen?
  {
    questionKey: "question8",
    optionKeys: ["option1", "option2", "option3", "option4"],
    type: "single",
  },
  // Q4: Wie oft kochst du?
  {
    questionKey: "question7",
    optionKeys: ["option1", "option2", "option3", "option4"],
    type: "single",
  },
  // Q5: Welche Ernährungsweise?
  {
    questionKey: "question9",
    optionKeys: ["option1", "option2", "option3", "option4", "option5", "option6"],
    type: "multiple",
  },
  // Q6: Allergien & Intoleranzen?
  {
    questionKey: "question10",
    optionKeys: [
      "option1",
      "option2",
      "option3",
      "option4",
      "option5",
      "option6",
      "option7",
      "option8",
      "option9",
      "option10",
    ],
    type: "multiple",
    twoColumns: true,
  },
  // Q7: Sonstige Abneigungen?
  {
    questionKey: "question11",
    optionKeys: ["option1", "option2", "option3", "option4", "option5", "option6", "option7"],
    type: "multiple",
    twoColumns: true,
  },
  // Q8: Wo findest du Rezepte?
  {
    questionKey: "question5",
    optionKeys: [
      "option1",
      "option2",
      "option3",
      "option4",
      "option5",
      "option6",
      "option7",
      "option8",
    ],
    type: "multiple",
  },
  // Q9: Wie organisierst du Rezepte?
  {
    questionKey: "question6",
    optionKeys: ["option1", "option2", "option3", "option4", "option5"],
    type: "multiple",
  },
];

// Unused questions — kept for potential re-addition
// {
//   questionKey: "question3",
//   optionKeys: ["option1", "option2", "option3"],
//   type: "single",
// },
// {
//   questionKey: "question4",
//   optionKeys: ["option1", "option2", "option3", "option4", "option5"],
//   type: "single",
// },
