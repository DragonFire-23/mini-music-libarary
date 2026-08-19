import { useEffect, useState } from "react";
import type { Song } from "@/lib/library";
import { Overlay } from "./SongBook";

export function DeskNotes({
  songs,
  value,
  onChange,
  onOpenSong,
  onClose,
}: {
  songs: Song[];
  value: string;
  onChange: (v: string) => void;
  onOpenSong: (s: Song) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const noted = songs.filter((s) => s.notes.trim());

  return (
    <Overlay onClose={onClose}>
      <div className="animate-book-open mx-auto grid w-full max-w-4xl grid-cols-1 md:grid-cols-2">
        <div className="paper-surface rounded-l-[3px] p-8" style={{ transform: "rotate(-0.3deg)" }}>
          <h2 className="plate-type text-lg uppercase tracking-[0.15em]">Commonplace book</h2>
          <p className="hand mt-1 text-sm opacity-55">whatever you leave on the desk</p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onChange(e.target.value);
            }}
            rows={12}
            placeholder="a thought, a lyric, a list of songs to find…"
            className="hand mt-4 w-full resize-none bg-[repeating-linear-gradient(transparent,transparent_27px,oklch(0.3_0.03_60/0.18)_28px)] text-lg leading-7 outline-none placeholder:opacity-35"
          />
        </div>
        <div className="paper-surface rounded-r-[3px] p-8">
          <h2 className="plate-type text-lg uppercase tracking-[0.15em]">Marginalia</h2>
          <p className="hand mt-1 text-sm opacity-55">notes tucked inside your books</p>
          <div className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
            {noted.length === 0 && <p className="hand text-base opacity-50">no notes written yet.</p>}
            {noted.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenSong(s)}
                className="block w-full border-b border-ink/15 pb-2 text-left transition-opacity hover:opacity-70"
                style={{ transform: `rotate(${i % 2 ? 0.2 : -0.3}deg)` }}
              >
                <span className="hand block text-lg leading-tight">“{s.notes}”</span>
                <span className="block text-xs opacity-60">
                  — {s.title}, {s.artist}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="plate-type mt-6 text-[11px] uppercase tracking-widest opacity-70 hover:opacity-100"
          >
            ← leave the desk
          </button>
        </div>
      </div>
    </Overlay>
  );
}
