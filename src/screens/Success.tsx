import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { Page } from '../components/Screen';
import { Button, Card, Icon, Row, T } from '../components/ui';
import { rupiah } from '../components/Form';

export default function Success() {
  const { go, payment } = useStore();
  const waktu = payment?.paid_at ? new Date(payment.paid_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
  return (
    <Page gap={16} style={{ alignItems: 'center', paddingTop: 64 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={44} width={2.6} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Pembayaran berhasil</Text>
      <Text style={[T.body, { color: colors.muted, textAlign: 'center' }]}>Terima kasih. Bukti pembayaran sudah disimpan di riwayat.</Text>
      <Card style={{ alignSelf: 'stretch', borderRadius: 20, padding: 18, gap: 12, marginTop: 6 }}>
        <Row label="Nominal" value={rupiah(payment?.jumlah ?? 0)} />
        <Row label="Metode" value={payment?.metode ?? '-'} />
        <Row label="No. tagihan" value={payment?.invoice ?? '-'} />
        <Row label="Waktu" value={waktu} />
      </Card>
      <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
        <View style={{ flex: 1 }}><Button title="Lihat riwayat" variant="outline" onPress={() => go('pay')} /></View>
        <View style={{ flex: 1 }}><Button title="Ke Beranda" onPress={() => go('home')} /></View>
      </View>
    </Page>
  );
}
