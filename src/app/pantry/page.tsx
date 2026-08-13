"use client";

import { useState } from "react";
import Link from "next/link";
import IngredientAutocomplete from "@/components/IngredientAutocomplete";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/States";
import Badge from "@/components/Badge";
import { PantryMatch } from "@/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

export default function PantryPage() {
  const [pantry, setPantry] = useState<string[]>(["Chicken Breast", "Onion", "Garlic", "Rice"]);
  const [matches, setMatches] = useState<PantryMatch[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  async function runMatch(items: string[]) {
    if (items.length === 0) {
      setMatches([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/pantry-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: items }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setMatches(data.matches ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function addIngredient(name: string) {
    if (pantry.includes(name)) return;
    const next = [...pantry, name];
    setPantry(next);
  }

  function removeIngredient(name: string) {
    setPantry(pantry.filter((p) => p !== name));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What can I cook?</h1>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          Add what&apos;s in your kitchen. We&apos;ll match recipes you can make outright, plus
          recipes you can make by substituting an ingredient you have — following substitution
          chains up to two steps (e.g. buttermilk ← plain yogurt ← Greek yogurt).
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <label className="mb-2 block text-sm font-medium">Your pantry</label>
        <IngredientAutocomplete onSelect={addIngredient} excluded={pantry} />
        <div className="mt-3 flex flex-wrap gap-2">
          {pantry.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent-hover"
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                aria-label={`Remove ${item}`}
                className="text-accent-hover/60 hover:text-accent-hover"
              >
                ×
              </button>
            </span>
          ))}
          {pantry.length === 0 && (
            <span className="text-sm text-foreground-muted">No ingredients added yet.</span>
          )}
        </div>
        <button
          onClick={() => runMatch(pantry)}
          disabled={pantry.length === 0}
          className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Find what I can cook
        </button>
      </section>

      {status === "loading" && <CardSkeletonGrid count={4} />}

      {status === "error" && <ErrorState onRetry={() => runMatch(pantry)} />}

      {status === "idle" && (
        <EmptyState
          emoji="🧺"
          title="Add a few ingredients to get started"
          description="Try Chicken Breast, Onion, Garlic and Rice, or add your own."
        />
      )}

      {status === "ready" && matches.length === 0 && (
        <EmptyState
          title="No recipes matched"
          description="None of the recipes overlap with your pantry, even with substitutions. Try adding a protein or a staple like rice, pasta, or flour."
        />
      )}

      {status === "ready" && matches.length > 0 && (
        <ul className="space-y-4">
          {matches.map((m) => (
            <li key={m.recipe.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {m.recipe.emoji}
                  </span>
                  <div>
                    <Link
                      href={`/recipes/${m.recipe.id}`}
                      className="text-lg font-semibold hover:text-accent-hover"
                    >
                      {m.recipe.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge>{m.recipe.cuisine}</Badge>
                      {m.recipe.dietTags.map((tag) => (
                        <Badge key={tag} tone="success">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-2xl font-bold text-accent-hover">
                    {Math.round(m.matchScore * 100)}%
                  </span>
                  <span className="text-xs text-foreground-muted">match</span>
                </div>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.round(m.matchScore * 100)}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                {m.haveDirectly.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-success">✓ You have</p>
                    <p className="text-foreground-muted">{m.haveDirectly.join(", ")}</p>
                  </div>
                )}
                {m.needsSubstitution.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-accent-hover">⇄ Substitute</p>
                    <ul className="space-y-0.5 text-foreground-muted">
                      {m.needsSubstitution.map((s) => (
                        <li key={s.required}>
                          {s.required} ← {s.substituteFrom}
                          {s.hops === 2 && <span className="text-xs"> (2-hop chain)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {m.missing.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-foreground-muted">Still need</p>
                    <p className="text-foreground-muted">{m.missing.join(", ")}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
