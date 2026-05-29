import type { ReminderUrgency } from "@/lib/children/reminders";
import {
  computeAgeWeeks,
  daysBetween,
  dueDateFromBirthWeeks,
  startOfDay,
} from "@/lib/children/age";

export interface NutritionMilestone {
  id: string;
  title: string;
  body: string;
  dueDate?: string;
  urgency: ReminderUrgency;
  atWeeks: number;
}

export interface AgeNutritionGuide {
  label: string;
  summary: string;
  focusNutrients: string[];
  foodsToIntroduce: string[];
  avoid: string[];
  feedingTips: string[];
}

export interface MealSlot {
  meal: string;
  ideas: string;
}

export interface DayMealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

function urgencyForWeekTarget(
  dateOfBirth: string,
  targetWeeks: number,
): { urgency: ReminderUrgency; dueDate: string } {
  const due = dueDateFromBirthWeeks(dateOfBirth, targetWeeks);
  const today = startOfDay(new Date());
  const diff = daysBetween(today, startOfDay(due));

  let urgency: ReminderUrgency = "upcoming";
  if (diff < 0) urgency = "overdue";
  else if (diff === 0) urgency = "today";
  else if (diff <= 7) urgency = "this_week";

  return { urgency, dueDate: due.toISOString() };
}

export function getNutritionMilestones(
  ageWeeks: number,
  dateOfBirth: string,
): NutritionMilestone[] {
  const milestones: { atWeeks: number; title: string; body: string }[] = [
    {
      atWeeks: 26,
      title: "Solids introduction window",
      body: "Around 6 months, many babies are ready for first purees alongside milk feeds.",
    },
    {
      atWeeks: 32,
      title: "Iron-rich foods",
      body: "Offer iron-fortified cereal, pureed meats, or legumes as solids expand.",
    },
    {
      atWeeks: 40,
      title: "Texture progression",
      body: "Move toward mashed and soft finger foods as swallowing skills improve.",
    },
    {
      atWeeks: 52,
      title: "Family table foods",
      body: "Toddler portions of varied foods; continue limiting salt and choking hazards.",
    },
  ];

  return milestones
    .filter((m) => {
      const windowStart = m.atWeeks - 2;
      const windowEnd = m.atWeeks + 4;
      return ageWeeks >= windowStart && ageWeeks <= windowEnd;
    })
    .map((m) => {
      const { urgency, dueDate } = urgencyForWeekTarget(
        dateOfBirth,
        m.atWeeks,
      );
      return {
        id: `nutrition-${m.atWeeks}`,
        title: m.title,
        body: m.body,
        atWeeks: m.atWeeks,
        urgency,
        dueDate,
      };
    });
}

export function getAgeNutritionGuide(ageWeeks: number): AgeNutritionGuide {
  if (ageWeeks < 24) {
    return {
      label: "0–5 months · Milk feeds",
      summary:
        "Breast milk or formula provides complete nutrition. Watch hunger/fullness cues.",
      focusNutrients: ["Vitamin D (as advised)", "Iron stores from birth"],
      foodsToIntroduce: ["None yet — milk only unless clinician advises otherwise"],
      avoid: ["Honey", "Cow's milk as main drink", "Solid foods before readiness signs"],
      feedingTips: [
        "8–12 feeds per 24h is common in early months",
        "Discuss vitamin D supplementation with your pediatrician",
      ],
    };
  }

  if (ageWeeks < 34) {
    return {
      label: "6–7 months · Starting solids",
      summary:
        "Introduce single-ingredient purees while keeping milk as the primary source.",
      focusNutrients: ["Iron", "Zinc", "Healthy fats"],
      foodsToIntroduce: [
        "Iron-fortified infant cereal",
        "Pureed vegetables (sweet potato, peas)",
        "Pureed fruits (banana, pear)",
        "Pureed meat or lentils",
      ],
      avoid: ["Honey", "Choking hazards (whole grapes, nuts)", "Added salt or sugar"],
      feedingTips: [
        "One new food every 3–5 days to watch for reactions",
        "Offer solids after a milk feed when baby is alert",
      ],
    };
  }

  if (ageWeeks < 52) {
    return {
      label: "8–11 months · Expanding variety",
      summary:
        "Increase texture and finger foods; aim for diverse colors and food groups daily.",
      focusNutrients: ["Iron", "Protein", "Vitamin C (with iron foods)"],
      foodsToIntroduce: [
        "Soft finger foods (avocado, banana, steamed veggies)",
        "Yogurt (plain, full-fat) if dairy tolerated",
        "Scrambled egg, soft fish, beans",
        "Sips of water with meals",
      ],
      avoid: ["Honey under 12 months", "Whole nuts", "Hard raw vegetables"],
      feedingTips: [
        "2–3 meals plus snacks as appetite allows",
        "Let baby self-feed safe soft pieces",
      ],
    };
  }

  return {
    label: "12+ months · Toddler eating",
    summary:
      "Family foods in safe portions; regular meal and snack rhythm supports growth.",
    focusNutrients: ["Iron", "Calcium", "Healthy fats", "Fiber"],
    foodsToIntroduce: [
      "Whole grains, lean proteins, full-fat dairy",
      "Variety of fruits and vegetables",
      "Water and milk; limit juice",
    ],
    avoid: ["Choking hazards", "Excess juice or sugary drinks", "High-sodium processed snacks"],
    feedingTips: [
      "3 meals + 2 snacks daily is a common pattern",
      "Repeated exposure helps acceptance of new foods",
    ],
  };
}

