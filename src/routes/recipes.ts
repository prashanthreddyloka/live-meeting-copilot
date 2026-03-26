import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prismaClient";

const bodySchema = z.object({
  items: z.array(z.object({ name: z.string() }))
});

function parseRecipeTags(tagString: string) {
  const rawTags = tagString.split(",").map((tag) => tag.trim()).filter(Boolean);
  const country = rawTags.find((tag) => tag.startsWith("country:"))?.replace("country:", "");
  const continent = rawTags.find((tag) => tag.startsWith("continent:"))?.replace("continent:", "");
  const tags = rawTags.filter((tag) => !tag.startsWith("country:") && !tag.startsWith("continent:"));
  return { tags, country, continent };
}

export const recipesRouter = Router();

recipesRouter.post("/from-items", async (req, res, next) => {
  try {
    const { items } = bodySchema.parse(req.body);
    const pantry = new Set(items.map((item) => item.name.toLowerCase()));
    const recipes = await prisma.recipe.findMany();

    const mapped = recipes
      .map((recipe) => {
        const ingredients = JSON.parse(recipe.ingredientsJson) as Array<{ name: string; qty: string; optional?: boolean }>;
        const matches = ingredients.filter((ingredient) => pantry.has(ingredient.name.toLowerCase()));
        const missingOptional = ingredients.filter(
          (ingredient) => ingredient.optional && !pantry.has(ingredient.name.toLowerCase())
        );
        const { tags, country, continent } = parseRecipeTags(recipe.tags);
        const indianPriorityBonus = country?.toLowerCase() === "india" ? 8 : continent?.toLowerCase() === "asia" ? 2 : 0;
        return {
          id: recipe.id,
          title: recipe.title,
          tags,
          country,
          continent,
          cookTime: recipe.cookTime,
          steps: JSON.parse(recipe.stepsJson),
          ingredients,
          score: matches.length * 10 - missingOptional.length + indianPriorityBonus,
          coverage: `${matches.length}/${ingredients.length}`,
          substitutionSuggestions: missingOptional.map(
            (ingredient) => `Optional swap for ${ingredient.name}: pantry-friendly herb, greens, or a neutral staple.`
          )
        };
      })
      .sort((a, b) => b.score - a.score);

    return res.json({
      recipes: mapped,
      matches: Object.fromEntries(mapped.map((recipe) => [recipe.id, recipe.coverage]))
    });
  } catch (error) {
    return next(error);
  }
});
