import { useState } from "react";
import type { Collection, Song } from "@/lib/library";
import { MOODS, makeSpine } from "@/lib/library";
import { Overlay } from "./SongBook";

export function CatalogCard({
  collections,
  onClose,
  onAdd,
}: {
  collections: Collection[];
  onClose: () => void;
  onAdd: (s: Song) => void;
}) {
  const [f, setF] = useState({
    title: "",
    artist: "",
    album: "",
    artwork: "",
    url: "",
    duration: "",
    notes: "",
    tags: "",
    collectionId: collections[0]?.id ?? "favorites",
  });
  const [moods, setMoods] = useState<string[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    onAdd({
      id: `s-${Date.now()}`,
      title: f.title.trim(),
      artist: f.artist.trim() || "unknown hand",
      album: f.album.trim(),
      artwork: f.artwork.trim(),
      url: f.url.trim(),
      duration: f.duration.trim(),
      notes: f.notes,
      moods,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      collectionId: f.collectionId,
      dateAdded: new Date().toISOString(),
      spine: makeSpine(Date.now() % 9973),
    });
  };

  const field = (label: string, key: keyof typeof f, placeholder = "") => (
    <div>
      <label className="plate-type block text-[10px] uppercase tracking-wider opacity-55">{label}</label>
      <input
        value={f[key]}
        onChange={(e) => setF({ ...f, [key]: e.target.value })}
        placeholder={placeholder}
        className="hand w-full border-b border-ink/30 bg-transparent pb-0.5 text-lg outline-none placeholder:opacity-35 focus:border-ink/70"
      />
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <form
        onSubmit={submit}
        className="animate-book-open paper-surface mx-auto w-full max-w-xl rounded-[2px] p-8"
        style={{ transform: "rotate(-0.5deg)" }}
      >
        <div className="flex items-baseline justify-between border-b-2 border-double border-ink/30 pb-2">
          <h2 className="plate-type text-xl uppercase tracking-[0.15em]">Accession card</h2>
          <span className="hand text-sm opacity-55">{new Date().toLocaleDateString()}</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("Title", "title", "song title")}
          {field("Artist", "artist", "who plays it")}
          {field("Album", "album", "")}
          {field("Duration", "duration", "3:42")}
          {field("Artwork URL", "artwork", "optional image link")}
          {field("Music URL", "url", "spotify / youtube")}
        </div>

        <div className="mt-4">
          <label className="plate-type block text-[10px] uppercase tracking-wider opacity-55">Notes</label>
          <textarea
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
            rows={2}
            className="hand w-full resize-none border-b border-ink/30 bg-transparent text-lg outline-none focus:border-ink/70"
          />
        </div>

        <div className="mt-4">
          <label className="plate-type block text-[10px] uppercase tracking-wider opacity-55">Mood</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoods(moods.includes(m) ? moods.filter((x) => x !== m) : [...moods, m])}
                className={`hand rounded-[2px] border px-2 py-0.5 text-sm ${
                  moods.includes(m) ? "border-ink/60 bg-ink/15" : "border-ink/20 opacity-55"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("Tags", "tags", "comma, separated")}
          <div>
            <label className="plate-type block text-[10px] uppercase tracking-wider opacity-55">Shelf</label>
            <select
              value={f.collectionId}
              onChange={(e) => setF({ ...f, collectionId: e.target.value })}
              className="w-full border-b border-ink/30 bg-transparent pb-1 text-sm outline-none"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button type="button" onClick={onClose} className="hand text-sm opacity-55 hover:opacity-90">
            never mind
          </button>
          <button
            type="submit"
            className="plate-type rounded-[2px] border border-ink/50 bg-ink/10 px-4 py-1.5 text-[11px] uppercase tracking-wider transition-colors hover:bg-ink/20"
          >
            shelve it
          </button>
        </div>
      </form>
    </Overlay>
  );
}
