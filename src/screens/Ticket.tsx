import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Button, Divider, Header, Row, T } from '../components/ui';
import { Empty, ErrorBox, Loading, tanggalPendek } from '../components/Form';

const POLL_MS = 15000;

export default function Ticket() {
  const { go, antrianId, set } = useStore();
  const [id, setId] = useState<string | null>(antrianId);

  // Dibuka dari tab tanpa id: pakai antrian aktif hari ini.
  const resolve = useLoad(async () => {
    if (id) return id;
    const aktif = await api.antrianAktif();
    const first = aktif[0]?.id ?? null;
    if (first) { setId(first); set({ antrianId: first }); }
    return first;
  }, []);

  const tiket = useLoad(async () => (id ? api.antrian(id) : null), [id]);
  const status = useLoad(async () => (id ? api.antrianStatus(id) : null), [id]);

  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => { void status.reload(true); }, POLL_MS);
    return () => clearInterval(t);
  }, [id, status.reload]);

  const batal = () => Alert.alert('Batalkan antrian?', 'Nomor antrian Anda akan dibatalkan.', [
    { text: 'Tidak', style: 'cancel' },
    { text: 'Ya, batalkan', style: 'destructive', onPress: async () => {
      try { await api.batalAntrian(id as string); go('home', { antrianId: null }); }
      catch (e) { Alert.alert('Gagal membatalkan', (e as Error).message); }
    } },
  ]);

  const a = tiket.data;
  const st = status.data;
  const loading = (resolve.loading || tiket.loading) && !a;

  return (
    <Page gap={16}>
      <Header title="Tiket Antrian" onBack={() => go('live')} />
      {loading ? <Loading /> : null}
      {tiket.error || resolve.error ? <ErrorBox message={(tiket.error ?? resolve.error) as string} onRetry={() => { void resolve.reload(); void tiket.reload(); }} /> : null}
      {!loading && !a && !tiket.error && !resolve.error ? <Empty text="Belum ada antrian aktif." /> : null}

      {a ? (
        <>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' }}>
            <View style={{ backgroundColor: colors.primary, padding: 22, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Nomor antrian Anda</Text>
              <Text style={{ color: '#fff', fontSize: 64, fontWeight: '800', lineHeight: 72 }}>{a.nomor}</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>Poli {a.poliklinik}</Text>
            </View>
            <View style={{ padding: 20, gap: 14 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Sedang dilayani</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{st?.nomor_dipanggil ?? '-'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Antrian di depan</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                    {st ? `${st.antrian_di_depan} (± ${st.estimasi_menit} mnt)` : '-'}
                  </Text>
                </View>
              </View>
              <Divider />
              <Row label="Dokter" value={a.dokter ?? '-'} />
              <Row label="Tanggal" value={`${tanggalPendek(a.tanggal)} · ${a.jam_daftar ?? ''}`} />
              <Row label="Cara bayar" value={a.cara_bayar ?? '-'} />
              <Row label="No. pendaftaran" value={a.kode_pendaftaran ?? '-'} />
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View accessibilityRole="image" accessibilityLabel="Kode QR check-in"
                  style={{ padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' }}>
                  <QRCode value={a.qr} size={132} />
                </View>
                <Text style={[T.muted, { fontSize: 12, textAlign: 'center' }]}>Tunjukkan kode ini ke petugas pendaftaran saat tiba</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {a.status === 'pendaftaran' ? (
              <View style={{ flex: 1 }}><Button title="Batalkan" variant="outline" danger onPress={batal} /></View>
            ) : null}
            <View style={{ flex: 1 }}><Button title="Antrian live" onPress={() => go('live')} /></View>
          </View>
        </>
      ) : null}
    </Page>
  );
}
