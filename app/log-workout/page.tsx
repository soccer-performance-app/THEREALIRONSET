"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { WorkoutLogger, type DayExercise } from "@/components/WorkoutLogger";

export default function LogWorkoutPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }
      setUserId(auth.user.id);

      const { data: choices, error: choicesErr } = await supabase
        .from("user_exercise_choices")
        .select("exercise_id")
        .eq("user_id", auth.user.id);

      if (choicesErr) {
        setError(`Couldn't load your exercise choices: ${choicesErr.message}`);
        setLoading(false);
        return;
      }

      if (!choices || choices.length === 0) {
        setLoading(false);
        return;
      }

      const exerciseIds = choices.map((c) => c.exercise_id);

      const { data: exerciseRows, error: exErr } = await supabase
        .from("exercises")
        .select("id,name,compound,increment_kg,progression_mode")
        .in("id", exerciseIds);

      if (exErr) {
        setError(`Couldn't load exercise details: ${exErr.message}`);
        setLoading(false);
        return;
      }

      const { data: stateRows, error: stateErr } = await supabase
        .from("user_exercise_state")
        .select("exercise_id,working_weight_kg,sets")
        .eq("user_id", auth.user.id)
        .in("exercise_id", exerciseIds);

      if (stateErr) {
        setError(`Couldn't load your working weights: ${stateErr.message}`);
        setLoading(false);
        return;
      }

      const stateByExercise = new Map(
        (stateRows ?? []).map((s: any) => [s.exercise_id, s])
      );

      const dayExercises: DayExercise[] = (exerciseRows ?? []).map((ex: any) => {
        const state = stateByExercise.get(ex.id);
        return {
          exerciseId: ex.id,
          name: ex.name,
          compound: ex.compound,
          progressionMode: ex.progression_mode,
          workingWeightKg: state?.working_weight_kg ?? 0,
          sets: state?.sets ?? (ex.compound ? 3 : 3),
          incrementKg: ex.increment_kg,
        };
      });

      setExercises(dayExercises);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return <div className="wrap"><p className="muted">Loading…</p></div>;
  }

  if (error) {
    return (
      <div className="wrap">
        <div className="card">
          <p style={{ color: "var(--down)" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!userId) return null;

  if (exercises.length === 0) {
    return (
      <div className="wrap">
        <div className="card">
          <h3>No exercises chosen yet</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            You haven't picked exercises for any movement patterns yet. Head back to your
            dashboard to select exercises before logging a workout.
          </p>
          <a href="/dashboard" className="btn btn-primary" style={{ marginTop: 14, display: "inline-block" }}>
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <WorkoutLogger userId={userId} dayLabel="Today's session" exercises={exercises} />
    </div>
  );
}
