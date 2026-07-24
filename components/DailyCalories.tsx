"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { activityCalories, dailyCalorieTarget } from "@/lib/calories";
import type { ActivityLog, Profile } from "@/lib/types";

const RPE_ANCHORS: Record<number, string> = { 3: "easy", 6: "moderate", 8: "hard", 10: "max" };
const GOAL_LABEL: Record<string, string> = { cut: "Cut", bulk: "Bulk", maintain: "Maintain" };

export function DailyCalories({ userId }: { userId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<(ActivityLog & { id: string; calories: number })[]>([]);
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState(6);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("activity_logs").select("id,activity_type,duration_min,rpe,calories").eq("user_id", userId).eq("log_date", today),
      ]);
      setProfile(p as Profile);
      setLogs(
        (a ?? []).map((r: any) => ({ id: r.id, activityType: r.activity_type, durationMin: r.duration_min, rpe: r.rpe, calories: r.calories }))
      );
    })();
  }, [userId, today]);

  const target = useMemo(() => {
    if (!profile) return null;
    return dailyCalorieTarget(profile, logs);
  }, [profile, logs]);

  async function addActivity() {
    if (!profile || !type || !duration) return;
    const log: ActivityLog = { activityType: type, durationMin: Number(duration), rpe };
    const kcal = Math.round(activityCalories(log, profile.weight_kg ?? 0) * 10) / 10;
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({ user_id: userId, log_date: today, activity_type: type, duration_min: Number(duration), rpe, calories: kcal })
      .select("id")
      .single();
    if (error || !data) return;
    setLogs((prev) => [...prev, { id: data.id, ...log, calories: kcal }]);
    setType(""); setDuration(""); setRpe(6);
  }

  async function removeActivity(id: string) {
    await supabase.from("activity_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  if (!profile) return <div className="card muted">Loading…</div>;

  return (
    <div>
      <div className="card" style={{ textAlign: "center" }}>
        <span className="eyebrow">{target ? `Today's target · ${GOAL_LABEL[target.goal]}` : "Today's target"}</span>
        <div className="big-num" style={{ color: "var(--steel-bright)" }}>{target?.target ?? "—"}</div>
        <span className="muted num" style={{ fontSize: "0.8rem" }}>kcal</span>
        {target && (
          <p className="muted num" style={{ fontSize: "0.75rem", marginTop: 10 }}>
            maintenance {target.maintenance} ({target.baseExpenditure} base + {target.activityKcal} activity)
            {target.goalOffsetKcal !== 0 && (
              <> · {target.goalOffsetKcal > 0 ? "+" : ""}{target.goalOffsetKcal} for {GOAL_LABEL[target.goal].toLowerCase()}</>
            )}
          </p>
        )}
      </div>

      <div className="card">
        <h3>Log activity</h3>
        <div className="field">
          <label htmlFor="atype">Type</label>
          <input id="atype" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. lifting, run, cycling" />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="adur">Duration (min)</label>
            <input id="adur" className="num" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="arpe">RPE — {rpe} {RPE_ANCHORS[rpe] ? `(${RPE_ANCHORS[rpe]})` : ""}</label>
            <input id="arpe" type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={!type || !duration} onClick={addActivity}>
          Add
        </button>
      </div>

      {logs.length > 0 && (
        <div className="card">
          <h3>Logged today</h3>
          {logs.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span>{l.activityType} <span className="muted num" style={{ fontSize: "0.8rem" }}>· {l.durationMin}m · RPE {l.rpe}</span></span>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="num">{Math.round(l.calories)} kcal</span>
                <button className="chip" onClick={() => removeActivity(l.id)} aria-label="Remove">✕</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
