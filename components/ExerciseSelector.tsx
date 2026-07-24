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
  const [saving, setSaving] = useState(false);

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
          .select("sets")
          .eq("user_id", userId)
          .eq("exercise_id", cid)
          .maybeSingle();
        if (alive && st?.sets) setSets(st.sets as 2 | 3);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, patternSlug]);

  async function pick(exerciseId: string) {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    setChoiceId(exerciseId);
    setSaving(true);
    await supabase.from("user_exercise_choices").upsert({
      user_id: userId,
      pattern_slug: patternSlug,
      exercise_id: exerciseId,
    });
    await supabase.from("user_exercise_state").upsert(
      { user_id: userId, exercise_id: exerciseId, sets: ex.compound ? sets : 3 },
      { onConflict: "user_id,exercise_id", ignoreDuplicates: true }
    );
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

      {selected?.compound && (
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
      {selected && !selected.compound && (
        <p className="muted num" style={{ fontSize: "0.78rem", marginTop: 10 }}>
          3 sets · isolation
        </p>
      )}
      {saving && <p className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>Saved</p>}
    </div>
  );
}
