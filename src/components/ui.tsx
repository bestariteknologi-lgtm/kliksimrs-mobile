import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, radius } from '../theme';

/* ---------- Icons (stroke, 24px grid) ---------- */
const PATHS: Record<string, React.ReactNode> = {
  plus: <Path d="M12 5v14M5 12h14" />,
  home: <Path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  ticket: <Path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3zM13 6v12" />,
  doc: <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" />,
  docLines: <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 14h6M9 17h4" />,
  card: <><Rect x="2" y="5" width="20" height="14" rx="2" /><Path d="M2 10h20" /></>,
  pill: <Path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7zM8.5 8.5l7 7" />,
  user: <><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0 1 16 0" /></>,
  back: <Path d="M15 6l-6 6 6 6" />,
  check: <Path d="M5 12l5 5 9-10" />,
  clock: <><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>,
  finger: <Path d="M12 11a3 3 0 0 1 3 3v2M9 14a3 3 0 0 1 6 0M7 17a6 6 0 0 1-1-5 6 6 0 0 1 12 0M5 20a9 9 0 0 1-1-8 8 8 0 0 1 16 0" />,
  bell: <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  qr: <Path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v7M14 20h3M17 17h3M5.5 5.5h2v2h-2zM16.5 5.5h2v2h-2zM5.5 16.5h2v2h-2z" />,
};

export function Icon({ name, size = 24, color = colors.primary, width = 2 }: {
  name: keyof typeof PATHS | string; size?: number; color?: string; width?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}

/* ---------- Typography ---------- */
export const T = {
  h1: { fontSize: 22, fontWeight: '800', color: colors.text } as TextStyle,
  h2: { fontSize: 20, fontWeight: '800', color: colors.text } as TextStyle,
  h3: { fontSize: 16, fontWeight: '800', color: colors.text } as TextStyle,
  body: { fontSize: 14, color: colors.text } as TextStyle,
  muted: { fontSize: 13, color: colors.muted } as TextStyle,
  label: { fontSize: 13, fontWeight: '700', color: colors.muted } as TextStyle,
};

/* ---------- Layout ---------- */
export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[s.card, style]}>{children}</View>
);

export const Divider = () => <View style={{ height: 1, backgroundColor: colors.divider }} />;

export const Row = ({ label, value, bold = true }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.row}>
    <Text style={[T.body, { color: colors.muted }]}>{label}</Text>
    <Text style={[T.body, { fontWeight: bold ? '700' : '600', flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
  </View>
);

export function Badge({ text, bg = colors.primarySoft, fg = colors.primaryDark }: { text: string; bg?: string; fg?: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

/* ---------- Buttons ---------- */
export function Button({ title, onPress, variant = 'primary', icon, danger }: {
  title: string; onPress: () => void; variant?: 'primary' | 'outline' | 'white'; icon?: string; danger?: boolean;
}) {
  const c = danger ? colors.danger : colors.primary;
  const filled = variant === 'primary';
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [s.btn, filled
        ? { backgroundColor: c }
        : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: variant === 'white' ? 'transparent' : c },
        pressed && { opacity: 0.85 }]}>
      {icon ? <Icon name={icon} size={22} color={filled ? '#fff' : c} /> : null}
      <Text style={{ color: filled ? '#fff' : c, fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={onPress} style={s.back}>
      <Icon name="back" size={20} color={colors.text} width={2.4} />
    </Pressable>
  );
}

export function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {onBack ? <BackButton onPress={onBack} /> : null}
      <Text style={[T.h2, { flexShrink: 1 }]}>{title}</Text>
    </View>
  );
}

/* Chip / pilihan (pill atau kotak) */
export function Choice({ label, selected, onPress, style, textStyle, children }: {
  label?: string; selected: boolean; onPress: () => void;
  style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; children?: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[s.choice, selected ? s.choiceOn : s.choiceOff, style]}>
      {children ?? (
        <Text style={[{ fontSize: 14, fontWeight: selected ? '700' : '600', color: selected ? '#fff' : colors.text }, textStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  btn: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  back: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  choice: { minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  choiceOn: { backgroundColor: colors.primary },
  choiceOff: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border },
});
