"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, formatPrice, type ApiProduct } from "@/lib/api";

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ApiProduct[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.get<ApiProduct[]>(
          `/products/search?q=${encodeURIComponent(query)}`,
        );
        setSuggestions(results.slice(0, 6));
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goToResults() {
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && goToResults()}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Busca papa, pollo, detergente..."
          className="w-full bg-transparent text-sm outline-none"
        />
        <button
          onClick={goToResults}
          className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
        >
          Buscar
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-black/10 bg-white shadow-lg">
          {suggestions.map((p) => (
            <li key={p.id}>
              <Link
                href={`/buscar?q=${encodeURIComponent(p.name)}`}
                className="flex items-center justify-between px-4 py-2 text-sm hover:bg-background"
              >
                <span>{p.name}</span>
                <span className="text-foreground/60">{formatPrice(p.price, p.unit)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
