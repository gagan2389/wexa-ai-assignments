"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import IngredientAutocomplete from "@/components/IngredientAutocomplete";
import { EmptyState, ErrorState } from "@/components/States";
import { SubstituteSuggestion, SubstitutionPathResult } from "@/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

function ExploreContent() {
  const searchParams = useSearchParams();
  const [ingredient, setIngredient] = useState(searchParams.get("ingredient") ?? "");
  const [neighborhood, setNeighborhood] = useState<{
    canReplace: SubstituteSuggestion[];
    canBeReplacedBy: SubstituteSuggestion[];
  } | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const [pathFrom, setPathFrom] = useState("");
  const [pathTo, setPathTo] = useState("");
  const [pathResult, setPathResult] = useState<SubstitutionPathResult | null>(null);
  const [pathStatus, setPathStatus] = useState<Status>("idle");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- loading/reset state for an ingredient change */
    if (!ingredient) {
      setNeighborhood(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/ingredients/${encodeURIComponent(ingredient)}/substitutes`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setNeighborhood(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [ingredient]);

  async function findPath() {
    if (!pathFrom || !pathTo) return;
    setPathStatus("loading");
    try {
      const res = await fetch(
        `/api/substitution-path?from=${encodeURIComponent(pathFrom)}&to=${encodeURIComponent(pathTo)}`
      );
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setPathResult(data);
      setPathStatus("ready");
    } catch {
      setPathStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Substitution explorer</h1>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          Ingredients are connected by a directed <code className="text-sm">SUBSTITUTES_FOR</code>{" "}
          relationship. Explore what can replace an ingredient — or what it can replace — up to two
          hops away.
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <label className="mb-2 block text-sm font-medium">Pick an ingredient</label>
        <IngredientAutocomplete
          onSelect={setIngredient}
          placeholder="e.g. Butter, Egg, Soy Sauce…"
        />
        {ingredient && (
          <p className="mt-2 text-sm text-foreground-muted">
            Showing substitutes for <span className="font-medium text-foreground">{ingredient}</span>
          </p>
        )}
      </section>

      {status === "loading" && (
        <div className="mb-10 h-40 animate-pulse rounded-2xl bg-surface-muted" />
      )}
      {status === "error" && <ErrorState onRetry={() => setIngredient(ingredient)} />}
      {status === "idle" && (
        <EmptyState emoji="🔎" title="Pick an ingredient above to see its substitution network" />
      )}

      {status === "ready" && neighborhood && (
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SubstituteColumn
            title={`Can replace ${ingredient}`}
            emptyText="Nothing in the graph can replace this yet."
            items={neighborhood.canBeReplacedBy}
          />
          <SubstituteColumn
            title={`${ingredient} can replace`}
            emptyText="This ingredient isn't recorded as a substitute for anything yet."
            items={neighborhood.canReplace}
          />
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-1 text-lg font-semibold">Path finder</h2>
        <p className="mb-4 text-sm text-foreground-muted">
          Find the shortest substitution chain between any two ingredients, however many hops it
          takes — a query that needs a recursive CTE in SQL but is native here (
          <code className="text-xs">shortestPath()</code>).
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <IngredientAutocomplete onSelect={setPathFrom} placeholder="From ingredient…" />
          <IngredientAutocomplete onSelect={setPathTo} placeholder="To ingredient…" />
          <button
            onClick={findPath}
            disabled={!pathFrom || !pathTo}
            className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Find path
          </button>
        </div>
        {(pathFrom || pathTo) && (
          <p className="mt-2 text-xs text-foreground-muted">
            {pathFrom || "…"} → {pathTo || "…"}
          </p>
        )}

        {pathStatus === "loading" && (
          <div className="mt-4 h-10 animate-pulse rounded-xl bg-surface-muted" />
        )}
        {pathStatus === "error" && <div className="mt-4"><ErrorState onRetry={findPath} /></div>}
        {pathStatus === "ready" && pathResult && (
          <div className="mt-4">
            {pathResult.found ? (
              <div className="flex flex-wrap items-center gap-2">
                {pathResult.path.map((node, i) => (
                  <span key={node.name} className="flex items-center gap-2">
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-hover">
                      {node.name}
                    </span>
                    {i < pathResult.path.length - 1 && (
                      <span className="text-foreground-muted">→</span>
                    )}
                  </span>
                ))}
                <span className="ml-2 text-xs text-foreground-muted">
                  {pathResult.hops} hop{pathResult.hops !== 1 && "s"}
                </span>
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">
                No substitution chain connects these two ingredients.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SubstituteColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: SubstituteSuggestion[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.ingredient.id}
              className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm"
            >
              <span className="font-medium">{item.ingredient.name}</span>
              <span className="text-xs text-foreground-muted">
                {item.hops === 1 ? "direct" : "2 hops"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  );
}
