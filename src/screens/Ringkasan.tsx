import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { RangeBar } from '../components/RangeBar';
import { Header, T } from '../components/ui';
import { Empty, ErrorBox, Loading, tanggalPendek } from '../components/Form';

const LABEL: Record<string, string> = { di_atas: 'Di atas rujukan', di_bawah: 'Di bawah rujukan', normal: 'Normal' };

const Kartu = ({ judul, aksesori, children }: { judul: string; aksesori?: React.ReactNode; children: React.ReactNode }) => (
  <View accessibilityLabel={judul} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{judul}</Text>
      {aksesori}
    </View>
    {children}
  </View>
);

// Ringkasan satu kunjungan: penjelasan dokter, hasil lab, obat & aturan minum, kontrol berikutnya.
export default function Ringkasan() {
  const { go, ringkasanId } = useStore();
  const { data, error, loading, reload } = useLoad(async () => (ringkasanId ? api.ringkasan(ringkasanId) : null), [ringkasanId]);

  return (
    <Page gap={16}>
      <Header title="Ringkasan kunjungan" onBack={() => go('records')} />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}
      {!loading && !error && !data ? <Empty text="Ringkasan tidak ditemukan." /> : null}

      {data ? (
        <>
          <Text style={T.muted}>{tanggalPendek(data.tanggal)} · {data.dokter ?? '-'}{data.poliklinik ? ` · ${data.poliklinik}` : ''}</Text>

          {data.penjelasan_dokter ? (
            <View accessibilityLabel="Penjelasan dokter" style={{ backgroundColor: colors.primary, borderRadius: 20, padding: 18, gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: '#CDE9E3' }}>PENJELASAN SINGKAT DARI DOKTER</Text>
              <Text style={{ fontSize: 15, lineHeight: 23, color: '#fff' }}>{data.penjelasan_dokter}</Text>
            </View>
          ) : null}

          {data.lab.length > 0 ? (
            <Kartu judul="Hasil laboratorium" aksesori={data.lab_baru ? (
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, backgroundColor: colors.primarySoft, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' }}>BARU</Text>
            ) : null}>
              {data.lab.map((l, i) => (
                <View key={i} style={{ gap: 8, paddingBottom: i < data.lab.length - 1 ? 12 : 0, borderBottomWidth: i < data.lab.length - 1 ? 1 : 0, borderBottomColor: colors.divider }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1 }}>{l.nama}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{l.hasil ?? '-'} <Text style={{ fontSize: 12, fontWeight: '500', color: colors.muted }}>{l.satuan ?? ''}</Text></Text>
                  </View>
                  <RangeBar nilai={l.nilai} min={l.batas_min} maks={l.batas_maks} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{l.nilai_rujukan ? `Rujukan ${l.nilai_rujukan}` : ''}</Text>
                    {l.status || l.abnormal ? (
                      <Text style={{ fontSize: 12, fontWeight: '700', color: l.abnormal ? '#8A4B00' : colors.primaryDark }}>
                        {l.status ? LABEL[l.status] : 'Di luar rujukan'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </Kartu>
          ) : null}

          {data.obat.length > 0 ? (
            <Kartu judul="Obat & aturan minum">
              {data.obat.map((o, i) => (
                <View key={i} style={{ gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{o.nama}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{[o.aturan, `${o.jumlah}`].filter(Boolean).join(' · ')}</Text>
                </View>
              ))}
            </Kartu>
          ) : null}

          {data.kontrol_berikutnya ? (
            <View accessibilityLabel="Kontrol berikutnya" style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>Kontrol berikutnya</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  {new Date(`${data.kontrol_berikutnya}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => go('queue')}
                style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Ambil antrean</Text>
              </Pressable>
            </View>
          ) : null}

          {data.tersinkron_satusehat ? (
            <Text style={{ fontSize: 12, color: colors.muted }}>Riwayat tersinkron ke SATUSEHAT, jadi dokter lain bisa melihatnya dengan izin Anda.</Text>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
