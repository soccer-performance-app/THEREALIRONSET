import type { ActivityLog, Goal, MetabolicRate, Profile } from "./types";

/**
 * Calorie model.
 *
 * BMR: Katch-McArdle, which is driven by lean body mass — that's why we bother
 * collecting body-fat %. It's more honest than Mifflin here because two people
 * at the same weight with very different composition have very different BMRs.
 *
 *   LBM  = weight_kg * (1 - bodyFat/100)
 *   BMR  = 370 + 21.6 * LBM
 *
 * Perceived metabolism is a self-report and self-report of metabolism is weak,
 * so it is deliberately capped at +/-5% — enough to nudge, not enough to wreck
 * the estimate if the user is wrong about themselves.
 *
 * Daily target is NOT static. It's:
 *   base living expenditure (BMR * 1.2 sedentary baseline)
 *   + calories from each logged activity (RPE-scaled METs)
 *   = maintenance for THAT day
 *   + goal offset (bulk/cut/maintain), applied as a percentage of maintenance
 *
 * The offset is a percentage rather than a flat kcal number on purpose: a
 * flat -500 kcal deficit is a much bigger bite out of a 1,800 kcal maintenance
 * than a 3,200 kcal one. Percentage scales with the person and with the day's
 * logged activity, consistent with the rest of this model being dynamic.
 *
 *   cut:      -20% of maintenance   (~0.5-1% bodyweight/week loss for most)
 *   bulk:     +12% of maintenance   (lean-gain pace, not a "eat everything" surplus)
 *   maintain:   0%
 *
 * These percentages are a reasonable default, not a prescription — treat them
 * as a starting point to tune, same as the progression increments.
 */

const GOAL_ADJUST: Record<Goal, number> = {
  cut: -0.2,
  bulk: 0.12,
  maintain: 0,
};

const METABOLIC_MULT: Record<MetabolicRate, number> = {
  slow: 0.95,
  slightly_slow: 0.975,
  normal: 1.0,
  slightly_fast: 1.025,
  fast: 1.05,
};

const BASELINE_MULT = 1.2; // non-exercise daily living, before logged activity

export function leanBodyMassKg(weightKg: number, bodyFatPct: number): number {
  return weightKg * (1 - bodyFatPct / 100);
}

export function katchMcArdleBmr(weightKg: number, bodyFatPct: number): number {
  return 370 + 21.6 * leanBodyMassKg(weightKg, bodyFatPct);
}

export function adjustedBmr(profile: Pick<Profile, "weight_kg" | "body_fat_pct" | "perceived_metabolism">): number {
  if (profile.weight_kg == null || profile.body_fat_pct == null) return 0;
  const bmr = katchMcArdleBmr(profile.weight_kg, profile.body_fat_pct);
  return bmr * METABOLIC_MULT[profile.perceived_metabolism];
}

/**
 * RPE -> MET mapping, anchored to the onboarding scale:
 *   1-3 easy, 4-6 moderate, 7-8 hard, 9-10 max.
 * Values are conservative; treat activity calories as an estimate with real
 * error bars, not a precise figure.
 */
const MET_BY_RPE: Record<number, number> = {
  1: 2.5, 2: 3, 3: 3.5, 4: 5, 5: 6, 6: 7, 7: 8.5, 8: 9.5, 9: 11, 10: 12.5,
};

export function activityCalories(log: ActivityLog, weightKg: number): number {
  const met = MET_BY_RPE[clampRpe(log.rpe)];
  // kcal = MET * kg * hours
  return met * weightKg * (log.durationMin / 60);
}

export interface DailyTarget {
  bmr: number;              // adjusted BMR
  baseExpenditure: number;  // BMR * baseline
  activityKcal: number;     // sum of logged activity
  maintenance: number;      // baseExpenditure + activityKcal, before the goal offset
  goal: Goal;
  goalOffsetKcal: number;   // signed: negative for cut, positive for bulk
  target: number;           // rounded daily calorie target, maintenance + offset
}

export function dailyCalorieTarget(
  profile: Pick<Profile, "weight_kg" | "body_fat_pct" | "perceived_metabolism" | "goal">,
  logs: ActivityLog[]
): DailyTarget {
  const bmr = adjustedBmr(profile);
  const base = bmr * BASELINE_MULT;
  const weightKg = profile.weight_kg ?? 0;
  const activityKcal = logs.reduce((sum, l) => sum + activityCalories(l, weightKg), 0);
  const maintenance = base + activityKcal;
  const goal = profile.goal ?? "maintain";
  const goalOffsetKcal = maintenance * GOAL_ADJUST[goal];
  const target = maintenance + goalOffsetKcal;
  return {
    bmr: Math.round(bmr),
    baseExpenditure: Math.round(base),
    activityKcal: Math.round(activityKcal),
    maintenance: Math.round(maintenance),
    goal,
    goalOffsetKcal: Math.round(goalOffsetKcal),
    target: Math.round(target),
  };
}

function clampRpe(rpe: number): number {
  return Math.min(10, Math.max(1, Math.round(rpe)));
}