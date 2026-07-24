import type { PerformedSet, SetAction } from "./types";

/**
 * Progressive overload decision for ONE exercise, from the sets performed this
 * session, producing the weight to load NEXT session.
 *
 * Rules (in strict priority order, per the spec):
 *   1. If ANY set hit 9-10 reps  -> increase. This wins even if a later set in
 *      the same session dropped lower due to fatigue.
 *   2. Else if ANY set fell to <=5 reps -> decrease.
 *   3. Otherwise -> hold.
 *
 * `incrementKg` is the exercise's own default jump (see the catalog). A global
 * step would punish long-lever isolation work (a 2.5 kg jump on lateral raises
 * is a ~15-20% load increase) so it is per-exercise on purpose.
 */
export interface ProgressionResult {
  action: SetAction;
  nextWeightKg: number;
  reason: string;
}

export function nextSessionWeight(
  performed: PerformedSet[],
  currentWeightKg: number,
  incrementKg: number
): ProgressionResult {
  if (performed.length === 0) {
    return { action: "hold", nextWeightKg: currentWeightKg, reason: "no sets logged" };
  }

  const top = Math.max(...performed.map((s) => s.reps));
  const bottom = Math.min(...performed.map((s) => s.reps));

  // Rule 1 — top-set priority.
  if (top >= 9) {
    return {
      action: "increase",
      nextWeightKg: round25(currentWeightKg + incrementKg),
      reason: `hit ${top} reps (>=9) on at least one set`,
    };
  }

  // Rule 2 — grinding.
  if (bottom <= 5) {
    return {
      action: "decrease",
      nextWeightKg: Math.max(0, round25(currentWeightKg - incrementKg)),
      reason: `dropped to ${bottom} reps (<=5) with no set reaching 9`,
    };
  }

  // Rule 3 — stay and try to add reps.
  return { action: "hold", nextWeightKg: currentWeightKg, reason: "in the 6-8 rep zone" };
}

/** Snap to the nearest 0.25 kg so we never store float dust like 42.4999. */
function round25(kg: number): number {
  return Math.round(kg * 4) / 4;
}

/** Number of sets a movement runs: compounds are user choice (2-3), isolation fixed 3. */
export function setCountFor(compound: boolean, compoundPreference: 2 | 3 = 3): 2 | 3 {
  return compound ? compoundPreference : 3;
}

/**
 * Rep-based progression for bodyweight-only movements (bodyweight pull-ups,
 * bodyweight dips) — anything tagged progression_mode = 'reps' in the catalog.
 *
 * There's no external load here, so the weight-based increase/decrease rules
 * don't apply: you can't add plates to a bodyweight pull-up, and there's
 * nothing to reduce if reps drop either. What DOES carry over is the same
 * top-set threshold used for loaded lifts: once any set reaches 9-10 reps,
 * that's the signal the movement has more strength than the exercise can
 * express. Bodyweight reps have a hard ceiling most lifters reach well before
 * their strength does — so instead of a weight change, this flags it and
 * points at the loaded variant (weighted pull-ups / weighted dips), which is
 * where the next real progression comes from.
 */
export interface BodyweightRepResult {
  ceilingReached: boolean;
  topReps: number;
  message: string;
}

export function bodyweightRepCheck(performed: PerformedSet[]): BodyweightRepResult {
  if (performed.length === 0) {
    return { ceilingReached: false, topReps: 0, message: "no sets logged" };
  }
  const topReps = Math.max(...performed.map((s) => s.reps));
  if (topReps >= 10) {
    return {
      ceilingReached: true,
      topReps,
      message: `${topReps} reps on a set — bodyweight is capping out here. Worth moving to the weighted version to keep progressing.`,
    };
  }
  return { ceilingReached: false, topReps, message: "still room to add reps at bodyweight" };
}