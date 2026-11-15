import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { Screen as S, useStore } from '../store';
import { Page } from '../components/Screen';
import { Icon, T } from '../components/ui';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { ErrorBox, Loading, rupiah, tanggalPendek } from '../components/Form';

function Shortcut({ icon, label, target }: { icon: string; label: string; target: S }) {
  const { go } = useStore();
  return (
    <Pressable accessibilityRole="button" onPress={() => go(target)}
      style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function Alert({ icon, iconColor, bg, title, sub, onPress }: {
  icon: string; iconColor: string; bg: string; title: string; sub: string; onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={{ backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{title}</Text>
        <Text style={T.muted}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const sapaan = () => {
  const h = new Date().getHours();
  return h < 11 ? 'Selamat pagi,' : h < 15 ? 'Selamat siang,' : h < 18 ? 'Selamat sore,' : 'Selamat malam,';
};
const jam = (s: string) => s.replace(':', '.');

export default function Home() {
  const { go, user } = useStore();
  const { data, error, loading, reload } = useLoad(async () => {
    const [beranda, tagihan, lab, notif, kunjungan] = await Promise.all([
      api.beranda(), api.tagihan(), api.lab(), api.notifikasi(), api.kunjunganHariIni().catch(() => null),
    ]);
    const aktif = beranda.antrian_aktif;
    const status = aktif ? await api.antrianStatus(aktif.id).catch(() => null) : null;
    return { beranda, tagihan, lab, belumDibaca: notif.belum_dibaca, kunjungan, status };
  });

  const aktif = data?.beranda.antrian_aktif;
  const st = data?.status;
  const belumBayar = (data?.tagihan ?? []).filter(t => t.status === 'belum_bayar');
  const totalBelumBayar = belumBayar.reduce((a, t) => a + t.total, 0);
  const labTerbaru = data?.lab[0];
  const resepSiap = data?.kunjungan?.resep?.status === 'siap';
  // Kemajuan antrian = nomor yang sudah dipanggil terhadap nomor Anda.
  const nomorSaya = st ? Number(st.nomor_saya.replace(/\D/g, '').slice(-3)) : 0;
  const progres = st && nomorSaya > 0 ? Math.min(100, Math.round(((st.nomor_dipanggil ?? 0) / nomorSaya) * 100)) : 0;

  return (
    <Page gap={20}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{user?.inisial ?? ''}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={T.muted}>{sapaan()}</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{user?.nama ?? ''}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifikasi" onPress={() => go('notif')}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={22} />
          {data && data.belumDibaca > 0 ? (
            <View style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger,
              alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{data.belumDibaca > 9 ? '9+' : data.belumDibaca}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}

      {data ? (
        aktif ? (
          <View style={{ backgroundColor: colors.primary, borderRadius: 22, padding: 18, gap: 10 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, opacity: 0.9 }}>KUNJUNGAN HARI INI</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Poli {aktif.poliklinik}</Text>
            <Text style={{ color: '#fff', fontSize: 14 }}>{aktif.dokter}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>Antrian {aktif.nomor}</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 13 }}>Sedang dilayani: {st?.nomor_dipanggil ?? '-'}</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#2E8A82', overflow: 'hidden' }}>
              <View style={{ width: `${progres}%`, height: 8, backgroundColor: '#fff', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ gap: 2, flexShrink: 1 }}>
                <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9 }}>{st?.sudah_dipanggil ? 'Status' : 'Perkiraan dipanggil'}</Text>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                  {st?.sudah_dipanggil ? 'Sudah dipanggil' : st?.perkiraan_dipanggil ? `${jam(st.perkiraan_dipanggil.dari)} – ${jam(st.perkiraan_dipanggil.sampai)}` : st ? 'Berikutnya' : '-'}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => go('live', { antrianId: aktif.id })}
                style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center' }}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>Antrian live</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.primary, borderRadius: 22, padding: 18, gap: 10 }}>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Belum ada antrian hari ini</Text>
            <Text style={{ color: '#fff', fontSize: 14 }}>Ambil nomor antrian untuk berobat tanpa menunggu di loket.</Text>
            <Pressable accessibilityRole="button" onPress={() => go('queue')}
              style={{ minHeight: 48, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '800' }}>Ambil antrian sekarang</Text>
            </Pressable>
          </View>
        )
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Shortcut icon="ticket" label="Ambil Antrian" target="queue" />
        <Shortcut icon="docLines" label="Rekam Medis" target="records" />
        <Shortcut icon="route" label="Alur Kunjungan" target="kunjungan" />
        <Shortcut icon="pill" label="Status Obat" target="kunjungan" />
      </View>

      {data ? (
        <>
          <Text style={T.h3}>Perlu perhatian</Text>
          {resepSiap ? (
            <Alert icon="pill" iconColor={colors.primary} bg={colors.primarySoft} onPress={() => go('kunjungan')}
              title="Obat siap diambil" sub={`Resep ${data.kunjungan?.resep?.nomor ?? ''} · loket farmasi`.replace('  ', ' ')} />
          ) : null}
          {belumBayar.length > 0 ? (
            <Alert icon="card" iconColor="#8A4B00" bg={colors.warnBg} onPress={() => go('pay')}
              title="Tagihan belum dibayar" sub={`${rupiah(totalBelumBayar)} · ${belumBayar.length} tagihan`} />
          ) : null}
          {labTerbaru ? (
            <Alert icon="doc" iconColor={colors.primary} bg={colors.primarySoft}
              onPress={() => go('lab', { labId: labTerbaru.id })} title="Hasil laboratorium"
              sub={`${tanggalPendek(labTerbaru.tanggal)} · ${labTerbaru.jumlah_abnormal} nilai di luar rujukan`} />
          ) : null}
          {!resepSiap && belumBayar.length === 0 && !labTerbaru ? (
            <Alert icon="check" iconColor={colors.primary} bg={colors.primarySoft} title="Tidak ada yang perlu ditindaklanjuti" sub="Semua tagihan lunas" />
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
