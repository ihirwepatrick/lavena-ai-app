export function computeAgeWeeks(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return Math.floor(
    (now.getTime() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
}

export function dueDateFromBirthWeeks(
  dateOfBirth: string,
  dueAtWeeks: number,
): Date {
  const dob = new Date(dateOfBirth);
  const due = new Date(dob);
  due.setDate(due.getDate() + dueAtWeeks * 7);
  return due;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}
