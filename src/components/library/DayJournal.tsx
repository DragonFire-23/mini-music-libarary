import { useMemo, useState } from "react";
import { Overlay } from "./SongBook";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** little book spines arranged around the rim of the calendar */
function RimBooks() {
  const books = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const r = Math.sin(i * 92.7) * 0.5 + 0.5;
        return {
          h: 12 + Math.round(r * 12),
          w: 4 + Math.round(r * 4),
          hue: [28, 45, 18, 104, 148, 212, 350, 72][i % 8]!,
          tilt: (r - 0.5) * 12,
        };
      }),
    [],
  );
  const side = (from: number, to: number, cls: string, vertical: boolean) => (
    <div
      className={`pointer-events-none absolute flex items-end gap-[3px] ${cls}`}
      style={vertical ? { flexDirection: "column", alignItems: "flex-end" } : undefined}
    >
      {books.slice(from, to).map((b, i) => (
        <span
          key={i}
          className="block rounded-[1px]"
          style={{
            width: vertical ? `${b.h}px` : `${b.w}px`,
            height: vertical ? `${b.w}px` : `${b.h}px`,
            background: `oklch(${0.36 + (i % 3) * 0.05} 0.08 ${b.hue})`,
            boxShadow: "inset 0 0 3px oklch(0 0 0/0.5)",
            transform: vertical ? undefined : `rotate(${b.tilt}deg)`,
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {side(0, 10, "-top-[24px] left-6 right-6 justify-center", false)}
      {side(10, 20, "-bottom-[24px] left-6 right-6 justify-center", false)}
      {side(20, 27, "-left-[24px] top-8 bottom-8 justify-center", true)}
      {side(27, 34, "-right-[24px] top-8 bottom-8 justify-center", true)}
    </>
  );
}

export function DayJournal({
  entries,
  onChange,
  onClose,
}: {
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  onClose: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(key(today));

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const pad = first.getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: pad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];

  const selDate = new Date(`${selected}T12:00:00`);
  const text = entries[selected] ?? "";

  return (
    <Overlay onClose={onClose}>
      <div className="animate-book-open mx-auto grid w-full max-w-4xl grid-cols-1 gap-10 md:grid-cols-[1.05fr_1fr]">
        {/* calendar with books around the rim */}
        <div className="relative">
          <RimBooks />
          <div className="paper-surface rounded-[3px] p-7" style={{ transform: "rotate(-0.4deg)" }}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="plate-type px-1 text-sm opacity-60 hover:opacity-100"
              >
                ←
              </button>
              <h2 className="plate-type text-base uppercase tracking-[0.18em]">
                {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="plate-type px-1 text-sm opacity-60 hover:opacity-100"
              >
                →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {DAYS.map((d, i) => (
                <span key={i} className="plate-type text-[10px] uppercase tracking-wider opacity-50">
                  {d}
                </span>
              ))}
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const k = key(d);
                const isToday = k === key(today);
                const isSel = k === selected;
                const written = Boolean(entries[k]?.trim());
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(k)}
                    className={`hand relative aspect-square rounded-[2px] text-lg leading-none transition-colors ${
                      isSel ? "bg-ink/15" : "hover:bg-ink/8"
                    } ${isToday ? "ring-1 ring-ink/60" : ""}`}
                  >
                    <span className={isToday ? "" : "opacity-80"}>{d.getDate()}</span>
                    {written && (
                      <span className="absolute bottom-1 left-1/2 h-[3px] w-3 -translate-x-1/2 rounded-full bg-ink/45" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="hand mt-4 text-sm opacity-55">
              today is {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* the day's page */}
        <div className="paper-surface rounded-[3px] p-7" style={{ transform: "rotate(0.3deg)" }}>
          <h2 className="plate-type text-lg uppercase tracking-[0.15em]">
            {selDate.toLocaleDateString(undefined, { weekday: "long" })}
          </h2>
          <p className="hand mt-1 text-sm opacity-55">
            {selDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <textarea
            value={text}
            onChange={(e) => onChange({ ...entries, [selected]: e.target.value })}
            rows={13}
            placeholder="what today sounded like…"
            className="hand mt-4 w-full resize-none bg-[repeating-linear-gradient(transparent,transparent_27px,oklch(0.3_0.03_60/0.18)_28px)] text-lg leading-7 outline-none placeholder:opacity-35"
          />
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="plate-type text-[11px] uppercase tracking-widest opacity-70 hover:opacity-100"
            >
              ← close the calendar
            </button>
            <span className="hand text-sm opacity-45">
              {Object.values(entries).filter((v) => v.trim()).length} days written
            </span>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
