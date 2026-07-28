"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BodyFatGrid } from "@/components/BodyFatGrid";
import { splitsForDays } from "@/lib/splits";
import type { Goal, LiftingTenure, MetabolicRate, Sex } from "@/lib/types";
import { CustomSplitBuilder } from "@/components/CustomSplitBuilder";
import type { CustomDay } from "@/lib/customSplit";

const METAB: { v: MetabolicRate; label: string }[] = [
  { v: "slow", label: "Slow" },
  { v: "slightly_slow", label: "Slightly slow" },
  { v: "normal", label: "Normal" },
  { v: "slightly_fast", label: "Slightly fast" },
  { v: "fast", label: "Fast" },
];
const GOALS: { v: Goal; label: string; sub: string }[] = [
  { v: "cut", label: "Cut", sub: "Lose fat, keep as much muscle as possible" },
  { v: "maintain", label: "Maintain", sub: "Stay around current weight" },
  { v: "bulk", label: "Bulk", sub: "Gain muscle, some fat gain expected" },
];
const TENURE: { v: LiftingTenure; label: string }[] = [
  { v: "just_starting", label: "Just starting out" },
  { v: "under_6mo", label: "Under 6 months" },
  { v: "6mo_2yr", label: "6 months – 2 years" },
  { v: "2yr_plus", label: "2+ years" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [metab, setMetab] = useState<MetabolicRate>("normal");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tenure, setTenure] = useState<LiftingTenure | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [splitKey, setSplitKey] = useState<string | null>(null);
  const [buildingCustom, setBuildingCustom] = useState(false);
  const [customDays, setCustomDays] = useState<CustomDay[] | null>(null);

  const splitOptions = days ? splitsForDays(days) : [];

  const steps = [
    {
      title: "The basics",
      valid: heightCm && weightKg && age && sex,
      body: (
        <>
          <div className="row">
            <div className="field">
              <label htmlFor="h">Height (cm)</label>
              <input id="h" className="num" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="w">Weight (kg)</label>
              <input id="w" className="num" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="a">Age</label>
              <input id="a" className="num" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="field">
              <label>Sex</label>
              <div className="chip-row">
                {(["male", "female"] as Sex[]).map((s) => (
                  <button key={s} type="button" className="chip" aria-pressed={sex === s} onClick={() => setSex(s)} style={{ textTransform: "capitalize" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Body fat",
      valid: bodyFat != null,
      body: sex ? <BodyFatGrid sex={sex} value={bodyFat} onChange={setBodyFat} /> : <p className="muted">Set your sex first.</p>,
    },
    {
      title: "Metabolism",
      valid: true,
      body: (
        <>
          <p className="muted" style={{ marginTop: 0 }}>How fast does your metabolism feel? This only nudges the estimate (±5%).</p>
          <div className="chip-row">
            {METAB.map((m) => (
              <button key={m.v} type="button" className="chip" aria-pressed={metab === m.v} onClick={() => setMetab(m.v)}>
                {m.label}
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "Goal",
      valid: goal != null,
      body: (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            This sets your daily calorie target above, at, or below maintenance.
          </p>
          {GOALS.map((g) => (
            <button
              key={g.v}
              type="button"
              className="card"
              aria-pressed={goal === g.v}
              onClick={() => setGoal(g.v)}
              style={{
                width: "100%", textAlign: "left", cursor: "pointer", marginTop: 10,
                borderColor: goal === g.v ? "var(--steel)" : "var(--line-soft)",
              }}
            >
              <h3>{g.label}</h3>
              <p className="muted" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>{g.sub}</p>
            </button>
          ))}
        </>
      ),
    },
    {
      title: "Experience",
      valid: tenure != null,
      body: (
        <div className="chip-row">
          {TENURE.map((t) => (
            <button key={t.v} type="button" className="chip" aria-pressed={tenure === t.v} onClick={() => setTenure(t.v)}>
              {t.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Training days",
      valid: days != null,
      body: (
        <>
          <label>Days per week you'll train</label>
          <div className="chip-row">
            {[2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" className="chip num" aria-pressed={days === d} onClick={() => { setDays(d); setSplitKey(null); }}>
                {d}
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "Your split",
      valid: (splitKey != null && !buildingCustom) || (buildingCustom && customDays != null),
      body: buildingCustom ? (
        <CustomSplitBuilder
          daysPerWeek={days ?? 3}
          onComplete={(builtDays) => {
            setCustomDays(builtDays);
            setSplitKey("custom");
          }}
        />
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Only splits that train every muscle group at least twice a week. No single-muscle days.
          </p>
          {splitOptions.map((s) => (
            <button
              key={s.key}
              type="button"
              className="card"
              aria-pressed={splitKey === s.key}
              onClick={() => setSplitKey(s.key)}
              style={{
                width: "100%", textAlign: "left", cursor: "pointer", marginTop: 10,
                borderColor: splitKey === s.key ? "var(--steel)" : "var(--line-soft)",
              }}
            >
              <h3>{s.name}</h3>
              <p className="num muted" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>
                {s.days.map((d) => d.label).join("  ·  ")}
              </p>
              {s.note && <p className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>{s.note}</p>}
            </button>
          ))}
          <button
            type="button"
            className="card"
            onClick={() => { setBuildingCustom(true); setSplitKey(null); }}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer", marginTop: 10,
              borderColor: "var(--steel)", borderStyle: "dashed",
            }}
          >
            <h3>Build your own</h3>
            <p className="muted" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>
              Assign muscle groups to each day yourself. Every muscle still needs 2 days minimum.
            </p>
          </button>
        </>
      ),
    },
  ];

  const current = steps[step];

  async function finish() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) { setSaving(false); return; }
    await supabase.from("profiles").update({
      height_cm: Number(heightCm),
      weight_kg: Number(weightKg),
      age: Number(age),
      sex,
      body_fat_pct: bodyFat,
      perceived_metabolism: metab,
      goal,
      tenure,
      training_days: days,
      split_key: splitKey,
      onboarded: true,
    }).eq("id", uid);
    router.push("/dashboard");
  }

  return (
    <main className="wrap">
      <span className="eyebrow">Step {step + 1} / {steps.length}</span>
      <h1 style={{ marginBottom: 20 }}>{current.title}</h1>
      <div className="card">{current.body}</div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {step > 0 && (
          <button className="btn" style={{ flex: 1 }} onClick={() => setStep((s) => s - 1)}>Back</button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={!current.valid} onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={!current.valid || saving} onClick={finish}>
            {saving ? "Saving…" : "Finish"}
          </button>
        )}
      </div>
    </main>
  );
}
