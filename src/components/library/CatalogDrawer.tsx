import { useState } from "react";
import type { Collection, Song } from "@/lib/library";
import { matches } from "@/lib/library";

export function CatalogDrawer({
  songs,
  collections,
  onOpenSong,
}: {
  songs: Song[];
  collections: Collection[];
  onOpenSong: (s: Song) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = q.trim() ? songs.filter((s) => matches(s, q, collections)).slice(0, 8) : [];

  return (
    <div className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 wood-surface px-4 py-2.5 text-left transition-transform duration-300 hover:translate-y-[1px]"
        style={{ boxShadow: "var(--shadow-object)" }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-amber/70 shadow-[0_0_6px_oklch(0.79_0.14_72/0.6)]" />
        <span className="plate-type text-[11px] uppercase tracking-[0.18em] text-parchment/80">
          card catalog
        </span>
        <span className="hand ml-auto text-sm text-parchment-dim/60">{open ? "close" : "pull"}</span>
      </button>

      {open && (
        <div
          className="animate-drawer-out absolute bottom-full left-0 z-30 mb-1 w-full rounded-t-[2px] p-3"
          style={{
            background: "linear-gradient(180deg, oklch(0.3 0.04 58), oklch(0.24 0.035 56))",
            boxShadow: "0 -14px 30px -12px oklch(0 0 0/0.8)",
          }}
        >
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="song, artist, mood, note…"
            className="hand w-full rounded-[2px] paper-surface px-3 py-1.5 text-lg outline-none placeholder:opacity-40"
          />
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {q.trim() && results.length === 0 && (
              <p className="hand px-1 py-2 text-sm text-parchment-dim/60">nothing filed under that.</p>
            )}
            {results.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenSong(s)}
                className="animate-soft-in block w-full cursor-pointer rounded-[2px] paper-surface px-3 py-1.5 text-left transition-transform hover:-translate-y-[1px]"
                style={{ animationDelay: `${i * 40}ms`, transform: `rotate(${(i % 2 ? 0.5 : -0.4)}deg)` }}
              >
                <span className="block text-sm leading-tight">{s.title}</span>
                <span className="hand block text-xs leading-tight opacity-65">
                  {s.artist} · {collections.find((c) => c.id === s.collectionId)?.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
