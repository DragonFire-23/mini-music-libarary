import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addedThisWeek,
  defaultCollections,
  loadLibrary,
  saveLibrary,
  type LibraryData,
  type Song,
} from "@/lib/library";
import { Dust } from "@/components/library/Dust";
import { WindowPane, nextWeather } from "@/components/library/WindowPane";
import { Shelf } from "@/components/library/Shelf";
import { SongBook } from "@/components/library/SongBook";
import { CollectionPanel } from "@/components/library/CollectionPanel";
import { CatalogCard } from "@/components/library/CatalogCard";
import { CatalogDrawer } from "@/components/library/CatalogDrawer";
import { DeskNotes } from "@/components/library/DeskNotes";
import { Player } from "@/components/library/Player";
import { VolumeKnob } from "@/components/library/VolumeKnob";
import { ClockTick, RainAmbience } from "@/lib/audio";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Little Music Library — a cozy room for your songs" },
      {
        name: "description",
        content:
          "A small, lamplit library where every song you save becomes a book on the shelf. Notes, moods, collections and a quiet record player.",
      },
      { property: "og:title", content: "The Little Music Library" },
      {
        property: "og:description",
        content: "Step into a warm wooden room where your music collection is shelved as books.",
      },
    ],
  }),
  component: Index,
});

type PanelState =
  | { kind: "none" }
  | { kind: "song"; id: string }
  | { kind: "collection"; id: string }
  | { kind: "add" }
  | { kind: "notes" };

