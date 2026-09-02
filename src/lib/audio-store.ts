// Stores complete, user-provided audio files so full-length playback survives
// a reload (object URLs do not). Blobs live in IndexedDB, keyed by song id.

const DB_NAME = "lml-audio";
const STORE = "files";

export const LOCAL_PREFIX = "local:";

export function isLocalRef(url: string) {
  return url.startsWith(LOCAL_PREFIX);
}

export function localRef(id: string) {
  return `${LOCAL_PREFIX}${id}`;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putAudio(id: string, file: Blob) {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAudio(id: string): Promise<Blob | null> {
  try {
    const db = await open();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

export async function deleteAudio(id: string) {
  try {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    db.close();
  } catch {
    /* ignore */
  }
}
