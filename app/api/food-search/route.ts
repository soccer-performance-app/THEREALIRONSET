import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to USDA FoodData Central search.
 * Keeps the API key off the client. Returns a trimmed, normalized shape —
 * USDA's raw response has far more fields than we need and varies by
 * food type (Foundation vs Branded vs Survey), so we flatten it here.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "USDA_API_KEY not configured" }, { status: 500 });
  }

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
    query
  )}&pageSize=10&dataType=Foundation,SR%20Legacy&api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "USDA lookup failed" }, { status: 502 });
  }

  const data = await res.json();

  const results = (data.foods ?? []).map((f: any) => {
    // Some USDA entries list "Energy" twice — once in kJ, once in KCAL.
    // Matching by name alone can silently grab the kJ value (roughly 4.2x
    // too high). Energy specifically must be filtered to the KCAL unit;
    // other nutrients here don't have this dual-unit issue.
    const nutrient = (name: string) =>
      f.foodNutrients?.find(
        (n: any) => n.nutrientName === name && (name !== "Energy" || n.unitName === "KCAL")
      )?.value ?? 0;

    return {
      fdcId: f.fdcId,
      name: f.description,
      // USDA gives values per 100g by default for these data types.
      per100g: {
        calories: nutrient("Energy"),
        protein: nutrient("Protein"),
        carbs: nutrient("Carbohydrate, by difference"),
        fat: nutrient("Total lipid (fat)"),
      },
    };
  });

  return NextResponse.json({ results });
}
