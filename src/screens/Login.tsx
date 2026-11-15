import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { Button } from '../components/ui';
import { ErrorText, Field } from '../components/Form';
import { Logo } from '../components/Logo';
import { config } from '../config';

export default function Login() {
  const { go, signIn } = useStore();
  const insets = useSafeAreaInsets();
  const [identitas, setIdentitas] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const enter = async () => {
    if (!identitas.trim() || !pw) { setErr('Isi NIK / No. BPJS / No. Rekam Medis dan kata sandi.'); return; }
    setBusy(true); setErr(null);
    try {
      signIn(await api.login(identitas.trim(), pw));
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ backgroundColor: colors.primary, paddingTop: insets.top + 32, paddingHorizontal: 28, paddingBottom: 32,
          borderBottomLeftRadius: 36, borderBottomRightRadius: 36, gap: 14 }}>
          <Logo size={72} radius={20} />
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 35 }}>Selamat datang di {config.appName}</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', opacity: 0.92 }}>{config.hospitalName}</Text>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22, opacity: 0.92 }}>
            Daftar berobat, lihat rekam medis, dan bayar tagihan dari ponsel Anda.
          </Text>
        </View>
        <View style={{ padding: 28, paddingTop: 26, gap: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Masuk</Text>
          <Field label="NIK / No. BPJS / No. Rekam Medis" value={identitas} onChangeText={setIdentitas}
            autoCapitalize="none" keyboardType="number-pad" />
          <Field label="Kata sandi" value={pw} onChangeText={setPw} secureTextEntry />
          <ErrorText text={err} />
          <Button title={busy ? 'Memproses…' : 'Masuk'} onPress={busy ? () => undefined : enter} />
          <Pressable accessibilityRole="button" onPress={() => go('forgot')} style={{ alignItems: 'center', minHeight: 40, justifyContent: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Lupa kata sandi?</Text>
          </Pressable>
          <Button title="Belum punya akun? Daftar" variant="outline" onPress={() => go('register')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
