import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useStore } from '../store';
import { api, setToken } from '../api';
import { Page } from '../components/Screen';
import { Button, Choice, Header, T } from '../components/ui';
import { ErrorText, Field } from '../components/Form';

// Langkah 1 (layar ini): data diri → akun dibuat. Langkah 2 (layar VerifikasiHp): verifikasi nomor WhatsApp dengan OTP.
// Pasien lama dicocokkan dengan data RS; pasien baru didaftarkan.
// Input tanggal lahir dd-mm-yyyy (auto-sisip "-"); dikirim ke API sebagai yyyy-mm-dd.
const fmtTgl = (t: string) => {
  const d = t.replace(/\D/g, '').slice(0, 8);
  return d.length > 4 ? `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
};
const tglIso = (t: string): string | null => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(t);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (dt.getFullYear() !== Number(yyyy) || dt.getMonth() !== Number(mm) - 1 || dt.getDate() !== Number(dd) || dt > new Date()) return null;
  return `${yyyy}-${mm}-${dd}`;
};

export default function Register() {
  const { go } = useStore();
  const [f, setF] = useState({ nik: '', nama: '', tanggal_lahir: '', jk: 'L' as 'L' | 'P', nomor_hp: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const up = (patch: Partial<typeof f>) => setF(p => ({ ...p, ...patch }));

  const daftar = async () => {
    if (f.nik.length !== 16) { setErr('NIK harus 16 digit.'); return; }
    if (!f.nama.trim() || !tglIso(f.tanggal_lahir)) { setErr('Isi nama dan tanggal lahir yang valid (format HH-BB-TTTT).'); return; }
    if (f.nomor_hp.replace(/\D/g, '').length < 8) { setErr('Isi nomor WhatsApp yang valid.'); return; }
    if (f.password.length < 8) { setErr('Kata sandi minimal 8 karakter.'); return; }
    setBusy(true); setErr(null);
    try {
      const c = await api.checkIdentitas(f.nik);
      if (c.punya_akun) { setErr('NIK ini sudah memiliki akun. Silakan masuk.'); return; }
      const auth = await api.register({
        nik: f.nik, nama: f.nama.trim(), tanggal_lahir: tglIso(f.tanggal_lahir)!, jenis_kelamin: f.jk,
        nomor_hp: f.nomor_hp, password: f.password,
      });
      // Akun sudah dibuat. Pakai token-nya untuk langkah verifikasi WhatsApp di layar berikutnya.
      setToken(auth.token);
      go('verifikasiHp', { user: auth.profil });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page gap={14}>
      <Header title="Daftar Akun" onBack={() => go('login')} />
      <Text style={T.muted}>Pasien lama: gunakan data yang sama dengan di rumah sakit. Pasien baru akan didaftarkan otomatis.</Text>
      <Field label="NIK (16 digit)" value={f.nik} onChangeText={t => up({ nik: t.replace(/\D/g, '').slice(0, 16) })} keyboardType="number-pad" placeholder="16 digit sesuai KTP" />
      <Field label="Nama lengkap" value={f.nama} onChangeText={t => up({ nama: t })} autoCapitalize="words" placeholder="Sesuai KTP" />
      <Field label="Tanggal lahir (HH-BB-TTTT)" value={f.tanggal_lahir} onChangeText={t => up({ tanggal_lahir: fmtTgl(t) })} placeholder="Contoh: 31-01-1990" maxLength={10} keyboardType="numbers-and-punctuation" />
      <View style={{ gap: 8 }}>
        <Text style={T.label}>Jenis kelamin</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Choice label="Laki-laki" selected={f.jk === 'L'} onPress={() => up({ jk: 'L' })} style={{ flex: 1, borderRadius: 14 }} />
          <Choice label="Perempuan" selected={f.jk === 'P'} onPress={() => up({ jk: 'P' })} style={{ flex: 1, borderRadius: 14 }} />
        </View>
      </View>
      <Field label="Nomor WhatsApp" value={f.nomor_hp} onChangeText={t => up({ nomor_hp: t })} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
      {/* Nomor BPJS disembunyikan saat daftar; diisi lewat Profil → Data diri & keamanan. */}
      <Field label="Kata sandi (min. 8 karakter)" value={f.password} onChangeText={t => up({ password: t })} secureTextEntry placeholder="Minimal 8 karakter" />
      <ErrorText text={err} />
      <Button title={busy ? 'Mendaftarkan…' : 'Daftar'} onPress={busy ? () => undefined : daftar} />
    </Page>
  );
}
