import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Badge, Button, Card, Divider, Icon, T } from '../components/ui';
import { Empty, ErrorBox, Loading, rupiah, tanggalPendek } from '../components/Form';
import type { PayMetode } from '../types';

type Metode = PayMetode | 'KASIR';
const METODE: { key: Metode; label: string; sub: string }[] = [
  { key: 'QRIS', label: 'QRIS', sub: 'Semua e-wallet & m-banking' },
  { key: 'VA', label: 'Virtual Account Bank', sub: 'Transfer dari bank mana pun' },
  { key: 'EWALLET', label: 'E-wallet', sub: 'Setujui di aplikasi e-wallet' },
  { key: 'KASIR', label: 'Bayar di kasir', sub: 'Tunai atau kartu debit' },
];

const History = ({ title, sub, amount, status }: { title: string; sub: string; amount: number; status: string }) => (
  <Card style={{ borderRadius: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{title}</Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>{sub}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{rupiah(amount)}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: status === 'paid' ? colors.primaryDark : colors.muted }}>
        {status === 'paid' ? 'Lunas' : status === 'pending' ? 'Menunggu' : 'Kedaluwarsa'}
      </Text>
    </View>
  </Card>
);

export default function Pay() {
  const { go, set, tagihanId } = useStore();
  const [busy, setBusy] = useState(false);
  const [metode, setMetode] = useState<Metode>('QRIS');
  const [rinci, setRinci] = useState(false);
  const list = useLoad(() => api.tagihan());
  const riwayat = useLoad(() => api.riwayatPembayaran());

  const belum = (list.data ?? []).filter(t => t.status === 'belum_bayar');
  const pilihId = belum.find(t => t.id === tagihanId)?.id ?? belum[0]?.id ?? null;
  useEffect(() => { if (pilihId && pilihId !== tagihanId) set({ tagihanId: pilihId }); }, [pilihId, tagihanId, set]);

  const detail = useLoad(async () => (pilihId ? api.tagihanDetail(pilihId) : null), [pilihId]);

  const bayar = async () => {
    if (!pilihId || metode === 'KASIR') return;
    setBusy(true);
    try {
      const p = await api.bayar(pilihId, metode);
      go('payDetail', { payment: p });
    } catch (e) {
      Alert.alert('Pembayaran gagal dibuat', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const d = detail.data;
  return (
    <Page>
      <Text style={T.h1}>Pembayaran</Text>
      {list.loading && !list.data ? <Loading /> : null}
      {list.error ? <ErrorBox message={list.error} onRetry={() => list.reload()} /> : null}

      {list.data && belum.length === 0 ? (
        <Card style={{ borderRadius: 22, padding: 18, gap: 8 }}>
          <Badge text="Lunas" />
          <Text style={T.body}>Tidak ada tagihan yang harus dibayar.</Text>
        </Card>
      ) : null}

      {belum.length > 1 ? (
        <View style={{ gap: 8 }}>
          <Text style={T.label}>Pilih tagihan</Text>
          {belum.map(t => (
            <Pressable key={t.id} accessibilityRole="radio" accessibilityState={{ selected: t.id === pilihId }} onPress={() => set({ tagihanId: t.id })}
              style={{ backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: t.id === pilihId ? 2 : 1.5,
                borderColor: t.id === pilihId ? colors.primary : colors.border }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{t.poliklinik} · {tanggalPendek(t.tanggal)}</Text>
              <Text style={T.muted}>{rupiah(t.total)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {pilihId && detail.loading && !d ? <Loading /> : null}
      {detail.error ? <ErrorBox message={detail.error} onRetry={() => detail.reload()} /> : null}

      {d ? (
        <>
          <Card style={{ borderRadius: 22, padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge text="Belum dibayar" bg={colors.warnBg} fg={colors.warnText} />
              <Text style={{ fontSize: 12, color: colors.muted }}>{d.invoice}</Text>
            </View>
            <View>
              <Text style={T.muted}>Total tagihan</Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text }}>{rupiah(d.total)}</Text>
            </View>
            <Divider />
            {(rinci ? d.items : d.kelompok.map(k => ({ label: k.nama, jumlah: 1, subtotal: k.total }))).map((i, k) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontSize: 14, color: colors.muted, flexShrink: 1 }}>{i.label}{i.jumlah > 1 ? ` ×${i.jumlah}` : ''}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{rupiah(i.subtotal)}</Text>
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setRinci(v => !v)} style={{ minHeight: 40, justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>{rinci ? 'Sembunyikan rincian per item' : 'Lihat rincian per item'}</Text>
            </Pressable>
          </Card>

          <Text style={[T.h3, { fontSize: 15 }]}>Metode pembayaran</Text>
          <View style={{ gap: 8 }}>
            {METODE.map(m => {
              const on = m.key === metode;
              return (
                <Pressable key={m.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setMetode(m.key)}
                  style={{ backgroundColor: '#fff', borderRadius: 16, minHeight: 60, paddingHorizontal: 14, flexDirection: 'row',
                    alignItems: 'center', gap: 12, borderWidth: on ? 2 : 1.5, borderColor: on ? colors.primary : colors.border }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="card" size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{m.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{m.sub}</Text>
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 1.5, borderColor: on ? colors.primary : '#8FA9A4' }} />
                </Pressable>
              );
            })}
          </View>
          {metode === 'KASIR' ? (
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 16, padding: 16, gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primaryDark }}>Bayar di kasir</Text>
              <Text style={{ fontSize: 13, lineHeight: 19, color: '#0B3D38' }}>
                Tunjukkan nomor pendaftaran {d.invoice ?? ''} kepada petugas kasir, lalu bayar tunai atau dengan kartu debit.
              </Text>
            </View>
          ) : (
            <Button title={busy ? 'Memproses…' : `Bayar ${rupiah(d.total)}`} onPress={busy ? () => undefined : bayar} />
          )}
        </>
      ) : null}

      <Text style={[T.h3, { fontSize: 15, marginTop: 4 }]}>Riwayat pembayaran</Text>
      {riwayat.loading && !riwayat.data ? <Loading /> : null}
      {riwayat.data && riwayat.data.length === 0 ? <Empty text="Belum ada riwayat pembayaran." /> : null}
      {(riwayat.data ?? []).map(p => (
        <History key={p.id} title={p.invoice} sub={`${tanggalPendek(p.paid_at ?? p.expires_at)} · ${p.metode}`} amount={p.jumlah} status={p.status} />
      ))}
    </Page>
  );
}
