import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeDetail, relatedRecipes } from "@/lib/queries";
import { DbConnectionError } from "@/lib/neo4j";
import { ErrorState } from "@/components/States";
import Badge from "@/components/Badge";
import RecipeCard from "@/components/RecipeCard";
import { RecipeDetail, RelatedRecipe } from "@/lib/types";

async function loadRecipe(
  id: string
): Promise<{ recipe: RecipeDetail; related: RelatedRecipe[] } | "error" | "not_found"> {
  try {
    const recipe = await getRecipeDetail(id);
    if (!recipe) return "not_found";
    const related = await relatedRecipes(id);
    return { recipe, related };
  } catch (err) {
    if (err instanceof DbConnectionError) return "error";
    throw err;
  }
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadRecipe(id);

  if (result === "not_found") notFound();

  if (result === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <ErrorState />
      </div>
    );
  }

  const { recipe, related } = result;

  return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/" className="mb-6 inline-block text-sm text-foreground-muted hover:text-accent">
          ← Back to all recipes
        </Link>

        <div className="mb-6 flex items-start gap-4">
          <span className="text-5xl" aria-hidden="true">
            {recipe.emoji}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
            <p className="mt-1 text-foreground-muted">{recipe.description}</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{recipe.cuisine}</Badge>
          {recipe.dietTags.map((tag) => (
            <Badge key={tag} tone="success">
              {tag}
            </Badge>
          ))}
          <span className="ml-1 text-sm text-foreground-muted">
            ⏱ {recipe.prepTimeMinutes} min · 🍽 {recipe.servings} servings
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <section className="md:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((line) => (
                <li
                  key={line.ingredient.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  <Link
                    href={`/explore?ingredient=${encodeURIComponent(line.ingredient.name)}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {line.ingredient.name}
                  </Link>
                  <span className="text-foreground-muted">
                    {line.quantity}
                    {line.optional && " · optional"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-foreground-muted">
              Tap an ingredient to find substitutes for it.
            </p>
          </section>

          <section className="md:col-span-3">
            <h2 className="mb-3 text-lg font-semibold">Instructions</h2>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-hover">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-foreground-muted">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-1 text-lg font-semibold">Recipes with overlapping ingredients</h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Found via a two-hop traversal: Recipe → shared Ingredient → other Recipe.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <RecipeCard
                  key={r.recipe.id}
                  recipe={r.recipe}
                  highlight={
                    <p className="mb-3 text-xs text-accent-hover">
                      Shares {r.sharedIngredients.length}: {r.sharedIngredients.slice(0, 3).join(", ")}
                      {r.sharedIngredients.length > 3 && "…"}
                    </p>
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
  );
}
