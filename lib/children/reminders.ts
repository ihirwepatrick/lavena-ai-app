import { createClient } from "@/lib/supabase/client";
import { getNutritionMilestones } from "@/lib/nutrition/guide";
import {
  computeAgeWeeks,
  daysBetween,
  dueDateFromBirthWeeks,
  startOfDay,
} from "./age";

export type ReminderUrgency = "overdue" | "today" | "this_week" | "upcoming";

export interface ChildReminder {
  id: string;
  kind: "vaccine" | "nutrition";
  title: string;
  body: string;
  dueDate?: string;
  urgency: ReminderUrgency;
  childName: string;
}

function urgencyForDueDate(due: Date): ReminderUrgency {
  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  const diff = daysBetween(today, dueDay);

  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "this_week";
  return "upcoming";
}

function formatDueLabel(due: Date, urgency: ReminderUrgency): string {
  const formatted = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (urgency === "today") return `Due today · ${formatted}`;
  if (urgency === "overdue") return `Overdue · was ${formatted}`;
  if (urgency === "this_week") return `Due this week · ${formatted}`;
  return `Due ${formatted}`;
}

export async function fetchChildReminders(
  childId: string,
): Promise<ChildReminder[]> {
  const supabase = createClient();

  const { data: child } = await supabase
    .from("children")
    .select("name, date_of_birth")
    .eq("id", childId)
    .single();

  if (!child) return [];

  const ageWeeks = computeAgeWeeks(child.date_of_birth);

  const [{ data: vaccines }, { data: schedule }] = await Promise.all([
    supabase
      .from("vaccine_records")
      .select("vaccine_name")
      .eq("child_id", childId),
    supabase
      .from("local_vaccine_schedule")
      .select("vaccine_name, due_at_weeks, notes")
      .eq("region", "US")
      .order("due_at_weeks", { ascending: true }),
  ]);

  const administered = new Set(
    (vaccines ?? []).map((v) =>
      v.vaccine_name.toLowerCase().split("(")[0].trim(),
    ),
  );

  const vaccineReminders: ChildReminder[] = (schedule ?? [])
    .filter((item) => {
      const base = item.vaccine_name.toLowerCase().split("(")[0].trim();
      const already = [...administered].some(
        (a) => a.includes(base) || base.includes(a),
      );
      if (already) return false;
      const due = dueDateFromBirthWeeks(
        child.date_of_birth,
        item.due_at_weeks,
      );
      const urgency = urgencyForDueDate(due);
      return urgency !== "upcoming" || item.due_at_weeks <= ageWeeks + 4;
    })
    .map((item) => {
      const due = dueDateFromBirthWeeks(
        child.date_of_birth,
        item.due_at_weeks,
      );
      const urgency = urgencyForDueDate(due);
      return {
        id: `vax-${item.vaccine_name}-${item.due_at_weeks}`,
        kind: "vaccine" as const,
        title: item.vaccine_name,
        body:
          item.notes ??
          `Scheduled around week ${item.due_at_weeks} · ${formatDueLabel(due, urgency)}`,
        dueDate: due.toISOString(),
        urgency,
        childName: child.name,
      };
    });

  const nutritionReminders: ChildReminder[] = getNutritionMilestones(
    ageWeeks,
    child.date_of_birth,
  ).map((m) => ({
    id: m.id,
    kind: "nutrition" as const,
    title: m.title,
    body: m.body,
    dueDate: m.dueDate,
    urgency: m.urgency,
    childName: child.name,
  }));

  const order: Record<ReminderUrgency, number> = {
    overdue: 0,
    today: 1,
    this_week: 2,
    upcoming: 3,
  };

  return [...vaccineReminders, ...nutritionReminders].sort(
    (a, b) => order[a.urgency] - order[b.urgency],
  );
}

/** @deprecated Use fetchChildReminders */
export async function fetchChildNotifications(childId: string) {
  const reminders = await fetchChildReminders(childId);
  return reminders.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    childName: r.childName,
  }));
}
