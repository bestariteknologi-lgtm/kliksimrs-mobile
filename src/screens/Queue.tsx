import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Button, Choice, T } from '../components/ui';
import { Empty, ErrorBox, ErrorText, Loading } from '../components/Form';

const inisial = (n: string) => n.replace(/^(dr\.?|drg\.?)\s*/i, '').split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();

export default function Queue() {
  const { go, set, poliId, dokterId, cara, asuransiId } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const master = useLoad(async () => {
    const [poli, bayar] = await Promise.all([api.poliklinik(), api.caraBayar()]);
    return { poli, bayar };
  });
  const jadwal = useLoad(async () => (poliId ? api.jadwal(poliId) : null), [poliId]);

  const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dokter = jadwal.data?.dokter ?? [];

  const ambil = async () => {
    if (!poliId || !dokterId) { setErr('Pilih poli dan dokter terlebih dahulu.'); return; }
    if (cara === 'ASURANSI' && !asuransiId) { setErr('Pilih perusahaan asuransi.'); return; }
    setBusy(true); setErr(null);
    try {
      const a = await api.daftarAntrian({
        poliklinik_id: poliId, dokter_id: dokterId, cara_bayar: cara,
        ...(cara === 'ASURANSI' && asuransiId ? { perusahaan_asuransi_id: asuransiId } : {}),
      });
      go('ticket', { antrianId: a.id });
    } catch (e) {
      setErr((e as Error).message);
      Alert.alert('Tidak dapat mengambil antrian', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page gap={16}>
      <Text style={T.h1}>Ambil Antrian</Text>
      {master.loading && !master.data ? <Loading /> : null}
      {master.error ? <ErrorBox message={master.error} onRetry={() => master.reload()} /> : null}

      {master.data ? (
        <>
          <View style={{ gap: 8 }}>
            <Text style={T.label}>1. Pilih poli</Text>
            {master.data.poli.length === 0 ? <Empty text="Belum ada poliklinik yang tersedia." /> : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {master.data.poli.map(p => (
                  <Choice key={p.id} label={p.nama} selected={p.id === poliId} onPress={() => set({ poliId: p.id, dokterId: null })} />
                ))}
              </View>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={T.label}>2. Tanggal</Text>
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontWeight: '800', color: colors.primaryDark }}>Hari ini · {hariIni}</Text>
              <Text style={[T.muted, { marginTop: 2 }]}>Pendaftaran antrian saat ini hanya untuk hari ini.</Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={T.label}>3. Pilih dokter &amp; jam</Text>
            {!poliId ? <Text style={T.muted}>Pilih poli terlebih dahulu.</Text> : null}
            {poliId && jadwal.loading ? <Loading /> : null}
            {jadwal.error ? <ErrorBox message={jadwal.error} onRetry={() => jadwal.reload()} /> : null}
            {poliId && !jadwal.loading && !jadwal.error && dokter.length === 0 ? <Empty text="Tidak ada dokter yang praktek hari ini di poli ini." /> : null}
            {dokter.map(d => {
              const on = d.dokter_id === dokterId;
              const penuh = d.sisa_kuota !== null && d.sisa_kuota <= 0;
              return (
                <Pressable key={d.dokter_id} accessibilityRole="button" accessibilityState={{ selected: on, disabled: penuh }} disabled={penuh}
                  onPress={() => set({ dokterId: d.dokter_id })}
                  style={{ backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: penuh ? 0.5 : 1,
                    borderWidth: on ? 2 : 1.5, borderColor: on ? colors.primary : colors.border }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>{inisial(d.nama)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{d.nama}</Text>
                    <Text style={T.muted}>{d.jam} · {penuh ? 'Kuota penuh' : d.sisa_kuota === null ? 'Kuota tersedia' : `Sisa kuota ${d.sisa_kuota}`}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={T.label}>Cara bayar</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {master.data.bayar.jenis.map(c => (
                <Choice key={c} label={c === 'UMUM' ? 'Umum' : c === 'BPJS' ? 'BPJS' : 'Asuransi'} selected={c === cara}
                  onPress={() => set({ cara: c, asuransiId: null })} style={{ flex: 1, borderRadius: 14 }} />
              ))}
            </View>
            {cara === 'ASURANSI' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {master.data.bayar.asuransi.map(a => (
                  <Choice key={a.id} label={a.nama_perusahaan} selected={a.id === asuransiId} onPress={() => set({ asuransiId: a.id })} />
                ))}
              </View>
            ) : null}
          </View>

          <ErrorText text={err} />
          <Button title={busy ? 'Memproses…' : 'Ambil Nomor Antrian'} onPress={busy ? () => undefined : ambil} />
        </>
      ) : null}
    </Page>
  );
}
