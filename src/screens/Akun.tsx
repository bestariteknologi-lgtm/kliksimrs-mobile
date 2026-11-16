import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { Page } from '../components/Screen';
import { Button, Card, Header, T } from '../components/ui';
import { ErrorText, Field } from '../components/Form';

const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

// Data diri yang boleh diubah dari aplikasi dan ubah kata sandi. NIK, nomor BPJS, dan nomor HP adalah data
// identitas: perubahannya meminta konfirmasi kata sandi dan tidak boleh sama dengan milik pasien lain.
export default function Akun() {
  const { go, user, set } = useStore();
  const [nik, setNik] = useState(user?.nik ?? '');
  const [bpjs, setBpjs] = useState(user?.nomor_bpjs ?? '');
  const [hp, setHp] = useState(user?.nomor_hp ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [alamat, setAlamat] = useState(user?.alamat ?? '');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [busy, setBusy] = useState<'profil' | 'sandi' | null>(null);
  const [err, setErr] = useState<{ profil?: string; sandi?: string }>({});

  // Hitung perubahan data identitas untuk menampilkan kolom konfirmasi sandi.
  const nikBerubah = nik !== (user?.nik ?? '');
  const bpjsBerubah = bpjs !== (user?.nomor_bpjs ?? '');
  const hpBerubah = hp.trim() !== (user?.nomor_hp ?? '');
  const sensitif = [nikBerubah && 'NIK', bpjsBerubah && 'nomor BPJS', hpBerubah && 'nomor HP'].filter(Boolean) as string[];

  const simpanProfil = async () => {
    if (nikBerubah && nik.length !== 16) { setErr(e => ({ ...e, profil: 'NIK harus 16 digit.' })); return; }
    if (bpjs && bpjs.length !== 13) { setErr(e => ({ ...e, profil: 'Nomor BPJS harus 13 digit (kosongkan bila tidak ada).' })); return; }
    if (sensitif.length > 0 && !konfirmasi) { setErr(e => ({ ...e, profil: `Masukkan kata sandi Anda untuk mengubah ${sensitif.join(' dan ')}.` })); return; }

    setBusy('profil'); setErr(e => ({ ...e, profil: undefined }));
    try {
      const p = await api.updateProfil({
        nomor_hp: hp.trim(), email: email || null, alamat: alamat || null,
        ...(nikBerubah ? { nik } : {}),
        ...(bpjsBerubah ? { nomor_bpjs: bpjs || null } : {}),
        ...(sensitif.length > 0 ? { password: konfirmasi } : {}),
      });
      set({ user: p });
      setNik(p.nik ?? ''); setBpjs(p.nomor_bpjs ?? ''); setHp(p.nomor_hp ?? ''); setKonfirmasi('');
      Alert.alert('Tersimpan', nikBerubah ? 'Data diri diperbarui. Gunakan NIK baru Anda untuk masuk berikutnya.' : 'Data diri diperbarui.');
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
        <Text style={T.muted}>Nama dan tanggal lahir hanya dapat diubah melalui loket pendaftaran.</Text>
        <Field label="NIK" value={nik} onChangeText={t => setNik(digits(t, 16))} keyboardType="number-pad" placeholder="16 digit sesuai KTP" />
        <Field label="Nomor BPJS" value={bpjs} onChangeText={t => setBpjs(digits(t, 13))} keyboardType="number-pad" placeholder="13 digit (kosongkan bila tidak ada)" />
        <Field label="Nomor HP" value={hp} onChangeText={setHp} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="nama@email.com" />
        <Field label="Alamat" value={alamat} onChangeText={setAlamat} placeholder="Alamat tempat tinggal" />
        {sensitif.length > 0 ? (
          <>
            <Text style={{ fontSize: 13, lineHeight: 19, color: colors.warnText, backgroundColor: colors.warnBg, borderRadius: 12, padding: 12 }}>
              Anda mengubah {sensitif.join(' dan ')}. Data ini dipakai untuk masuk dan identitas di rumah sakit, jadi pastikan sudah benar.
            </Text>
            <Field label="Kata sandi (konfirmasi perubahan)" value={konfirmasi} onChangeText={setKonfirmasi} secureTextEntry placeholder="Masukkan kata sandi Anda saat ini" />
          </>
        ) : null}
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
