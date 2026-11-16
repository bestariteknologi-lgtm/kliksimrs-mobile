import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Badge, Button, Card, Header, T } from '../components/ui';
import { Empty, ErrorBox, Loading } from '../components/Form';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const JUMLAH_HARI = 6;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dariYmd = (s: string) => new Date(`${s}T00:00:00`);

// Jadwal praktik dokter per tanggal dengan sisa kuota; dari sini pasien bisa langsung mengambil antrian.
export default function JadwalDokter() {
  const { go } = useStore();
  const hari = useMemo(() => Array.from({ length: JUMLAH_HARI }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const [tanggal, setTanggal] = useState(ymd(hari[0]));
  const [q, setQ] = useState('');
  const [poli, setPoli] = useState('');
  const { data, error, loading, reload } = useLoad(() => api.jadwalDokter(tanggal, q.trim(), poli), [tanggal, q, poli]);

  const ambil = (poliklinikId: string, dokterId: string, tgl: string) => go('queue', { poliId: poliklinikId, dokterId, tanggal: tgl });

  return (
    <Page gap={14}>
      <Header title="Jadwal Dokter" onBack={() => go('home')} />
      <TextInput value={q} onChangeText={setQ} placeholder="Cari dokter atau spesialis" placeholderTextColor={colors.muted}
        accessibilityLabel="Cari dokter"
        style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 15, color: colors.text, borderWidth: 1.5, borderColor: colors.border }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[{ id: '', nama: 'Semua poli' }, ...(data?.poliklinik ?? [])].map(p => (
          <Pressable key={p.id || 'semua'} accessibilityRole="button" onPress={() => setPoli(p.id)}
            style={{ paddingHorizontal: 14, minHeight: 38, borderRadius: 19, justifyContent: 'center',
              backgroundColor: poli === p.id ? colors.primary : '#fff', borderWidth: 1.5, borderColor: poli === p.id ? colors.primary : colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: poli === p.id ? '#fff' : colors.text }}>{p.nama}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {hari.map((d, i) => {
          const aktif = ymd(d) === tanggal;
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${HARI_PANJANG[d.getDay()]} ${d.getDate()}`} onPress={() => setTanggal(ymd(d))}
              style={{ flex: 1, minHeight: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2,
                backgroundColor: aktif ? colors.primary : '#fff', borderWidth: 1.5, borderColor: aktif ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: aktif ? '#fff' : colors.muted }}>{i === 0 ? 'Hari ini' : HARI[d.getDay()]}</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: aktif ? '#fff' : colors.text }}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}

      {data ? (
        data.libur ? (
          <Empty text={`Hari libur: ${data.libur}. Tidak ada praktik dokter.`} />
        ) : data.dokter.length === 0 ? (
          <Empty text="Tidak ada dokter yang praktik pada tanggal ini." />
        ) : (
          <>
            <Text style={T.muted}>{data.dokter.length} jadwal praktik</Text>
            {data.dokter.map(d => (
              <Card key={`${d.dokter_id}-${d.poliklinik_id}-${d.jam}`} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{d.nama}</Text>
                    <Text style={T.muted}>{[d.spesialis, d.poliklinik].filter(Boolean).join(' · ')}</Text>
                    <Text style={{ fontSize: 13, color: colors.text, marginTop: 2 }}>Praktik {d.jam.replace(/:/g, '.')}</Text>
                  </View>
                  {d.status === 'penuh'
                    ? <Badge text="Kuota penuh" bg={colors.warnBg} fg={colors.warnText} />
                    : <Badge text={`Sisa kuota ${d.sisa_kuota}`} />}
                </View>
                {d.status === 'penuh' ? (
                  d.tanggal_berikutnya ? (
                    <Button title={`Coba ${HARI_PANJANG[dariYmd(d.tanggal_berikutnya).getDay()]}`} variant="outline"
                      onPress={() => setTanggal(d.tanggal_berikutnya!)} />
                  ) : null
                ) : data.bisa_daftar ? (
                  <Button title="Ambil antrian" onPress={() => ambil(d.poliklinik_id, d.dokter_id, data.tanggal)} />
                ) : null}
              </Card>
            ))}
          </>
        )
      ) : null}
    </Page>
  );
}
