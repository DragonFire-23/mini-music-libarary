import { useState } from "react";
import { makeSpine, type Song } from "@/lib/library";
import { findTrackPreview } from "@/lib/track-preview";
import { Overlay } from "./SongBook";

function splitDash(v: string) {
  const parts = v.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) return { artist: parts[0]!.trim(), title: parts.slice(1).join(" - ").trim() };
  return { artist: "", title: v.trim() };
}

/**
 * The listening room: whatever you put on here is looked up, played, and
 * pressed into a new book on the shelf.
 */
export function ListeningRoom({
  onShelve,
  onClose,
}: {
  onShelve: (song: Song) => void;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [bound, setBound] = useState<string[]>([]);

  const listen = async () => {
    const raw = entry.trim();
    if (!raw || busy) return;
    setBusy(true);
    const { artist, title } = splitDash(raw);
    const found = await findTrackPreview(title, artist);
    const song: Song = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: found?.trackName || title || raw,
      artist: found?.artistName || artist,
      album: "",
      artwork: found?.artwork ?? "",
      url: link.trim(),
      notes: "",
      moods: [],
      tags: ["listened"],
      collectionId: "unknown",
      dateAdded: new Date().toISOString(),
      spine: makeSpine(),
    };
    onShelve(song);
    setBound((b) => [song.title, ...b]);
    setEntry("");
    setLink("");
    setBusy(false);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="animate-book-open mx-auto w-full max-w-lg paper-surface rounded-[3px] p-8">
        <h2 className="plate-type text-lg uppercase tracking-[0.15em]">The listening room</h2>
        <p className="hand mt-1 text-base opacity-60">
          Name what you're listening to and it's bound into a book on the shelf.
        </p>

        <label className="plate-type mt-6 block text-[10px] uppercase tracking-[0.3em] opacity-60">
          song — artist
        </label>
        <input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void listen();
          }}
          placeholder="Nina Simone – Feeling Good"
          className="hand mt-1 w-full border-b border-ink/25 bg-transparent pb-1 text-2xl outline-none placeholder:opacity-30"
        />

        <label className="plate-type mt-5 block text-[10px] uppercase tracking-[0.3em] opacity-60">
          link (optional)
        </label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://music.youtube.com/watch?v=…"
          className="hand mt-1 w-full border-b border-ink/25 bg-transparent pb-1 text-lg outline-none placeholder:opacity-30"
        />

        <button
          type="button"
          onClick={() => void listen()}
          disabled={busy || !entry.trim()}
          className="plate-type mt-6 rounded-[2px] border border-ink/30 px-4 py-2 text-[11px] uppercase tracking-widest transition-opacity disabled:opacity-30 hover:opacity-70"
        >
          {busy ? "binding…" : "listen & shelve"}
        </button>

        {bound.length > 0 && (
          <ul className="hand mt-5 max-h-32 space-y-1 overflow-y-auto text-lg opacity-70">
            {bound.map((t, i) => (
              <li key={`${t}-${i}`}>· “{t}” — bound and shelved</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="plate-type mt-6 block text-[11px] uppercase tracking-widest opacity-70 hover:opacity-100"
        >
          ← back to the room
        </button>
      </div>
    </Overlay>
  );
}
