/**
 * Day-by-day custom split builder — lets a user assign specific exercise
 * PATTERNS to each day of their split, with live weekly coverage checking.
 *
 * Coverage rule, confirmed through direct iteration on real examples:
 *   - Most muscle groups need >=2 hits/week from ANY of their patterns,
 *     combined freely: chest (mid-chest + upper-chest), lats (vertical +
 *     horizontal pull), triceps (overhead + near-torso), quads (press +
 *     extension), and hamstrings (hip-hinge + curl) are each ONE muscle
 *     for this purpose — e.g. 1 mid-chest + 1 upper-chest = 2 hits,
 *     satisfies chest. No independent per-sub-pattern requirement.
 *   - Shoulders is the deliberate exception: overhead-press (front/mid delt
 *     via pressing) and side-delts (lateral delt, isolation) are genuinely
 *     separate muscles for this purpose, each independently needing its
 *     own >=2 hits/week. They do NOT share a combined pool.
 *   - hip-hinge is a dual-muscle pattern: one day of it counts once toward
 *     BOTH hamstrings and glutes simultaneously.
 *   - upper-back-combo is deliberately excluded: it already has its own
 *     dedicated coverage system (lib/upperBackCoverage.ts).
 */

export type DayBuilderMuscle =
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "chest"
  | "lats"
  | "shoulders_press"
  | "shoulders_side"
  | "triceps"
  | "biceps"
  | "brachioradialis"
  | "abs";

export const DAY_BUILDER_MUSCLES: DayBuilderMuscle[] = [
  "quads", "hamstrings", "glutes", "calves",
  "chest", "lats", "shoulders_press", "shoulders_side",
  "triceps", "biceps", "brachioradialis", "abs",
];

export const DAY_BUILDER_MUSCLE_LABELS: Record<DayBuilderMuscle, string> = {
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  chest: "Chest",
  lats: "Lats",
  shoulders_press: "Shoulders (press)",
  shoulders_side: "Shoulders (side delt)",
  triceps: "Triceps",
  biceps: "Biceps",
  brachioradialis: "Brachioradialis",
  abs: "Abs",
};

export const PATTERN_TO_MUSCLE: Record<string, DayBuilderMuscle[]> = {
  "quads-press": ["quads"],
  "quads-ext": ["quads"],
  "hip-hinge": ["hamstrings", "glutes"],
  "ham-curl": ["hamstrings"],
  calves: ["calves"],
  "lats-vertical": ["lats"],
  "lats-horizontal": ["lats"],
  "mid-chest": ["chest"],
  "upper-chest": ["chest"],
  "overhead-press": ["shoulders_press"],
  "side-delts": ["shoulders_side"],
  "triceps-overhead": ["triceps"],
  "triceps-near-torso": ["triceps"],
  biceps: ["biceps"],
  brachioradialis: ["brachioradialis"],
  abs: ["abs"],
};

export interface DayPatterns {
  label: string;
  patternSlugs: string[];
}

export interface MuscleCoverageResult {
  muscle: DayBuilderMuscle;
  hits: number;
  ok: boolean;
}

function tallyHits(days: DayPatterns[]): Record<DayBuilderMuscle, number> {
  const counts: Record<string, number> = {};
  for (const day of days) {
    const seenToday = new Set<DayBuilderMuscle>();
    for (const slug of day.patternSlugs) {
      for (const m of PATTERN_TO_MUSCLE[slug] ?? []) {
        seenToday.add(m);
      }
    }
    for (const m of seenToday) {
      counts[m] = (counts[m] ?? 0) + 1;
    }
  }
  return counts as Record<DayBuilderMuscle, number>;
}

export function dayBuilderCoverage(days: DayPatterns[]): MuscleCoverageResult[] {
  const hits = tallyHits(days);
  return DAY_BUILDER_MUSCLES.map((muscle) => ({
    muscle,
    hits: hits[muscle] ?? 0,
    ok: (hits[muscle] ?? 0) >= 2,
  }));
}

export function isDayBuilderSatisfied(days: DayPatterns[]): boolean {
  return dayBuilderCoverage(days).every((r) => r.ok);
}
