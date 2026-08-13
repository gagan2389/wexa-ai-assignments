"use client";

import { useEffect, useMemo, useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/States";
import { RecipeSummary } from "@/lib/types";

type Status = "loading" | "ready" | "error";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [dietTag, setDietTag] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/filters")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setCuisines(data.cuisines ?? []);
        setDietTags(data.dietTags ?? []);
      })
      .catch(() => {});
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for an in-flight fetch
    setStatus("loading");
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (cuisine) params.set("cuisine", cuisine);
    if (dietTag) params.set("dietTag", dietTag);

    const timeout = setTimeout(() => {
      fetch(`/api/recipes?${params.toString()}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          setRecipes(data.recipes ?? []);
          setStatus("ready");
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setStatus("error");
        });
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search, cuisine, dietTag, reloadKey]);

  const hasFilters = useMemo(() => Boolean(search || cuisine || dietTag), [search, cuisine, dietTag]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse recipes</h1>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          Every recipe here is a node in a graph, connected to its ingredients, cuisine and diet
          tags. Filter below, or head to{" "}
          <a href="/pantry" className="font-medium text-accent underline underline-offset-2">
            What Can I Cook?
          </a>{" "}
          to search by what&apos;s in your kitchen.
        </p>
      </section>

      <section className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes…"
          className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm placeholder:text-foreground-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:max-w-xs"
        />
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={dietTag}
          onChange={(e) => setDietTag(e.target.value)}
          className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Any diet</option>
          {dietTags.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setCuisine("");
              setDietTag("");
            }}
            className="text-sm font-medium text-foreground-muted underline underline-offset-2 hover:text-accent"
          >
            Clear filters
          </button>
        )}
      </section>

      {status === "loading" && <CardSkeletonGrid />}

      {status === "error" && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}

      {status === "ready" && recipes.length === 0 && (
        <EmptyState
          title="No recipes match those filters"
          description="Try a different search term or clear your filters."
        />
      )}

      {status === "ready" && recipes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
