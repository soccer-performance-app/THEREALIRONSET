export type DayKind = "full" | "upper" | "lower" | "push" | "pull" | "legs" | "focus";

const MAJOR = [
  "quads", "hamstrings", "glutes", "calves",
  "chest", "lats", "shoulders", "upper_back", "biceps", "triceps",
] as const;
type Major = (typeof MAJOR)[number];

const COVERAGE: Record<DayKind, Major[]> = {
  full:  [...MAJOR],
  upper: ["chest", "lats", "shoulders", "upper_back", "biceps", "triceps"],
  lower: ["quads", "hamstrings", "glutes", "calves"],
  push:  ["chest", "shoulders", "triceps"],
  pull:  ["lats", "upper_back", "biceps"],
  legs:  ["quads", "hamstrings", "glutes", "calves"],
  focus: [],
};

export interface SplitDay {
  label: string;
  kind: DayKind;
}
export interface SplitTemplate {
  key: string;
  name: string;
  days: SplitDay[];
  note?: string;
}

const TEMPLATES: Record<number, SplitTemplate[]> = {
  2: [
    { key: "fb2", name: "Full Body ×2", days: [
      { label: "Full Body A", kind: "full" },
      { label: "Full Body B", kind: "full" },
    ]},
  ],
  3: [
    { key: "fb3", name: "Full Body ×3", days: [
      { label: "Full Body A", kind: "full" },
      { label: "Full Body B", kind: "full" },
      { label: "Full Body C", kind: "full" },
    ]},
    { key: "fb2-focus", name: "Full Body ×2 + Focus day",
      note: "The two full-body days cover the 2×/week rule; the focus day is extra volume for a lagging area you pick (e.g. side delts, arms, glutes).",
      days: [
        { label: "Full Body A", kind: "full" },
        { label: "Full Body B", kind: "full" },
        { label: "Focus", kind: "focus" },
      ]},
  ],
  4: [
    { key: "ul2", name: "Upper / Lower ×2", days: [
      { label: "Upper A", kind: "upper" },
      { label: "Lower A", kind: "lower" },
      { label: "Upper B", kind: "upper" },
      { label: "Lower B", kind: "lower" },
    ]},
    { key: "fb4", name: "Full Body ×4", days: [
      { label: "Full Body A", kind: "full" },
      { label: "Full Body B", kind: "full" },
      { label: "Full Body C", kind: "full" },
      { label: "Full Body D", kind: "full" },
    ]},
  ],
  5: [
    { key: "ulul-fb", name: "Upper / Lower / Upper / Lower / Full Body", days: [
      { label: "Upper A", kind: "upper" },
      { label: "Lower A", kind: "lower" },
      { label: "Upper B", kind: "upper" },
      { label: "Lower B", kind: "lower" },
      { label: "Full Body", kind: "full" },
    ]},
    { key: "ppl-ul", name: "Push / Pull / Legs / Upper / Lower", days: [
      { label: "Push", kind: "push" },
      { label: "Pull", kind: "pull" },
      { label: "Legs", kind: "legs" },
      { label: "Upper", kind: "upper" },
      { label: "Lower", kind: "lower" },
    ]},
  ],
  6: [
    { key: "ppl2", name: "Push / Pull / Legs ×2", days: [
      { label: "Push A", kind: "push" },
      { label: "Pull A", kind: "pull" },
      { label: "Legs A", kind: "legs" },
      { label: "Push B", kind: "push" },
      { label: "Pull B", kind: "pull" },
      { label: "Legs B", kind: "legs" },
    ]},
    { key: "ul3", name: "Upper / Lower ×3", days: [
      { label: "Upper A", kind: "upper" },
      { label: "Lower A", kind: "lower" },
      { label: "Upper B", kind: "upper" },
      { label: "Lower B", kind: "lower" },
      { label: "Upper C", kind: "upper" },
      { label: "Lower C", kind: "lower" },
    ]},
  ],
};

export function validate(template: SplitTemplate): boolean {
  const count: Record<string, number> = {};
  for (const day of template.days) {
    for (const m of COVERAGE[day.kind]) count[m] = (count[m] ?? 0) + 1;
  }
  return MAJOR.every((m) => (count[m] ?? 0) >= 2);
}

export function splitsForDays(days: number): SplitTemplate[] {
  const list = TEMPLATES[days] ?? [];
  const valid = list.filter(validate);
  if (valid.length !== list.length) {
    const bad = list.filter((t) => !validate(t)).map((t) => t.key);
    throw new Error(`Split templates violate 2x/week rule: ${bad.join(", ")}`);
  }
  return valid;
}

export function getSplit(days: number, key: string): SplitTemplate | undefined {
  return (TEMPLATES[days] ?? []).find((t) => t.key === key);
}
