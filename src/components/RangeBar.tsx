import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

/**
 * Bilah posisi hasil lab terhadap rentang rujukan: zona normal hijau muda, di luar itu oranye,
 * penanda hitam = nilai pasien. Hanya digambar bila nilai dan minimal satu batas diketahui.
 */
export function RangeBar({ nilai, min, maks }: { nilai: number | null; min: number | null; maks: number | null }) {
  if (nilai === null || (min === null && maks === null)) return null;

  // Domain tampilan: beri ruang di kiri/kanan zona normal agar nilai di luar rentang tetap terlihat.
  const lebar = min !== null && maks !== null ? maks - min : Math.max(min ?? 0, maks ?? 0);
  const pad = lebar * 0.6 || 1;
  const d0 = Math.min(min !== null ? min - pad : 0, nilai - pad * 0.2);
  const d1 = Math.max(maks !== null ? maks + pad : (min ?? 0) + pad * 2, nilai + pad * 0.2);
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - d0) / (d1 - d0)) * 100));

  const zA = min !== null ? pos(min) : 0;
  const zB = maks !== null ? pos(maks) : 100;
  const m = Math.min(98, Math.max(1, pos(nilai)));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ height: 8, borderRadius: 4, backgroundColor: '#F6D9B8', overflow: 'visible' }}>
      <View style={{ position: 'absolute', left: `${zA}%`, width: `${Math.max(2, zB - zA)}%`, top: 0, bottom: 0, backgroundColor: '#CFE6E0' }} />
      <View style={{ position: 'absolute', left: `${m}%`, top: -4, width: 4, height: 16, borderRadius: 2, backgroundColor: colors.text, marginLeft: -2 }} />
    </View>
  );
}
