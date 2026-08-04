"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExerciseSelector } from "@/components/ExerciseSelector";
import { UpperBackSelector } from "@/components/UpperBackSelector";
import { PATTERNS } from "@/lib/exercises";

export default function SelectExercisesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);
      setLoading(false);
    })();
  }, [router]);

  if (loading || !userId) {
    return <div className="wrap"><p className="muted">Loading…</p></div>;
  }

  const required = PATTERNS.filter((p) => !p.optional && p.slug !== "upper-back-combo");
  const optional = PATTERNS.filter((p) => p.optional);

  return (
    <main className="wrap" style={{ paddingTop: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1>Choose your exercises</h1>
        <a href="/dashboard" className="btn">Back to dashboard</a>
      </div>
      <p className="muted" style={{ marginBottom: 24 }}>
        Pick one exercise per pattern. You can change these anytime.
      </p>

      <UpperBackSelector userId={userId} />


      {required.map((pattern) => (
        <ExerciseSelector
          key={pattern.slug}
          userId={userId}
          patternSlug={pattern.slug}
          patternName={pattern.name}
          prompt={pattern.prompt}
          muscle={pattern.muscle}
        />
      ))}

      {optional.length > 0 && (
        <>
          <h2 style={{ marginTop: 32, marginBottom: 8 }}>Optional</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            These aren't required — skip any you don't want to train directly.
          </p>
          {optional.map((pattern) => (
            <ExerciseSelector
              key={pattern.slug}
              userId={userId}
              patternSlug={pattern.slug}
              patternName={pattern.name}
              prompt={pattern.prompt}
              muscle={pattern.muscle}
            />
          ))}
        </>
      )}

      <a
        href="/log-workout"
        className="btn btn-primary btn-block"
        style={{ marginTop: 24, display: "block", textAlign: "center" }}
      >
        Log a workout
      </a>
    </main>
  );
}
