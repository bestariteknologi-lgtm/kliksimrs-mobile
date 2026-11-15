import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#8FA9A4"
        style={{ height: 52, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16,
          fontSize: 15, fontWeight: '500', backgroundColor: '#fff', color: colors.text }} />
    </View>
  );
}

export const ErrorText = ({ text }: { text?: string | null }) =>
  text ? <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>{text}</Text> : null;

export const Loading = () => (
  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
    <ActivityIndicator color={colors.primary} />
  </View>
);

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ backgroundColor: colors.dangerBg, borderRadius: 16, padding: 14, gap: 8 }}>
      <Text style={{ color: colors.dangerText, fontSize: 14 }}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <Text style={{ color: colors.dangerText, fontWeight: '800' }}>Coba lagi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const Empty = ({ text }: { text: string }) => (
  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
    <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>{text}</Text>
  </View>
);

export const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

export function tanggalPendek(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
