import { useCallback, useEffect, useRef } from "react";

/**
 * A little brass knob. Drag up/down (or use arrow keys) to turn it.
 */
export function VolumeKnob({
  value,
  onChange,
  label,
  size = 34,
  muted = false,
  onToggleMute,
}: {
  value: number; // 0..1
  onChange: (v: number) => void;
  label: string;
  size?: number;
  muted?: boolean;
  onToggleMute?: () => void;
}) {
  const dragging = useRef(false);
  const start = useRef({ y: 0, v: 0 });

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const dy = start.current.y - e.clientY;
      onChange(clamp(start.current.v + dy / 120));
    },
    [onChange],
  );

  useEffect(() => {
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", up);
    };
  }, [onMove]);

  const shown = muted ? 0 : value;
  const angle = -135 + shown * 270;

  return (
    <div className="flex items-center gap-2">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown * 100)}
        onPointerDown={(e) => {
          dragging.current = true;
          start.current = { y: e.clientY, v: value };
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(clamp(value + 0.05));
          }
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            onChange(clamp(value - 0.05));
          }
        }}
        onDoubleClick={onToggleMute}
        style={{ width: size, height: size }}
        className="relative shrink-0 cursor-ns-resize touch-none rounded-full outline-none ring-amber/40 focus-visible:ring-2"
        title={`${label} — drag to turn`}
      >
        <span
          className="absolute inset-0 rounded-full border border-amber/35 bg-[radial-gradient(circle_at_35%_28%,oklch(0.62_0.09_78),oklch(0.36_0.06_66)_62%,oklch(0.22_0.03_60))]"
          style={{ boxShadow: "0 2px 5px oklch(0 0 0/0.55), inset 0 1px 1px oklch(0.85 0.08 80/0.35)" }}
        />
        <span
          className="absolute inset-0 transition-transform duration-150"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute left-1/2 top-[13%] h-[28%] w-[2px] -translate-x-1/2 rounded-full bg-parchment/85" />
        </span>
        {muted && (
          <span className="absolute inset-0 rounded-full bg-wood-deep/55" />
        )}
      </div>
      {onToggleMute && (
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? `unmute ${label}` : `mute ${label}`}
          className="hand cursor-pointer text-xs text-parchment-dim/60 transition-colors hover:text-parchment"
        >
          {muted ? "muted" : "mute"}
        </button>
      )}
    </div>
  );
}
