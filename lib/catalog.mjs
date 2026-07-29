// SINGLE SOURCE OF TRUTH for the exercise catalog.
// Both supabase/seed.sql and lib/exercises.ts are generated from this file
// (run `node scripts/generate.mjs`) so the database and frontend never drift.
//
// increment_kg = default working-weight jump used by the progression engine.
// Small joints / long levers get 1kg; big lower-body compounds get 5kg.

/** @typedef {{name:string, compound:boolean, tags?:string[], inc:number, mode?:"weight"|"reps"}} Ex */
// mode "reps" = bodyweight-only movement with no external load: progression is
// tracked by rep count, not weight (see lib/progression.ts:bodyweightRepCheck).
// Defaults to "weight" when omitted.
/** @typedef {{slug:string, muscle:string, name:string, optional?:boolean, exercises:Ex[]}} Pattern */

/** @type {Pattern[]} */
export const PATTERNS = [
  {
    slug: "quads-press", muscle: "Quads", name: "Quads — Pressing",
    exercises: [
      { name: "Squat", compound: true, inc: 5 },
      { name: "Hack squat", compound: true, inc: 5 },
      { name: "Pendulum squat", compound: true, inc: 5 },
      { name: "Front squat", compound: true, inc: 5 },
      { name: "Leg press", compound: true, inc: 5 },
    ],
  },
  {
    slug: "quads-ext", muscle: "Quads", name: "Quads — Extension",
    exercises: [
      { name: "Leg extension machine", compound: false, inc: 2.5 },
      { name: "Free weight leg extension", compound: false, inc: 2.5 },
    ],
  },
  {
    slug: "hip-hinge", muscle: "Posterior chain", name: "Hip hinge",
    exercises: [
      { name: "Romanian deadlift", compound: true, inc: 5 },
      { name: "Conventional deadlift", compound: true, inc: 5 },
      { name: "Hip thrust", compound: true, inc: 5 },
      { name: "Stiff leg deadlift", compound: true, inc: 5 },
      { name: "Back extension", compound: true, inc: 2.5 },
    ],
  },
  {
    slug: "ham-curl", muscle: "Hamstrings", name: "Hamstring curl",
    exercises: [
      { name: "Seated hamstring curl machine", compound: false, inc: 2.5 },
      { name: "Lying hamstring curl machine", compound: false, inc: 2.5 },
    ],
  },
  {
    slug: "calves", muscle: "Calves", name: "Calves",
    exercises: [
      { name: "Dumbbell calf raise", compound: false, inc: 2.5 },
      { name: "Standing calf raise machine", compound: false, inc: 2.5 },
      { name: "Smith machine calf raise", compound: false, inc: 2.5 },
      { name: "Calf raise on leg press", compound: false, inc: 5 },
    ],
  },
  {
    slug: "lats-vertical", muscle: "Lats", name: "Lats — Vertical pull",
    exercises: [
      { name: "Weighted pull ups", compound: true, inc: 2.5 },
      { name: "Bodyweight pull ups", compound: true, inc: 2.5, mode: "reps" },
      { name: "Assisted pull ups", compound: true, inc: 2.5 },
      { name: "Lat pulldown", compound: true, inc: 2.5 },
    ],
  },
  {
    slug: "lats-horizontal", muscle: "Lats", name: "Lats — Horizontal pull",
    exercises: [
      { name: "Chest supported row (normal grip)", compound: true, inc: 2.5 },
      { name: "Cable row (medium grip)", compound: true, inc: 2.5 },
      { name: "Dumbbell row", compound: true, inc: 2.5 },
    ],
  },
  {
    slug: "mid-chest", muscle: "Chest", name: "Mid chest",
    exercises: [
      { name: "Pec deck", compound: false, inc: 2.5 },
      { name: "Dumbbell fly", compound: false, inc: 2.5 },
      { name: "Flat barbell bench press", compound: true, inc: 2.5 },
      { name: "Flat dumbbell bench press", compound: true, inc: 2.5 },
      { name: "Smith machine flat bench press", compound: true, inc: 2.5 },
      { name: "Machine chest press", compound: true, inc: 2.5 },
    ],
  },
  {
    slug: "upper-chest", muscle: "Chest", name: "Upper chest",
    exercises: [
      { name: "Incline dumbbell press", compound: true, inc: 2.5 },
      { name: "Incline smith machine press", compound: true, inc: 2.5 },
      { name: "Incline barbell press", compound: true, inc: 2.5 },
      { name: "Low to high fly", compound: false, inc: 1 },
    ],
  },
  {
    slug: "overhead-press", muscle: "Shoulders", name: "Overhead press",
    exercises: [
      { name: "Standing overhead barbell press", compound: true, inc: 2.5 },
      { name: "Shoulder press (pin-loaded machine)", compound: true, inc: 2.5 },
      { name: "Shoulder press (free-weight machine)", compound: true, inc: 2.5 },
      { name: "Seated dumbbell shoulder press", compound: true, inc: 2.5 },
      { name: "Seated barbell shoulder press", compound: true, inc: 2.5 },
    ],
  },
  {
    slug: "side-delts", muscle: "Side delts", name: "Side delts",
    exercises: [
      { name: "Dumbbell lateral raise", compound: false, inc: 1 },
      { name: "Cable lateral raise", compound: false, inc: 1 },
      { name: "Machine lateral raise", compound: false, inc: 2.5 },
    ],
  },
  {
    slug: "upper-back-combo", muscle: "Traps / Rear delt / Mid back", name: "Traps / Rear delt / Mid back",
    exercises: [
      { name: "Wide grip flared-elbow row", compound: true, tags: ["traps", "rear_delt", "mid_back"], inc: 2.5 },
      { name: "Kelso shrug", compound: false, tags: ["traps", "rear_delt", "mid_back"], inc: 2.5 },
      { name: "Close grip cable row", compound: true, tags: ["traps", "rear_delt", "mid_back"], inc: 2.5 },
      { name: "Face pull", compound: false, tags: ["traps", "rear_delt"], inc: 1 },
      { name: "Rear delt fly machine", compound: false, tags: ["rear_delt"], inc: 1 },
      { name: "Dumbbell reverse fly", compound: false, tags: ["rear_delt"], inc: 1 },
      { name: "Cable reverse fly", compound: false, tags: ["rear_delt"], inc: 1 },
      { name: "Dumbbell shrug", compound: false, tags: ["traps"], inc: 2.5 },
      { name: "Smith machine shrug", compound: false, tags: ["traps"], inc: 2.5 },
    ],
  },
  {
    slug: "triceps-overhead", muscle: "Triceps", name: "Triceps — Overhead / side",
    exercises: [
      { name: "Overhead cable extension", compound: false, inc: 1 },
      { name: "Bodyweight dips", compound: true, inc: 2.5, mode: "reps" },
      { name: "Weighted dips", compound: true, inc: 2.5 },
      { name: "Single-arm tricep extension", compound: false, inc: 1 },
      { name: "Dumbbell skull crusher", compound: false, inc: 1 },
      { name: "Barbell / EZ-bar skull crusher", compound: false, inc: 1 },
      { name: "Dumbbell French press", compound: false, inc: 1 },
    ],
  },
  {
    slug: "triceps-near-torso", muscle: "Triceps", name: "Triceps — Near-torso",
    exercises: [
      { name: "Cable tricep pushdown", compound: false, inc: 1 },
      { name: "Rope pushdown", compound: false, inc: 1 },
      { name: "Barbell JM press", compound: true, inc: 2.5 },
      { name: "Smith machine JM press", compound: true, inc: 2.5 },
    ],
  },
  {
    slug: "biceps", muscle: "Biceps", name: "Biceps",
    exercises: [
      { name: "Dumbbell curl", compound: false, inc: 1 },
      { name: "Dumbbell preacher curl", compound: false, inc: 1 },
      { name: "Barbell curl", compound: false, inc: 1 },
      { name: "Barbell preacher curl", compound: false, inc: 1 },
      { name: "Incline dumbbell curl", compound: false, inc: 1 },
      { name: "Spider curl", compound: false, inc: 1 },
      { name: "Cable curl", compound: false, inc: 1 },
      { name: "Bayesian curl", compound: false, inc: 1 },
    ],
  },
  {
    slug: "brachioradialis", muscle: "Brachioradialis", name: "Brachioradialis",
    exercises: [
      { name: "Dumbbell hammer curl", compound: false, inc: 1 },
      { name: "Cable hammer curl", compound: false, inc: 1 },
      { name: "Dumbbell reverse curl", compound: false, inc: 1 },
      { name: "Cable reverse curl", compound: false, inc: 1 },
      { name: "Barbell reverse curl", compound: false, inc: 1 },
    ],
  },
  {
    slug: "abs", muscle: "Abs", name: "Abs",
    exercises: [
      { name: "Cable crunch", compound: false, inc: 2.5 },
      { name: "Ab crunch machine", compound: false, inc: 2.5 },
      { name: "Weighted decline sit-up", compound: false, inc: 2.5 },
      { name: "Weighted sit-up", compound: false, inc: 2.5 },
    ],
  },
  {
    slug: "forearm-flexors", muscle: "Forearms", name: "Forearms — Flexors", optional: true,
    exercises: [
      { name: "Dumbbell supinated wrist curl", compound: false, inc: 1 },
      { name: "EZ-bar supinated wrist curl", compound: false, inc: 1 },
      { name: "Cable supinated wrist curl", compound: false, inc: 1 },
    ],
  },
  {
    slug: "forearm-extensors", muscle: "Forearms", name: "Forearms — Extensors", optional: true,
    exercises: [
      { name: "Dumbbell pronated wrist curl", compound: false, inc: 1 },
    ],
  },
  {
    slug: "glute-iso", muscle: "Glutes", name: "Glute isolation", optional: true,
    exercises: [
      { name: "Glute kickback", compound: false, inc: 2.5 },
      { name: "Extra hip thrust", compound: true, inc: 5 },
    ],
  },
  {
    slug: "lower-chest-iso", muscle: "Chest", name: "Lower chest isolation", optional: true,
    exercises: [
      { name: "Decline bench", compound: true, inc: 2.5 },
      { name: "High to low fly", compound: false, inc: 1 },
    ],
  },
];

export const PROMPT = "Select one you enjoy";