"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface DbExercise {
  id: string;
  name: string;
  compound: boolean;
  increment_kg: number;
  progression_mode: "weight" | "reps";
}

type Unit = "kg" | "lb";
const KG_TO_LB = 2.20462;

function kgToDisplay(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : Math.round(kg * KG_TO_LB * 10) / 10;
}
function displayToKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : Math.round((value / KG_TO_LB) * 100) / 100;
}

export function ExerciseSelector({
  userId,
  patternSlug,
  patternName,
  prompt,
  muscle,
}: {
  userId: string;
  patternSlug: string;
  patternName: string;
  prompt: string;
  muscle: string;
}) {
  const [exercises, setExercises] = useState<DbExercise[]>([]);
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [sets, setSets] = useState<2 | 3>(3);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [unit, setUnit] = useState<Unit>("lb");
  const [saving, setSaving] = useState(false);
  const [weightSaving, setWeightSaving] = useState(false);

  const selected = exercises.find((e) => e.id === choiceId) ?? null;

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: exs }, { data: choice }] = await Promise.all([
        supabase
          .from("exercises")
          .select("id,name,compound,increment_kg,progression_mode")
          .eq("pattern_slug", patternSlug)
          .eq("retired", false)
          .order("name"),
        supabase
          .from("user_exercise_choices")
          .select("exercise_id")
          .eq("user_id", userId)
          .eq("pattern_slug", patternSlug)
          .maybeSingle(),
      ]);
      if (!alive) return;
      setExercises((exs as DbExercise[]) ?? []);
      const cid = choice?.exercise_id ?? null;
      setChoiceId(cid);
      if (cid) {
        const { data: st } = await supabase
          .from("user_exercise_state")
          .select("sets,working_weight_kg")
          .eq("user_id", userId)
          .eq("exercise_id", cid)
          .maybeSingle();
        if (alive) {
          if (st?.sets) setSets(st.sets as 2 | 3);
          if (st?.working_weight_kg != null) {
            setWeightKg(st.working_weight_kg);
            setWeightInput(String(kgToDisplay(st.working_weight_kg, unit)));
          }
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, patternSlug]);

  useEffect(() => {
    if (weightKg != null) {
      setWeightInput(String(kgToDisplay(weightKg, unit)));
    }
  }, [unit, weightKg]);

  async function pick(exerciseId: string) {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    setChoiceId(exerciseId);
    setSaving(true);
    // user_exercise_choices' primary key now includes exercise_id (needed
    // for the upper-back-combo multi-select), which means a plain upsert no
    // longer replaces a prior single-pattern choice — it just adds a second
    // row. This component is single-pick-only, so explicitly clear any
    // existing choice for this pattern first.
    await supabase
      .from("user_exercise_choices")
      .delete()
      .eq("user_id", userId)
      .eq("pattern_slug", patternSlug);
    await supabase.from("user_exercise_choices").insert({
      user_id: userId,
      pattern_slug: patternSlug,
      exercise_id: exerciseId,
    });
    await supabase.from("user_exercise_state").upsert(
      { user_id: userId, exercise_id: exerciseId, sets },
      { onConflict: "user_id,exercise_id", ignoreDuplicates: true }
    );
    const { data: st } = await supabase
      .from("user_exercise_state")
      .select("working_weight_kg")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .maybeSingle();
    const kg = st?.working_weight_kg ?? null;
    setWeightKg(kg);
    setWeightInput(kg != null ? String(kgToDisplay(kg, unit)) : "");
    setSaving(false);
  }

  async function changeSets(n: 2 | 3) {
    setSets(n);
    if (!choiceId) return;
    await supabase
      .from("user_exercise_state")
      .update({ sets: n })
      .eq("user_id", userId)
      .eq("exercise_id", choiceId);
  }

  async function saveWeight() {
    if (!choiceId) return;
    const displayVal = Number(weightInput);
    if (Number.isNaN(displayVal) || displayVal < 0) return;
    const kg = displayToKg(displayVal, unit);
    setWeightSaving(true);
    await supabase
      .from("user_exercise_state")
      .update({ working_weight_kg: kg })
      .eq("user_id", userId)
      .eq("exercise_id", choiceId);
    setWeightKg(kg);
    setWeightSaving(false);
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3>{patternName}</h3>
        <span className="eyebrow">{muscle}</span>
      </div>

      <div className="field" style={{ marginTop: 10 }}>
        <label htmlFor={`sel-${patternSlug}`}>{prompt}</label>
        <select
          id={`sel-${patternSlug}`}
          value={choiceId ?? ""}
          onChange={(e) => pick(e.target.value)}
        >
          <option value="" disabled>
            {prompt}
          </option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="field" style={{ marginTop: 12 }}>
          <label>Sets</label>
          <div className="chip-row">
            {[2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className="chip num"
                aria-pressed={sets === n}
                onClick={() => changeSets(n as 2 | 3)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && selected.progression_mode === "weight" && (
        <div className="field" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor={`weight-${patternSlug}`} style={{ marginBottom: 0 }}>
              Working weight
            </label>
            <div className="chip-row">
              {(["kg", "lb"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  className="chip num"
                  aria-pressed={unit === u}
                  onClick={() => setUnit(u)}
                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              id={`weight-${patternSlug}`}
              className="num"
              inputMode="decimal"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="0"
            />
            <button className="btn" onClick={saveWeight} disabled={weightSaving}>
              {weightSaving ? "…" : "Save"}
            </button>
          </div>
          <p className="muted" style={{ fontSize: "0.72rem", marginTop: 6 }}>
            Set this to your current working weight — it updates automatically after that from logged sessions.
          </p>
        </div>
      )}

      {selected && selected.progression_mode === "reps" && (
        <p className="muted num" style={{ fontSize: "0.78rem", marginTop: 10 }}>
          Bodyweight — tracked by reps, not weight
        </p>
      )}

      {saving && <p className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>Saved</p>}
    </div>
  );
}