function Index() {
  const [data, setData] = useState<LibraryData>(() => ({
    songs: [],
    collections: defaultCollections,
    prefs: { lampOn: true, weather: "rain" },
  }));
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<PanelState>({ kind: "none" });
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [newSongId, setNewSongId] = useState<string | null>(null);
  const whisperTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(loadLibrary());
    setReady(true);
  }, []);

  // browsers need a gesture before any sound is allowed
  const [gestured, setGestured] = useState(false);
  useEffect(() => {
    if (gestured) return;
    const on = () => setGestured(true);
    window.addEventListener("pointerdown", on, { once: true });
    window.addEventListener("keydown", on, { once: true });
    return () => {
      window.removeEventListener("pointerdown", on);
      window.removeEventListener("keydown", on);
    };
  }, [gestured]);

  const rainVolume = data.prefs.rainVolume ?? 0.5;
  const rainMuted = data.prefs.rainMuted ?? false;
  const musicVolume = data.prefs.musicVolume ?? 0.7;
  const rainLevel = rainMuted ? 0 : rainVolume * (playing ? 0.12 : 0.28);

  // rain against the window, softened while a record is on
  const rainRef = useRef<RainAmbience | null>(null);
  useEffect(() => {
    if (!gestured || data.prefs.weather !== "rain") return;
    const rain = new RainAmbience();
    rainRef.current = rain;
    rain.start(rainLevelRef.current);
    return () => {
      rain.stop();
      rainRef.current = null;
    };
  }, [gestured, data.prefs.weather]);

  const rainLevelRef = useRef(rainLevel);
  useEffect(() => {
    rainLevelRef.current = rainLevel;
    rainRef.current?.setVolume(rainLevel);
  }, [rainLevel]);

  // the clock keeps time only when the room is otherwise quiet
  useEffect(() => {
    if (!gestured || playing) return;
    const clock = new ClockTick();
    clock.start(0.16);
    return () => clock.stop();
  }, [gestured, playing]);


  const setRainVolume = (v: number) =>
    setData((d) => ({ ...d, prefs: { ...d.prefs, rainVolume: v, rainMuted: v === 0 ? (d.prefs.rainMuted ?? false) : false } }));
  const toggleRainMute = () => setData((d) => ({ ...d, prefs: { ...d.prefs, rainMuted: !(d.prefs.rainMuted ?? false) } }));
  const setMusicVolume = (v: number) => setData((d) => ({ ...d, prefs: { ...d.prefs, musicVolume: v } }));

  useEffect(() => {
    if (ready) saveLibrary(data);
  }, [data, ready]);


  const say = (msg: string) => {
    setWhisper(msg);
    if (whisperTimer.current) clearTimeout(whisperTimer.current);
    whisperTimer.current = setTimeout(() => setWhisper(null), 3200);
  };

  const songsFor = (id: string) => data.songs.filter((s) => s.collectionId === id);
  const currentSong = data.songs.find((s) => s.id === nowPlaying) ?? null;
  const weekly = addedThisWeek(data.songs);

  const ordinary = data.collections.filter((c) => !c.special);
  const special = data.collections.filter((c) => c.special);

  const updateSong = (s: Song) =>
    setData((d) => ({ ...d, songs: d.songs.map((x) => (x.id === s.id ? s : x)) }));

  const addSong = (s: Song) => {
    setData((d) => ({ ...d, songs: [...d.songs, s] }));
    setPanel({ kind: "none" });
    setNewSongId(s.id);
    say(`“${s.title}” shelved.`);
    setTimeout(() => setNewSongId(null), 1200);
  };

  const removeSong = (id: string) => {
    setData((d) => ({ ...d, songs: d.songs.filter((s) => s.id !== id) }));
    setPanel({ kind: "none" });
    if (nowPlaying === id) setNowPlaying(null);
    say("book returned to the dust.");
  };

  const addCollection = () => {
    const id = `c-${Date.now()}`;
    setData((d) => ({
      ...d,
      collections: [
        ...d.collections.filter((c) => !c.special),
        { id, name: "New shelf", blurb: "still smells of sawdust." },
        ...d.collections.filter((c) => c.special),
      ],
    }));
    setPanel({ kind: "collection", id });
  };

  const lamp = data.prefs.lampOn;

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 62% 18%, oklch(0.26 0.035 58) 0%, oklch(0.17 0.024 52) 46%, oklch(0.11 0.016 48) 100%)",
      }}
    >
      {/* wall panelling */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, oklch(0 0 0/0.28) 0 1px, transparent 1px 92px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 vignette" />
      {/* floor */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[22vh]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(88deg, oklch(0 0 0/0.35) 0 2px, transparent 2px 74px), linear-gradient(180deg, oklch(0.22 0.03 52), oklch(0.14 0.02 48))",
        }}
      />

      <h1 className="sr-only">The Little Music Library</h1>

      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:px-12">
        {/* ---------------- left: the bookcase wall ---------------- */}
        <section className="relative">
          <header className="mb-5 flex items-end justify-between">
            <div>
              <p className="plate-type text-[11px] uppercase tracking-[0.35em] text-parchment-dim/60">
                the little
              </p>
              <p className="hand -mt-1 text-4xl text-parchment">Music Library</p>
            </div>
            <p className="hand max-w-[13rem] text-right text-sm leading-tight text-parchment-dim/60">
              {data.songs.length} books on the shelves
              {weekly > 0 && ` · ${weekly} added this week`}
            </p>
          </header>

          <div
            className="relative rounded-[3px] wood-deep-surface p-3 pb-4"
            style={{ boxShadow: "var(--shadow-shelf)" }}
          >
            <div className="max-h-[62vh] space-y-0 overflow-y-auto pr-1 lg:max-h-[64vh]">
              {ordinary.map((c) => (
                <Shelf
                  key={c.id}
                  collection={c}
                  songs={songsFor(c.id)}
                  newSongId={newSongId}
                  onOpenCollection={() => setPanel({ kind: "collection", id: c.id })}
                  onOpenSong={(s) => setPanel({ kind: "song", id: s.id })}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addCollection}
              className="hand mt-3 ml-4 cursor-pointer text-base text-parchment-dim/55 hover:text-parchment"
            >
              + build another shelf
            </button>

            {lamp && (
              <div className="pointer-events-none absolute -right-16 top-1/3 h-72 w-72 lamp-pool opacity-50" />
            )}
            <Dust count={18} opacity={lamp ? 0.4 : 0.16} />
          </div>

          {/* the dim corner */}
          <div className="relative mt-8 lg:pl-14">
            <p className="hand mb-1 pl-4 text-sm text-parchment-dim/45">
              …tucked behind the reading chair
            </p>
            <div
              className="rounded-[3px] p-2"
              style={{
                background: "linear-gradient(180deg, oklch(0.16 0.02 50), oklch(0.11 0.015 48))",
                boxShadow: "inset 0 0 40px oklch(0 0 0/0.8)",
              }}
            >
              {special.map((c) => (
                <Shelf
                  key={c.id}
                  collection={c}
                  songs={songsFor(c.id)}
                  newSongId={newSongId}
                  onOpenCollection={() => setPanel({ kind: "collection", id: c.id })}
                  onOpenSong={(s) => setPanel({ kind: "song", id: s.id })}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- right: window, desk, corner ---------------- */}
        <section className="relative flex flex-col gap-8">
          <div className="flex items-start gap-6">
            <div className="w-[46%] max-w-[240px]">
              <WindowPane
                weather={data.prefs.weather}
                onClick={() => {
                  setData((d) => ({ ...d, prefs: { ...d.prefs, weather: nextWeather(d.prefs.weather) } }));
                  say("outside, the weather turns.");
                }}
              />
              {data.prefs.weather === "rain" && (
                <div className="mt-3 flex items-center gap-2 rounded-[2px] border border-amber/15 bg-wood-deep/50 px-2.5 py-2">
                  <VolumeKnob
                    value={rainVolume}
                    onChange={setRainVolume}
                    label="rain volume"
                    size={30}
                    muted={rainMuted}
                    onToggleMute={toggleRainMute}
                  />
                  <span className="plate-type text-[9px] uppercase tracking-widest text-parchment-dim/50">rain</span>
                </div>
              )}
              {data.prefs.weather !== "cloudy" && (
                <div className="pointer-events-none relative -mt-24 h-40">
                  <Dust count={12} opacity={0.3} />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center gap-5 pt-2">
              <Clock onPeek={say} />
              <Plant />
              <FramedPrint onPeek={say} />
            </div>
          </div>

          <div className="flex items-end justify-start gap-8 pl-2">
            <BookStack />
            <Candle onPeek={say} />
            <span className="hand max-w-[15rem] text-sm leading-snug text-parchment-dim/40">
              {weekly > 0
                ? `${weekly} ${weekly === 1 ? "book" : "books"} added this week. someone has been busy.`
                : "the shelves are quiet this week."}
            </span>
          </div>


          {/* desk */}
          <div className="relative mt-auto">
            {lamp && (
              <div className="pointer-events-none absolute -top-28 left-6 h-72 w-[85%] lamp-pool animate-flicker" />
            )}

            <div className="relative z-10 flex items-end justify-between gap-4 pl-2 pb-1">
              <Lamp
                on={lamp}
                onClick={() => {
                  setData((d) => ({ ...d, prefs: { ...d.prefs, lampOn: !d.prefs.lampOn } }));
                  say(lamp ? "the room goes dim." : "warm light again.");
                }}
              />
              <RecordPlayer
                spinning={playing}
                onClick={() => {
                  if (!currentSong) {
                    const pick = data.songs[0];
                    if (pick) {
                      setNowPlaying(pick.id);
                      setPlaying(true);
                      say(`“${pick.title}” on the turntable.`);
                    }
                  } else {
                    setPlaying((p) => !p);
                  }
                }}
              />
            </div>

            {/* desk — built in perspective: receding top, front edge, legs */}
            <div className="relative [perspective:900px] [perspective-origin:50%_0%]">
              {/* the top, tilted away from the viewer */}
              <button
                type="button"
                onClick={() => setPanel({ kind: "notes" })}
                className="group relative block w-full cursor-pointer wood-surface px-6 py-6 text-left [transform:rotateX(46deg)] [transform-origin:bottom_center] [transform-style:preserve-3d]"
                style={{
                  boxShadow: "0 30px 60px -20px oklch(0 0 0/0.95), inset 0 2px 0 oklch(1 0 0/0.07)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to top, oklch(0 0 0/0.42), oklch(0 0 0/0) 55%, oklch(1 0 0/0.05))",
                  }}
                />
                <div className="relative flex items-end gap-4 [transform:rotateX(-46deg)] [transform-origin:bottom_center]">
                  <Papers />
                  <OpenBook />
                  <Cup />
                  <span className="hand ml-auto pb-1 text-sm text-parchment-dim/45 transition-colors group-hover:text-parchment/80">
                    open the desk
                  </span>
                </div>
              </button>

              {/* front edge of the desktop */}
              <div
                className="relative h-5 w-full wood-deep-surface"
                style={{
                  boxShadow:
                    "inset 0 1px 0 oklch(1 0 0/0.1), inset 0 -6px 10px -6px oklch(0 0 0/0.8), 0 14px 24px -10px oklch(0 0 0/0.85)",
                }}
              />

              {/* legs and the shadowed underside */}
              <div className="relative flex h-20 items-stretch justify-between px-5">
                <div
                  className="w-6 wood-deep-surface"
                  style={{ clipPath: "polygon(0 0,100% 0,86% 100%,10% 100%)" }}
                />
                <div
                  className="pointer-events-none flex-1"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, oklch(0 0 0/0.62), oklch(0 0 0/0.15))",
                  }}
                />
                <div
                  className="w-6 wood-deep-surface"
                  style={{ clipPath: "polygon(0 0,100% 0,90% 100%,14% 100%)" }}
                />
              </div>
            </div>


            <div className="mt-5 flex flex-wrap items-center gap-4">
              <CatalogDrawer
                songs={data.songs}
                collections={data.collections}
                onOpenSong={(s) => setPanel({ kind: "song", id: s.id })}
              />
              <button
                type="button"
                onClick={() => setPanel({ kind: "add" })}
                className="hand cursor-pointer rounded-[2px] border border-amber/40 px-4 py-2 text-lg text-amber/90 transition-colors hover:bg-amber/10"
              >
                add a book to the library
              </button>
            </div>
          </div>

          <Chair />
        </section>
      </div>

      {/* whisper */}
      {whisper && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <p
            className="hand animate-soft-in rounded-[2px] paper-surface px-4 py-1.5 text-lg"
            style={{ transform: "rotate(-0.8deg)" }}
          >
            {whisper}
          </p>
        </div>
      )}

      {/* player */}
      {currentSong && (
        <div className="fixed bottom-5 right-5 z-40">
          <Player
            song={currentSong}
            playing={playing}
            volume={musicVolume}
            onVolume={setMusicVolume}
            onToggle={() => setPlaying((p) => !p)}
            onClose={() => {
              setPlaying(false);
              setNowPlaying(null);
            }}
          />
        </div>
      )}

      {/* panels */}
      {panel.kind === "song" &&
        (() => {
          const s = data.songs.find((x) => x.id === panel.id);
          if (!s) return null;
          return (
            <SongBook
              song={s}
              collections={data.collections}
              isPlaying={nowPlaying === s.id && playing}
              volume={musicVolume}
              onVolume={setMusicVolume}
              onPlay={() => {
                setNowPlaying(s.id);
                setPlaying(true);
              }}
              onSave={updateSong}
              onDelete={removeSong}
              onClose={() => setPanel({ kind: "none" })}
            />
          );
        })()}

      {panel.kind === "collection" &&
        (() => {
          const c = data.collections.find((x) => x.id === panel.id);
          if (!c) return null;
          return (
            <CollectionPanel
              collection={c}
              songs={songsFor(c.id)}
              onOpenSong={(s) => setPanel({ kind: "song", id: s.id })}
              onDeleteSong={(id) =>
                setData((d) => ({ ...d, songs: d.songs.filter((x) => x.id !== id) }))
              }
              onRename={(name) =>
                setData((d) => ({
                  ...d,
                  collections: d.collections.map((x) => (x.id === c.id ? { ...x, name } : x)),
                }))
              }
              onDelete={
                c.special || defaultCollections.some((d) => d.id === c.id)
                  ? undefined
                  : () => {
                      setData((d) => ({
                        ...d,
                        collections: d.collections.filter((x) => x.id !== c.id),
                        songs: d.songs.map((s) =>
                          s.collectionId === c.id ? { ...s, collectionId: "unknown" } : s,
                        ),
                      }));
                      setPanel({ kind: "none" });
                    }
              }
              onClose={() => setPanel({ kind: "none" })}
            />
          );
        })()}

      {panel.kind === "add" && (
        <CatalogCard
          collections={data.collections}
          onAdd={addSong}
          onClose={() => setPanel({ kind: "none" })}
        />
      )}

      {panel.kind === "notes" && (
        <DeskNotes
          songs={data.songs}
          value={data.prefs.deskNotes ?? ""}
          onChange={(v) => setData((d) => ({ ...d, prefs: { ...d.prefs, deskNotes: v } }))}
          onOpenSong={(s) => setPanel({ kind: "song", id: s.id })}
          onClose={() => setPanel({ kind: "none" })}
        />
      )}
    </main>
  );
}

