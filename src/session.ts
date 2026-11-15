import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'kliksimrs_token';

// SecureStore tidak tersedia di web (expo start --web); pakai localStorage sebagai cadangan dev.
export async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (token) globalThis.localStorage?.setItem(KEY, token); else globalThis.localStorage?.removeItem(KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(KEY, token); else await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* penyimpanan gagal: sesi hanya berlaku selama aplikasi terbuka */
  }
}
