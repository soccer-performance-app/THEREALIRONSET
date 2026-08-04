"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  upperBackCoverage,
  UPPER_BACK_LABELS,
  type UpperBackExercise,
  type UpperBackMuscle,
} from "@/lib/upperBackCoverage";

type Unit = "lb" | "kg";
const KG_TO_LB = 2.20462;
function kgToDisplay(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : Math.round(kg * KG_TO_LB * 10) / 10;
}
function displayToKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : Math.round((value / KG_TO_LB) * 100) / 100;
}

export function UpperBackSelector({ userId }: { userId: string }) {
  const patternSlug = "upper-back-combo";
  const [exercises, setExercises] = useState<UpperBackExercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [weightsKg, setWeightsKg] = useState<Record<string, number>>({});
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<Unit>("lb");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: exs }, { data: choices }] = await Promise.all([
        supabase
          .from("exercises")
          .select("id,name,tags")
          .eq("pattern_slug", patternSlug)
          .eq("retired", false)
          .order("name"),
        supabase
          .from("user_exercise_choices")
          .select("exercise_id")
          .eq("user_id", userId)
          .eq("pattern_slug", patternSlug),
      ]);
      if (!alive) return;
      setExercises(
        (exs ?? []).map((e: any) => ({ id: e.id, name: e.name, tags: e.tags as UpperBackMuscle[] }))
      );
      const ids = (choices ?? []).map((c: any) => c.exercise_id);
      setSelectedIds(ids);

      if (ids.length > 0) {
        const { data: states } = await supabase
          .from("user_exercise_state")
          .select("exercise_id,working_weight_kg")
          .eq("user_id", userId)
          .in("exercise_id", ids);
        const kgMap: Record<string, number> = {};
        const inputMap: Record<string, string> = {};
        for (const s of states ?? []) {
          kgMap[s.exercise_id] = s.working_weight_kg;
          inputMap[s.exercise_id] = String(kgToDisplay(s.working_weight_kg, unit));
        }
        setWeightsKg(kgMap);
        setWeightInputs(inputMap);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setWeightInputs((prev) => {
      const next: Record<string, string> = {};
      for (const id of selectedIds) {
        const kg = weightsKg[id];
        next[id] = kg != null ? String(kgToDisplay(kg, unit)) : (prev[id] ?? "");
      }
      return next;
    });
  }, [unit, weightsKg, selectedIds]);

  async function toggle(exerciseId: string) {
    const isSelected = selectedIds.includes(exerciseId);
    setSaving(true);
    if (isSelected) {
      await supabase
        .from("user_exercise_choices")
        .delete()
        .eq("user_id", userId)
        .eq("pattern_slug", patternSlug)
        .eq("exercise_id", exerciseId);
      setSelectedIds((prev) => prev.filter((id) => id !== exerciseId));
    } else {
      await supabase.from("user_exercise_choices").upsert({
        user_id: userId,
        pattern_slug: patternSlug,
        exercise_id: exerciseId,
      });
      await supabase.from("user_exercise_state").upsert(
        { user_id: userId, exercise_id: exerciseId, sets: 3 },
        { onConflict: "user_id,exercise_id", ignoreDuplicates: true }
      );
      setSelectedIds((prev) => [...prev, exerciseId]);
    }
    setSaving(false);
  }

  async function saveWeight(exerciseId: string) {
    const displayVal = Number(weightInputs[exerciseId]);
    if (Number.isNaN(displayVal) || displayVal < 0) return;
    const kg = displayToKg(displayVal, unit);
    setSaving(true);
    await supabase
      .from("user_exercise_state")
      .update({ working_weight_kg: kg })
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId);
    setWeightsKg((prev) => ({ ...prev, [exerciseId]: kg }));
    setSaving(false);
  }

  const coverage = upperBackCoverage(selectedIds, exercises);
  const allCovered = coverage.every((c) => c.covered);
  const selectedExercises = exercises.filter((e) => selectedIds.includes(e.id));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3>Traps / Rear delt / Mid back</h3>
        <span className="eyebrow">Traps / Rear delt / Mid back</span>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 10 }}>
        Select as many as you need — some exercises hit all three, others hit just one. Pick
        until every muscle below is covered.
      </p>

      <div className="chip-row" style={{ marginTop: 12 }}>
        {exercises.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className="chip"
            aria-pressed={selectedIds.includes(ex.id)}
            onClick={() => toggle(ex.id)}
          >
            {ex.name}
          </button>
        ))}
      </div>

      {selectedExercises.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ marginBottom: 0 }}>Working weights</label>
            <div className="chip-row">
              {(["lb", "kg"] as Unit[]).map((u) => (
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
          {selectedExercises.map((ex) => (
            <div key={ex.id} className="field" style={{ marginTop: 8 }}>
              <label htmlFor={`weight-${ex.id}`} style={{ fontSize: "0.8rem" }}>{ex.name}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id={`weight-${ex.id}`}
                  className="num"
                  inputMode="decimal"
                  value={weightInputs[ex.id] ?? ""}
                  onChange={(e) => setWeightInputs((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                  placeholder="0"
                />
                <button className="btn" onClick={() => saveWeight(ex.id)} disabled={saving}>
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 10 }}>Coverage check</h3>
        <div className="chip-row">
          {coverage.map((c) => (
            <span
              key={c.muscle}
              className="pill"
              style={{
                borderColor: c.covered ? "var(--up)" : "var(--down)",
                color: c.covered ? "var(--up)" : "var(--down)",
              }}
            >
              {UPPER_BACK_LABELS[c.muscle]} {c.covered ? "✓" : "—"}
            </span>
          ))}
        </div>
        {!allCovered && (
          <p style={{ color: "var(--down)", fontSize: "0.8rem", marginTop: 10, marginBottom: 0 }}>
            Add an exercise that covers the missing muscle group(s) above.
          </p>
        )}
      </div>

      {saving && <p className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>Saved</p>}
    </div>
  );
}
