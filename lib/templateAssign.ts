import { PATTERN_TO_MUSCLE, type DayBuilderMuscle, type DayPatterns } from "./dayBuilder";
import type { DayKind, SplitTemplate } from "./splits";

/**
 * Auto-generates a DayPatterns[] for any pre-built split template.
 *
 * "upper" and "full" kinds repeat often enough across a week that their
 * multi-pattern muscles (chest, lats, triceps, quads, hamstrings) alternate
 * round-robin between sibling patterns across occurrences.
 *
 * "push", "pull", "legs", and "lower" kinds don't reliably repeat, so they
 * get FULL coverage instead — every sibling pattern for a muscle group goes
 * on that one day, since it may be the only exposure that muscle gets from
 * that specific day type. Verified: this is what makes a push day contain
 * both chest patterns and both shoulder patterns, not just one alternating
 * choice — the bug that produced a 4-exercise push day originally.
 *
 * Triceps on push day is the one deliberate exception: overhead-press
 * covers it fully enough on its own, so triceps-near-torso is NOT
 * auto-assigned there — left optional, addable by the user if they want
 * the extra volume, rather than force-added.
 */

const FULL_COVERAGE_KINDS = new Set<DayKind>(["push", "pull", "legs", "lower"]);

// Per full-coverage kind, muscle -> pattern to skip auto-assigning (left optional).
const OPTIONAL_SECOND_PATTERN: Partial<Record<DayKind, Record<string, string>>> = {
  push: { triceps: "triceps-near-torso" },
};

// Patterns with their own separate coverage system (upper-back-combo) aren't
// tracked via PATTERN_TO_MUSCLE/KIND_TO_MUSCLES muscle logic — they're just
// always included on the day kinds where they belong, confirmed as pull and
// upper specifically (not full-body, which already covers everything via
// its own broader muscle list).
const ALWAYS_INCLUDE_PATTERNS: Partial<Record<DayKind, string[]>> = {
  pull: ["upper-back-combo"],
  upper: ["upper-back-combo"],
};

const KIND_TO_MUSCLES: Record<DayKind, DayBuilderMuscle[]> = {
  full: [
    "quads", "hamstrings", "glutes", "calves",
    "chest", "lats", "shoulders_press", "shoulders_side",
    "triceps", "biceps", "brachioradialis", "abs",
  ],
  upper: ["chest", "lats", "shoulders_press", "shoulders_side", "triceps", "biceps", "brachioradialis"],
  lower: ["quads", "hamstrings", "glutes", "calves", "abs"],
  push: ["chest", "shoulders_press", "shoulders_side", "triceps"],
  pull: ["lats", "biceps", "brachioradialis"],
  legs: ["quads", "hamstrings", "glutes", "calves", "abs"],
  focus: [],
};

const MUSCLE_TO_PATTERNS: Record<string, string[]> = {};
for (const [pattern, muscles] of Object.entries(PATTERN_TO_MUSCLE)) {
  for (const muscle of muscles) {
    if (!MUSCLE_TO_PATTERNS[muscle]) MUSCLE_TO_PATTERNS[muscle] = [];
    MUSCLE_TO_PATTERNS[muscle].push(pattern);
  }
}

export function assignPatternsToTemplate(template: SplitTemplate): DayPatterns[] {
  const muscleOccurrence: Record<string, number> = {};

  function nextPatternFor(muscle: string): string | null {
    const patterns = MUSCLE_TO_PATTERNS[muscle];
    if (!patterns || patterns.length === 0) return null;
    const idx = muscleOccurrence[muscle] ?? 0;
    muscleOccurrence[muscle] = idx + 1;
    return patterns[idx % patterns.length];
  }

  return template.days.map((day) => {
    const muscles = KIND_TO_MUSCLES[day.kind] ?? [];
    const patternSlugs: string[] = [];
    const addedThisDay = new Set<string>();
    const optionalSkip = OPTIONAL_SECOND_PATTERN[day.kind] ?? {};

    for (const muscle of muscles) {
      const patterns = MUSCLE_TO_PATTERNS[muscle] ?? [];

      if (FULL_COVERAGE_KINDS.has(day.kind) && patterns.length > 1) {
        for (const pattern of patterns) {
          if (optionalSkip[muscle] === pattern) continue;
          if (!addedThisDay.has(pattern)) {
            patternSlugs.push(pattern);
            addedThisDay.add(pattern);
          }
        }
        muscleOccurrence[muscle] = (muscleOccurrence[muscle] ?? 0) + patterns.length;
      } else {
        const pattern = nextPatternFor(muscle);
        if (pattern && !addedThisDay.has(pattern)) {
          patternSlugs.push(pattern);
          addedThisDay.add(pattern);
        }
      }
    }

    const optionalPatternSlugs: string[] = [];
    const optionalMap = OPTIONAL_SECOND_PATTERN[day.kind] ?? {};
    for (const pattern of Object.values(optionalMap)) {
      optionalPatternSlugs.push(pattern);
    }

    for (const alwaysPattern of ALWAYS_INCLUDE_PATTERNS[day.kind] ?? []) {
      if (!patternSlugs.includes(alwaysPattern)) {
        patternSlugs.push(alwaysPattern);
      }
    }

    return { label: day.label, patternSlugs, optionalPatternSlugs };
  });
}

export function isFullBodyOnlyTemplate(template: SplitTemplate): boolean {
  return template.days.every((d) => d.kind === "full");
}
