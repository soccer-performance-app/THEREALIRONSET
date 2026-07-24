/**
 * Custom split builder logic.
 *
 * Lets a user assign muscle groups to each training day themselves, instead
 * of picking a pre-built template from lib/splits.ts. Same hard rule applies:
 * every major muscle group must appear on at least 2 days. This validator is
 * the live, as-you-build version of splits.ts:validate() — same rule, but
 * checked incrementally so the UI can tell the user which muscle is short
 * before they try to finish, not just reject the whole thing at the end.
 */

export const MUSCLE_GROUPS = [
  "quads", "hamstrings", "glutes", "calves",
  "chest", "lats", "shoulders", "upper_back", "biceps", "triceps",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  chest: "Chest",
  lats: "Lats",
  shoulders: "Shoulders",
  upper_back: "Upper back",
  biceps: "Biceps",
  triceps: "Triceps",
};

export interface CustomDay {
  label: string;
  muscles: MuscleGroup[];
}

export interface MuscleCoverage {
  muscle: MuscleGroup;
  count: number;
  ok: boolean; // true once count >= 2
}

/** Tally how many days each muscle group currently appears on. */
export function coverageFor(days: CustomDay[]): MuscleCoverage[] {
  const counts: Record<string, number> = {};
  for (const day of days) {
    for (const m of day.muscles) counts[m] = (counts[m] ?? 0) + 1;
  }
  return MUSCLE_GROUPS.map((m) => ({
    muscle: m,
    count: counts[m] ?? 0,
    ok: (counts[m] ?? 0) >= 2,
  }));
}

/** True only once every muscle group has hit the 2x/week minimum. */
export function isCustomSplitValid(days: CustomDay[]): boolean {
  return coverageFor(days).every((c) => c.ok);
}

/** Muscle groups still under 2 hits — used to tell the user what's missing. */
export function missingMuscles(days: CustomDay[]): MuscleGroup[] {
  return coverageFor(days).filter((c) => !c.ok).map((c) => c.muscle);
}

export function emptyDays(count: number): CustomDay[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Day ${i + 1}`,
    muscles: [],
  }));
}
