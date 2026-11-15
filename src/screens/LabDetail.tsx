import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Card, Header, T } from '../components/ui';
import { Empty, ErrorBox, Loading, tanggalPendek } from '../components/Form';

const Cols = ({ a, b, c, head }: { a: string; b: React.ReactNode; c: string; head?: boolean }) => (
  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: head ? 10 : 12, alignItems: 'center' }}>
    <Text style={{ flex: 1.4, fontSize: head ? 11 : 14, fontWeight: head ? '700' : '600', color: head ? colors.muted : colors.text }}>{a}</Text>
    <View style={{ flex: 1 }}>{typeof b === 'string' ? <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{b}</Text> : b}</View>
    <Text style={{ flex: 1, fontSize: head ? 11 : 12, fontWeight: head ? '700' : '400', color: colors.muted }}>{c}</Text>
  </View>
);

export default function LabDetail() {
  const { go, labId } = useStore();
  const { data, error, loading, reload } = useLoad(async () => (labId ? api.labDetail(labId) : null), [labId]);
  const abnormal = data?.hasil.filter(h => h.abnormal).length ?? 0;

  return (
    <Page>
      <Header title="Hasil Laboratorium" onBack={() => go('records', { recTab: 1 })} />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}
      {!loading && !error && !data ? <Empty text="Hasil tidak ditemukan." /> : null}
      {data ? (
        <>
          <Card style={{ padding: 16, gap: 4 }}>
            <Text style={T.h3}>Pemeriksaan laboratorium</Text>
            <Text style={T.muted}>{tanggalPendek(data.tanggal)}</Text>
          </Card>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
            <Cols head a="Pemeriksaan" b="Hasil" c="Rujukan" />
            {data.hasil.map((r, i) => (
              <View key={i} style={{ borderTopWidth: 1, borderTopColor: '#EAF1EF' }}>
                <Cols a={r.nama} c={r.nilai_rujukan ?? '-'} b={
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: r.abnormal ? '#9A3412' : colors.text }}>
                      {[r.hasil, r.satuan].filter(Boolean).join(' ') || '-'}
                    </Text>
                    {r.abnormal ? (
                      <Text style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 11, backgroundColor: colors.warnBg,
                        color: colors.warnText, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' }}>Di luar rujukan</Text>
                    ) : null}
                  </View>
                } />
              </View>
            ))}
          </Card>
          {abnormal > 0 ? (
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 16, padding: 14 }}>
              <Text style={{ fontSize: 13, lineHeight: 20, color: '#0B3D38' }}>
                <Text style={{ fontWeight: '800' }}>Catatan: </Text>
                {abnormal} nilai di luar rujukan. Diskusikan dengan dokter pada kunjungan berikutnya.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
