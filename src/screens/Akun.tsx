import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { Page } from '../components/Screen';
import { Button, Card, Header, T } from '../components/ui';
import { ErrorText, Field } from '../components/Form';

// Data diri yang boleh diubah dari aplikasi (nomor HP, email, alamat) dan ubah kata sandi.
export default function Akun() {
  const { go, user, set } = useStore();
  const [hp, setHp] = useState(user?.nomor_hp ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [alamat, setAlamat] = useState(user?.alamat ?? '');
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [busy, setBusy] = useState<'profil' | 'sandi' | null>(null);
  const [err, setErr] = useState<{ profil?: string; sandi?: string }>({});

  const simpanProfil = async () => {
    setBusy('profil'); setErr(e => ({ ...e, profil: undefined }));
    try {
      const p = await api.updateProfil({ nomor_hp: hp, email: email || null, alamat: alamat || null });
      set({ user: p });
      Alert.alert('Tersimpan', 'Data diri diperbarui.');
    } catch (e) {
      setErr(x => ({ ...x, profil: (e as Error).message }));
    } finally { setBusy(null); }
  };

  const simpanSandi = async () => {
    if (baru.length < 8) { setErr(x => ({ ...x, sandi: 'Kata sandi baru minimal 8 karakter.' })); return; }
    setBusy('sandi'); setErr(e => ({ ...e, sandi: undefined }));
    try {
      await api.updatePassword(lama, baru);
      setLama(''); setBaru('');
      Alert.alert('Tersimpan', 'Kata sandi diperbarui.');
    } catch (e) {
      setErr(x => ({ ...x, sandi: (e as Error).message }));
    } finally { setBusy(null); }
  };

  return (
    <Page gap={14}>
      <Header title="Data Diri & Keamanan" onBack={() => go('profile')} />
      <Card style={{ gap: 12 }}>
        <Text style={T.h3}>Data diri</Text>
        <Text style={T.muted}>Nama, NIK, dan tanggal lahir hanya dapat diubah melalui loket pendaftaran.</Text>
        <Field label="Nomor HP" value={hp} onChangeText={setHp} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="nama@email.com" />
        <Field label="Alamat" value={alamat} onChangeText={setAlamat} placeholder="Alamat tempat tinggal" />
        <ErrorText text={err.profil} />
        <Button title={busy === 'profil' ? 'Menyimpan…' : 'Simpan data diri'} onPress={busy ? () => undefined : simpanProfil} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={T.h3}>Ubah kata sandi</Text>
        <Field label="Kata sandi lama" value={lama} onChangeText={setLama} secureTextEntry placeholder="Masukkan kata sandi saat ini" />
        <Field label="Kata sandi baru (min. 8 karakter)" value={baru} onChangeText={setBaru} secureTextEntry placeholder="Minimal 8 karakter" />
        <ErrorText text={err.sandi} />
        <Button title={busy === 'sandi' ? 'Menyimpan…' : 'Ubah kata sandi'} variant="outline" onPress={busy ? () => undefined : simpanSandi} />
      </Card>
    </Page>
  );
}
