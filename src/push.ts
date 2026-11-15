import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { api } from './api';

// Notifikasi yang masuk saat aplikasi terbuka tetap ditampilkan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

let current: string | null = null;

/**
 * Minta izin dan daftarkan token push Expo ke server. Tidak pernah melempar error:
 * push bersifat tambahan (daftar notifikasi tetap tersedia di dalam aplikasi).
 * Butuh extra.eas.projectId di app.config.js, dan development build (bukan Expo Go) di Android.
 */
export async function registerPush(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Umum', importance: Notifications.AndroidImportance.DEFAULT });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api.daftarDevice(token, Platform.OS);
    current = token;
  } catch {
    /* abaikan */
  }
}

/** Lepas token perangkat ini dari akun (dipanggil sebelum keluar). */
export async function unregisterPush(): Promise<void> {
  if (!current) return;
  try { await api.hapusDevice(current); } catch { /* abaikan */ }
  current = null;
}
