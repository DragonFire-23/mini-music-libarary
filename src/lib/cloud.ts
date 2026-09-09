// Keeps a signed-in reader's shelf in Lovable Cloud so the same songs (and the
// actual audio files) come back on any device, after any reload.
import { supabase } from "@/integrations/supabase/client";
import type { Song, SpineStyle } from "@/lib/library";
import { makeSpine } from "@/lib/library";
import { getAudio, isLocalRef, putAudio, deleteAudio } from "@/lib/audio-store";

const BUCKET = "song-audio";

type Row = {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  url: string;
  duration: string | null;
  notes: string;
  moods: string[];
  tags: string[];
  collection_id: string;
  date_added: string;
  spine: unknown;
  audio_path: string | null;
};

function rowToSong(r: Row): Song {
  const spine = (r.spine && typeof r.spine === "object" && Object.keys(r.spine).length
    ? (r.spine as SpineStyle)
    : makeSpine());
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    album: r.album,
    artwork: r.artwork,
    url: r.url,
    ...(r.duration ? { duration: r.duration } : {}),
    notes: r.notes,
    moods: r.moods ?? [],
    tags: r.tags ?? [],
    genre: (r.genre as Song["genre"]) ?? "other",
    collectionId: r.collection_id,
    dateAdded: r.date_added,
    spine,
  };
}

function songToRow(s: Song, userId: string, audioPath: string | null) {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    artist: s.artist,
    album: s.album,
    artwork: s.artwork,
    url: s.url,
    duration: s.duration ?? null,
    notes: s.notes,
    moods: s.moods,
    tags: s.tags,
    collection_id: s.collectionId,
    date_added: s.dateAdded,
    spine: JSON.parse(JSON.stringify(s.spine)) as never,
    audio_path: audioPath,
    updated_at: new Date().toISOString(),
  };
}

const uploaded = new Map<string, string>(); // song id -> storage path

export async function pushSong(song: Song, userId: string) {
  let path = uploaded.get(song.id) ?? null;
  if (!path && isLocalRef(song.url)) {
    const blob = await getAudio(song.id);
    if (blob) {
      const p = `${userId}/${song.id}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(p, blob, { upsert: true, contentType: blob.type || "audio/mpeg" });
      if (!error) {
        path = p;
        uploaded.set(song.id, p);
      }
    }
  }
  await supabase.from("songs").upsert(songToRow(song, userId, path));
}

export async function removeSongCloud(id: string, userId: string) {
  uploaded.delete(id);
  await supabase.from("songs").delete().eq("id", id).eq("user_id", userId);
  await supabase.storage.from(BUCKET).remove([`${userId}/${id}`]);
}

/** Merge what the account already holds with anything sitting in this browser. */
export async function syncSongs(local: Song[], userId: string): Promise<Song[]> {
  const { data, error } = await supabase.from("songs").select("*");
  if (error) return local;
  const rows = (data ?? []) as unknown as Row[];
  rows.forEach((r) => {
    if (r.audio_path) uploaded.set(r.id, r.audio_path);
  });

  const cloudIds = new Set(rows.map((r) => r.id));
  const merged: Song[] = [...rows.map(rowToSong)];

  for (const s of local) {
    if (cloudIds.has(s.id)) continue;
    merged.push(s);
    await pushSong(s, userId);
  }

  // pull down any audio this browser is missing
  for (const r of rows) {
    if (!r.audio_path) continue;
    const have = await getAudio(r.id);
    if (have) continue;
    const { data: file } = await supabase.storage.from(BUCKET).download(r.audio_path);
    if (file) await putAudio(r.id, file);
  }

  merged.sort((a, b) => a.dateAdded.localeCompare(b.dateAdded));
  return merged;
}

export async function forgetLocalAudio(ids: string[]) {
  for (const id of ids) await deleteAudio(id);
}
