import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { Page } from '../components/Screen';
import { Button, Choice, Header, T } from '../components/ui';
import { ErrorText, Field } from '../components/Form';

// Alur: data diri → kode OTP WhatsApp → akun dibuat. Pasien lama dicocokkan dengan data RS; pasien baru didaftarkan.
export default function Register() {
  const { go, signIn } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [f, setF] = useState({ nik: '', nama: '', tanggal_lahir: '', jk: 'L' as 'L' | 'P', nomor_hp: '', password: '', nomor_bpjs: '' });
  const [kode, setKode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const up = (patch: Partial<typeof f>) => setF(p => ({ ...p, ...patch }));

  const kirimKode = async () => {
    if (f.nik.length !== 16) { setErr('NIK harus 16 digit.'); return; }
    if (!f.nama.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(f.tanggal_lahir)) { setErr('Isi nama dan tanggal lahir (format TTTT-BB-HH).'); return; }
    if (f.password.length < 8) { setErr('Kata sandi minimal 8 karakter.'); return; }
    setBusy(true); setErr(null);
    try {
      const c = await api.checkIdentitas(f.nik);
      if (c.punya_akun) { setErr('NIK ini sudah memiliki akun. Silakan masuk.'); return; }
      await api.otpKirim({ nik: f.nik, nomor_hp: f.nomor_hp, purpose: 'register' });
      setStep(2);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const daftar = async () => {
    if (kode.length !== 6) { setErr('Masukkan 6 digit kode.'); return; }
    setBusy(true); setErr(null);
    try {
      const v = await api.otpVerifikasi({ nomor_hp: f.nomor_hp, purpose: 'register', kode });
      signIn(await api.register({
        nik: f.nik, nama: f.nama.trim(), tanggal_lahir: f.tanggal_lahir, jenis_kelamin: f.jk,
        nomor_hp: f.nomor_hp, password: f.password, otp_token: v.otp_token,
        ...(f.nomor_bpjs ? { nomor_bpjs: f.nomor_bpjs } : {}),
      }));
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Page gap={14}>
      <Header title="Daftar Akun" onBack={() => (step === 2 ? setStep(1) : go('login'))} />
      {step === 1 ? (
        <>
          <Text style={T.muted}>Pasien lama: gunakan data yang sama dengan di rumah sakit. Pasien baru akan didaftarkan otomatis.</Text>
          <Field label="NIK (16 digit)" value={f.nik} onChangeText={t => up({ nik: t.replace(/\D/g, '').slice(0, 16) })} keyboardType="number-pad" />
          <Field label="Nama lengkap" value={f.nama} onChangeText={t => up({ nama: t })} autoCapitalize="words" />
          <Field label="Tanggal lahir (TTTT-BB-HH)" value={f.tanggal_lahir} onChangeText={t => up({ tanggal_lahir: t })} placeholder="1990-01-31" keyboardType="numbers-and-punctuation" />
          <View style={{ gap: 8 }}>
            <Text style={T.label}>Jenis kelamin</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Choice label="Laki-laki" selected={f.jk === 'L'} onPress={() => up({ jk: 'L' })} style={{ flex: 1, borderRadius: 14 }} />
              <Choice label="Perempuan" selected={f.jk === 'P'} onPress={() => up({ jk: 'P' })} style={{ flex: 1, borderRadius: 14 }} />
            </View>
          </View>
          <Field label="Nomor WhatsApp" value={f.nomor_hp} onChangeText={t => up({ nomor_hp: t })} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
          <Field label="No. BPJS (opsional)" value={f.nomor_bpjs} onChangeText={t => up({ nomor_bpjs: t.replace(/\D/g, '').slice(0, 13) })} keyboardType="number-pad" />
          <Field label="Kata sandi (min. 8 karakter)" value={f.password} onChangeText={t => up({ password: t })} secureTextEntry />
          <ErrorText text={err} />
          <Button title={busy ? 'Mengirim kode…' : 'Kirim kode verifikasi'} onPress={busy ? () => undefined : kirimKode} />
        </>
      ) : (
        <>
          <Text style={T.body}>Kode verifikasi 6 digit sudah dikirim ke WhatsApp <Text style={{ fontWeight: '800' }}>{f.nomor_hp}</Text>.</Text>
          <Field label="Kode verifikasi" value={kode} onChangeText={t => setKode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" />
          <ErrorText text={err} />
          <Button title={busy ? 'Memproses…' : 'Verifikasi & daftar'} onPress={busy ? () => undefined : daftar} />
          <Text style={[T.muted, { textAlign: 'center' }]} onPress={busy ? undefined : () => { setErr(null); void kirimKode(); }}>
            Tidak menerima kode? <Text style={{ color: colors.primary, fontWeight: '800' }}>Kirim ulang</Text>
          </Text>
        </>
      )}
    </Page>
  );
}
