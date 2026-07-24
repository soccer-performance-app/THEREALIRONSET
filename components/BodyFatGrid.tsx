"use client";

import type { Sex } from "@/lib/types";

const MALE_BANDS: { lo: number; hi: number; category: string }[] = [
  { lo: 1, hi: 5, category: "Essential fat" },
  { lo: 6, hi: 10, category: "Athletic" },
  { lo: 11, hi: 15, category: "Fitness" },
  { lo: 16, hi: 20, category: "Average" },
  { lo: 21, hi: 25, category: "Above average" },
  { lo: 26, hi: 30, category: "Overweight" },
  { lo: 31, hi: 35, category: "Obese" },
  { lo: 36, hi: 40, category: "Extremely obese" },
];

const FEMALE_BANDS: { lo: number; hi: number; category: string }[] = [
  { lo: 10, hi: 14, category: "Essential fat" },
  { lo: 15, hi: 19, category: "Athletic" },
  { lo: 20, hi: 24, category: "Fitness" },
  { lo: 25, hi: 29, category: "Lean" },
  { lo: 30, hi: 34, category: "Average" },
  { lo: 35, hi: 39, category: "Above average" },
  { lo: 40, hi: 44, category: "Overweight" },
  { lo: 45, hi: 49, category: "Obese" },
];

function midpoint(lo: number, hi: number): number {
  return Math.round((lo + hi) / 2);
}

export function BodyFatGrid({
  sex,
  value,
  onChange,
}: {
  sex: Sex;
  value: number | null;
  onChange: (pct: number) => void;
}) {
  const bands = sex === "female" ? FEMALE_BANDS : MALE_BANDS;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {bands.map((b) => {
          const pct = midpoint(b.lo, b.hi);
          const selected = value === pct;
          return (
            <button
              key={`${b.lo}-${b.hi}`}
              type="button"
              className="chip"
              aria-pressed={selected}
              onClick={() => onChange(pct)}
              style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/bodyfat/${sex}-${b.lo}-${b.hi}.jpg`}
                alt={`Body fat ${b.lo} to ${b.hi} percent reference, ${b.category.toLowerCase()}`}
                style={{ width: "100%", maxWidth: "100px", borderRadius: 4, aspectRatio: "211 / 605", objectFit: "cover" }}
              />
              <span className="num" style={{ fontSize: "0.9rem" }}>{b.lo}–{b.hi}%</span>
              <span className="muted" style={{ fontSize: "0.7rem" }}>{b.category}</span>
            </button>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: 10 }}>
        Pick the closest match. This is an estimate — the calorie model treats it as one.
      </p>
    </div>
  );
}
