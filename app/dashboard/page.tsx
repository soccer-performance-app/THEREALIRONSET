"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DailyCalories } from "@/components/DailyCalories";
import { FoodLogger } from "@/components/FoodLogger";
import { WeighIn } from "@/components/WeighIn";
import { dailyCalorieTarget } from "@/lib/calories";
import type { ActivityLog, FoodLog, Profile } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foodLogs, setFoodLogs] = useState<(FoodLog & { calories: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingAvgKg, setRollingAvgKg] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      setProfile(p as Profile);

      const { data: f } = await supabase
        .from("food_logs")
        .select("id,food_name,serving_desc,calories,protein_g,carbs_g,fat_g")
        .eq("user_id", data.user.id)
        .eq("log_date", today);

      setFoodLogs(
        (f ?? []).map((r: any) => ({
          id: r.id,
          foodName: r.food_name,
          servingDesc: r.serving_desc,
          calories: r.calories,
          proteinG: r.protein_g,
          carbsG: r.carbs_g,
          fatG: r.fat_g,
        }))
      );

      setLoading(false);
    })();
  }, [router, today]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading || !userId || !profile) {
    return <div className="wrap"><p className="muted">Loading…</p></div>;
  }

  // Once a real 7-day rolling average exists from logged weigh-ins, use it
  // instead of the static onboarding weight — the calorie calc adapts as
  // the person's actual weight changes over time.
  const effectiveProfile = rollingAvgKg != null ? { ...profile, weight_kg: rollingAvgKg } : profile;
  const target = dailyCalorieTarget(effectiveProfile, [] as ActivityLog[]);

  return (
    <main className="wrap" style={{ paddingTop: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Dashboard</h1>
        <button className="btn" onClick={handleLogout}>Log out</button>
      </div>

      <div className="card" style={{ display: "flex", gap: 10 }}>
        <a href="/select-exercises" className="btn" style={{ flex: 1, textAlign: "center" }}>
          Edit exercises & weight
        </a>
        <a href="/log-workout" className="btn btn-primary" style={{ flex: 1, textAlign: "center" }}>
          Log workout
        </a>
      </div>

      <button
        className="btn btn-block"
        style={{ marginBottom: 16, borderColor: "var(--down)", color: "var(--down)" }}
        onClick={async () => {
          if (!confirm("Clear everything you've logged today? This can't be undone.")) return;
          const today = new Date().toISOString().slice(0, 10);
          await supabase.from("food_logs").delete().eq("user_id", userId).eq("log_date", today);
          await supabase.from("activity_logs").delete().eq("user_id", userId).eq("log_date", today);
          window.location.reload();
        }}
      >
        New Day — Clear Today's Log
      </button>

      <WeighIn userId={userId} onWeeklyAverageChange={setRollingAvgKg} />

      <DailyCalories userId={userId} rollingAvgKg={rollingAvgKg} />

      <FoodLogger
        userId={userId}
        profile={profile}
        targetKcal={target.target}
        logs={foodLogs}
        onLogsChange={setFoodLogs}
      />
    </main>
  );
}
