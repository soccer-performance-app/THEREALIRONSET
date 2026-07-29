export type UpperBackMuscle = "traps" | "rear_delt" | "mid_back";
export const UPPER_BACK_MUSCLES: UpperBackMuscle[] = ["traps", "rear_delt", "mid_back"];

export const UPPER_BACK_LABELS: Record<UpperBackMuscle, string> = {
  traps: "Traps",
  rear_delt: "Rear delt",
  mid_back: "Mid back",
};

export interface UpperBackExercise {
  id: string;
  name: string;
  tags: UpperBackMuscle[];
}

export interface UpperBackCoverage {
  muscle: UpperBackMuscle;
  covered: boolean;
  coveredBy: string[];
}

export function upperBackCoverage(
  selectedIds: string[],
  allExercises: UpperBackExercise[]
): UpperBackCoverage[] {
  const selected = allExercises.filter((e) => selectedIds.includes(e.id));
  return UPPER_BACK_MUSCLES.map((muscle) => {
    const coveredBy = selected.filter((e) => e.tags.includes(muscle)).map((e) => e.name);
    return { muscle, covered: coveredBy.length > 0, coveredBy };
  });
}

export function isUpperBackSatisfied(
  selectedIds: string[],
  allExercises: UpperBackExercise[]
): boolean {
  return upperBackCoverage(selectedIds, allExercises).every((c) => c.covered);
}
