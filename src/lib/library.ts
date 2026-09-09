export const GENRES = ["pop", "rock", "indie", "classical", "instrumental", "other"] as const;
export type Genre = (typeof GENRES)[number];

export const GENRE_COLORS: Record<Genre, string> = {
  pop: "oklch(0.62 0.19 350)",
  rock: "oklch(0.5 0.17 25)",
  indie: "oklch(0.55 0.12 150)",
  classical: "oklch(0.68 0.11 85)",
  instrumental: "oklch(0.55 0.1 235)",
  other: "oklch(0.5 0.02 60)",
};

export function genreRank(genre: string | undefined): number {
  const i = GENRES.indexOf((genre as Genre) ?? "other");
  return i === -1 ? GENRES.length - 1 : i;
}

export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  url: string;
  duration?: string;
  notes: string;
  moods: string[];
  tags: string[];
  genre: Genre;
  collectionId: string;
  dateAdded: string;
  spine: SpineStyle;
};

export type SpineStyle = {
  hue: number;
  sat: number;
  light: number;
  height: number; // 0.72 - 1
  width: number; // 16 - 30 px
  tilt: number; // deg
  texture: "plain" | "ribbed" | "worn" | "gilt";
  label: "printed" | "hand" | "plate";
  bookmark: boolean;
};

export type Collection = {
  id: string;
  name: string;
  blurb: string;
  special?: boolean;
};

export type Prefs = {
  lampOn: boolean;
  weather: "rain" | "night" | "cloudy" | "stars";
  deskNotes?: string;
  rainVolume?: number;
  rainMuted?: boolean;
  musicVolume?: number;
  journal?: Record<string, string>;
};

const KEY = "little-music-library-v2";

export type LibraryData = {
  songs: Song[];
  collections: Collection[];
  prefs: Prefs;
};

let seedCounter = 0;
export function makeSpine(seed?: number): SpineStyle {
  const base = seed ?? ++seedCounter * 977;
  const r = (n: number) => {
    const x = Math.sin(base * 127.1 + n * 311.7 + 7.13) * 43758.5453;
    return x - Math.floor(x);
  };
  const palettes: [number, number, number][] = [
    [28, 0.09, 0.42],
    [45, 0.11, 0.52],
    [18, 0.13, 0.36],
    [104, 0.07, 0.4],
    [148, 0.06, 0.33],
    [212, 0.06, 0.36],
    [350, 0.09, 0.38],
    [72, 0.1, 0.58],
    [255, 0.05, 0.34],
    [8, 0.12, 0.3],
  ];
  const p = palettes[Math.floor(r(1) * palettes.length)] ?? palettes[0]!;
  const textures: SpineStyle["texture"][] = ["plain", "ribbed", "worn", "gilt"];
  const labels: SpineStyle["label"][] = ["printed", "hand", "plate"];
  return {
    hue: p[0] + Math.round(r(2) * 14 - 7),
    sat: p[1],
    light: p[2] + r(3) * 0.06 - 0.03,
    height: 0.72 + r(4) * 0.28,
    width: 17 + Math.round(r(5) * 14),
    tilt: r(6) < 0.16 ? (r(7) - 0.5) * 7 : 0,
    texture: textures[Math.floor(r(8) * textures.length)] ?? "plain",
    label: labels[Math.floor(r(9) * labels.length)] ?? "printed",
    bookmark: r(10) < 0.18,
  };

}

export const MOODS = [
  "warm",
  "melancholy",
  "restless",
  "dreaming",
  "golden",
  "storm",
  "quiet",
  "aching",
  "strange",
];

export const defaultCollections: Collection[] = [
  { id: "favorites", name: "Favorites", blurb: "The shelf nearest the lamp." },
  { id: "returning", name: "Songs I Keep Coming Back To", blurb: "Worn spines, soft corners." },
  { id: "writing", name: "Writing Music", blurb: "For long paper evenings." },
  { id: "comfort", name: "Comfort", blurb: "Blanket shelf." },
  { id: "night", name: "Night", blurb: "Only opened after eleven." },
  { id: "fantasy", name: "Fantasy", blurb: "Maps folded inside." },
  { id: "unknown", name: "Songs I Haven't Figured Out Yet", blurb: "The dim corner behind the chair.", special: true },
];

export const seedSongs: Song[] = [];

export function loadLibrary(): LibraryData {
  if (typeof window === "undefined") {
    return { songs: seedSongs, collections: defaultCollections, prefs: { lampOn: true, weather: "rain" } };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LibraryData;
      if (parsed?.songs && parsed?.collections) {
        return { ...parsed, prefs: parsed.prefs ?? { lampOn: true, weather: "rain" } };
      }
    }
  } catch {
    /* ignore */
  }
  return { songs: seedSongs, collections: defaultCollections, prefs: { lampOn: true, weather: "rain" } };
}

export function saveLibrary(data: LibraryData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function addedThisWeek(songs: Song[]) {
  const cutoff = Date.now() - 7 * 86400000;
  return songs.filter((s) => new Date(s.dateAdded).getTime() > cutoff).length;
}

export function matches(song: Song, q: string, collections: Collection[]) {
  const t = q.trim().toLowerCase();
  if (!t) return false;
  const col = collections.find((c) => c.id === song.collectionId)?.name ?? "";
  return [song.title, song.artist, song.album, song.notes, col, ...song.moods, ...song.tags]
    .join(" ")
    .toLowerCase()
    .includes(t);
}
