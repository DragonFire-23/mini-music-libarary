import type { Collection, Song } from "@/lib/library";
import { BookSpine } from "./BookSpine";

export function Shelf({
  collection,
  songs,
  onOpenCollection,
  onOpenSong,
  newSongId,
}: {
  collection: Collection;
  songs: Song[];
  onOpenCollection: () => void;
  onOpenSong: (s: Song) => void;
  newSongId?: string | null;
}) {
  return (
    <div className={`group/shelf relative ${collection.special ? "opacity-90" : ""}`}>
      <div
        className="relative flex h-[112px] items-end gap-[3px] overflow-hidden px-4 pb-[6px]"
        style={{
          background: collection.special
            ? "linear-gradient(180deg, oklch(0.13 0.02 50), oklch(0.17 0.024 52))"
            : "linear-gradient(180deg, oklch(0.15 0.022 52), oklch(0.2 0.028 54))",
          boxShadow: "inset 0 14px 22px -14px oklch(0 0 0/0.95)",
        }}
      >
        {songs.length === 0 && (
          <span className="hand mb-4 text-sm text-parchment-dim/50">— empty for now —</span>
        )}
        {songs.map((s) => (
          <BookSpine key={s.id} song={s} scale={1.45} onClick={() => onOpenSong(s)} isNew={newSongId === s.id} />
        ))}
        {songs.length > 0 && <ShelfDecor id={collection.id} />}

        {collection.special && (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,oklch(0_0_0/0.55),oklch(0_0_0/0.2)_40%,oklch(0_0_0/0.6))]" />
        )}
      </div>

      {/* shelf board */}
      <button
        type="button"
        onClick={onOpenCollection}
        className="relative block w-full cursor-pointer wood-surface px-4 py-[7px] text-left transition-colors duration-300 hover:brightness-110"
        style={{ boxShadow: "0 8px 14px -8px oklch(0 0 0/0.85)" }}
      >
        <span
          className={`${collection.special ? "hand text-[15px]" : "plate-type text-[11px] uppercase"} text-parchment/85`}
          style={collection.special ? { transform: "rotate(-1.2deg)", display: "inline-block" } : undefined}
        >
          {collection.name}
        </span>
        <span className="ml-2 text-[11px] text-parchment-dim/60">
          {songs.length} {songs.length === 1 ? "book" : "books"}
        </span>
      </button>
    </div>
  );
}

function ShelfDecor({ id }: { id: string }) {
  const k = id.length % 4;
  return (
    <div className="pointer-events-none ml-2 flex h-full items-end gap-2 opacity-90">
      {/* a book leaning against the stack */}
      <span
        className="block w-[14px] rounded-[2px]"
        style={{
          height: "54%",
          transform: "rotate(11deg)",
          transformOrigin: "bottom left",
          background: "linear-gradient(90deg, oklch(0.24 0.05 40), oklch(0.4 0.07 45), oklch(0.24 0.05 40))",
          boxShadow: "2px 0 4px -1px oklch(0 0 0/0.6)",
        }}
      />
      {/* flat stack */}
      <span className="ml-3 flex flex-col">
        {[0, 1, 2].slice(0, 2 + (k % 2)).map((i) => (
          <span
            key={i}
            className="block rounded-[1px]"
            style={{
              width: 46 - i * 5,
              height: 8,
              transform: `rotate(${i % 2 ? 1.4 : -1.1}deg)`,
              background: ["oklch(0.36 0.06 150)", "oklch(0.42 0.08 62)", "oklch(0.32 0.05 250)"][i],
            }}
          />
        ))}
      </span>
      {/* a trinket */}
      {k !== 2 && (
        <span className="mb-[1px] flex flex-col items-center">
          {k === 0 ? (
            <>
              <span className="block h-3 w-3 rounded-full bg-moss/60" />
              <span className="block h-2 w-5 rounded-sm bg-wood-light/80" />
            </>
          ) : (
            <>
              <span className="block h-4 w-[3px] bg-parchment-dim/70" />
              <span className="block h-2 w-4 rounded-sm bg-amber/50" />
            </>
          )}
        </span>
      )}
    </div>
  );
}
