import { useEffect, useState } from "react";
import type { Collection, Song } from "@/lib/library";
import { MOODS } from "@/lib/library";
import { VolumeKnob } from "./VolumeKnob";

export function SongBook({
  song,
  collections,
  onClose,
  onSave,
  onDelete,
  onPlay,
  isPlaying,
  volume,
  onVolume,
}: {
  song: Song;
  collections: Collection[];
  onClose: () => void;
  onSave: (s: Song) => void;
  onDelete: (id: string) => void;
  onPlay: () => void;
  isPlaying: boolean;
  volume: number;
  onVolume: (v: number) => void;
}) {
  const [draft, setDraft] = useState<Song>(song);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setDraft(song), [song]);

  const toggleMood = (m: string) => {
    const moods = draft.moods.includes(m) ? draft.moods.filter((x) => x !== m) : [...draft.moods, m];
    const next = { ...draft, moods };
    setDraft(next);
    onSave(next);
  };

  const commit = (patch: Partial<Song>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onSave(next);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="animate-book-open relative mx-auto w-full max-w-4xl [perspective:1600px]">
        {/* leather cover binding */}
        <div
          className="relative rounded-[3px] p-2 md:p-3"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.31 0.09 25), oklch(0.2 0.07 22) 50%, oklch(0.27 0.08 26))",
            boxShadow:
              "0 45px 80px -30px oklch(0 0 0/0.95), inset 0 1px 0 oklch(1 0 0/0.12), inset 0 -2px 6px oklch(0 0 0/0.5)",
            border: "1px solid oklch(0.14 0.05 18)",
          }}
        >
          {/* gold tooling frame */}
          <div className="pointer-events-none absolute inset-1.5 rounded-[1px] border border-amber/25" />
          <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[2px] md:grid-cols-2">
            {/* left page */}
          <div className="paper-surface relative rounded-l-[3px] p-8">
            <p className="hand text-sm opacity-60">
              added {new Date(draft.dateAdded).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h2 className="mt-2 text-4xl leading-tight font-semibold">{draft.title}</h2>
            <p className="plate-type mt-1 text-lg opacity-80">{draft.artist}</p>
            <p className="mt-0.5 text-sm italic opacity-60">
              {draft.album}
              {draft.duration ? ` · ${draft.duration}` : ""}
            </p>

            <div className="mt-6 flex items-start gap-4">
              <div
                className="h-28 w-28 shrink-0 overflow-hidden rounded-[2px] border border-ink/25 bg-ink/10"
                style={{ boxShadow: "inset 0 0 24px oklch(0 0 0/0.25)" }}
              >
                {draft.artwork ? (
                  <img src={draft.artwork} alt={`${draft.album} artwork`} className="h-full w-full object-cover" />
                ) : (
                  <div className="hand flex h-full w-full items-center justify-center px-2 text-center text-xs opacity-50">
                    no plate pasted in
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="plate-type block text-[10px] uppercase tracking-wider opacity-60">
                  external record
                </label>
                <input
                  value={draft.url}
                  onChange={(e) => commit({ url: e.target.value })}
                  placeholder="paste a Spotify or YouTube link"
                  className="mt-1 w-full border-b border-ink/25 bg-transparent pb-1 text-sm outline-none placeholder:opacity-40 focus:border-ink/60"
                />
                {draft.url && (
                  <a
                    href={draft.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hand mt-2 inline-block text-sm underline underline-offset-4 opacity-75 hover:opacity-100"
                  >
                    listen elsewhere →
                  </a>
                )}
                <p className="hand mt-3 text-sm opacity-60">
                  if you want to download your own Youtube Music,{" "}
                  <a
                    href="https://y2mate.gs/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 opacity-80 hover:opacity-100"
                  >
                    go here
                  </a>
                </p>
                <button
                  type="button"
                  onClick={onPlay}
                  className="plate-type mt-3 block rounded-[2px] border border-ink/30 px-3 py-1 text-[11px] uppercase tracking-wider transition-colors hover:bg-ink/10"
                >
                  {isPlaying ? "on the turntable" : "put on the record player"}
                </button>
                <div className="mt-3 flex items-center gap-2">
                  <VolumeKnob
                    value={volume}
                    onChange={onVolume}
                    label="record volume"
                    size={28}
                    muted={volume === 0}
                    onToggleMute={() => onVolume(volume === 0 ? 0.7 : 0)}
                  />
                  <span className="plate-type text-[9px] uppercase tracking-widest opacity-55">volume</span>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-[linear-gradient(90deg,transparent,oklch(0_0_0/0.22))]" />
          </div>

          {/* right page */}
          <div className="paper-surface relative rounded-r-[3px] p-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-[linear-gradient(270deg,transparent,oklch(0_0_0/0.18))]" />
            <label className="plate-type block text-[10px] uppercase tracking-wider opacity-60">notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => commit({ notes: e.target.value })}
              placeholder="what this one is for…"
              rows={5}
              className="hand mt-1 w-full resize-none bg-[repeating-linear-gradient(transparent,transparent_27px,oklch(0.3_0.03_60/0.18)_28px)] text-lg leading-7 outline-none placeholder:opacity-40"
            />

            <label className="plate-type mt-4 block text-[10px] uppercase tracking-wider opacity-60">mood</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMood(m)}
                  className={`hand rounded-[2px] border px-2 py-0.5 text-sm transition-colors ${
                    draft.moods.includes(m)
                      ? "border-ink/60 bg-ink/15"
                      : "border-ink/20 opacity-55 hover:opacity-90"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label className="plate-type mt-4 block text-[10px] uppercase tracking-wider opacity-60">tags</label>
            <input
              value={draft.tags.join(", ")}
              onChange={(e) =>
                commit({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
              }
              placeholder="comma, separated"
              className="hand mt-1 w-full border-b border-ink/25 bg-transparent pb-1 text-lg outline-none placeholder:opacity-40 focus:border-ink/60"
            />

            <label className="plate-type mt-4 block text-[10px] uppercase tracking-wider opacity-60">shelf</label>
            <select
              value={draft.collectionId}
              onChange={(e) => commit({ collectionId: e.target.value })}
              className="mt-1 w-full border-b border-ink/25 bg-transparent pb-1 text-sm outline-none"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="plate-type text-[11px] uppercase tracking-wider opacity-70 hover:opacity-100"
              >
                ← close the book
              </button>
              {confirming ? (
                <span className="hand flex items-center gap-3 text-sm">
                  <span className="opacity-60">burn this one?</span>
                  <button
                    type="button"
                    onClick={() => onDelete(draft.id)}
                    className="underline underline-offset-4 opacity-85 hover:opacity-100"
                  >
                    yes, remove it
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="opacity-50 hover:opacity-85">
                    keep it
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="hand text-sm opacity-45 hover:opacity-85"
                >
                  remove from the library
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 md:p-10">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[oklch(0.08_0.02_50/0.78)] backdrop-blur-[2px] animate-soft-in"
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