/* ------------------------------ small objects ----------------------------- */

function Clock({ onPeek }: { onPeek: (s: string) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const sec = now ? now.getSeconds() : 0;
  const min = now ? now.getMinutes() : 0;
  const hr = now ? now.getHours() % 12 : 0;

  return (
    <button
      type="button"
      onClick={() =>
        onPeek(now ? `the clock says ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` : "…")
      }
      title="the clock"
      className="relative h-24 w-24 cursor-pointer rounded-full border-4 border-wood-light transition-transform duration-300 hover:scale-[1.04]"
      style={{
        backgroundImage: "radial-gradient(circle at 40% 30%, oklch(0.9 0.03 85), oklch(0.78 0.04 82))",
        boxShadow: "var(--shadow-object)",
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1 h-2 w-[2px] -translate-x-1/2 bg-ink/60"
          style={{ transformOrigin: "50% 43px", transform: `rotate(${i * 90}deg)` }}
        />
      ))}
      <span
        className="absolute left-1/2 top-1/2 h-6 w-[3px] rounded bg-ink/80"
        style={{ transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${hr * 30 + min * 0.5}deg)` }}
      />
      <span
        className="absolute left-1/2 top-1/2 h-8 w-[2px] rounded bg-ink/70"
        style={{ transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${min * 6}deg)` }}
      />
      <span
        className="absolute left-1/2 top-1/2 h-9 w-px bg-destructive/70"
        style={{ transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${sec * 6}deg)` }}
      />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/80" />
    </button>
  );
}

function Lamp({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title="the desk lamp" className="group relative cursor-pointer">
      <div
        className="mx-auto h-9 w-20 rounded-t-full transition-colors duration-500"
        style={{
          background: on
            ? "linear-gradient(180deg, oklch(0.46 0.09 60), oklch(0.32 0.06 55))"
            : "linear-gradient(180deg, oklch(0.32 0.03 58), oklch(0.24 0.02 55))",
          boxShadow: on ? "0 14px 26px -8px oklch(0.79 0.14 72/0.5)" : "none",
        }}
      />
      <div className="mx-auto h-16 w-[3px] bg-wood-light" style={{ transform: "rotate(4deg)" }} />
      <div className="mx-auto h-2 w-14 rounded-full bg-wood-light" />
      {on && (
        <span className="pointer-events-none absolute left-1/2 top-8 h-4 w-16 -translate-x-1/2 rounded-full bg-amber/70 blur-md" />
      )}
      <span className="hand absolute -left-2 top-full mt-1 text-xs text-parchment-dim/0 transition-colors group-hover:text-parchment-dim/60">
        {on ? "click to dim" : "click to light"}
      </span>
    </button>
  );
}

function RecordPlayer({ spinning, onClick }: { spinning: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="the record player"
      className="group relative cursor-pointer rounded-[3px] wood-surface p-3 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-object)" }}
    >
      <div className="relative h-24 w-24">
        <div
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.22_0.02_60)_16%,oklch(0.12_0.01_60)_17%,oklch(0.16_0.015_60)_58%,oklch(0.11_0.01_60))]"
          style={{ animation: spinning ? "spin-record 3.6s linear infinite" : undefined }}
        >
          <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/75" />
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wood-deep" />
        </div>
        <span
          className="absolute right-0 top-1 h-16 w-[3px] origin-top rounded bg-parchment-dim/70"
          style={{ animation: spinning ? "needle-sway 6s ease-in-out infinite" : undefined, transform: "rotate(16deg)" }}
        />
      </div>
      <span className="hand mt-1 block text-center text-xs text-parchment-dim/50">
        {spinning ? "playing" : "the player"}
      </span>
    </button>
  );
}

function Cup() {
  const [sipped, setSipped] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      title="a cup of something"
      onClick={(e) => {
        e.stopPropagation();
        setSipped((s) => !s);
      }}
      className="relative mb-1 block cursor-pointer"
    >

      <div
        className="h-10 w-11 rounded-b-[14px] rounded-t-[3px]"
        style={{ background: "linear-gradient(180deg, oklch(0.86 0.03 85), oklch(0.7 0.035 82))" }}
      />
      <span className="absolute -right-2 top-2 h-5 w-4 rounded-r-full border-[3px] border-parchment-dim/80" />
      {!sipped && (
        <span className="pointer-events-none absolute -top-4 left-1/2 h-5 w-4 -translate-x-1/2 rounded-full bg-parchment/15 blur-[3px]" />
      )}
    </span>

  );
}

function Plant() {
  return (
    <div className="relative" title="a small plant">
      <div className="flex items-end justify-center gap-[3px]">
        {[16, 26, 20, 30, 18].map((h, i) => (
          <span
            key={i}
            className="block w-[6px] rounded-t-full bg-moss/80"
            style={{ height: h, transform: `rotate(${(i - 2) * 8}deg)`, transformOrigin: "bottom center" }}
          />
        ))}
      </div>
      <div
        className="h-9 w-14 rounded-b-[8px]"
        style={{ background: "linear-gradient(180deg, oklch(0.44 0.07 45), oklch(0.32 0.05 42))" }}
      />
    </div>
  );
}

function Papers() {
  return (
    <div className="relative h-16 w-24">
      {[-4, 1.5, -1].map((r, i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-[1px] paper-surface"
          style={{ transform: `rotate(${r}deg) translate(${i * 3}px, ${i * -2}px)` }}
        />
      ))}
      <span className="hand absolute inset-0 flex items-center justify-center text-sm text-ink/60">
        notes
      </span>
    </div>
  );
}

function OpenBook() {
  return (
    <div className="relative h-14 w-28" style={{ transform: "rotate(1.5deg)" }}>
      <span className="absolute inset-y-0 left-0 w-1/2 rounded-l-[2px] paper-surface" />
      <span className="absolute inset-y-0 right-0 w-1/2 rounded-r-[2px] paper-surface" />
      <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-ink/30" />
      <span className="absolute -top-2 right-6 h-6 w-1.5 rounded-b bg-destructive/70" />
    </div>
  );
}

function Chair() {
  return (
    <div className="pointer-events-none relative -mt-2 hidden h-28 justify-start lg:flex" aria-hidden>
      <div className="relative ml-4 w-40">
        <div
          className="h-16 w-40 rounded-t-[26px]"
          style={{ background: "linear-gradient(180deg, oklch(0.34 0.05 42), oklch(0.24 0.035 40))" }}
        />
        <div
          className="-mt-1 h-8 w-44 rounded-[10px]"
          style={{ background: "linear-gradient(180deg, oklch(0.3 0.045 42), oklch(0.2 0.03 40))" }}
        />
        <div className="mx-4 flex justify-between">
          <span className="block h-6 w-2 bg-wood-light/80" />
          <span className="block h-6 w-2 bg-wood-light/80" />
        </div>
      </div>
    </div>
  );
}

function FramedPrint({ onPeek }: { onPeek: (s: string) => void }) {
  return (
    <button
      type="button"
      title="a small framed print"
      onClick={() => onPeek("a pressed leaf someone framed a long time ago.")}
      className="cursor-pointer rounded-[2px] border-4 border-wood-light p-2 transition-transform duration-300 hover:rotate-0"
      style={{
        transform: "rotate(-2deg)",
        background: "linear-gradient(160deg, oklch(0.82 0.04 84), oklch(0.68 0.05 78))",
        boxShadow: "var(--shadow-object)",
      }}
    >
      <span className="block h-16 w-20 bg-[radial-gradient(circle_at_50%_60%,oklch(0.52_0.055_140/0.55),transparent_62%)]" />
    </button>
  );
}

function BookStack() {
  const rows = [
    { w: 96, h: 12, c: "oklch(0.42 0.11 45)", r: -1.5 },
    { w: 88, h: 10, c: "oklch(0.36 0.06 150)", r: 1.2 },
    { w: 100, h: 14, c: "oklch(0.5 0.09 72)", r: -0.6 },
    { w: 82, h: 9, c: "oklch(0.33 0.05 250)", r: 2 },
  ];
  return (
    <div className="flex flex-col items-center" title="a stack someone never reshelved">
      {rows.map((r, i) => (
        <span
          key={i}
          className="block rounded-[2px]"
          style={{
            width: r.w,
            height: r.h,
            background: r.c,
            transform: `rotate(${r.r}deg)`,
            boxShadow: "0 3px 6px -3px oklch(0 0 0/0.8)",
          }}
        />
      ))}
    </div>
  );
}

function Candle({ onPeek }: { onPeek: (s: string) => void }) {
  const [lit, setLit] = useState(true);
  return (
    <button
      type="button"
      title="a candle"
      onClick={() => {
        setLit((l) => !l);
        onPeek(lit ? "a thread of smoke." : "the wick catches.");
      }}
      className="relative flex cursor-pointer flex-col items-center"
    >
      {lit && (
        <span className="animate-flicker absolute -top-4 left-1/2 h-4 w-2 -translate-x-1/2 rounded-full bg-amber shadow-[0_0_16px_6px_oklch(0.79_0.14_72/0.45)]" />
      )}
      <span className="block h-14 w-5 rounded-t-[3px] bg-[linear-gradient(180deg,oklch(0.88_0.03_85),oklch(0.74_0.035_82))]" />
      <span className="block h-2 w-8 rounded-full bg-wood-light" />
    </button>
  );
}
