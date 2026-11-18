import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { api } from '../api';
import { registerPush } from '../push';
import { Page } from '../components/Screen';
import { Button, Header, T } from '../components/ui';
import { ErrorText, Field } from '../components/Form';

// Langkah 2 pendaftaran: akun sudah dibuat, verifikasi nomor WhatsApp dengan kode OTP.
export default function VerifikasiHp() {
  const { go, user } = useStore();
  const [kode, setKode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const terkirim = useRef(false);

  const kirim = async () => {
    setErr(null); setInfo(null);
    try {
      await api.hpOtpKirim();
      setInfo('Kode verifikasi dikirim ke WhatsApp Anda.');
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  // Kirim kode otomatis sekali saat layar dibuka.
  useEffect(() => {
    if (terkirim.current) return;
    terkirim.current = true;
    void kirim();
  }, []);

  const verifikasi = async () => {
    if (kode.length !== 6) { setErr('Masukkan 6 digit kode.'); return; }
    setBusy(true); setErr(null);
    try {
      const profil = await api.hpOtpVerifikasi(kode);
      go('home', { user: profil });
      void registerPush();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Page gap={14}>
      <Header title="Verifikasi WhatsApp" />
      <Text style={T.muted}>Akun Anda sudah dibuat. Verifikasi nomor WhatsApp untuk melanjutkan.</Text>
      <Text style={T.body}>Kode 6 digit dikirim ke <Text style={{ fontWeight: '800' }}>{user?.nomor_hp ?? 'nomor Anda'}</Text>.</Text>
      <Field label="Kode verifikasi" value={kode} onChangeText={t => setKode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="6 digit dari WhatsApp" />
      {info && !err ? <Text style={[T.muted, { color: colors.primary }]}>{info}</Text> : null}
      <ErrorText text={err} />
      <Button title={busy ? 'Memproses…' : 'Verifikasi'} onPress={busy ? () => undefined : verifikasi} />
      <Text style={[T.muted, { textAlign: 'center' }]} onPress={busy ? undefined : () => void kirim()}>
        Tidak menerima kode? <Text style={{ color: colors.primary, fontWeight: '800' }}>Kirim ulang</Text>
      </Text>
    </Page>
  );
}
