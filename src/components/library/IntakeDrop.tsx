import { useRef, useState } from "react";
import { makeSpine, type Song } from "@/lib/library";
import { localRef, putAudio } from "@/lib/audio-store";

function titleFromFile(name: string) {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ").trim();
  const parts = base.split(/\s+-\s+/);
  if (parts.length >= 2) return { artist: parts[0]!.trim(), title: parts.slice(1).join(" - ").trim() };
  return { artist: "", title: base };
}

export function IntakeDrop({
  onAdd,
  onClose,
}: {
  onAdd: (song: Song) => void;
  onClose: () => void;
}) {
  const [over, setOver] = useState(false);
  const [taken, setTaken] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (files: FileList | null) => {
    if (!files) return;
    const added: string[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name)) return;
      const { artist, title } = titleFromFile(f.name);
      const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // keep the complete file so the whole track plays, now and after a reload
      void putAudio(id, f);
      onAdd({
        id,
        title: title || f.name,
        artist,
        album: "",
        artwork: "",
        url: localRef(id),
        notes: "",
        moods: [],
        tags: [],
        collectionId: "unknown",
        dateAdded: new Date().toISOString(),
        spine: makeSpine(),
      });
      added.push(title || f.name);
    });
    if (added.length) setTaken((t) => [...added, ...t]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-[3px] wood-surface p-6"
        style={{ boxShadow: "var(--shadow-object)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="hand absolute right-4 top-3 cursor-pointer text-sm text-parchment-dim/60 hover:text-parchment"
        >
          close
        </button>
        <p className="plate-type text-[10px] uppercase tracking-[0.35em] text-parchment-dim/55">
          the unshelved stack
        </p>
        <p className="hand -mt-0.5 text-3xl text-parchment">Bring in new music</p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            accept(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className="mt-5 cursor-pointer rounded-[3px] border-2 border-dashed p-10 text-center transition-colors"
          style={{
            borderColor: over ? "oklch(0.79 0.14 72/0.8)" : "oklch(0.79 0.14 72/0.28)",
            background: over ? "oklch(0.79 0.14 72/0.08)" : "oklch(0 0 0/0.2)",
          }}
        >
          <p className="hand text-xl text-parchment/85">
            drop downloaded music here
          </p>
          <p className="hand mt-1 text-sm text-parchment-dim/55">
            or click to choose files — they wait in the reading chair corner until you shelve them
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => accept(e.target.files)}
          />
        </div>

        {taken.length > 0 && (
          <ul className="hand mt-4 max-h-40 space-y-1 overflow-y-auto text-base text-parchment-dim/70">
            {taken.map((t, i) => (
              <li key={`${t}-${i}`}>· {t} — set down in the corner</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
