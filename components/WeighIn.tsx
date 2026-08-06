"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const KG_TO_LB = 2.20462;

function getWeekInfo(startDate: string, today: string) {
  const start = new Date(startDate);
  const now = new Date(today);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7);
  const dayInWeek = (diffDays % 7) + 1;
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + weekNumber * 7);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return { weekNumber, dayInWeek, weekDates: days };
}

export function WeighIn({
  userId,
  onWeeklyAverageChange,
}: {
  userId: string;
  onWeeklyAverageChange: (kg: number | null) => void;
}) {
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [allEntries, setAllEntries] = useState<Record<string, number>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("weigh_ins")
        .select("log_date,weight_kg")
        .eq("user_id", userId)
        .order("log_date", { ascending: true });

      const rows = data ?? [];
      const entryMap: Record<string, number> = {};
      for (const r of rows) entryMap[r.log_date] = r.weight_kg;
      setAllEntries(entryMap);

      const earliest = rows[0]?.log_date ?? today;
      setStartDate(earliest);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!startDate) return;
    const { weekDates } = getWeekInfo(startDate, today);
    const weekWeights = weekDates.map((d) => allEntries[d]).filter((w): w is number => w != null);
    if (weekWeights.length === 7) {
      const avg = weekWeights.reduce((s, w) => s + w, 0) / 7;
      onWeeklyAverageChange(Math.round(avg * 10) / 10);
    } else {
      onWeeklyAverageChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEntries, startDate]);

  async function logDay(dateStr: string) {
    const val = Number(inputs[dateStr]);
    if (!val || val <= 0) return;
    const kg = unit === "kg" ? val : Math.round((val / KG_TO_LB) * 10) / 10;

    setSaving(dateStr);
    await supabase.from("weigh_ins").upsert(
      { user_id: userId, log_date: dateStr, weight_kg: kg },
      { onConflict: "user_id,log_date" }
    );
    setAllEntries((prev) => ({ ...prev, [dateStr]: kg }));
    if (!startDate || dateStr < startDate) setStartDate(dateStr);
    setSaving(null);
  }

  if (!startDate) return null;

  const { dayInWeek, weekDates } = getWeekInfo(startDate, today);
  const filledCount = weekDates.filter((d) => allEntries[d] != null).length;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>This week's weigh-ins</h3>
        <div className="chip-row">
          {(["lb", "kg"] as const).map((u) => (
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

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
        {filledCount}/7 days logged. Fill all 7 to shift your calorie target to this week's average.
      </p>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>
        Tip: weigh yourself first thing in the morning, before eating or drinking — and at
        the same time each day. That keeps the numbers comparable day to day.
      </p>

      {weekDates.map((dateStr, i) => {
        const dayNum = i + 1;
        const existingKg = allEntries[dateStr];
        const displayVal = existingKg != null
          ? String(unit === "kg" ? existingKg : Math.round(existingKg * KG_TO_LB * 10) / 10)
          : (inputs[dateStr] ?? "");
        const isToday = dateStr === today;
        const isFuture = dateStr > today;

        return (
          <div
            key={dateStr}
            style={{
              display: "flex", alignItems: "center", gap: 10, marginTop: 10,
              opacity: isFuture ? 0.4 : 1,
            }}
          >
            <span className="num" style={{ width: 56, fontSize: "0.85rem", color: isToday ? "var(--steel-bright)" : "var(--text-dim)" }}>
              Day {dayNum}
            </span>
            <input
              className="num"
              inputMode="decimal"
              placeholder={unit}
              disabled={isFuture}
              value={existingKg != null ? displayVal : (inputs[dateStr] ?? "")}
              onChange={(e) => setInputs((prev) => ({ ...prev, [dateStr]: e.target.value }))}
              style={{ flex: 1 }}
            />
            <button
              className="btn"
              disabled={isFuture || saving === dateStr}
              onClick={() => logDay(dateStr)}
            >
              {saving === dateStr ? "…" : existingKg != null ? "Update" : "Log"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
