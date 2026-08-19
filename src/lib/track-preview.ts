// Finds the real recording for a title + artist using Apple's public iTunes
// Search API, which returns a streamable 30-second preview and artwork.
// No key required; results are cached in memory and localStorage.

export type TrackPreview = {
  previewUrl: string;
  artwork: string;
  trackName: string;
  artistName: string;
};

const CACHE_KEY = "lml-track-previews-v1";
const memory = new Map<string, TrackPreview | null>();

function keyFor(title: string, artist: string) {
  return `${title}|${artist}`.toLowerCase().trim();
}

function readDisk(): Record<string, TrackPreview | null> {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeDisk(key: string, value: TrackPreview | null) {
  try {
    const all = readDisk();
    all[key] = value;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export async function findTrackPreview(
  title: string,
  artist: string,
  signal?: AbortSignal,
): Promise<TrackPreview | null> {
  const key = keyFor(title, artist);
  if (memory.has(key)) return memory.get(key) ?? null;
  if (typeof window !== "undefined") {
    const disk = readDisk();
    if (key in disk) {
      memory.set(key, disk[key] ?? null);
      return disk[key] ?? null;
    }
  }

  const term = encodeURIComponent(`${title} ${artist}`.trim());
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=8`;

  try {
    const res = await fetch(url, signal ? { signal } : {});
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as {
      results?: Array<{
        previewUrl?: string;
        artworkUrl100?: string;
        trackName?: string;
        artistName?: string;
      }>;
    };
    const wantArtist = artist.toLowerCase();
    const wantTitle = title.toLowerCase();
    const results = (json.results ?? []).filter((r) => r.previewUrl);
    const best =
      results.find(
        (r) =>
          (r.artistName ?? "").toLowerCase().includes(wantArtist) &&
          (r.trackName ?? "").toLowerCase().includes(wantTitle),
      ) ??
      results.find((r) => (r.artistName ?? "").toLowerCase().includes(wantArtist)) ??
      results[0];

    const found: TrackPreview | null = best?.previewUrl
      ? {
          previewUrl: best.previewUrl,
          artwork: (best.artworkUrl100 ?? "").replace("100x100", "300x300"),
          trackName: best.trackName ?? title,
          artistName: best.artistName ?? artist,
        }
      : null;

    memory.set(key, found);
    writeDisk(key, found);
    return found;
  } catch {
    return null;
  }
}
