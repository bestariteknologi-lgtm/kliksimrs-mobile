import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Screen, useStore } from '../store';
import { Icon } from './ui';

const TABS: { key: string; label: string; icon: string; target: Screen; match: Screen[] }[] = [
  { key: 'home', label: 'Beranda', icon: 'home', target: 'home', match: ['home', 'kunjungan'] },
  { key: 'queue', label: 'Antrian', icon: 'ticket', target: 'queue', match: ['queue', 'live'] },
  { key: 'records', label: 'Rekam', icon: 'doc', target: 'records', match: ['records', 'lab', 'ringkasan'] },
  { key: 'pay', label: 'Bayar', icon: 'card', target: 'pay', match: ['pay', 'payDetail', 'success'] },
  { key: 'profile', label: 'Profil', icon: 'user', target: 'profile', match: ['profile'] },
];

export const TAB_SCREENS: Screen[] = ['home', 'queue', 'live', 'kunjungan', 'records', 'ringkasan', 'pay', 'profile'];

export function TabBar() {
  const { screen, go } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff',
      borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8),
    }}>
      {TABS.map(t => {
        const active = t.match.includes(screen);
        const c = active ? colors.primary : colors.idle;
        return (
          <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: active }}
            onPress={() => go(t.target)}
            style={{ minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Icon name={t.icon} size={24} color={c} width={2.2} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: c }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
