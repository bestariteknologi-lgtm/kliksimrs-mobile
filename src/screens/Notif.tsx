import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Card, Header, T } from '../components/ui';
import { Empty, ErrorBox, Loading } from '../components/Form';
import type { Notifikasi } from '../types';

const waktu = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Notif() {
  const { go } = useStore();
  const { data, error, loading, reload } = useLoad(() => api.notifikasi());

  const buka = async (n: Notifikasi) => {
    if (!n.dibaca) { try { await api.bacaNotifikasi(n.id); } catch { /* abaikan */ } }
    if (n.data?.antrian_id) go('live', { antrianId: n.data.antrian_id });
    else if (n.data?.pembayaran_id) go('pay');
    else void reload(true);
  };

  const bacaSemua = async () => { try { await api.bacaSemuaNotifikasi(); } catch { /* abaikan */ } void reload(true); };

  return (
    <Page>
      <Header title="Notifikasi" onBack={() => go('home')} />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}
      {data && data.items.length === 0 ? <Empty text="Belum ada notifikasi." /> : null}
      {data && data.belum_dibaca > 0 ? (
        <Pressable accessibilityRole="button" onPress={bacaSemua} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Tandai semua dibaca</Text>
        </Pressable>
      ) : null}
      {data?.items.map(n => (
        <Pressable key={n.id} accessibilityRole="button" onPress={() => buka(n)}>
          <Card style={{ gap: 4, borderWidth: n.dibaca ? 0 : 1.5, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: n.dibaca ? '600' : '800', color: colors.text, flexShrink: 1 }}>{n.judul}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{waktu(n.waktu)}</Text>
            </View>
            <Text style={T.muted}>{n.pesan}</Text>
          </Card>
        </Pressable>
      ))}
    </Page>
  );
}
