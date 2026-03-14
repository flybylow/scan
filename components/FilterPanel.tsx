"use client";

import React, { useState } from "react";
import Link from "next/link";

export type ScoreLetter = "A" | "B" | "C" | "D" | "E";

export interface FiltersState {
  ecoscore: Record<ScoreLetter, boolean>;
  nutriscore: Record<ScoreLetter, boolean>;
  brandSearch: string;
  limit: number;
}

interface FilterPanelProps {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
}

const letters: ScoreLetter[] = ["A", "B", "C", "D", "E"];

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const update = (partial: Partial<FiltersState>) =>
    onChange({ ...filters, ...partial });

  return (
    <header className="w-full border-b border-zinc-800 bg-black/80 text-zinc-100 px-3 py-2 md:px-4 md:py-3">
      <div className="flex items-center gap-2 md:gap-6 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex items-center gap-2 min-h-[44px] px-3 rounded text-sm font-semibold uppercase tracking-wide text-zinc-300 bg-zinc-800/80"
          aria-expanded={open}
        >
          Filters
          <span className="text-zinc-500">{open ? "▼" : "▶"}</span>
        </button>
        <div className="hidden md:block text-sm font-semibold tracking-wide text-zinc-300 uppercase whitespace-nowrap">
          Filters
        </div>

        <div className={"flex flex-wrap items-center gap-2 md:gap-6 " + (open ? "flex" : "hidden md:flex")}>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="text-xs font-medium text-zinc-400 uppercase shrink-0">Ecoscore</div>
            <div className="flex flex-wrap gap-2">
              {letters.map((l) => (
                <label key={`eco-${l}`} className="flex items-center gap-1 text-xs cursor-pointer min-h-[44px] md:min-h-0">
                  <input
                    type="checkbox"
                    className="accent-emerald-400 w-4 h-4"
                    checked={filters.ecoscore[l]}
                    onChange={(e) => update({ ecoscore: { ...filters.ecoscore, [l]: e.target.checked } })}
                  />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="text-xs font-medium text-zinc-400 uppercase shrink-0">Nutriscore</div>
            <div className="flex flex-wrap gap-2">
              {letters.map((l) => (
                <label key={`nutri-${l}`} className="flex items-center gap-1 text-xs cursor-pointer min-h-[44px] md:min-h-0">
                  <input type="checkbox" className="accent-sky-400 w-4 h-4" checked={filters.nutriscore[l]} onChange={(e) => update({ nutriscore: { ...filters.nutriscore, [l]: e.target.checked } })} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1 md:min-w-[200px] md:max-w-xs">
            <div className="text-xs font-medium text-zinc-400 uppercase whitespace-nowrap shrink-0">Brand</div>
            <input
              type="text"
              value={filters.brandSearch}
              onChange={(e) => update({ brandSearch: e.target.value })}
              placeholder="e.g. nestlé"
              className="w-full min-w-0 rounded bg-zinc-900 border border-zinc-800 px-2 py-2 md:py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-3 min-h-[44px] md:min-h-0">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="uppercase font-medium">Limit</span>
              <span className="tabular-nums text-zinc-300">{filters.limit}</span>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={filters.limit}
              onChange={(e) => update({ limit: Number(e.target.value) })}
              className="w-24 md:w-32 accent-sky-500"
            />
          </div>
        </div>

        <Link
          href="/grid"
          className="ml-auto min-h-[44px] flex items-center px-3 py-2 md:py-1.5 rounded text-xs font-semibold uppercase tracking-wide bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors touch-manipulation"
        >
          GRID
        </Link>
      </div>
    </header>
  );
}
