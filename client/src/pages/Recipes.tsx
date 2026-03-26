import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { RecipeCard } from "../components/RecipeCard";
import type { Recipe } from "../types";

type RecipesProps = {
  recipes: Recipe[];
  onAddToPlan: (recipe: Recipe) => void;
};

export function Recipes({ recipes, onAddToPlan }: RecipesProps) {
  const [filterMode, setFilterMode] = useState<"all" | "country" | "continent">("all");
  const [selectedValue, setSelectedValue] = useState("All");

  const countries = useMemo(
    () => ["All", ...Array.from(new Set(recipes.map((recipe) => recipe.country).filter(Boolean) as string[])).sort()],
    [recipes]
  );
  const continents = useMemo(
    () => ["All", ...Array.from(new Set(recipes.map((recipe) => recipe.continent).filter(Boolean) as string[])).sort()],
    [recipes]
  );

  const visibleRecipes = useMemo(() => {
    if (filterMode === "country" && selectedValue !== "All") {
      return recipes.filter((recipe) => recipe.country === selectedValue);
    }

    if (filterMode === "continent" && selectedValue !== "All") {
      return recipes.filter((recipe) => recipe.continent === selectedValue);
    }

    return recipes;
  }, [filterMode, recipes, selectedValue]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-coral">Recipe engine</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Prioritized suggestions</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Matches are ranked by pantry coverage first, then optional substitutions keep momentum when you are one ingredient short.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-float">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Recipe filters</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Browse by all, country, or continent</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["country", "Country"],
              ["continent", "Continent"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFilterMode(value as "all" | "country" | "continent");
                  setSelectedValue("All");
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  filterMode === value ? "bg-ink text-white" : "bg-mist text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {filterMode !== "all" ? (
            <select
              value={selectedValue}
              onChange={(event) => setSelectedValue(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
            >
              {(filterMode === "country" ? countries : continents).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onAdd={onAddToPlan} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
