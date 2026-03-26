import { ClockIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Recipe } from "../types";

type RecipeCardProps = {
  recipe: Recipe;
  onAdd?: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, onAdd }: RecipeCardProps) {
  const [showRecipe, setShowRecipe] = useState(false);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${recipe.title} recipe`)}`;

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-float backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-slate-600">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-display text-2xl text-ink">{recipe.title}</h3>
        </div>
        <div className="rounded-full bg-oat px-3 py-2 text-sm font-semibold text-slate-600">{recipe.coverage ?? "Match"}</div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          {recipe.cookTime} min
        </span>
        <span className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4" />
          Score {recipe.score ?? 0}
        </span>
        {recipe.country ? <span>{recipe.country}</span> : null}
        {recipe.continent ? <span>{recipe.continent}</span> : null}
      </div>

      <p className="mt-4 text-sm text-slate-600">Uses {recipe.ingredients.map((ingredient) => ingredient.name).join(", ")}.</p>

      {recipe.substitutionSuggestions && recipe.substitutionSuggestions.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-mist p-3 text-sm text-slate-600">{recipe.substitutionSuggestions[0]}</div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowRecipe((current) => !current)}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {showRecipe ? "Hide recipe" : "Show recipe"}
        </button>
        {onAdd ? (
          <button
            type="button"
            onClick={() => onAdd(recipe)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Add to plan
          </button>
        ) : null}
      </div>

      {showRecipe ? (
        <div className="mt-4 rounded-2xl bg-oat p-4">
          <p className="text-sm font-semibold text-ink">Steps</p>
          <ol className="mt-3 space-y-2 text-sm text-slate-600">
            {recipe.steps.map((step, index) => (
              <li key={`${recipe.id}-step-${index}`}>{index + 1}. {step}</li>
            ))}
          </ol>
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
          >
            Watch related YouTube videos
          </a>
        </div>
      ) : null}
    </motion.article>
  );
}
