import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEY = 'muse_entries';
const PHOTOS_DIR = (FileSystem.documentDirectory ?? '') + 'muse_photos/';
const IS_WEB = Platform.OS === 'web';

export interface OutfitEntry {
  date: string;       // YYYY-MM-DD
  photoUri: string;   // local file URI (native) or blob/object URL (web)
  note?: string;
  createdAt: number;  // ms timestamp
}

async function ensurePhotosDir() {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function getAllEntries(): Promise<OutfitEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getEntry(date: string): Promise<OutfitEntry | null> {
  const entries = await getAllEntries();
  return entries.find(e => e.date === date) ?? null;
}

export async function saveEntry(
  date: string,
  photoUri: string,
  note?: string
): Promise<OutfitEntry> {
  let storedUri = photoUri;

  if (!IS_WEB) {
    // Native: copy picker's temp file into permanent app storage
    await ensurePhotosDir();
    const ext = photoUri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const fileName = `${date}_${Date.now()}.${ext}`;
    const destUri = PHOTOS_DIR + fileName;
    await FileSystem.copyAsync({ from: photoUri, to: destUri });
    storedUri = destUri;
  }

  const entries = await getAllEntries();
  const existingIdx = entries.findIndex(e => e.date === date);

  // Delete old photo file if replacing (native only)
  if (!IS_WEB && existingIdx >= 0) {
    const old = entries[existingIdx];
    try {
      const oldInfo = await FileSystem.getInfoAsync(old.photoUri);
      if (oldInfo.exists) {
        await FileSystem.deleteAsync(old.photoUri, { idempotent: true });
      }
    } catch {
      // ignore — old file may already be gone
    }
  }

  const entry: OutfitEntry = {
    date,
    photoUri: storedUri,
    note: note?.trim() || undefined,
    createdAt: Date.now(),
  };

  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.push(entry);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
}

export async function deleteEntry(date: string): Promise<void> {
  const entries = await getAllEntries();
  const idx = entries.findIndex(e => e.date === date);
  if (idx < 0) return;

  if (!IS_WEB) {
    const entry = entries[idx];
    try {
      const info = await FileSystem.getInfoAsync(entry.photoUri);
      if (info.exists) {
        await FileSystem.deleteAsync(entry.photoUri, { idempotent: true });
      }
    } catch {
      // ignore
    }
  }

  entries.splice(idx, 1);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function updateNote(date: string, note: string): Promise<void> {
  const entries = await getAllEntries();
  const idx = entries.findIndex(e => e.date === date);
  if (idx < 0) return;
  entries[idx].note = note.trim() || undefined;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
