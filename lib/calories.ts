import type { ActivityLog, Goal, MetabolicRate, Profile } from "./types";
// rateBasedOffsetKcal is defined further below in this file but referenced
// here inside dailyCalorieTarget — function declarations are hoisted, so
// this works fine despite the definition order.

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
  usingRateBasedGoal: boolean;  // true when goal weight/timeframe drove the offset, false = flat percentage model
  rateWasClamped: boolean;      // true if the requested timeframe was unsafe and got slowed down
}

export function dailyCalorieTarget(
  profile: Pick<Profile, "weight_kg" | "body_fat_pct" | "perceived_metabolism" | "goal" | "goal_weight_kg" | "goal_timeframe_weeks">,
  logs: ActivityLog[]
): DailyTarget {
  const bmr = adjustedBmr(profile);
  const base = bmr * BASELINE_MULT;
  const weightKg = profile.weight_kg ?? 0;
  const activityKcal = logs.reduce((sum, l) => sum + activityCalories(l, weightKg), 0);
  const maintenance = base + activityKcal;
  const goal = profile.goal ?? "maintain";

  // Prefer the rate-based offset (back-calculated from a real goal weight
  // and timeframe) when that data exists — it's more precise than the flat
  // percentage model. Falls back to the flat GOAL_ADJUST percentage
  // whenever goal weight or timeframe wasn't set during onboarding.
  const rateResult = rateBasedOffsetKcal(profile.weight_kg, profile.goal_weight_kg ?? null, profile.goal_timeframe_weeks ?? null);
  const usingRateBasedGoal = rateResult.offsetKcal != null;
  const goalOffsetKcal = rateResult.offsetKcal ?? maintenance * GOAL_ADJUST[goal];

  const target = maintenance + goalOffsetKcal;
  return {
    bmr: Math.round(bmr),
    baseExpenditure: Math.round(base),
    activityKcal: Math.round(activityKcal),
    maintenance: Math.round(maintenance),
    goal,
    goalOffsetKcal: Math.round(goalOffsetKcal),
    target: Math.round(target),
    usingRateBasedGoal,
    rateWasClamped: usingRateBasedGoal && !rateResult.safe,
  };
}

function clampRpe(rpe: number): number {
  return Math.min(10, Math.max(1, Math.round(rpe)));
}
/**
 * Rate-based goal offset — an alternative to the flat percentage model above.
 * Used when the user has set a goal weight and timeframe in onboarding.
 * This is the more standard approach: back-calculate the daily deficit/surplus
 * needed to hit a target weight by a target date, using the standard estimate
 * of ~3,500 kcal per pound of bodyweight change (7,700 kcal/kg).
 *
 * Falls back to null if either goal_weight_kg or goal_timeframe_weeks is
 * missing — callers should fall back to the flat GOAL_ADJUST percentage in
 * that case, not silently use zero.
 */
const KCAL_PER_KG = 7700;
const MAX_WEEKLY_RATE_PCT = 0.01; // 1% of bodyweight per week - standard safe upper bound

export interface RateBasedOffsetResult {
  offsetKcal: number | null;
  safe: boolean;
  clampedRateKgPerWeek?: number;
}

/**
 * SAFETY CLAMP: an aggressive timeframe (e.g. 15lb in 2 weeks) can produce a
 * mathematically "correct" deficit that's actually dangerous, even negative
 * in extreme cases. The rate is capped at 1% of current bodyweight per week
 * (used symmetrically for gain too). When the requested timeframe exceeds
 * this, the computed offset uses the clamped rate instead, and safe:false
 * is returned so the UI can tell the user their timeframe was adjusted.
 */
export function rateBasedOffsetKcal(
  currentWeightKg: number | null,
  goalWeightKg: number | null,
  timeframeWeeks: number | null
): RateBasedOffsetResult {
  if (currentWeightKg == null || goalWeightKg == null || timeframeWeeks == null || timeframeWeeks <= 0) {
    return { offsetKcal: null, safe: true };
  }

  const deltaKg = goalWeightKg - currentWeightKg;
  const requestedWeeklyRateKg = Math.abs(deltaKg) / timeframeWeeks;
  const maxSafeWeeklyRateKg = currentWeightKg * MAX_WEEKLY_RATE_PCT;

  if (requestedWeeklyRateKg > maxSafeWeeklyRateKg) {
    const clampedDeltaKg = Math.sign(deltaKg) * maxSafeWeeklyRateKg * timeframeWeeks;
    const totalKcalDelta = clampedDeltaKg * KCAL_PER_KG;
    return {
      offsetKcal: totalKcalDelta / (timeframeWeeks * 7),
      safe: false,
      clampedRateKgPerWeek: Math.round(maxSafeWeeklyRateKg * 100) / 100,
    };
  }

  const totalKcalDelta = deltaKg * KCAL_PER_KG;
  return { offsetKcal: totalKcalDelta / (timeframeWeeks * 7), safe: true };
}

/**
 * Protein target: 1g per lb of bodyweight, the simpler and slightly more
 * conservative end of the commonly cited 0.8-1g/lb range — better for
 * muscle retention during a cut, no real downside during a bulk or maintain.
 */
const KG_TO_LB = 2.20462;

export function proteinTargetG(weightKg: number | null): number {
  if (weightKg == null) return 0;
  return Math.round(weightKg * KG_TO_LB);
}

/**
 * Remaining macros (carbs + fat) split evenly by calorie share once protein
 * is accounted for. This is a starting default, not a prescription — carb/fat
 * ratio is far more a matter of personal preference than protein is.
 */
export interface MacroTargets {
  proteinG: number;
  proteinKcal: number;
  carbsG: number;
  fatG: number;
  remainingKcal: number;
}

export function macroTargets(totalKcalTarget: number, weightKg: number | null): MacroTargets {
  const proteinG = proteinTargetG(weightKg);
  const proteinKcal = proteinG * 4;
  const remainingKcal = Math.max(0, totalKcalTarget - proteinKcal);
  // Split remaining 50/50 between carbs and fat by calories, then convert to grams.
  const carbsKcal = remainingKcal / 2;
  const fatKcal = remainingKcal / 2;
  return {
    proteinG,
    proteinKcal,
    carbsG: Math.round(carbsKcal / 4),
    fatG: Math.round(fatKcal / 9),
    remainingKcal: Math.round(remainingKcal),
  };
}
