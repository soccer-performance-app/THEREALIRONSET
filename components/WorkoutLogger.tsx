"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  bodyweightRepCheck,
  nextSessionWeight,
  type BodyweightRepResult,
  type ProgressionResult,
} from "@/lib/progression";

export type ProgressionMode = "weight" | "reps";

export interface DayExercise {
  exerciseId: string;
  name: string;
  compound: boolean;
  progressionMode: ProgressionMode;
  workingWeightKg: number;
  sets: number;
  incrementKg: number;
  optional?: boolean;
}

type Outcome =
  | { mode: "weight"; result: ProgressionResult }
  | { mode: "reps"; result: BodyweightRepResult };

export function WorkoutLogger({
  userId,
  dayLabel,
  exercises,
}: {
  userId: string;
  dayLabel: string;
  exercises: DayExercise[];
}) {
  const [reps, setReps] = useState<Record<string, number[]>>(
    () => Object.fromEntries(exercises.map((e) => [e.exerciseId, Array(e.sets).fill(0)]))
  );
  const [results, setResults] = useState<Record<string, Outcome> | null>(null);
  const [saving, setSaving] = useState(false);

  function setRep(exId: string, setIdx: number, value: number) {
    setReps((prev) => {
      const arr = [...prev[exId]];
      arr[setIdx] = value;
      return { ...prev, [exId]: arr };
    });
  }

  async function finish() {
    setSaving(true);
    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({ user_id: userId, day_label: dayLabel })
      .select("id")
      .single();
    if (error || !workout) { setSaving(false); return; }

    const setRows: any[] = [];
    const outcomes: Record<string, Outcome> = {};

    for (const ex of exercises) {
      const performed = reps[ex.exerciseId].map((r, i) => ({
        setNumber: i + 1,
        weightKg: ex.progressionMode === "weight" ? ex.workingWeightKg : 0,
        reps: r,
      }));
      performed.forEach((s) =>
        setRows.push({ workout_id: workout.id, exercise_id: ex.exerciseId, set_number: s.setNumber, weight_kg: s.weightKg, reps: s.reps })
      );

      if (ex.progressionMode === "reps") {
        outcomes[ex.exerciseId] = { mode: "reps", result: bodyweightRepCheck(performed) };
      } else {
        const result = nextSessionWeight(performed, ex.workingWeightKg, ex.incrementKg);
        outcomes[ex.exerciseId] = { mode: "weight", result };
        await supabase
          .from("user_exercise_state")
          .update({ working_weight_kg: result.nextWeightKg })
          .eq("user_id", userId)
          .eq("exercise_id", ex.exerciseId);
      }
    }

    await supabase.from("workout_sets").insert(setRows);
    setResults(outcomes);
    setSaving(false);
  }

  return (
    <div>
      <span className="eyebrow">{dayLabel}</span>
      <h1 style={{ marginBottom: 16 }}>Log session</h1>

      {exercises.map((ex) => (
        <div className="card" key={ex.exerciseId}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3>
              {ex.name}
              {ex.optional && (
                <span
                  className="pill pill-hold"
                  style={{ marginLeft: 8, fontSize: "0.65rem", textTransform: "none", fontFamily: "var(--font-num)" }}
                >
                  Optional · recommended
                </span>
              )}
            </h3>
            {ex.progressionMode === "weight" ? (
              <span className="num muted" style={{ fontSize: "0.85rem" }}>{ex.workingWeightKg} kg</span>
            ) : (
              <span className="num muted" style={{ fontSize: "0.85rem" }}>bodyweight</span>
            )}
          </div>
          <div className="chip-row" style={{ marginTop: 10 }}>
            {Array.from({ length: ex.sets }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="num" style={{ fontSize: "0.72rem" }}>Set {i + 1}</label>
                <input
                  className="num"
                  inputMode="numeric"
                  style={{ width: 68 }}
                  value={reps[ex.exerciseId][i] || ""}
                  onChange={(e) => setRep(ex.exerciseId, i, Number(e.target.value))}
                  placeholder="reps"
                />
              </div>
            ))}
          </div>

          {results?.[ex.exerciseId]?.mode === "weight" && (
            <ProgressionPill result={(results[ex.exerciseId] as { mode: "weight"; result: ProgressionResult }).result} current={ex.workingWeightKg} />
          )}
          {results?.[ex.exerciseId]?.mode === "reps" && (
            <CeilingFlag result={(results[ex.exerciseId] as { mode: "reps"; result: BodyweightRepResult }).result} exerciseName={ex.name} />
          )}
        </div>
      ))}

      {!results && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={saving} onClick={finish}>
          {saving ? "Saving…" : "Finish workout"}
        </button>
      )}
      {results && <p className="muted" style={{ marginTop: 16 }}>Session saved.</p>}
    </div>
  );
}

function ProgressionPill({ result, current }: { result: ProgressionResult; current: number }) {
  const cls = result.action === "increase" ? "pill-up" : result.action === "decrease" ? "pill-down" : "pill-hold";
  const arrow = result.action === "increase" ? "▲" : result.action === "decrease" ? "▼" : "=";
  return (
    <p style={{ marginTop: 10 }}>
      <span className={`pill ${cls}`}>{arrow} {current} → {result.nextWeightKg} kg</span>{" "}
      <span className="muted" style={{ fontSize: "0.75rem" }}>{result.reason}</span>
    </p>
  );
}

function CeilingFlag({ result, exerciseName }: { result: BodyweightRepResult; exerciseName: string }) {
  if (!result.ceilingReached) {
    return (
      <p style={{ marginTop: 10 }}>
        <span className="pill pill-hold">{result.topReps} reps</span>{" "}
        <span className="muted" style={{ fontSize: "0.75rem" }}>{result.message}</span>
      </p>
    );
  }
  const weightedName = exerciseName.replace(/^Bodyweight /i, "Weighted ");
  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: 6, border: "1px solid var(--steel)", background: "var(--steel-dim)" }}>
      <p style={{ margin: 0 }}>
        <span className="pill pill-up">{result.topReps} reps</span>{" "}
        <span style={{ fontSize: "0.85rem" }}>Time to add load.</span>
      </p>
      <p className="muted" style={{ fontSize: "0.78rem", margin: "6px 0 0" }}>
        You hit {result.topReps} reps on a set — bodyweight progression caps out here. Switch to{" "}
        <strong style={{ color: "var(--text)" }}>{weightedName}</strong> next session to keep progressing.
      </p>
    </div>
  );
}
