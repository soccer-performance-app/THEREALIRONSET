"use client";

import { useState } from "react";
import {
  dayBuilderCoverage,
  isDayBuilderSatisfied,
  DAY_BUILDER_MUSCLE_LABELS,
  PATTERN_TO_MUSCLE,
  type DayPatterns,
} from "@/lib/dayBuilder";
import { PATTERNS } from "@/lib/exercises";

const PICKABLE_PATTERNS = PATTERNS.filter((p) => p.slug in PATTERN_TO_MUSCLE);

export function DayBuilder({
  daysPerWeek,
  onComplete,
}: {
  daysPerWeek: number;
  onComplete: (days: DayPatterns[]) => void;
}) {
  const [days, setDays] = useState<DayPatterns[]>(() =>
    Array.from({ length: daysPerWeek }, (_, i) => ({ label: `Day ${i + 1}`, patternSlugs: [] }))
  );

  const coverage = dayBuilderCoverage(days);
  const satisfied = isDayBuilderSatisfied(days);

  function renameDay(index: number, label: string) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, label } : d)));
  }

  function togglePattern(dayIndex: number, patternSlug: string) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const has = d.patternSlugs.includes(patternSlug);
        return {
          ...d,
          patternSlugs: has
            ? d.patternSlugs.filter((s) => s !== patternSlug)
            : [...d.patternSlugs, patternSlug],
        };
      })
    );
  }

  return (
    <div>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Build each day by picking which patterns you'll train. Every muscle group needs at
        least 2 hits across the week — some patterns (like mid-chest and upper-chest, or
        vertical and horizontal pulldowns) share a combined weekly total rather than each
        needing their own 2x.
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
            {PICKABLE_PATTERNS.map((p) => {
              const selected = day.patternSlugs.includes(p.slug);
              return (
                <button
                  key={p.slug}
                  type="button"
                  className="chip"
                  aria-pressed={selected}
                  onClick={() => togglePattern(dayIndex, p.slug)}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
          {day.patternSlugs.length > 8 && (
            <p style={{ color: "var(--down)", fontSize: "0.75rem", marginTop: 8, marginBottom: 0 }}>
              {day.patternSlugs.length} exercises on this day — most people find 7-8 is plenty
              for one session.
            </p>
          )}
        </div>
      ))}

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Weekly coverage check</h3>
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
              {DAY_BUILDER_MUSCLE_LABELS[c.muscle]} · {c.hits}/2
            </span>
          ))}
        </div>
        {!satisfied && (
          <p style={{ color: "var(--down)", fontSize: "0.8rem", marginTop: 10, marginBottom: 0 }}>
            Every muscle group needs at least 2 hits across the week before this split is valid.
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        disabled={!satisfied}
        onClick={() => onComplete(days)}
      >
        Use this split
      </button>
    </div>
  );
}
