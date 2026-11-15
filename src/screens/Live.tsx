import React, { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Page } from '../components/Screen';
import { Icon, T } from '../components/ui';
import { Empty, ErrorBox, Loading } from '../components/Form';
import type { Preferensi } from '../types';

const POLL_MS = 15000;
const jam = (s: string) => s.replace(':', '.');

// Antrian Live: posisi, perkiraan dipanggil, status check-in, dan preferensi kabar via WhatsApp.
export default function Live() {
  const { go, antrianId, set } = useStore();
  const [id, setId] = useState<string | null>(antrianId);

  const resolve = useLoad(async () => {
    if (id) return id;
    const aktif = await api.antrianAktif();
    const first = aktif[0]?.id ?? null;
    if (first) { setId(first); set({ antrianId: first }); }
    return first;
  }, []);
  const tiket = useLoad(async () => (id ? api.antrian(id) : null), [id]);
  const status = useLoad(async () => (id ? api.antrianStatus(id) : null), [id]);
  const pref = useLoad(() => api.preferensi());
  const [lokal, setLokal] = useState<Preferensi | null>(null);
  const p = lokal ?? pref.data;

  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => { void status.reload(true); }, POLL_MS);
    return () => clearInterval(t);
  }, [id, status.reload]);

  const ubah = async (patch: Partial<Preferensi>) => {
    const sebelum = p;
    setLokal({ ...(p as Preferensi), ...patch });
    try { setLokal(await api.updatePreferensi(patch)); } catch { setLokal(sebelum); }
  };

  const a = tiket.data;
  const st = status.data;
  const loading = (resolve.loading || tiket.loading) && !a;
  const dipanggil = !!st?.sudah_dipanggil;

  return (
    <Page gap={16}>
      <View style={{ gap: 2 }}>
        <Text style={T.h1}>Antrean Anda</Text>
        {a ? <Text style={T.muted}>Poli {a.poliklinik}{st?.lokasi ? ` · ${st.lokasi}` : ''}</Text> : null}
      </View>

      {loading ? <Loading /> : null}
      {tiket.error || resolve.error ? <ErrorBox message={(tiket.error ?? resolve.error) as string} onRetry={() => { void resolve.reload(); void tiket.reload(); }} /> : null}
      {!loading && !a && !tiket.error && !resolve.error ? (
        <>
          <Empty text="Belum ada antrian aktif hari ini." />
          <Pressable accessibilityRole="button" onPress={() => go('queue')} style={{ minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Ambil antrian</Text>
          </Pressable>
        </>
      ) : null}

      {a ? (
        <>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted }}>Nomor Anda</Text>
                <Text style={{ fontSize: 56, fontWeight: '800', lineHeight: 62, color: colors.primary }}>{a.nomor}</Text>
              </View>
              <View style={{ backgroundColor: colors.bg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>Sedang dilayani</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{st?.nomor_dipanggil ?? '-'}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="clock" size={28} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 12, color: colors.primaryDark, fontWeight: '600' }}>{st && !st.hari_ini ? 'Tanggal kunjungan' : dipanggil ? 'Status' : 'Perkiraan dipanggil'}</Text>
                {st && !st.hari_ini ? (
                  <>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primaryDark }}>
                      {new Date(`${st.tanggal}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.primaryDark }}>Perkiraan jam dipanggil tampil pada hari kunjungan.</Text>
                  </>
                ) : dipanggil ? (
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primaryDark }}>Anda sudah dipanggil</Text>
                ) : st?.perkiraan_dipanggil ? (
                  <>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primaryDark }}>{jam(st.perkiraan_dipanggil.dari)} – {jam(st.perkiraan_dipanggil.sampai)}</Text>
                    <Text style={{ fontSize: 12, color: colors.primaryDark }}>±{st.perkiraan_dipanggil.menit} menit lagi · rata-rata {st.rata_rata_menit} menit per pasien</Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primaryDark }}>{st ? 'Giliran Anda berikutnya' : '-'}</Text>
                )}
              </View>
            </View>

            {st ? (
              <View accessibilityLabel={`Posisi antrean: ${st.antrian_di_depan} pasien lagi`} style={{ flexDirection: 'row', gap: 6 }}>
                {st.posisi.map((c, i) => (
                  <View key={i} style={{ flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: c.jenis === 'dilayani' ? colors.primary : c.jenis === 'saya' ? '#fff' : colors.divider,
                    borderWidth: c.jenis === 'saya' ? 2 : 0, borderColor: colors.primary }}>
                    <Text style={{ fontSize: 11, fontWeight: c.jenis === 'menunggu' ? '600' : '800',
                      color: c.jenis === 'dilayani' ? '#fff' : c.jenis === 'saya' ? colors.primary : colors.muted }}>{c.nomor}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: st?.checkin.sudah ? colors.primarySoft : colors.warnBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={st?.checkin.sudah ? 'check' : 'clock'} size={22} color={st?.checkin.sudah ? colors.primary : colors.warnText} width={2.2} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                {st?.checkin.sudah ? `Sudah check-in${st.checkin.jam ? ` · ${jam(st.checkin.jam)}` : ''}` : 'Belum check-in'}
              </Text>
              <Text style={T.muted}>{st?.checkin.sudah ? 'Anda tercatat hadir di rumah sakit' : 'Check-in di kiosk atau loket saat tiba'}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => go('ticket', { antrianId: a.id })}
              style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>QR saya</Text>
            </Pressable>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16 }}>
            <Toggle label="Kabari via WhatsApp" sub="Saat 3 pasien lagi sebelum giliran Anda" value={p?.wa_giliran_dekat ?? true}
              disabled={!p} onChange={v => ubah({ wa_giliran_dekat: v })} border />
            <Toggle label="Kabari jika jadwal dokter berubah" sub="Dokter terlambat, cuti, atau ganti ruang" value={p?.wa_jadwal_berubah ?? true}
              disabled={!p} onChange={v => ubah({ wa_jadwal_berubah: v })} />
          </View>

          <Text style={{ fontSize: 13, lineHeight: 20, color: colors.muted, backgroundColor: colors.warnBg, borderRadius: 14, padding: 12 }}>
            <Text style={{ fontWeight: '800', color: '#8A4B00' }}>Boleh tinggalkan ruang tunggu. </Text>
            Kami kabari lewat aplikasi (dan WhatsApp bila diaktifkan) saat giliran Anda hampir tiba.
          </Text>
        </>
      ) : null}
    </Page>
  );
}

function Toggle({ label, sub, value, onChange, disabled, border }: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; border?: boolean;
}) {
  return (
    <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: border ? 1 : 0, borderBottomColor: colors.divider }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{label}</Text>
        <Text style={T.muted}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={label}
        trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
    </View>
  );
}
