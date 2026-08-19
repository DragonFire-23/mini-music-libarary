import type { Song } from "@/lib/library";

export function BookSpine({
  song,
  onClick,
  scale = 1,
  isNew = false,
}: {
  song: Song;
  onClick: () => void;
  scale?: number;
  isNew?: boolean;
}) {
  const s = song.spine;
  const base = `oklch(${s.light.toFixed(3)} ${s.sat.toFixed(3)} ${s.hue})`;
  const dark = `oklch(${Math.max(0.1, s.light - 0.1).toFixed(3)} ${s.sat.toFixed(3)} ${s.hue})`;
  const light = `oklch(${(s.light + 0.08).toFixed(3)} ${s.sat.toFixed(3)} ${s.hue})`;

  const texture =
    s.texture === "ribbed"
      ? `repeating-linear-gradient(180deg, oklch(0 0 0/0.22) 0 2px, transparent 2px 11px), `
      : s.texture === "worn"
        ? `radial-gradient(circle at 30% 80%, oklch(0.95 0.03 85/0.16), transparent 55%), `
        : s.texture === "gilt"
          ? `linear-gradient(90deg, transparent 12%, oklch(0.85 0.11 84/0.35) 14%, transparent 17%), `
          : "";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${song.title} — ${song.artist}`}
      className={`group relative shrink-0 origin-bottom cursor-pointer rounded-[2px] transition-[transform,filter] duration-300 ease-out hover:-translate-y-2 hover:rotate-0 hover:brightness-125 ${
        isNew ? "animate-slot-in" : ""
      }`}
      style={{
        width: s.width * scale,
        height: `${s.height * 100}%`,
        transform: `rotate(${s.tilt}deg)`,
        backgroundImage: `${texture}linear-gradient(90deg, ${dark}, ${base} 38%, ${light} 62%, ${dark})`,
        boxShadow: "2px 0 4px -1px oklch(0 0 0/0.6), inset 0 -6px 10px -6px oklch(0 0 0/0.8)",
      }}
    >
      <span
        className={`absolute inset-x-0 bottom-3 top-3 flex items-center justify-center overflow-hidden ${
          s.label === "hand" ? "hand" : s.label === "plate" ? "plate-type" : ""
        }`}
        style={{ writingMode: "vertical-rl" }}
      >
        <span
          className="max-h-full truncate px-[1px] text-[10px] tracking-wide text-parchment/75"
          style={s.label === "plate" ? { color: "oklch(0.85 0.11 84 / 0.9)" } : undefined}
        >
          {song.title}
        </span>
      </span>

      {s.label === "plate" && (
        <span className="absolute left-1/2 top-1.5 h-1.5 w-3 -translate-x-1/2 rounded-[1px] bg-amber/60" />
      )}
      {s.bookmark && (
        <span className="absolute -top-3 left-1/2 h-4 w-1.5 -translate-x-1/2 rounded-b-[1px] bg-destructive/80" />
      )}

      <span className="pointer-events-none absolute bottom-[105%] left-1/2 z-30 w-max max-w-56 -translate-x-1/2 translate-y-1 scale-95 rounded-[2px] paper-surface px-2.5 py-1 text-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <span className="block text-sm leading-tight font-medium">{song.title}</span>
        <span className="hand block text-xs leading-tight opacity-75">{song.artist}</span>
      </span>
    </button>
  );
}
