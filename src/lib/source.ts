// Works out what a song's saved url actually is, so the player never pretends
// a webpage link is a playable audio stream.

import { isAudioFile } from "./audio";
import { isLocalRef } from "./audio-store";

export type SourceKind =
  | { kind: "local" } // complete file the user brought in
  | { kind: "file" } // direct, browser-playable audio url
  | { kind: "embed"; service: "spotify" | "youtube"; embedUrl: string; label: string }
  | { kind: "page" } // some other webpage — not audio
  | { kind: "none" };

function youtubeId(u: URL) {
  if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  if (u.pathname === "/watch") return u.searchParams.get("v");
  const m = u.pathname.match(/^\/(embed|shorts)\/([\w-]+)/);
  return m?.[2] ?? null;
}

export function classifySource(url: string): SourceKind {
  const raw = (url || "").trim();
  if (!raw) return { kind: "none" };
  if (isLocalRef(raw)) return { kind: "local" };
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return { kind: "file" };
  if (isAudioFile(raw)) return { kind: "file" };

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { kind: "page" };
  }

  if (u.hostname.endsWith("spotify.com")) {
    const m = u.pathname.match(/\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (m) {
      return {
        kind: "embed",
        service: "spotify",
        embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        label: "Spotify",
      };
    }
  }

  if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
    const id = youtubeId(u);
    if (id) {
      return {
        kind: "embed",
        service: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
        label: "YouTube",
      };
    }
  }

  return { kind: "page" };
}
