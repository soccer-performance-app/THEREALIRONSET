"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { WorkoutLogger, type DayExercise } from "@/components/WorkoutLogger";
import type { DayPatterns } from "@/lib/dayBuilder";

export default function LogWorkoutPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [splitKey, setSplitKey] = useState<string | null>(null);
  const [customSplit, setCustomSplit] = useState<DayPatterns[] | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
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

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("split_key,custom_split")
        .eq("id", auth.user.id)
        .single();

      if (profileErr) {
        setError(`Couldn't load your profile: ${profileErr.message}`);
        setLoading(false);
        return;
      }

      setSplitKey(profile?.split_key ?? null);
      setCustomSplit((profile?.custom_split as DayPatterns[] | null) ?? null);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const isCustom = customSplit != null && customSplit.length > 0;
    if (isCustom && selectedDayIndex == null) return;

    (async () => {
      setLoading(true);

      const { data: choices, error: choicesErr } = await supabase
        .from("user_exercise_choices")
        .select("exercise_id")
        .eq("user_id", userId);

      if (choicesErr) {
        setError(`Couldn't load your exercise choices: ${choicesErr.message}`);
        setLoading(false);
        return;
      }

      if (!choices || choices.length === 0) {
        setExercises([]);
        setLoading(false);
        return;
      }

      let exerciseIds = choices.map((c) => c.exercise_id);

      const { data: exerciseRows, error: exErr } = await supabase
        .from("exercises")
        .select("id,name,pattern_slug,compound,increment_kg,progression_mode")
        .in("id", exerciseIds);

      if (exErr) {
        setError(`Couldn't load exercise details: ${exErr.message}`);
        setLoading(false);
        return;
      }

      let filteredRows = exerciseRows ?? [];

      let optionalPatternSlugSet = new Set<string>();
      if (isCustom && selectedDayIndex != null && customSplit) {
        const day = customSplit[selectedDayIndex];
        const dayPatternSlugs = new Set(day.patternSlugs);
        optionalPatternSlugSet = new Set(day.optionalPatternSlugs ?? []);
        const allRelevantSlugs = new Set([...dayPatternSlugs, ...optionalPatternSlugSet]);
        filteredRows = filteredRows.filter((ex: any) => allRelevantSlugs.has(ex.pattern_slug));
        exerciseIds = filteredRows.map((ex: any) => ex.id);
      }

      const { data: stateRows, error: stateErr } = await supabase
        .from("user_exercise_state")
        .select("exercise_id,working_weight_kg,sets")
        .eq("user_id", userId)
        .in("exercise_id", exerciseIds);

      if (stateErr) {
        setError(`Couldn't load your working weights: ${stateErr.message}`);
        setLoading(false);
        return;
      }

      const stateByExercise = new Map((stateRows ?? []).map((s: any) => [s.exercise_id, s]));

      const dayExercises: DayExercise[] = filteredRows.map((ex: any) => {
        const state = stateByExercise.get(ex.id);
        return {
          exerciseId: ex.id,
          name: ex.name,
          compound: ex.compound,
          progressionMode: ex.progression_mode,
          workingWeightKg: state?.working_weight_kg ?? 0,
          sets: state?.sets ?? 3,
          incrementKg: ex.increment_kg,
          optional: optionalPatternSlugSet.has(ex.pattern_slug),
        };
      });

      setExercises(dayExercises);
      setLoading(false);
    })();
  }, [userId, splitKey, customSplit, selectedDayIndex]);

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

  const isCustom = customSplit != null && customSplit.length > 0;

  if (isCustom && selectedDayIndex == null) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <h1 style={{ marginBottom: 8 }}>Which day are you doing?</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Pick today's day from your split to see just that day's exercises.
        </p>
        {customSplit!.map((day, i) => (
          <button
            key={i}
            type="button"
            className="card"
            onClick={() => setSelectedDayIndex(i)}
            style={{ width: "100%", textAlign: "left", cursor: "pointer", marginTop: 10 }}
          >
            <h3>{day.label}</h3>
            <p className="muted num" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>
              {day.patternSlugs.length} exercises
            </p>
          </button>
        ))}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="wrap">
        <div className="card">
          <h3>No exercises chosen yet</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            You haven't picked exercises for {isCustom ? "this day" : "any movement patterns"} yet.
            Head back to your dashboard to select exercises before logging a workout.
          </p>
          <a href="/dashboard" className="btn btn-primary" style={{ marginTop: 14, display: "inline-block" }}>
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  const dayLabel = isCustom && selectedDayIndex != null
    ? customSplit![selectedDayIndex].label
    : "Today's session";

  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      {!isCustom && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
            Your split was set up before day-specific tracking existed, so this shows everything
            you've chosen. Redo onboarding to get day-by-day exercise lists instead.
          </p>
        </div>
      )}
      <WorkoutLogger userId={userId} dayLabel={dayLabel} exercises={exercises} />
    </div>
  );
}
