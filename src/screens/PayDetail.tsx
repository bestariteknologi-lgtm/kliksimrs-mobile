import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { Page } from '../components/Screen';
import { Button, Card, Header, Icon, T } from '../components/ui';
import { rupiah } from '../components/Form';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const POLL_MS = 3000;

export default function PayDetail() {
  const { go, payment } = useStore();
  const [p, setP] = useState(payment);
  const [left, setLeft] = useState(payment?.sisa_detik ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Cek status ke server sampai lunas / kedaluwarsa.
  useEffect(() => {
    if (!payment) return;
    const id = setInterval(async () => {
      try {
        const cur = await api.pembayaran(payment.id);
        setP(cur);
        if (cur.status === 'paid') go('success', { payment: cur });
      } catch { /* abaikan, coba lagi pada putaran berikutnya */ }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [payment, go]);

  useEffect(() => { if (!payment) go('pay'); }, [payment, go]);
  if (!payment || !p) return null;

  const kedaluwarsa = p.status === 'expired' || left <= 0;
  const simulasi = async () => {
    setBusy(true);
    try {
      go('success', { payment: await api.simulasiBayar(p.id) });
    } catch (e) {
      Alert.alert('Gagal', (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Page gap={16}>
      <Header title={`Bayar dengan ${p.metode === 'VA' ? 'Virtual Account' : p.metode === 'EWALLET' ? 'E-wallet' : 'QRIS'}`} onBack={() => go('pay')} />
      <Card style={{ borderRadius: 24, padding: 22, alignItems: 'center', gap: 12 }}>
        <Text style={T.muted}>Total pembayaran</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text }}>{rupiah(p.jumlah)}</Text>

        {p.metode === 'QRIS' && p.payload?.qr_string ? (
          <View accessibilityRole="image" accessibilityLabel="Kode QRIS pembayaran"
            style={{ padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', opacity: kedaluwarsa ? 0.3 : 1 }}>
            <QRCode value={p.payload.qr_string} size={190} />
          </View>
        ) : null}
        {p.metode === 'VA' ? (
          <View style={{ alignSelf: 'stretch', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 16, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Nomor Virtual Account</Text>
            <Text selectable style={{ fontSize: 22, fontWeight: '800', letterSpacing: 1, marginTop: 6, color: colors.text }}>{p.payload?.va_number}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{p.payload?.bank}</Text>
          </View>
        ) : null}
        {p.metode === 'EWALLET' ? (
          <View style={{ alignSelf: 'stretch', backgroundColor: colors.primarySoft, borderRadius: 16, padding: 18 }}>
            <Text style={{ fontSize: 14, lineHeight: 21, color: '#0B3D38', textAlign: 'center' }}>
              Anda akan diarahkan ke aplikasi e-wallet untuk menyetujui pembayaran.
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warnBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Icon name="clock" size={18} color={colors.warnText} width={2.2} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.warnText }}>{kedaluwarsa ? 'Kedaluwarsa' : `Berlaku ${fmt(left)}`}</Text>
        </View>
        <Text style={[T.muted, { fontSize: 12, textAlign: 'center' }]}>{p.invoice}</Text>
      </Card>

      {kedaluwarsa ? <Button title="Buat pembayaran baru" onPress={() => go('pay')} /> : null}
      {!kedaluwarsa && p.gateway === 'dummy' ? (
        <Button title={busy ? 'Memproses…' : 'Simulasikan pembayaran berhasil'} variant="outline" onPress={busy ? () => undefined : simulasi} />
      ) : null}
    </Page>
  );
}