const WEEKLY_TEMPLATES: Record<string, DayMealPlan[]> = {
  infant: [
    { day: "Mon", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
    { day: "Tue", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
    { day: "Wed", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
    { day: "Thu", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
    { day: "Fri", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
    { day: "Sat", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
    { day: "Sun", breakfast: "Breast/formula feed", lunch: "Breast/formula feed", dinner: "Breast/formula feed", snack: "—" },
  ],
  startingSolids: [
    { day: "Mon", breakfast: "Milk feed", lunch: "Iron-fortified cereal puree", dinner: "Milk feed", snack: "Milk feed" },
    { day: "Tue", breakfast: "Milk feed", lunch: "Sweet potato puree", dinner: "Milk feed", snack: "Milk feed" },
    { day: "Wed", breakfast: "Milk feed", lunch: "Pear puree", dinner: "Milk feed", snack: "Milk feed" },
    { day: "Thu", breakfast: "Milk feed", lunch: "Pea puree", dinner: "Milk feed", snack: "Milk feed" },
    { day: "Fri", breakfast: "Milk feed", lunch: "Banana mash", dinner: "Milk feed", snack: "Milk feed" },
    { day: "Sat", breakfast: "Milk feed", lunch: "Lentil puree", dinner: "Milk feed", snack: "Milk feed" },
    { day: "Sun", breakfast: "Milk feed", lunch: "Avocado mash", dinner: "Milk feed", snack: "Milk feed" },
  ],
  expanding: [
    { day: "Mon", breakfast: "Oat cereal + milk", lunch: "Soft banana pieces", dinner: "Chicken puree + veg", snack: "Yogurt" },
    { day: "Tue", breakfast: "Scrambled egg", lunch: "Steamed carrot sticks", dinner: "Rice + beans mash", snack: "Milk" },
    { day: "Wed", breakfast: "Toast strips + avocado", lunch: "Fish puree + peas", dinner: "Pasta + tomato sauce", snack: "Soft pear" },
    { day: "Thu", breakfast: "Iron cereal", lunch: "Cheese cubes (pasteurized)", dinner: "Turkey + sweet potato", snack: "Water" },
    { day: "Fri", breakfast: "Pancake fingers", lunch: "Cucumber sticks", dinner: "Lentil soup (smooth)", snack: "Milk" },
    { day: "Sat", breakfast: "Fruit + yogurt", lunch: "Soft meatballs", dinner: "Veg risotto", snack: "Banana" },
    { day: "Sun", breakfast: "Oatmeal + berries", lunch: "Hummus + soft pita", dinner: "Baked salmon flake", snack: "Milk" },
  ],
  toddler: [
    { day: "Mon", breakfast: "Oatmeal, berries, milk", lunch: "Turkey sandwich quarter, cucumber", dinner: "Rice, beans, broccoli", snack: "Cheese, apple slices" },
    { day: "Tue", breakfast: "Egg, toast, fruit", lunch: "Soup, whole-grain crackers", dinner: "Pasta, tomato sauce, meatballs", snack: "Yogurt" },
    { day: "Wed", breakfast: "Pancakes, banana", lunch: "Quesadilla, avocado", dinner: "Baked chicken, potatoes, peas", snack: "Hummus, carrots" },
    { day: "Thu", breakfast: "Cereal, milk, orange", lunch: "Tuna salad, bread", dinner: "Stir-fry veg, tofu, rice", snack: "Trail mix (age-safe)" },
    { day: "Fri", breakfast: "Smoothie, toast", lunch: "Pizza strip, salad", dinner: "Fish sticks, green beans", snack: "Milk" },
    { day: "Sat", breakfast: "French toast, berries", lunch: "Leftover rice bowl", dinner: "Homemade burger, sweet potato", snack: "Fruit" },
    { day: "Sun", breakfast: "Waffles, yogurt", lunch: "Pasta salad", dinner: "Roast veg, chicken drumstick", snack: "Crackers, cheese" },
  ],
};

export function getWeeklyMealSchedule(ageWeeks: number): DayMealPlan[] {
  if (ageWeeks < 24) return WEEKLY_TEMPLATES.infant;
  if (ageWeeks < 34) return WEEKLY_TEMPLATES.startingSolids;
  if (ageWeeks < 52) return WEEKLY_TEMPLATES.expanding;
  return WEEKLY_TEMPLATES.toddler;
}
