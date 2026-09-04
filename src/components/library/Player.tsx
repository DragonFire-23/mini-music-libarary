import { useEffect, useMemo, useRef, useState } from "react";
import type { Song } from "@/lib/library";
import { MusicBox } from "@/lib/audio";
import { findTrackPreview } from "@/lib/track-preview";
import { getAudio } from "@/lib/audio-store";
import { classifySource } from "@/lib/source";
import { VolumeKnob } from "./VolumeKnob";

export function Player({
  song,
  playing,
  onToggle,
  onClose,
  volume,
  onVolume,
}: {
  song: Song;
  playing: boolean;
  onToggle: () => void;
  onClose: () => void;
  volume: number;
  onVolume: (v: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [fileTotal, setFileTotal] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [looking, setLooking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const source = useMemo(() => classifySource(song.url || ""), [song.url]);
  const [hasDownload, setHasDownload] = useState(false);
  // the service's own player is only used when there is no downloaded file
  const embed = source.kind === "embed" && !hasDownload && !looking ? source : null;

  // resolve the best complete source we are actually allowed to play.
  // a downloaded file the user brought in ALWAYS wins over any external link.
  useEffect(() => {
    let dead = false;
    let objectUrl: string | null = null;
    let ac: AbortController | null = null;
    setSrc(null);
    setIsPreview(false);
    setElapsed(0);
    setFileTotal(0);
    setLooking(true);

    getAudio(song.id)
      .then((blob) => {
        if (dead) return;
        if (blob) {
          setHasDownload(true);
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
          return;
        }
        setHasDownload(false);
        // no downloaded copy — fall back to whatever the saved url offers
        if (source.kind === "file") {
          setSrc(song.url);
          return;
        }
        if (source.kind === "embed") return; // the embed below takes over
        // only a webpage (or nothing) — the catalogue's short preview,
        // said plainly rather than passed off as the whole song
        ac = new AbortController();
        findTrackPreview(song.title, song.artist, ac.signal).then((r) => {
          if (dead || !r?.previewUrl) return;
          setSrc(r.previewUrl);
          setIsPreview(true);
        });
      })
      .finally(() => !dead && setLooking(false));

    return () => {
      dead = true;
      ac?.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [song.id, song.url, song.title, song.artist, source.kind]);

  const hasFile = Boolean(src);

  // real audio — play it for real
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !hasFile) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing, hasFile, src]);

  // nothing findable and nothing embeddable — the room hums a seeded melody
  const boxRef = useRef<MusicBox | null>(null);
  useEffect(() => {
    if (hasFile || embed || looking || !playing) return;
    const box = new MusicBox();
    boxRef.current = box;
    box.start(song.id + song.title, volumeRef.current * 0.3);
    return () => {
      box.stop();
      boxRef.current = null;
    };
  }, [playing, hasFile, embed, looking, song.id, song.title]);

  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) audioRef.current.volume = volume;
    boxRef.current?.setVolume(volume * 0.3);
  }, [volume]);

  useEffect(() => {
    if (!playing || hasFile || embed) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [playing, hasFile, embed]);

  const total = (hasFile && fileTotal) || parseDuration(song.duration) || 222;
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;

  const seek = (t: number) => {
    const el = audioRef.current;
    setElapsed(Math.max(0, Math.min(total, Math.floor(t))));
    if (el && hasFile) el.currentTime = Math.max(0, Math.min(total, t));
  };

  return (
    <div
      className="animate-soft-in pointer-events-auto w-[380px] rounded-[4px] wood-surface p-5"
      style={{ boxShadow: "var(--shadow-shelf)" }}
    >
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadStart={(e) => {
            e.currentTarget.volume = volume;
          }}
          onTimeUpdate={(e) => setElapsed(Math.floor(e.currentTarget.currentTime))}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            setFileTotal(Number.isFinite(d) ? Math.floor(d) : 0);
          }}
          onDurationChange={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setFileTotal(Math.floor(d));
          }}
          onEnded={onToggle}
          onError={() => setSrc(null)}
        />
      )}

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <div
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.2_0.02_60)_18%,oklch(0.13_0.01_60)_19%,oklch(0.17_0.015_60)_60%,oklch(0.12_0.01_60))]"
            style={{ animation: playing ? "spin-record 3.6s linear infinite" : undefined }}
          >
            <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/80" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg leading-tight text-parchment">{song.title}</p>
          <p className="hand truncate text-base leading-tight text-parchment-dim/70">{song.artist}</p>
        </div>
        {!embed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "pause" : "play"}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber/50 text-amber transition-colors hover:bg-amber/15"
          >
            {playing ? (
              <span className="flex gap-1">
                <span className="block h-4 w-1 bg-current" />
                <span className="block h-4 w-1 bg-current" />
              </span>
            ) : (
              <span className="ml-1 block h-0 w-0 border-y-[9px] border-l-[13px] border-y-transparent border-l-current" />
            )}
          </button>
        )}
      </div>

      {embed ? (
        <div className="mt-3">
          <iframe
            title={`${embed.label} player — ${song.title}`}
            src={embed.embedUrl}
            className="w-full rounded-[2px] border-0"
            height={embed.service === "spotify" ? 152 : 150}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            loading="lazy"
          />
          <p className="hand mt-1.5 text-xs leading-snug text-parchment-dim/60">
            {embed.label} only lets a webpage play the full track through its own player — use the
            controls above.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <VolumeKnob
              value={volume}
              onChange={onVolume}
              label="record volume"
              size={38}
              muted={volume === 0}
              onToggleMute={() => onVolume(volume === 0 ? 0.7 : 0)}
            />
            <span className="plate-type text-[10px] uppercase tracking-widest text-parchment-dim/50">
              volume
            </span>
            <button
              type="button"
              onClick={() => seek(0)}
              className="hand ml-auto cursor-pointer text-xs text-parchment-dim/60 hover:text-parchment"
            >
              start over
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(1, total)}
            step={1}
            value={Math.min(elapsed, total)}
            disabled={!hasFile}
            aria-label="seek"
            onChange={(e) => seek(Number(e.target.value))}
            className="mt-3 h-[3px] w-full cursor-pointer appearance-none rounded-full bg-wood-deep/70 accent-amber disabled:cursor-default"
            style={{
              backgroundImage: `linear-gradient(to right, oklch(0.79 0.14 72/0.7) ${pct}%, transparent ${pct}%)`,
            }}
          />

          <div className="mt-1 flex items-center justify-between text-[10px] text-parchment-dim/60">
            <span>{fmt(elapsed)}</span>
            <div className="flex items-center gap-3">
              {song.url && source.kind !== "local" && (
                <a
                  href={song.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hand text-xs hover:text-parchment"
                >
                  open link
                </a>
              )}
              <button type="button" onClick={onClose} className="hand text-xs hover:text-parchment">
                lift needle
              </button>
            </div>
            <span>{hasFile ? fmt(total) : song.duration || fmt(total)}</span>
          </div>

          {isPreview && (
            <p className="hand mt-1.5 text-xs leading-snug text-parchment-dim/60">
              this is only a 30-second catalogue preview — add the full audio file, or a Spotify /
              YouTube link, to hear the whole song.
            </p>
          )}
          {!hasFile && !looking && (
            <p className="hand mt-1.5 text-xs leading-snug text-parchment-dim/60">
              no playable audio for this one yet — the room hums instead.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function parseDuration(d?: string) {
  if (!d) return 0;
  const [m, s] = d.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(m as number)) return 0;
  return (m || 0) * 60 + (s || 0);
}
