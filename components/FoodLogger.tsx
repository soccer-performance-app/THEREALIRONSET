"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { macroTargets } from "@/lib/calories";
import type { FoodLog, Profile } from "@/lib/types";

interface SearchResult {
  fdcId: number;
  name: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
}

export function FoodLogger({
  userId,
  profile,
  targetKcal,
  logs,
  onLogsChange,
}: {
  userId: string;
  profile: Profile;
  targetKcal: number;
  logs: (FoodLog & { calories: number })[];
  onLogsChange: (logs: (FoodLog & { calories: number })[]) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [grams, setGrams] = useState("100");

  async function search() {
    if (query.trim().length < 2) return;
    setSearching(true);
    const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setSearching(false);
  }

  async function logFood() {
    if (!selected) return;
    const g = Number(grams);
    if (!g || g <= 0) return;
    const scale = g / 100;
    const calories = Math.round(selected.per100g.calories * scale);
    const proteinG = Math.round(selected.per100g.protein * scale * 10) / 10;
    const carbsG = Math.round(selected.per100g.carbs * scale * 10) / 10;
    const fatG = Math.round(selected.per100g.fat * scale * 10) / 10;

    const { data, error } = await supabase
      .from("food_logs")
      .insert({
        user_id: userId,
        log_date: today,
        food_name: selected.name,
        serving_desc: `${g}g`,
        calories,
        protein_g: proteinG,
        carbs_g: carbsG,
        fat_g: fatG,
      })
      .select("id")
      .single();

    if (error || !data) return;

    onLogsChange([
      ...logs,
      {
        id: data.id,
        foodName: selected.name,
        servingDesc: `${g}g`,
        calories,
        proteinG,
        carbsG,
        fatG,
      },
    ]);
    setSelected(null);
    setQuery("");
    setResults([]);
    setGrams("100");
  }

  async function removeLog(id: string) {
    await supabase.from("food_logs").delete().eq("id", id);
    onLogsChange(logs.filter((l) => l.id !== id));
  }

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.proteinG,
      carbs: acc.carbs + l.carbsG,
      fat: acc.fat + l.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div>
      <div className="card">
        <h3>Log food</h3>
        <div className="field">
          <label htmlFor="food-search">Search USDA database</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="food-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="e.g. chicken breast, banana, rice"
            />
            <button className="btn" onClick={search} disabled={searching}>
              {searching ? "…" : "Search"}
            </button>
          </div>
        </div>

        {results.length > 0 && !selected && (
          <div style={{ marginTop: 12 }}>
            {results.map((r) => (
              <button
                key={r.fdcId}
                type="button"
                className="chip"
                style={{ display: "block", width: "100%", textAlign: "left", marginTop: 6 }}
                onClick={() => setSelected(r)}
              >
                {r.name}{" "}
                <span className="muted num" style={{ fontSize: "0.75rem" }}>
                  · {Math.round(r.per100g.calories)} kcal/100g
                </span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div style={{ marginTop: 14 }}>
            <p style={{ marginBottom: 8 }}>{selected.name}</p>
            <div className="field">
              <label htmlFor="grams">Grams</label>
              <input
                id="grams"
                className="num"
                inputMode="numeric"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
            </div>
            <p className="muted num" style={{ fontSize: "0.78rem", marginTop: 8 }}>
              {Math.round(selected.per100g.calories * (Number(grams) / 100))} kcal ·{" "}
              {Math.round(selected.per100g.protein * (Number(grams) / 100) * 10) / 10}g protein
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={logFood}>
                Add
              </button>
              <button className="btn" onClick={() => setSelected(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Today's macros</h3>
        {(() => {
          const targets = macroTargets(targetKcal, profile.weight_kg);
          const kcalPct = targetKcal > 0 ? Math.min(100, (totals.calories / targetKcal) * 100) : 0;
          const proteinPct = targets.proteinG > 0 ? Math.min(100, (totals.protein / targets.proteinG) * 100) : 0;
          return (
            <>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>Calories</span>
                  <span className="num" style={{ fontSize: "0.8rem" }}>
                    {Math.round(totals.calories)} / {targetKcal} kcal
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--line-soft)" }}>
                  <div style={{ height: "100%", width: `${kcalPct}%`, background: "linear-gradient(90deg, #5b9eff, #8b7fff)", borderRadius: 999, transition: "width 0.3s ease" }} />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>Protein</span>
                  <span className="num" style={{ fontSize: "0.8rem" }}>
                    {Math.round(totals.protein)}g / {targets.proteinG}g
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--line-soft)" }}>
                  <div style={{ height: "100%", width: `${proteinPct}%`, background: "linear-gradient(90deg, #8b7fff, #ff5ca8)", borderRadius: 999, transition: "width 0.3s ease" }} />
                </div>
              </div>

              <div className="chip-row" style={{ marginTop: 14 }}>
                <span className="pill pill-hold">
                  {Math.round(totals.carbs)}g / {targets.carbsG}g carbs
                </span>
                <span className="pill pill-hold">
                  {Math.round(totals.fat)}g / {targets.fatG}g fat
                </span>
              </div>
            </>
          );
        })()}
      </div>

      {logs.length > 0 && (
        <div className="card">
          <h3>Logged today</h3>
          {logs.map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <span>
                {l.foodName}{" "}
                <span className="muted num" style={{ fontSize: "0.8rem" }}>
                  · {l.servingDesc}
                </span>
              </span>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="num">{Math.round(l.calories)} kcal</span>
                <button className="chip" onClick={() => removeLog(l.id)} aria-label="Remove">
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
