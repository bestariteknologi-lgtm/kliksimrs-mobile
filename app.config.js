// Konfigurasi per rumah sakit: edit config/hospital.config.json (dan timpa assets/logo.png), lalu build.
const hospital = require('./config/hospital.config.json');

module.exports = {
  expo: {
    name: hospital.appName,
    slug: 'kliksimrs-mobile',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/logo.png',
    android: {
      package: hospital.androidPackage,
      adaptiveIcon: { foregroundImage: './assets/logo-adaptive.png', backgroundColor: '#FFFFFF' },
      usesCleartextTraffic: hospital.apiBaseUrl.startsWith('http://'), // izinkan http untuk server lokal/IP
    },
    ios: { supportsTablet: false, bundleIdentifier: hospital.iosBundleId },
    web: { bundler: 'metro' },
    plugins: [
      // Splash native (singkat): logo di tengah. Splash gambar penuh ada di layar Splash dalam aplikasi.
      'expo-secure-store',
      'expo-notifications',
      ['expo-splash-screen', { image: './assets/logo-adaptive.png', imageWidth: 220, backgroundColor: '#FFFFFF' }],
    ],
    extra: {
      hospitalName: hospital.hospitalName,
      apiBaseUrl: hospital.apiBaseUrl,
      primaryColor: hospital.primaryColor,
      // Wajib diisi (config/hospital.config.json → easProjectId) agar push notification aktif.
      eas: hospital.easProjectId ? { projectId: hospital.easProjectId } : undefined,
    },
  },
};
