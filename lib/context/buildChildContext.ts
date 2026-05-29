import type { SupabaseClient } from "@supabase/supabase-js";

function computeAgeWeeks(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const diffMs = now.getTime() - dob.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function formatAge(dateOfBirth: string): string {
  const weeks = computeAgeWeeks(dateOfBirth);
  if (weeks < 8) return `${weeks} weeks old`;
  const months = Math.floor(weeks / 4.345);
  if (months < 24) return `${months} months old`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}mo old` : `${years} years old`;
}

export async function buildChildContext(
  supabase: SupabaseClient,
  childId: string,
): Promise<string> {
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, name, date_of_birth")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    throw new Error("Child not found");
  }

  const ageWeeks = computeAgeWeeks(child.date_of_birth);

  const [
    vaccinesRes,
    allergiesRes,
    feedingRes,
    sleepRes,
    growthRes,
    scheduleRes,
  ] = await Promise.all([
    supabase
      .from("vaccine_records")
      .select("vaccine_name, administered_at, notes")
      .eq("child_id", childId)
      .order("administered_at", { ascending: false }),
    supabase
      .from("allergies")
      .select("allergen, severity, notes")
      .eq("child_id", childId),
    supabase
      .from("feeding_logs")
      .select("logged_at, type, amount_ml, notes")
      .eq("child_id", childId)
      .gte(
        "logged_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("logged_at", { ascending: false })
      .limit(20),
    supabase
      .from("sleep_logs")
      .select("started_at, ended_at, notes")
      .eq("child_id", childId)
      .gte(
        "started_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("growth_records")
      .select("recorded_at, weight_kg, height_cm")
      .eq("child_id", childId)
      .order("recorded_at", { ascending: false })
      .limit(3),
    supabase
      .from("local_vaccine_schedule")
      .select("vaccine_name, due_at_weeks, notes")
      .eq("region", "US")
      .order("due_at_weeks", { ascending: true }),
  ]);

  const administered = new Set(
    (vaccinesRes.data ?? []).map((v) =>
      v.vaccine_name.toLowerCase().split("(")[0].trim(),
    ),
  );

  const upcoming = (scheduleRes.data ?? []).filter((item) => {
    if (item.due_at_weeks < ageWeeks) return false;
    const baseName = item.vaccine_name.toLowerCase().split("(")[0].trim();
    return ![...administered].some(
      (a) => a.includes(baseName) || baseName.includes(a),
    );
  });

  const sections = [
    "You are a warm, clear infant healthcare assistant for parents.",
    "IMPORTANT: Use ONLY the structured facts below for medical/history data. Do not invent records, dates, or diagnoses.",
    "Your role: explain, guide, personalize tone, and help parents understand — the database and schedules are the source of truth.",
    "",
    "## Response format",
    "- Use Markdown: short paragraphs, bullet lists when listing items.",
    "- Put a space before bold markers (e.g. born on **March 3, 2026**, not onMarch or at**week 16**).",
    "- Bold (**text**) the direct answer, dates, vaccine names, and key numbers.",
    "",
    `## Child profile`,
    `- Name: ${child.name}`,
    `- Date of birth: ${child.date_of_birth}`,
    `- Age: ${formatAge(child.date_of_birth)} (${ageWeeks} weeks)`,
    "",
    "## Vaccine history",
    ...(vaccinesRes.data?.length
      ? vaccinesRes.data.map(
          (v) =>
            `- ${v.vaccine_name} on ${v.administered_at}${v.notes ? ` (${v.notes})` : ""}`,
        )
      : ["- No vaccine records on file"]),
    "",
    "## Upcoming vaccines (from schedule vs records)",
    ...(upcoming.length
      ? upcoming.slice(0, 6).map(
          (v) =>
            `- ${v.vaccine_name} due around week ${v.due_at_weeks}${v.notes ? ` — ${v.notes}` : ""}`,
        )
      : ["- None identified from schedule comparison"]),
    "",
    "## Allergies",
    ...(allergiesRes.data?.length
      ? allergiesRes.data.map(
          (a) =>
            `- ${a.allergen}${a.severity ? ` (${a.severity})` : ""}${a.notes ? `: ${a.notes}` : ""}`,
        )
      : ["- None recorded"]),
    "",
    "## Feeding (last 7 days)",
    ...(feedingRes.data?.length
      ? feedingRes.data.map(
          (f) =>
            `- ${f.logged_at}: ${f.type}${f.amount_ml ? `, ${f.amount_ml}ml` : ""}${f.notes ? ` — ${f.notes}` : ""}`,
        )
      : ["- No recent feeding logs"]),
    "",
    "## Sleep (last 7 days)",
    ...(sleepRes.data?.length
      ? sleepRes.data.map(
          (s) =>
            `- ${s.started_at}${s.ended_at ? ` → ${s.ended_at}` : ""}${s.notes ? ` — ${s.notes}` : ""}`,
        )
      : ["- No recent sleep logs"]),
    "",
    "## Growth (latest)",
    ...(growthRes.data?.length
      ? growthRes.data.map(
          (g) =>
            `- ${g.recorded_at}: ${g.weight_kg ? `${g.weight_kg} kg` : ""}${g.height_cm ? `, ${g.height_cm} cm` : ""}`.trim(),
        )
      : ["- No growth records"]),
  ];

  return sections.join("\n");
}
