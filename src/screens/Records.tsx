import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Badge, Card, Choice, T } from '../components/ui';
import { Empty, ErrorBox, Loading, tanggalPendek } from '../components/Form';

const TABS = ['Riwayat', 'Hasil Lab', 'Resep', 'Alergi'] as const;

function Riwayat() {
  const { data, error, loading, reload } = useLoad(() => api.kunjungan());
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={() => reload()} />;
  if (!data?.items.length) return <Empty text="Belum ada riwayat kunjungan." />;
  return (
    <>
      {data.items.map(v => (
        <Card key={v.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge text={v.jenis === 'RAWAT INAP' ? 'Rawat Inap' : 'Rawat Jalan'} />
            <Text style={{ fontSize: 12, color: colors.muted }}>{tanggalPendek(v.tanggal)}</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{v.poliklinik} · {v.dokter}</Text>
          {v.diagnosa.length > 0 ? (
            <Text style={[T.muted, { lineHeight: 20 }]}>Diagnosis: {v.diagnosa.map(d => `${d.nama} (${d.kode})`).join(', ')}</Text>
          ) : <Text style={T.muted}>Diagnosis belum tercatat</Text>}
        </Card>
      ))}
    </>
  );
}

function Lab() {
  const { go } = useStore();
  const { data, error, loading, reload } = useLoad(() => api.lab());
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={() => reload()} />;
  if (!data?.length) return <Empty text="Belum ada hasil laboratorium." />;
  return (
    <>
      {data.map(l => (
        <Pressable key={l.id} accessibilityRole="button" onPress={() => go('lab', { labId: l.id })}>
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge text="Laboratorium" bg={colors.warnBg} fg={colors.warnText} />
              <Text style={{ fontSize: 12, color: colors.muted }}>{tanggalPendek(l.tanggal)}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{l.jumlah_indikator} pemeriksaan</Text>
            <Text style={T.muted}>{l.jumlah_abnormal > 0 ? `${l.jumlah_abnormal} nilai di luar rujukan` : 'Semua nilai normal'} · Ketuk untuk detail</Text>
          </Card>
        </Pressable>
      ))}
    </>
  );
}

function Resep() {
  const { data, error, loading, reload } = useLoad(() => api.resep());
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={() => reload()} />;
  if (!data?.length) return <Empty text="Belum ada resep." />;
  const perTanggal = data.reduce<Record<string, typeof data>>((m, r) => { (m[r.tanggal ?? '-'] ??= []).push(r); return m; }, {});
  return (
    <>
      {Object.entries(perTanggal).map(([tgl, rows]) => (
        <Card key={tgl} style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Resep {tanggalPendek(tgl)}{rows[0].dokter ? ` · ${rows[0].dokter}` : ''}</Text>
          {rows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1 }}>{r.nama}</Text>
              <Text style={{ fontSize: 14, color: colors.muted, flexShrink: 1, textAlign: 'right' }}>{[r.aturan, `${r.jumlah}`].filter(Boolean).join(' · ')}</Text>
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}

function Alergi() {
  const { data, error, loading, reload } = useLoad(() => api.alergi());
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={() => reload()} />;
  if (!data?.length) return <Empty text="Tidak ada riwayat alergi tercatat." />;
  return (
    <>
      {data.map((a, i) => (
        <Card key={i} style={{ gap: 6 }}>
          <Badge text={a.jenis || 'Alergi'} bg={colors.dangerBg} fg={colors.dangerText} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{a.nama}</Text>
          {a.keterangan ? <Text style={T.muted}>{a.keterangan}</Text> : null}
        </Card>
      ))}
    </>
  );
}

export default function Records() {
  const { recTab, set } = useStore();
  return (
    <Page>
      <Text style={T.h1}>Rekam Medis</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TABS.map((t, i) => (
          <Choice key={t} label={t} selected={i === recTab} onPress={() => set({ recTab: i })}
            style={{ flex: 1, paddingHorizontal: 4 }} textStyle={{ fontSize: 13 }} />
        ))}
      </View>
      {recTab === 0 && <Riwayat />}
      {recTab === 1 && <Lab />}
      {recTab === 2 && <Resep />}
      {recTab === 3 && <Alergi />}
    </Page>
  );
}
