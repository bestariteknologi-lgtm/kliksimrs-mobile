import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Icon, T } from '../components/ui';
import { Empty, ErrorBox, Loading } from '../components/Form';
import type { ResepStatus, Tahap } from '../types';

const POLL_MS = 20000;
const jam = (s?: string | null) => (s ? s.replace(':', '.') : null);

function Titik({ state }: { state: Tahap['state'] }) {
  if (state === 'selesai') {
    return <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={14} color="#fff" width={3} />
    </View>;
  }
  return <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', borderWidth: state === 'sekarang' ? 3 : 2, borderColor: state === 'sekarang' ? colors.primary : colors.border }} />;
}

const LANGKAH = ['Diterima', 'Disiapkan', 'Siap diambil'];

function Resep({ r }: { r: ResepStatus }) {
  const warna = r.status === 'siap' || r.status === 'diserahkan' ? { bg: colors.primarySoft, fg: colors.primaryDark } : { bg: colors.warnBg, fg: '#8A4B00' };
  const jamLangkah = [r.jam_diterima, r.jam_disiapkan, r.jam_diambil];
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Resep Anda{r.nomor ? ` · ${r.nomor}` : ''}</Text>
          <Text style={T.muted}>{r.jumlah_obat} obat{r.jumlah_racik ? ` · ${r.jumlah_racik} racikan` : ''}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: warna.fg, backgroundColor: warna.bg, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, overflow: 'hidden' }}>{r.status_label}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {LANGKAH.map((l, i) => {
          const n = i + 1;
          const penuh = r.status === 'siap' || r.status === 'diserahkan' ? n <= 3 : n < r.langkah;
          const sedang = !penuh && n === r.langkah;
          return (
            <View key={l} style={{ flex: 1, gap: 6 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
                <View style={{ height: 6, width: penuh ? '100%' : sedang ? '55%' : '0%', backgroundColor: colors.primary }} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: sedang ? '700' : '400', color: sedang ? colors.text : colors.muted }}>
                {l}{jamLangkah[i] ? ` ${jam(jamLangkah[i])}` : ''}
              </Text>
            </View>
          );
        })}
      </View>
      {r.item.length > 0 ? (
        <View style={{ gap: 8 }}>
          {r.item.map((o, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.text, flexShrink: 1 }}>{o.nama}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{o.aturan ? `${o.aturan} · ` : ''}{o.jumlah}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={{ fontSize: 12, color: colors.muted }}>
        {r.status === 'siap' ? 'Obat sudah siap. Tunjukkan nomor resep di loket farmasi.' : r.status === 'diserahkan' ? 'Obat sudah Anda terima.' : 'Kami kabari lewat aplikasi saat obat siap. Tunjukkan nomor resep di loket.'}
      </Text>
    </View>
  );
}

// Alur kunjungan hari ini: tahapan per unit + status resep di farmasi.
export default function Kunjungan() {
  const { go } = useStore();
  const { data, error, loading, reload } = useLoad(() => api.kunjunganHariIni());

  useEffect(() => {
    const t = setInterval(() => { void reload(true); }, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  const tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Page gap={16}>
      <View style={{ gap: 2 }}>
        <Text style={T.h1}>Kunjungan hari ini</Text>
        <Text style={T.muted}>{tgl}{data ? ` · ${data.tahap_selesai} dari ${data.tahap_total} tahap selesai` : ''}</Text>
      </View>

      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}
      {!loading && !error && !data ? (
        <>
          <Empty text="Belum ada kunjungan hari ini." />
          <Pressable accessibilityRole="button" onPress={() => go('queue')} style={{ minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Ambil antrian</Text>
          </Pressable>
        </>
      ) : null}

      {data ? (
        <>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 16 }}>
            {data.tahapan.map((t, i) => {
              const terakhir = i === data.tahapan.length - 1;
              return (
                <View key={t.kode} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <Titik state={t.state} />
                    {!terakhir ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: t.state === 'selesai' ? colors.primary : colors.border }} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2, paddingBottom: terakhir ? 0 : 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: t.state === 'sekarang' ? '700' : '600', color: t.state === 'sekarang' ? colors.primary : t.state === 'menunggu' ? colors.muted : colors.text }}>
                      {t.state === 'sekarang' ? `Sekarang: ${t.label}` : t.label}
                    </Text>
                    {t.keterangan ? <Text style={T.muted}>{t.keterangan}</Text> : null}
                    {t.state === 'sekarang' && t.lokasi ? <Text style={T.muted}>{t.lokasi}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
          {data.resep ? <Resep r={data.resep} /> : null}
        </>
      ) : null}
    </Page>
  );
}
