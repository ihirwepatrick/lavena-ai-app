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

export async function fetchChildNotifications(childId: string) {
  const supabase = createClient();

  const { data: child } = await supabase
    .from("children")
    .select("name, date_of_birth")
    .eq("id", childId)
    .single();

  if (!child) return [];

  const ageWeeks = Math.floor(
    (Date.now() - new Date(child.date_of_birth).getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );

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

  const upcoming = (schedule ?? [])
    .filter((item) => {
      if (item.due_at_weeks < ageWeeks) return false;
      const base = item.vaccine_name.toLowerCase().split("(")[0].trim();
      return ![...administered].some(
        (a) => a.includes(base) || base.includes(a),
      );
    })
    .slice(0, 5);

  return upcoming.map((item) => ({
    id: `${item.vaccine_name}-${item.due_at_weeks}`,
    title: `${item.vaccine_name} due`,
    body: item.notes ?? `Due around week ${item.due_at_weeks}`,
    childName: child.name,
  }));
}
