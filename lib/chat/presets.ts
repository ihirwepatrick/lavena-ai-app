export interface ChatPreset {
  id: string;
  label: string;
  prompt: string;
  category: "health" | "nutrition" | "sleep" | "general";
}

export const CHAT_PRESETS: ChatPreset[] = [
  {
    id: "vaccine-due",
    label: "Next vaccine due",
    prompt: "When is the next vaccine due for my child?",
    category: "health",
  },
  {
    id: "vaccine-schedule",
    label: "Full vaccine schedule",
    prompt: "Walk me through the upcoming vaccine schedule based on my child's records.",
    category: "health",
  },
  {
    id: "allergies",
    label: "Allergy review",
    prompt: "What should I know about my child's allergies and how to manage them?",
    category: "health",
  },
  {
    id: "weekly-meals",
    label: "Weekly meal plan",
    prompt:
      "Suggest a balanced weekly meal schedule for my child's current age, in a day-by-day table format.",
    category: "nutrition",
  },
  {
    id: "nutrition-age",
    label: "Foods for this age",
    prompt:
      "What foods and nutrients should my child be getting at their current age?",
    category: "nutrition",
  },
  {
    id: "solids-ready",
    label: "Ready for solids?",
    prompt:
      "Is my child ready to start solids? What signs should I look for?",
    category: "nutrition",
  },
  {
    id: "feeding-amount",
    label: "Feeding amounts",
    prompt: "Is my current feeding amount normal for my child's age?",
    category: "nutrition",
  },
  {
    id: "iron-foods",
    label: "Iron-rich foods",
    prompt:
      "What iron-rich foods should I offer this week for my child's age?",
    category: "nutrition",
  },
  {
    id: "sleep-summary",
    label: "Sleep patterns",
    prompt: "Summarize last week's sleep patterns and anything I should watch for.",
    category: "sleep",
  },
  {
    id: "growth-check",
    label: "Growth check",
    prompt:
      "How is my child's growth tracking based on their records? What should I discuss with our pediatrician?",
    category: "sleep",
  },
  {
    id: "feeding-log",
    label: "Feeding log review",
    prompt: "Review recent feeding logs and note any patterns or concerns.",
    category: "general",
  },
  {
    id: "daily-summary",
    label: "Daily health summary",
    prompt:
      "Give me a short daily summary of vaccines, nutrition, sleep, and growth for my child.",
    category: "general",
  },
];

export const PRESET_CATEGORIES = [
  { id: "health" as const, label: "Health & vaccines" },
  { id: "nutrition" as const, label: "Nutrition & meals" },
  { id: "sleep" as const, label: "Sleep & growth" },
  { id: "general" as const, label: "General" },
];

export const HOME_PROMPT_IDS = [
  "vaccine-due",
  "weekly-meals",
  "sleep-summary",
  "allergies",
];
