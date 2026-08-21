import { useMemo } from "react";
import type { Prefs } from "@/lib/library";

const order: Prefs["weather"][] = ["rain", "night", "cloudy", "stars"];

export function nextWeather(w: Prefs["weather"]): Prefs["weather"] {
  return order[(order.indexOf(w) + 1) % order.length]!;
}

export function WindowPane({
  weather,
  onClick,
}: {
  weather: Prefs["weather"];
  onClick: () => void;
}) {
  const drops = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: ((i * 37) % 100) + Math.sin(i) * 2,
        delay: (i % 11) * 0.31,
        dur: 0.9 + ((i * 13) % 7) / 10,
        h: 8 + ((i * 7) % 14),
      })),
    [],
  );
  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: ((i * 53) % 96) + 2,
        top: ((i * 29) % 80) + 4,
        delay: (i % 9) * 0.7,
        s: i % 5 === 0 ? 2.4 : 1.4,
      })),
    [],
  );

  const sky: Record<Prefs["weather"], string> = {
    rain: "linear-gradient(180deg, oklch(0.32 0.03 250), oklch(0.22 0.025 250))",
    night: "linear-gradient(180deg, oklch(0.26 0.05 265), oklch(0.15 0.03 265))",
    cloudy: "linear-gradient(180deg, oklch(0.44 0.02 250), oklch(0.31 0.02 250))",
    stars: "linear-gradient(180deg, oklch(0.2 0.045 275), oklch(0.11 0.03 270))",
  };

  return (
    <div className="group relative w-full">
      {/* Opaque wood casing set into the wall — keeps the sky contained */}
      <div
        className="relative w-full overflow-hidden rounded-t-[46%] bg-wood-deep p-[10px] shadow-[var(--shadow-shelf)]"
        style={{ aspectRatio: "3 / 4" }}
      >
        <button
          type="button"
          onClick={onClick}
          title="the window"
          className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-t-[44%] border-[6px] border-wood-light transition-transform duration-500 hover:brightness-110"
        >
          {/* the glass — everything inside is clipped to this pane */}
          <div className="absolute inset-0" style={{ background: sky[weather] }} />

          {weather === "rain" &&
            drops.map((d, i) => (
              <span
                key={i}
                className="pointer-events-none absolute top-0 w-px"
                style={{
                  left: `${d.left}%`,
                  height: "100%",
                  animation: `rain-fall ${d.dur}s linear ${d.delay}s infinite`,
                }}
              >
                <span
                  className="block w-px bg-parchment/35"
                  style={{ height: d.h }}
                />
              </span>
            ))}

          {weather === "stars" &&
            stars.map((s, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-parchment"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.s,
                  height: s.s,
                  animation: `twinkle ${3 + (i % 5)}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}

          {weather === "night" && (
            // contained glow — inset so light stays inside the pane
            <div
              className="absolute right-[18%] top-[12%] h-9 w-9 rounded-full bg-parchment/85"
              style={{ boxShadow: "0 0 22px 8px oklch(0.9 0.05 85 / 0.45)" }}
            />
          )}

          {weather === "cloudy" && (
            <>
              <div className="absolute left-[-20%] top-[22%] h-10 w-[80%] rounded-full bg-parchment/12 blur-md" />
              <div className="absolute left-[10%] top-[46%] h-8 w-[75%] rounded-full bg-parchment/10 blur-md" />
            </>
          )}

          {/* muntins */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-full w-[5px] -translate-x-1/2 bg-wood-light" />
            <div className="absolute left-0 top-1/2 h-[5px] w-full -translate-y-1/2 bg-wood-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.08),transparent_60%)]" />
          </div>
        </button>
      </div>

      {/* Solid sill — the clear boundary between window and room wall */}
      <div className="relative -mt-[14px] h-5 w-[112%] -translate-x-[6%] rounded-b-sm bg-wood-light shadow-[0_6px_10px_-4px_oklch(0_0_0/0.85)]">
        <div className="absolute inset-x-1 top-[2px] h-[3px] rounded-full bg-wood-deep/40" />
      </div>

      <span className="hand pointer-events-none mt-1 block text-center text-xs lowercase text-parchment-dim/50 transition-colors duration-300 group-hover:text-parchment/70">
        {weather}
      </span>
    </div>
  );
}
