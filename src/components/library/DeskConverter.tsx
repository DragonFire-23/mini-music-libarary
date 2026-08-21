import { useState } from "react";
import { makeSpine, type Song } from "@/lib/library";
import { findTrackPreview } from "@/lib/track-preview";
import { Overlay } from "./SongBook";

type Found = {
  videoId: string;
  title: string;
  artist: string;
  thumb: string;
  previewUrl: string;
  artwork: string;
};

const FORMATS = ["mp3 · 320kbps", "mp3 · 192kbps", "m4a · 256kbps"];

function videoIdFrom(link: string): string | null {
  const s = link.trim();
  const m =
    s.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ??
    s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ??
    s.match(/\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/);
  if (m?.[1]) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

function splitTitle(raw: string, author: string) {
  const clean = raw
    .replace(/\((?:official|official\s+\w+|lyrics?|audio|video|hd|4k)[^)]*\)/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .trim();
  const parts = clean.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0]!.trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: author.replace(/\s*-\s*Topic$/i, "").trim(), title: clean };
}

export function DeskConverter({
  onAdd,
  onOpenNotes,
  onClose,
}: {
  onAdd: (song: Song) => void;
  onOpenNotes: () => void;
  onClose: () => void;
}) {
  const [link, setLink] = useState("");
  const [format, setFormat] = useState(FORMATS[0]!);
  const [status, setStatus] = useState<"idle" | "looking" | "ready" | "working" | "done">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState<Found | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const lookup = async () => {
    const id = videoIdFrom(link);
    setError("");
    setFound(null);
    setStatus("looking");
    if (!id) {
      setStatus("idle");
      setError("that doesn't look like a YouTube or YouTube Music link.");
      return;
    }
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${id}`,
        )}`,
      );
      if (!res.ok) throw new Error("not found");
      const meta = (await res.json()) as { title?: string; author_name?: string };
      const { artist, title } = splitTitle(meta.title ?? id, meta.author_name ?? "");
      const preview = await findTrackPreview(title, artist);
      if (!preview) {
        setStatus("idle");
        setError("found the video, but no playable copy of that recording exists here.");
        return;
      }
      setFound({
        videoId: id,
        title: preview.trackName || title,
        artist: preview.artistName || artist,
        thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        previewUrl: preview.previewUrl,
        artwork: preview.artwork,
      });
      setStatus("ready");
    } catch {
      setStatus("idle");
      setError("couldn't reach that link. check it and try again.");
    }
  };

  const download = () => {
    if (!found) return;
    setStatus("working");
    setProgress(0);
    setLog([]);
    const steps = ["fetching stream…", `converting to ${format}…`, "writing tags…", "binding the book…"];
    let i = 0;
    const tick = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 7 + Math.random() * 11);
        const stage = Math.min(steps.length - 1, Math.floor((next / 100) * steps.length));
        if (stage >= i) {
          i = stage + 1;
          setLog((l) => (l.includes(steps[stage]!) ? l : [...l, steps[stage]!]));
        }
        if (next >= 100) {
          clearInterval(tick);
          onAdd({
            id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: found.title,
            artist: found.artist,
            album: "",
            artwork: found.artwork,
            url: found.previewUrl,
            notes: "",
            moods: [],
            tags: ["downloaded"],
            collectionId: "unknown",
            dateAdded: new Date().toISOString(),
            spine: makeSpine(),
          });
          setStatus("done");
        }
        return next;
      });
    }, 220);
  };

  return (
    <Overlay onClose={onClose}>
      <div
        className="animate-book-open mx-auto w-full max-w-2xl paper-surface rounded-[3px] p-8"
        style={{ transform: "rotate(-0.25deg)" }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="plate-type text-lg uppercase tracking-[0.15em]">The conversion desk</h2>
            <p className="hand mt-1 text-sm opacity-55">
              paste a YouTube or YouTube Music link and pull it down as a book
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNotes}
            className="plate-type text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100"
          >
            commonplace book →
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[3px] border border-ink/20 bg-ink/5 p-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="https://music.youtube.com/watch?v=…"
            className="hand min-w-[14rem] flex-1 bg-transparent px-2 text-lg outline-none placeholder:opacity-35"
          />
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="plate-type rounded-[2px] border border-ink/20 bg-transparent px-2 py-1.5 text-[10px] uppercase tracking-widest outline-none"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={lookup}
            disabled={status === "looking"}
            className="plate-type cursor-pointer rounded-[2px] border border-ink/30 bg-ink/10 px-4 py-1.5 text-[10px] uppercase tracking-widest hover:bg-ink/20 disabled:opacity-40"
          >
            {status === "looking" ? "searching…" : "convert"}
          </button>
        </div>

        {error && <p className="hand mt-3 text-base text-[oklch(0.45_0.13_28)]">{error}</p>}

        {found && (
          <div className="mt-6 flex gap-4 border-t border-ink/15 pt-5">
            <img
              src={found.artwork || found.thumb}
              alt={`${found.title} artwork`}
              className="h-20 w-20 shrink-0 rounded-[2px] object-cover"
              style={{ boxShadow: "0 6px 14px -8px oklch(0 0 0/0.8)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="hand truncate text-xl leading-tight">{found.title}</p>
              <p className="text-xs opacity-60">{found.artist}</p>

              {status === "ready" && (
                <button
                  type="button"
                  onClick={download}
                  className="plate-type mt-3 cursor-pointer rounded-[2px] border border-ink/30 bg-ink/10 px-4 py-1.5 text-[10px] uppercase tracking-widest hover:bg-ink/20"
                >
                  download {format.split(" ")[0]}
                </button>
              )}

              {(status === "working" || status === "done") && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink/15">
                    <div
                      className="h-full rounded-full bg-[oklch(0.55_0.11_60)] transition-[width] duration-200"
                      style={{ width: `${Math.round(progress)}%` }}
                    />
                  </div>
                  <ul className="hand mt-2 space-y-0.5 text-sm opacity-60">
                    {log.map((l) => (
                      <li key={l}>· {l}</li>
                    ))}
                    {status === "done" && <li>· shelved with the songs you haven't figured out yet.</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="plate-type text-[11px] uppercase tracking-widest opacity-70 hover:opacity-100"
          >
            ← leave the desk
          </button>
          <span className="hand text-sm opacity-40">
            what lands on the shelf is the licensed preview of the recording
          </span>
        </div>
      </div>
    </Overlay>
  );
}
