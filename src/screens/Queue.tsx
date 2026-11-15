import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Button, Choice, Header, T } from '../components/ui';
import { Empty, ErrorBox, ErrorText, Loading } from '../components/Form';
import type { DokterJadwal, Jadwal } from '../types';

const LANGKAH = ['Poli', 'Dokter', 'Jadwal', 'Konfirmasi'];
const HARI_TAMPIL = 5; // hari ini + 4 hari ke depan (sesuai desain); batas sebenarnya diatur server
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const inisial = (n: string) => n.replace(/^(dr\.?|drg\.?)\s*/i, '').split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
const jam = (s: string) => s.replace(/:/g, '.');
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Stepper({ aktif }: { aktif: number }) {
  return (
    <View accessibilityLabel={`Langkah ${aktif} dari 4`} style={{ flexDirection: 'row', gap: 6 }}>
      {LANGKAH.map((l, i) => (
        <View key={l} style={{ flex: 1, gap: 6 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: i < aktif ? colors.primary : colors.border }} />
          <Text style={{ fontSize: 11, color: i + 1 === aktif ? colors.primary : colors.muted, fontWeight: i + 1 === aktif ? '700' : '400' }}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

// Status satu tanggal bagi dokter terpilih: tersedia / penuh / libur / tidak praktek.
function statusTanggal(j: Jadwal | undefined, dokterId: string | null): { ok: boolean; label: string; sesi: DokterJadwal[] } {
  if (!j) return { ok: false, label: '…', sesi: [] };
  if (j.libur) return { ok: false, label: 'Libur', sesi: [] };
  if (!j.bisa_daftar) return { ok: false, label: '—', sesi: [] };
  const sesi = j.dokter.filter(d => d.dokter_id === dokterId);
  if (sesi.length === 0) return { ok: false, label: '—', sesi: [] };
  if (sesi.every(s => s.penuh)) return { ok: false, label: 'Penuh', sesi };
  return { ok: true, label: '', sesi };
}

// Daftar berobat dalam 3 langkah: poli → dokter → tanggal, sesi & penjamin, lalu ambil nomor antrean.
export default function Queue() {
  const { go, set, poliId, dokterId, cara, asuransiId, user } = useStore();
  const [langkah, setLangkah] = useState<1 | 2 | 3>(poliId && dokterId ? 3 : poliId ? 2 : 1);
  const [tanggal, setTanggal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hari = useMemo(() => Array.from({ length: HARI_TAMPIL }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);

  const master = useLoad(async () => {
    const [poli, bayar] = await Promise.all([api.poliklinik(), api.caraBayar()]);
    return { poli, bayar };
  });
  // Ketersediaan semua tanggal yang ditampilkan dimuat sekaligus saat poli dipilih.
  const jadwalAll = useLoad(async () => (poliId ? Promise.all(hari.map(d => api.jadwal(poliId, ymd(d)))) : null), [poliId]);

  const poli = master.data?.poli.find(p => p.id === poliId);
  const perTanggal = jadwalAll.data ?? [];

  // Dokter = gabungan semua dokter yang praktek di rentang tanggal.
  const dokterList = useMemo(() => {
    const m = new Map<string, { id: string; nama: string; hari: string[]; semuaPenuh: boolean }>();
    perTanggal.forEach((j, i) => {
      if (!j.bisa_daftar) return;
      j.dokter.forEach(d => {
        const cur = m.get(d.dokter_id) ?? { id: d.dokter_id, nama: d.nama, hari: [], semuaPenuh: true };
        if (!cur.hari.includes(HARI[hari[i].getDay()])) cur.hari.push(HARI[hari[i].getDay()]);
        if (!d.penuh) cur.semuaPenuh = false;
        m.set(d.dokter_id, cur);
      });
    });
    return Array.from(m.values());
  }, [perTanggal, hari]);
  const dokter = dokterList.find(d => d.id === dokterId);

  const stat = hari.map((_, i) => statusTanggal(perTanggal[i], dokterId));
  const idx = tanggal ? hari.findIndex(d => ymd(d) === tanggal) : -1;
  const sesi = idx >= 0 ? stat[idx].sesi : [];

  // Saat masuk langkah 3 / ganti dokter: pilih tanggal tersedia pertama bila pilihan belum valid.
  useEffect(() => {
    if (langkah !== 3 || !dokterId || perTanggal.length === 0) return;
    if (idx >= 0 && stat[idx].ok) return;
    const pertama = stat.findIndex(x => x.ok);
    setTanggal(pertama >= 0 ? ymd(hari[pertama]) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langkah, dokterId, jadwalAll.data]);

  const labelTanggal = idx >= 0
    ? hari[idx].toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) + (idx === 0 ? ' (hari ini)' : '')
    : null;

  const bpjs = (user?.nomor_bpjs ?? '').replace(/\D/g, '');
  const bpjsOk = bpjs.length === 13;

  const ambil = async () => {
    if (!poliId || !dokterId) { setErr('Pilih poli dan dokter terlebih dahulu.'); return; }
    if (!tanggal) { setErr('Pilih tanggal kunjungan yang tersedia.'); return; }
    if (cara === 'BPJS' && !bpjsOk) { setErr('Nomor BPJS belum terdata. Pilih cara bayar lain atau lengkapi di loket.'); return; }
    if (cara === 'ASURANSI' && !asuransiId) { setErr('Pilih perusahaan asuransi.'); return; }
    setBusy(true); setErr(null);
    try {
      const a = await api.daftarAntrian({
        poliklinik_id: poliId, dokter_id: dokterId, cara_bayar: cara, tanggal,
        ...(cara === 'ASURANSI' && asuransiId ? { perusahaan_asuransi_id: asuransiId } : {}),
      });
      set({ poliId: null, dokterId: null });
      go('live', { antrianId: a.id });
    } catch (e) {
      // Koneksi putus/timeout: antrean bisa saja sudah terbentuk di server. Cek dulu sebelum menampilkan error.
      if ((e as { status?: number }).status === 0) {
        try {
          const lists = await Promise.all([api.antrianAktif(), api.antrianMendatang()]);
          const baru = lists.flat().find(x => x.tanggal === tanggal);
          if (baru) { set({ poliId: null, dokterId: null }); go('live', { antrianId: baru.id }); return; }
        } catch { /* jatuh ke pesan error */ }
      }
      setErr((e as Error).message);
      Alert.alert('Tidak dapat mengambil antrian', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const kembali = () => (langkah === 1 ? go('home') : setLangkah((langkah - 1) as 1 | 2));

  return (
    <Page gap={16}>
      <Header title="Daftar berobat" onBack={kembali} />
      <Stepper aktif={langkah} />
      {master.loading && !master.data ? <Loading /> : null}
      {master.error ? <ErrorBox message={master.error} onRetry={() => master.reload()} /> : null}

      {/* 1. POLI */}
      {master.data && langkah === 1 ? (
        <View style={{ gap: 10 }}>
          <Text style={T.label}>Pilih poliklinik</Text>
          {master.data.poli.length === 0 ? <Empty text="Belum ada poliklinik yang tersedia." /> : null}
          {master.data.poli.map(p => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => { set({ poliId: p.id, dokterId: null }); setTanggal(null); setLangkah(2); }}
              style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: p.id === poliId ? 2 : 1.5, borderColor: p.id === poliId ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{p.nama}</Text>
              {p.keterangan ? <Text style={T.muted}>{p.keterangan}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* 2. DOKTER */}
      {master.data && langkah === 2 ? (
        <View style={{ gap: 10 }}>
          <Text style={T.label}>Pilih dokter · Poli {poli?.nama}</Text>
          {jadwalAll.loading ? <Loading /> : null}
          {jadwalAll.error ? <ErrorBox message={jadwalAll.error} onRetry={() => jadwalAll.reload()} /> : null}
          {!jadwalAll.loading && !jadwalAll.error && dokterList.length === 0 ? <Empty text={`Tidak ada dokter yang praktek di poli ini dalam ${HARI_TAMPIL} hari ke depan.`} /> : null}
          {dokterList.map(d => (
            <Pressable key={d.id} accessibilityRole="button" accessibilityState={{ disabled: d.semuaPenuh }} disabled={d.semuaPenuh}
              onPress={() => { set({ dokterId: d.id }); setLangkah(3); }}
              style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: d.semuaPenuh ? 0.5 : 1 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.primary, fontWeight: '800' }}>{inisial(d.nama)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{d.nama}</Text>
                <Text style={T.muted}>Praktek: {d.hari.join(' · ')}{d.semuaPenuh ? ' · Penuh' : ''}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* 3. TANGGAL, SESI & PENJAMIN */}
      {master.data && langkah === 3 ? (
        <>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>{dokter ? inisial(dokter.nama) : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{dokter?.nama ?? 'Pilih dokter'}</Text>
              <Text style={T.muted}>Poli {poli?.nama}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setLangkah(2)} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Ganti</Text>
            </Pressable>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={T.label}>Pilih tanggal</Text>
            {jadwalAll.loading ? <Loading /> : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {hari.map((d, i) => {
                  const st = stat[i];
                  const on = i === idx;
                  return (
                    <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !st.ok }}
                      accessibilityLabel={`${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}${st.ok ? '' : `, ${st.label}`}`}
                      disabled={!st.ok} onPress={() => setTanggal(ymd(d))}
                      style={{ flex: 1, minHeight: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2,
                        backgroundColor: on ? colors.primary : st.ok ? '#fff' : '#E8F1EF',
                        borderWidth: st.ok ? (on ? 0 : 1.5) : 1, borderStyle: st.ok ? 'solid' : 'dashed', borderColor: colors.border }}>
                      <Text style={{ fontSize: 11, color: on ? '#fff' : colors.muted }}>{HARI[d.getDay()]}</Text>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: on ? '#fff' : st.ok ? colors.text : colors.muted }}>{d.getDate()}</Text>
                      {!st.ok ? <Text style={{ fontSize: 9, color: colors.muted }}>{st.label}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
            {!jadwalAll.loading && !stat.some(x => x.ok) ? <Text style={{ fontSize: 13, color: colors.dangerText }}>Dokter ini tidak memiliki jadwal yang tersedia dalam {HARI_TAMPIL} hari ke depan.</Text> : null}
          </View>

          <View style={{ gap: 10 }}>
            <Text style={T.label}>Sesi praktik{labelTanggal ? ` · ${labelTanggal}` : ''}</Text>
            {sesi.map((s: DokterJadwal, i) => (
              <View key={i} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: colors.primary }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{jam(s.jam)}</Text>
                  <Text style={T.muted}>{s.perkiraan_dilayani && idx === 0 ? `Perkiraan dilayani ±${jam(s.perkiraan_dilayani)}` : 'Nomor antrian diberikan per hari praktik'}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: s.penuh ? colors.danger : colors.primary, backgroundColor: s.penuh ? colors.dangerBg : colors.primarySoft, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, overflow: 'hidden' }}>
                  {s.penuh ? 'Penuh' : s.sisa_kuota === null ? 'Tersedia' : `Sisa ${s.sisa_kuota} kuota`}
                </Text>
              </View>
            ))}
            {sesi.length === 0 && !jadwalAll.loading ? <Text style={T.muted}>Pilih tanggal yang tersedia untuk melihat sesi.</Text> : null}
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Penjamin</Text>
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
            {cara === 'BPJS' ? (
              <Text style={{ fontSize: 13, lineHeight: 19, color: bpjsOk ? colors.text : colors.dangerText }}>
                {bpjsOk ? `Nomor BPJS terdata: •••• •••• ${bpjs.slice(-4)}. Kepesertaan diverifikasi petugas saat Anda tiba.` : 'Nomor BPJS belum terdata di rumah sakit. Pilih cara bayar lain atau lengkapi di loket.'}
              </Text>
            ) : null}
            <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 12, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>YANG PERLU DIBAWA</Text>
              <Text style={{ fontSize: 13, color: colors.text }}>• KTP{cara === 'BPJS' ? ' atau kartu KIS' : ''}</Text>
              {cara === 'BPJS' ? <Text style={{ fontSize: 13, color: colors.text }}>• Surat rujukan (bila diminta)</Text> : null}
              <Text style={{ fontSize: 13, color: colors.text }}>• Obat yang sedang diminum (jika ada)</Text>
            </View>
          </View>

          <ErrorText text={err} />
          <Button title={busy ? 'Memproses…' : 'Ambil nomor antrean'} onPress={busy || !tanggal ? () => undefined : ambil} />
        </>
      ) : null}
    </Page>
  );
}
