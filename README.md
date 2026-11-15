# KlikSIMRS Mobile (MVP Prototype)

Aplikasi pasien SIMRS — prototipe MVP berdasarkan desain "Desain Aplikasi Mobile Pasien SIMRS".
Stack: Expo (React Native) + TypeScript. Terhubung ke API `kliksimrs` (`/api/mobile/v1`); tidak ada lagi data mock.

## Menjalankan
> Butuh Node.js >= 22.13 (`nvm install 22 && nvm use 22`).

```bash
npm install
npx expo start        # scan QR dengan Expo Go, atau tekan i / a / w
```

## Konfigurasi per rumah sakit (saat build)
Edit `config/hospital.config.json` (nama app, nama RS, `apiBaseUrl`, warna, package id) dan timpa
gambar di `assets/`: `logo.png` (ikon app + logo di Login/Beranda), `logo-adaptive.png` (logo dengan padding untuk adaptive icon Android),
`splash.png` (splash gambar penuh, potret). Sumber aslinya di `gambar/` (RSUD Cerah Medika). Lalu build ulang.
`apiBaseUrl` = domain server RS + `/api` (contoh `https://simrs.rs-contoh.id/api`), dibaca lewat `src/config.ts`. Satu server melayani satu RS, jadi tidak perlu kirim id RS.
Setelah mengganti config/logo, jalankan `npx expo prebuild --platform android --clean` sebelum build native.

## Alur yang tersedia
Daftar (OTP WhatsApp) / Masuk / Lupa kata sandi → Beranda → Ambil Antrian (poli, dokter, cara bayar; hari ini saja) →
Tiket (QR check-in, posisi antrian, batal) → Rekam Medis (riwayat, lab, resep, alergi) → Detail Lab →
Pembayaran (QRIS / VA / e-wallet — gateway masih dummy, ada tombol simulasi) → Sukses → Profil / Keluar.

## Struktur
- `src/store.tsx` — state global + navigasi sederhana (termasuk tombol back Android)
- `src/api.ts` — API client (token, refresh otomatis, error), `src/types.ts` — tipe respons, `src/session.ts` — token di SecureStore, `src/useLoad.ts` — hook loading/error
- `src/screens/` — satu file per layar
- `src/components/` — UI kit, TabBar

## Langkah berikutnya (di luar MVP)
Biometrik (expo-local-authentication), QR asli, payment gateway,
push notifikasi pengingat jadwal, React Navigation bila alur bertambah.
