import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { Page } from '../components/Screen';
import { Button, T } from '../components/ui';

import type { Screen } from '../store';

// target null = belum tersedia
const MENU: { label: string; target: Screen | null }[] = [
  { label: 'Data diri & keamanan', target: 'akun' },
  { label: 'Notifikasi', target: 'notif' },
  { label: 'Keluarga & pasien terhubung (segera)', target: null },
];

export default function Profile() {
  const { logout, user, go } = useStore();
  return (
    <Page>
      <Text style={T.h1}>Profil</Text>
      <View style={{ backgroundColor: colors.primary, borderRadius: 22, padding: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>{user?.inisial}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{user?.nama}</Text>
            <Text style={{ color: '#fff', fontSize: 13 }}>No. RM {user?.nomor_rm ?? '-'}{user?.umur != null ? ` · ${user.umur} tahun` : ''}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,.16)', borderRadius: 14, padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontSize: 13 }}>BPJS Kesehatan</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{user?.nomor_bpjs || 'Belum terdata'}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 18 }}>
        {MENU.map((m, i) => (
          <Pressable key={m.label} accessibilityRole="button" disabled={!m.target} onPress={() => m.target && go(m.target)}
            style={{ minHeight: 56, paddingHorizontal: 16, justifyContent: 'center', opacity: m.target ? 1 : 0.5,
              borderBottomWidth: i < MENU.length - 1 ? 1 : 0, borderBottomColor: '#EAF1EF' }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <Button title="Keluar" variant="outline" danger onPress={logout} />
    </Page>
  );
}
