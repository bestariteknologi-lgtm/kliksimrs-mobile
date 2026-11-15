import Constants from 'expo-constants';

// Nilai berasal dari config/hospital.config.json lewat app.config.js (ditetapkan saat build).
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const config = {
  appName: Constants.expoConfig?.name ?? 'KlikSIMRS',
  hospitalName: extra.hospitalName ?? 'Rumah Sakit',
  apiBaseUrl: (extra.apiBaseUrl ?? '').replace(/\/+$/, ''),
  primaryColor: extra.primaryColor ?? '#0F766E',
};
