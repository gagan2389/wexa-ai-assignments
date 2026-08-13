"use client";

import { useEffect, useRef, useState } from "react";
import { Ingredient } from "@/lib/types";

export default function IngredientAutocomplete({
  onSelect,
  placeholder = "Type an ingredient…",
  excluded = [],
}: {
  onSelect: (name: string) => void;
  placeholder?: string;
  excluded?: string[];
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Ingredient[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/ingredients?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setOptions(data.ingredients ?? []))
        .catch(() => {});
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visible = query.trim() ? options.filter((o) => !excluded.includes(o.name)) : [];

  function choose(name: string) {
    onSelect(name);
    setQuery("");
    setOptions([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && visible.length > 0) {
            e.preventDefault();
            choose(visible[0].name);
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm placeholder:text-foreground-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {open && visible.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface shadow-lg">
          {visible.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => choose(opt.name)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span>{opt.name}</span>
                <span className="text-xs text-foreground-muted">{opt.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
