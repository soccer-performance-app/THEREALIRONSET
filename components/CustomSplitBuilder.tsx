"use client";

import { useState } from "react";
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  coverageFor,
  isCustomSplitValid,
  emptyDays,
  type CustomDay,
  type MuscleGroup,
} from "@/lib/customSplit";

export function CustomSplitBuilder({
  daysPerWeek,
  onComplete,
}: {
  daysPerWeek: number;
  onComplete: (days: CustomDay[]) => void;
}) {
  const [days, setDays] = useState<CustomDay[]>(() => emptyDays(daysPerWeek));

  const coverage = coverageFor(days);
  const valid = isCustomSplitValid(days);

  function toggleMuscle(dayIndex: number, muscle: MuscleGroup) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const has = d.muscles.includes(muscle);
        return {
          ...d,
          muscles: has ? d.muscles.filter((m) => m !== muscle) : [...d.muscles, muscle],
        };
      })
    );
  }

  function renameDay(dayIndex: number, label: string) {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, label } : d)));
  }

  return (
    <div>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Assign muscle groups to each day. Every muscle needs at least 2 days before you can continue.
      </p>

      {days.map((day, dayIndex) => (
        <div className="card" key={dayIndex} style={{ marginTop: 12 }}>
          <input
            value={day.label}
            onChange={(e) => renameDay(dayIndex, e.target.value)}
            style={{ marginBottom: 10, fontWeight: 600 }}
            aria-label={`Day ${dayIndex + 1} label`}
          />
          <div className="chip-row">
            {MUSCLE_GROUPS.map((m) => {
              const selected = day.muscles.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  className="chip"
                  aria-pressed={selected}
                  onClick={() => toggleMuscle(dayIndex, m)}
                >
                  {MUSCLE_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Coverage check</h3>
        <div className="chip-row">
          {coverage.map((c) => (
            <span
              key={c.muscle}
              className="pill"
              style={{
                borderColor: c.ok ? "var(--up)" : "var(--down)",
                color: c.ok ? "var(--up)" : "var(--down)",
              }}
            >
              {MUSCLE_LABELS[c.muscle]} · {c.count}/2
            </span>
          ))}
        </div>
        {!valid && (
          <p style={{ color: "var(--down)", fontSize: "0.8rem", marginTop: 10, marginBottom: 0 }}>
            Every muscle group needs at least 2 days before this split is valid.
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        disabled={!valid}
        onClick={() => onComplete(days)}
      >
        Use this split
      </button>
    </div>
  );
}
