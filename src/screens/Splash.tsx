import React, { useEffect } from 'react';
import { Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store';

// Splash gambar penuh (assets/splash.png), tampil sebentar sambil memulihkan sesi, lalu ke Beranda atau Login.
export default function Splash() {
  const { bootstrap } = useStore();
  useEffect(() => {
    // Tampilkan splash minimal 2 detik sambil memulihkan sesi.
    const wait = new Promise(r => setTimeout(r, 2000));
    void Promise.all([wait, bootstrap()]);
  }, [bootstrap]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" />
      <Image source={require('../../assets/splash.png')} resizeMode="cover"
        accessibilityLabel="RSUD Cerah Medika, Aplikasi Layanan Rumah Sakit"
        style={{ flex: 1, width: '100%' }} />
    </View>
  );
}
