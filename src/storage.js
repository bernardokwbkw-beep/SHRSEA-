import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './config';

const MAX_VISITED = 300;

async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const loadVisited = () => load(STORAGE_KEYS.visited, []);
export const loadSettings = () => load(STORAGE_KEYS.settings, null);

export async function saveVisited(list) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.visited, JSON.stringify(list.slice(-MAX_VISITED)));
  } catch {}
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {}
}
