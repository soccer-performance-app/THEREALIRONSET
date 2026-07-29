"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  upperBackCoverage,
  UPPER_BACK_LABELS,
  type UpperBackExercise,
  type UpperBackMuscle,
} from "@/lib/upperBackCoverage";

export function UpperBackSelector({ userId }: { userId: string }) {
  const patternSlug = "upper-back-combo";
  const [exercises, setExercises] = useState<UpperBackExercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      setSelectedIds((choices ?? []).map((c: any) => c.exercise_id));
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

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

  const coverage = upperBackCoverage(selectedIds, exercises);
  const allCovered = coverage.every((c) => c.covered);

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
