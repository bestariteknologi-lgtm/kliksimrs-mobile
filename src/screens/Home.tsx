import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { Screen as S, useStore } from '../store';
import { Page } from '../components/Screen';
import { Icon, T } from '../components/ui';
import { Logo } from '../components/Logo';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { ErrorBox, Loading, rupiah, tanggalPendek } from '../components/Form';

function Shortcut({ icon, label, target }: { icon: string; label: string; target: S }) {
  const { go, set } = useStore();
  return (
    <Pressable accessibilityRole="button" onPress={() => go(target, label === 'Resep Obat' ? { recTab: 2 } : {})}
      style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{label}</Text>
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

export default function Home() {
  const { go, user } = useStore();
  const { data, error, loading, reload } = useLoad(async () => {
    const [beranda, tagihan, lab, notif] = await Promise.all([api.beranda(), api.tagihan(), api.lab(), api.notifikasi()]);
    return { beranda, tagihan, lab, belumDibaca: notif.belum_dibaca };
  });

  const aktif = data?.beranda.antrian_aktif;
  const belumBayar = (data?.tagihan ?? []).filter(t => t.status === 'belum_bayar');
  const totalBelumBayar = belumBayar.reduce((a, t) => a + t.total, 0);
  const labTerbaru = data?.lab[0];

  return (
    <Page gap={18}>
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
        <Logo size={40} radius={12} />
      </View>

      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={() => reload()} /> : null}

      {data ? (
        aktif ? (
          <Pressable accessibilityRole="button" onPress={() => go('ticket', { antrianId: aktif.id })}
            style={{ backgroundColor: colors.primary, borderRadius: 22, padding: 18, gap: 8 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>ANTRIAN HARI INI</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Poli {aktif.poliklinik}</Text>
            <Text style={{ color: '#fff', fontSize: 14 }}>{aktif.dokter}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>Antrian {aktif.nomor}</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 13 }}>Ketuk untuk lihat tiket</Text>
            </View>
          </Pressable>
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
        <Shortcut icon="card" label="Bayar" target="pay" />
        <Shortcut icon="pill" label="Resep Obat" target="records" />
      </View>

      {data ? (
        <>
          <Text style={T.h3}>Perlu perhatian</Text>
          {belumBayar.length > 0 ? (
            <Alert icon="card" iconColor="#8A4B00" bg={colors.warnBg} onPress={() => go('pay')}
              title="Tagihan belum dibayar" sub={`${rupiah(totalBelumBayar)} · ${belumBayar.length} tagihan`} />
          ) : (
            <Alert icon="check" iconColor={colors.primary} bg={colors.primarySoft}
              title="Tidak ada tagihan tertunda" sub="Semua tagihan sudah lunas" />
          )}
          {labTerbaru ? (
            <Alert icon="doc" iconColor={colors.primary} bg={colors.primarySoft}
              onPress={() => go('lab', { labId: labTerbaru.id })} title="Hasil laboratorium"
              sub={`${tanggalPendek(labTerbaru.tanggal)} · ${labTerbaru.jumlah_abnormal} nilai di luar rujukan`} />
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
