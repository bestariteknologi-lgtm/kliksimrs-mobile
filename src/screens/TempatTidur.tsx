import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Badge, Button, Card, Header, T } from '../components/ui';
import { Empty, ErrorBox, Loading } from '../components/Form';

const FILTER = [
  { k: 'semua', label: 'Semua' }, { k: 'rawat_inap', label: 'Rawat inap' },
  { k: 'intensif', label: 'Intensif' }, { k: 'isolasi', label: 'Isolasi' },
] as const;
const STATUS = {
  tersedia: { label: 'Tersedia', bg: colors.primarySoft, fg: colors.primaryDark, bar: colors.primary },
  terbatas: { label: 'Terbatas', bg: colors.warnBg, fg: colors.warnText, bar: '#E0A030' },
  penuh: { label: 'Penuh', bg: '#FDE8E8', fg: colors.danger, bar: colors.danger },
} as const;

const jamMenit = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

// Ketersediaan tempat tidur per kelas; data dihitung server dari status bed saat ini.
export default function TempatTidur() {
  const { go } = useStore();
  const [filter, setFilter] = useState<(typeof FILTER)[number]['k']>('semua');
  const { data, error, loading, reload } = useLoad(async () => {
    const [bed, info] = await Promise.all([api.tempatTidur(), api.info().catch(() => null)]);
    return { bed, info };
  });
  const bed = data?.bed;
  const kelas = (bed?.kelas ?? []).filter(k => filter === 'semua' || k.kategori === filter);
  const igd = data?.info?.telepon_igd;

  return (
    <Page gap={14}>
      <Header title="Ketersediaan Tempat Tidur" onBack={() => go('home')} />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}

      {bed ? (
        <>
          <View style={{ backgroundColor: colors.primary, borderRadius: 22, padding: 18, gap: 4 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, opacity: 0.9 }}>TEMPAT TIDUR TERSEDIA</Text>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800' }}>{bed.tersedia}<Text style={{ fontSize: 18, fontWeight: '600' }}> dari {bed.total}</Text></Text>
            <Text style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>{bed.terisi} terisi · diperbarui {jamMenit(bed.diperbarui)}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {FILTER.map(f => (
              <Pressable key={f.k} accessibilityRole="button" onPress={() => setFilter(f.k)}
                style={{ paddingHorizontal: 14, minHeight: 38, borderRadius: 19, justifyContent: 'center',
                  backgroundColor: filter === f.k ? colors.primary : '#fff', borderWidth: 1.5, borderColor: filter === f.k ? colors.primary : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: filter === f.k ? '#fff' : colors.text }}>{f.label}</Text>
              </Pressable>
            ))}
          </View>

          {kelas.length === 0 ? <Empty text="Belum ada data tempat tidur untuk kategori ini." /> : kelas.map(k => {
            const st = STATUS[k.status];
            const persen = k.total > 0 ? Math.round((k.terisi + k.tidak_tersedia) / k.total * 100) : 0;
            return (
              <Card key={k.nama} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: colors.text }}>{k.nama}</Text>
                  <Badge text={st.label} bg={st.bg} fg={st.fg} />
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.divider, overflow: 'hidden' }}>
                  <View style={{ width: `${persen}%`, height: 8, backgroundColor: st.bar }} />
                </View>
                <Text style={T.muted}>{k.tersedia} tersedia dari {k.total} tempat tidur</Text>
              </Card>
            );
          })}

          {igd ? (
            <Card style={{ gap: 10 }}>
              <Text style={T.h3}>Kondisi darurat?</Text>
              <Text style={T.muted}>Instalasi Gawat Darurat melayani 24 jam. Jangan menunggu ketersediaan tempat tidur untuk mencari pertolongan.</Text>
              <Button title="Telepon IGD" onPress={() => void Linking.openURL(`tel:${igd}`)} />
            </Card>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
