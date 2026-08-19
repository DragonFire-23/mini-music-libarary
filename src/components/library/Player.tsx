import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/library";
import { MusicBox, isAudioFile } from "@/lib/audio";
import { findTrackPreview } from "@/lib/track-preview";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ownFile = isAudioFile(song.url || "");

  // find the real recording for this title + artist
  useEffect(() => {
    if (ownFile) return;
    const ac = new AbortController();
    setPreviewUrl(null);
    setFailed(false);
    setLooking(true);
    findTrackPreview(song.title, song.artist, ac.signal)
      .then((r) => setPreviewUrl(r?.previewUrl ?? null))
      .finally(() => setLooking(false));
    return () => ac.abort();
  }, [song.title, song.artist, ownFile]);

  const src = failed ? null : ownFile ? song.url : previewUrl;
  const hasFile = Boolean(src);

  useEffect(() => {
    setElapsed(0);
    setFileTotal(0);
  }, [song.id]);

  // real audio — play it for real
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !hasFile) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing, hasFile, src]);

  // nothing findable — the room hums a seeded music-box melody instead
  const boxRef = useRef<MusicBox | null>(null);
  useEffect(() => {
    if (hasFile || looking || !playing) return;
    const box = new MusicBox();
    boxRef.current = box;
    box.start(song.id + song.title, volumeRef.current * 0.3);
    return () => {
      box.stop();
      boxRef.current = null;
    };
  }, [playing, hasFile, looking, song.id, song.title]);

  // keep both sound sources at the chosen level
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) audioRef.current.volume = volume;
    boxRef.current?.setVolume(volume * 0.3);
  }, [volume]);

  useEffect(() => {
    if (!playing || hasFile) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [playing, hasFile]);

  const total = (hasFile && fileTotal) || parseDuration(song.duration) || 222;
  const pct = Math.min(100, (elapsed / total) * 100);

  return (
    <div
      className="animate-soft-in pointer-events-auto w-[290px] rounded-[3px] wood-surface p-3.5"
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
          onLoadedMetadata={(e) => setFileTotal(Math.floor(e.currentTarget.duration) || 0)}
          onEnded={onToggle}
          onError={() => setFailed(true)}
        />
      )}


      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <div
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.2_0.02_60)_18%,oklch(0.13_0.01_60)_19%,oklch(0.17_0.015_60)_60%,oklch(0.12_0.01_60))]"
            style={{ animation: playing ? "spin-record 3.6s linear infinite" : undefined }}
          >
            <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/80" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-tight text-parchment">{song.title}</p>
          <p className="hand truncate text-sm leading-tight text-parchment-dim/70">{song.artist}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "pause" : "play"}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber/50 text-amber transition-colors hover:bg-amber/15"
        >
          {playing ? (
            <span className="flex gap-[3px]">
              <span className="block h-3.5 w-[3px] bg-current" />
              <span className="block h-3.5 w-[3px] bg-current" />
            </span>
          ) : (
            <span className="ml-[3px] block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <VolumeKnob
          value={volume}
          onChange={onVolume}
          label="record volume"
          size={30}
          muted={volume === 0}
          onToggleMute={() => onVolume(volume === 0 ? 0.7 : 0)}
        />
        <span className="plate-type text-[9px] uppercase tracking-widest text-parchment-dim/50">volume</span>
      </div>

      <div className="mt-3 h-[3px] w-full rounded-full bg-wood-deep/70">
        <div
          className="h-full rounded-full bg-amber/70 transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-parchment-dim/60">
        <span>{fmt(elapsed)}</span>
        <div className="flex items-center gap-3">

          {song.url && (
            <a href={song.url} target="_blank" rel="noreferrer" className="hand text-xs hover:text-parchment">
              open link
            </a>
          )}
          <button type="button" onClick={onClose} className="hand text-xs hover:text-parchment">
            lift needle
          </button>
        </div>
        <span>{hasFile ? fmt(total) : song.duration || fmt(total)}</span>
      </div>
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
