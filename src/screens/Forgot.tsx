import React, { useState } from 'react';
import { Text } from 'react-native';
import { useStore } from '../store';
import { api } from '../api';
import { Page } from '../components/Screen';
import { Button, Header, T } from '../components/ui';
import { ErrorText, Field } from '../components/Form';

// Lupa kata sandi: NIK + nomor WhatsApp terdaftar → kode OTP → kata sandi baru.
export default function Forgot() {
  const { go } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [nik, setNik] = useState('');
  const [hp, setHp] = useState('');
  const [kode, setKode] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr(null);
    try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const kirim = () => run(async () => {
    if (nik.length !== 16 || hp.length < 8) throw new Error('Isi NIK (16 digit) dan nomor WhatsApp terdaftar.');
    await api.otpKirim({ nik, nomor_hp: hp, purpose: 'reset_password' });
    setStep(2);
  });

  const reset = () => run(async () => {
    if (kode.length !== 6) throw new Error('Masukkan 6 digit kode.');
    if (pw.length < 8) throw new Error('Kata sandi baru minimal 8 karakter.');
    const v = await api.otpVerifikasi({ nomor_hp: hp, purpose: 'reset_password', kode });
    await api.resetPassword({ nik, nomor_hp: hp, otp_token: v.otp_token, password_baru: pw });
    go('login');
  });

  return (
    <Page gap={14}>
      <Header title="Lupa Kata Sandi" onBack={() => (step === 2 ? setStep(1) : go('login'))} />
      {step === 1 ? (
        <>
          <Text style={T.muted}>Kode verifikasi dikirim ke WhatsApp yang terdaftar pada akun Anda.</Text>
          <Field label="NIK (16 digit)" value={nik} onChangeText={t => setNik(t.replace(/\D/g, '').slice(0, 16))} keyboardType="number-pad" />
          <Field label="Nomor WhatsApp terdaftar" value={hp} onChangeText={setHp} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
          <ErrorText text={err} />
          <Button title={busy ? 'Mengirim…' : 'Kirim kode'} onPress={busy ? () => undefined : kirim} />
        </>
      ) : (
        <>
          <Text style={T.muted}>Jika data cocok, kode 6 digit sudah dikirim ke WhatsApp Anda.</Text>
          <Field label="Kode verifikasi" value={kode} onChangeText={t => setKode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" />
          <Field label="Kata sandi baru (min. 8 karakter)" value={pw} onChangeText={setPw} secureTextEntry />
          <ErrorText text={err} />
          <Button title={busy ? 'Memproses…' : 'Simpan kata sandi baru'} onPress={busy ? () => undefined : reset} />
        </>
      )}
    </Page>
  );
}
