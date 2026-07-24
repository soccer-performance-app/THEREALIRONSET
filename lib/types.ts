export type Sex = "male" | "female";
export type MetabolicRate =
  | "slow"
  | "slightly_slow"
  | "normal"
  | "slightly_fast"
  | "fast";
export type LiftingTenure = "just_starting" | "under_6mo" | "6mo_2yr" | "2yr_plus";
export type SetAction = "increase" | "decrease" | "hold";
export type Goal = "bulk" | "cut" | "maintain";

export interface Profile {
  id: string;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  sex: Sex | null;
  body_fat_pct: number | null;
  perceived_metabolism: MetabolicRate;
  tenure: LiftingTenure | null;
  training_days: number | null;
  split_key: string | null;
  goal: Goal;
  onboarded: boolean;
}

export interface PerformedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface ActivityLog {
  activityType: string;
  durationMin: number;
  rpe: number; // 1-10
}