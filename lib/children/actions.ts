import type { Child } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function formatChildAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const weeks = Math.floor(
    (now.getTime() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  if (weeks < 8) return `${weeks} weeks old`;
  const months = Math.floor(weeks / 4.345);
  if (months < 24) return `${months} months old`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo old` : `${years} years old`;
}

export function formatDisplayDate(dateOfBirth: string): string {
  return new Date(dateOfBirth).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function createChildProfile(
  name: string,
  dateOfBirth: string,
): Promise<Child> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to register a child.");
  }

  const { data, error } = await supabase
    .from("children")
    .insert({
      user_id: user.id,
      name: name.trim(),
      date_of_birth: dateOfBirth,
    })
    .select("id, name, date_of_birth")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create child profile");
  }

  return data as Child;
}

export { fetchChildNotifications, fetchChildReminders } from "./reminders";
export type { ChildReminder, ReminderUrgency } from "./reminders";
