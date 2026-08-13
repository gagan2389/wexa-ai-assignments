import Link from "next/link";
import { RecipeSummary } from "@/lib/types";
import Badge from "./Badge";

export default function RecipeCard({
  recipe,
  highlight,
}: {
  recipe: RecipeSummary;
  highlight?: React.ReactNode;
}) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden="true">
          {recipe.emoji}
        </span>
        <Badge>{recipe.cuisine}</Badge>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground group-hover:text-accent-hover">
        {recipe.name}
      </h3>
      <p className="mb-4 line-clamp-2 text-sm text-foreground-muted">{recipe.description}</p>
      {highlight}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-foreground-muted">
        <span>⏱ {recipe.prepTimeMinutes} min</span>
        <span>🍽 {recipe.servings} servings</span>
        <span>{recipe.ingredientCount} ingredients</span>
      </div>
      {recipe.dietTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.dietTags.map((tag) => (
            <Badge key={tag} tone="success">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
