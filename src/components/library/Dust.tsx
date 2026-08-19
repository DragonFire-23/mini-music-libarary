import { useEffect, useMemo, useState } from "react";

export function Dust({
  count = 26,
  className = "",
  opacity = 0.5,
}: {
  count?: number;
  className?: string;
  opacity?: number;
}) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin((i + 1) * 12.9898 * (n + 1)) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          left: r(1) * 100,
          top: 20 + r(2) * 80,
          size: 1 + r(3) * 2.2,
          delay: r(4) * 14,
          dur: 11 + r(5) * 13,
          dx: (r(6) - 0.5) * 46,
        };
      }),
    [count],
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-dust"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            filter: "blur(0.4px)",
            animation: `drift-up ${m.dur}s linear ${m.delay}s infinite`,
            ["--dx" as string]: `${m.dx}px`,
            ["--dust-opacity" as string]: opacity,
          }}
        />
      ))}
    </div>
  );
}
