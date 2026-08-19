import type { Collection, Song } from "@/lib/library";
import { BookSpine } from "./BookSpine";
import { Overlay } from "./SongBook";
import { Dust } from "./Dust";

export function CollectionPanel({
  collection,
  songs,
  onClose,
  onOpenSong,
  onRename,
  onDelete,
  onDeleteSong,
}: {
  collection: Collection;
  songs: Song[];
  onClose: () => void;
  onOpenSong: (s: Song) => void;
  onRename: (name: string) => void;
  onDelete?: (() => void) | undefined;
  onDeleteSong: (id: string) => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div
        className="animate-soft-in relative mx-auto w-full max-w-5xl overflow-hidden rounded-[3px] wood-deep-surface p-8 md:p-12"
        style={{ boxShadow: "0 40px 80px -30px oklch(0 0 0/0.9)" }}
      >
        <Dust count={16} opacity={0.28} />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[70%] -translate-x-1/2 lamp-pool" />

        <div className="relative flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <input
              defaultValue={collection.name}
              onBlur={(e) => onRename(e.target.value.trim() || collection.name)}
              className={`${collection.special ? "hand text-3xl" : "plate-type text-2xl uppercase tracking-[0.12em]"} w-full max-w-xl bg-transparent text-parchment outline-none`}
            />
            <p className="hand mt-1 text-base text-parchment-dim/65">{collection.blurb}</p>
          </div>
          <span className="plate-type text-[11px] uppercase tracking-widest text-parchment-dim/60">
            {songs.length} volumes
          </span>
        </div>

        <div className="relative mt-10">
          <div className="flex h-56 items-end gap-1 border-b-[10px] border-wood-light px-4 pb-1">
            {songs.length === 0 && (
              <span className="hand mb-6 text-lg text-parchment-dim/50">
                this section is waiting for its first book.
              </span>
            )}
            {songs.map((s) => (
              <div key={s.id} className="group relative flex items-end">
                <BookSpine song={s} scale={1.6} onClick={() => onOpenSong(s)} />
                <button
                  type="button"
                  aria-label={`remove ${s.title}`}
                  title={`remove ${s.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSong(s.id);
                  }}
                  className="absolute -top-5 left-1/2 hidden h-5 w-5 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-amber/40 bg-wood-deep text-[11px] leading-none text-parchment-dim/80 hover:text-parchment group-hover:flex"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="h-4 bg-[linear-gradient(180deg,oklch(0_0_0/0.55),transparent)]" />
        </div>

        <div className="relative mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="plate-type text-[11px] uppercase tracking-widest text-parchment-dim/70 hover:text-parchment"
          >
            ← back to the room
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete} className="hand text-sm text-parchment-dim/45 hover:text-parchment-dim">
              take this shelf down
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}
