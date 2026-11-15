import { config } from './config';
import { saveToken } from './session';
import type {
  Alergi, AuthResult, KunjunganHariIni, NotifikasiList, Preferensi, Ringkasan, Antrian, AntrianStatus, Beranda, CaraBayar, Jadwal, KunjunganItem, KunjunganList, LabDetail, LabItem,
  PayMetode, Pembayaran, Poliklinik, Profil, ResepItem, Tagihan, TagihanDetail,
} from './types';

const BASE = `${config.apiBaseUrl}/mobile/v1`;
const TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string[]>) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshing: Promise<boolean> | null = null;

export const setToken = (t: string | null) => { token = t; void saveToken(t); };
export const hasToken = () => !!token;
export const currentToken = () => token;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };
/** Pasang token dari penyimpanan tanpa menulis ulang ke penyimpanan. */
export const restoreToken = (t: string | null) => { token = t; };

async function raw(method: string, path: string, body?: unknown, auth = true, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const timeout = (e as Error)?.name === 'AbortError';
    throw new ApiError(timeout ? 'Koneksi terlalu lama. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.', 0);
  } finally {
    clearTimeout(timer);
  }
}

async function tryRefresh(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await raw('POST', '/auth/refresh');
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.token) { setToken(json.data.token); return true; }
      return false;
    } catch {
      return false;
    } finally {
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, auth = true, timeoutMs = TIMEOUT_MS): Promise<T> {
  let res = await raw(method, path, body, auth, timeoutMs);

  if (res.status === 401 && auth && token && path !== '/auth/refresh') {
    if (await tryRefresh()) res = await raw(method, path, body, auth, timeoutMs);
    if (res.status === 401) { onUnauthorized?.(); }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    const errors = json?.errors as Record<string, string[]> | undefined;
    const first = errors ? Object.values(errors)[0]?.[0] : undefined;
    throw new ApiError(first ?? json?.message ?? `Terjadi kesalahan (${res.status}).`, res.status, errors);
  }
  return json?.data as T;
}

const get = <T>(p: string) => request<T>('GET', p);
const post = <T>(p: string, b?: unknown, auth = true, timeoutMs = TIMEOUT_MS) => request<T>('POST', p, b ?? {}, auth, timeoutMs);

// Pendaftaran antrean bisa lama di RS yang integrasi BPJS Antrean-nya lambat (dijalankan sinkron di server).
const DAFTAR_ANTRIAN_TIMEOUT_MS = 90000;

export type RegisterInput = {
  nik: string; nama: string; tanggal_lahir: string; jenis_kelamin: 'L' | 'P'; nomor_hp: string; password: string;
  otp_token: string; email?: string; alamat?: string; nomor_bpjs?: string; nama_ibu?: string;
};

export const api = {
  // --- auth (publik)
  info: () => request<{ nama_rs: string | null; alamat: string | null; telepon: string | null }>('GET', '/info', undefined, false),
  checkIdentitas: (nik: string) => post<{ terdaftar_di_rs: boolean; punya_akun: boolean }>('/auth/check-identitas', { nik }, false),
  otpKirim: (p: { nik: string; nomor_hp: string; purpose: 'register' | 'reset_password' }) => post<null>('/auth/otp/kirim', p, false),
  otpVerifikasi: (p: { nomor_hp: string; purpose: 'register' | 'reset_password'; kode: string }) =>
    post<{ otp_token: string; berlaku_menit: number }>('/auth/otp/verifikasi', p, false),
  register: (p: RegisterInput) => post<AuthResult>('/auth/register', p, false),
  login: (identitas: string, password: string) => post<AuthResult>('/auth/login', { identitas, password }, false),
  resetPassword: (p: { nik: string; nomor_hp: string; otp_token: string; password_baru: string }) => post<null>('/auth/reset-password', p, false),
  logout: () => post<null>('/auth/logout'),

  // --- akun
  me: () => get<Profil>('/me'),
  updateProfil: (p: { nomor_hp?: string; email?: string | null; alamat?: string | null }) => request<Profil>('PUT', '/me', p),
  updatePassword: (password_lama: string, password_baru: string) => request<null>('PUT', '/me/password', { password_lama, password_baru }),
  beranda: () => get<Beranda>('/beranda'),

  // --- perjalanan kunjungan
  kunjunganHariIni: () => get<KunjunganHariIni | null>('/kunjungan/hari-ini'),
  ringkasan: (id: string) => get<Ringkasan>(`/rekam-medis/kunjungan/${id}/ringkasan`),
  preferensi: () => get<Preferensi>('/me/preferensi-notifikasi'),
  updatePreferensi: (p: Partial<Preferensi>) => request<Preferensi>('PUT', '/me/preferensi-notifikasi', p),

  // --- notifikasi & perangkat push
  notifikasi: () => get<NotifikasiList>('/notifikasi'),
  bacaNotifikasi: (id: string) => post<null>(`/notifikasi/${id}/baca`),
  bacaSemuaNotifikasi: () => post<null>('/notifikasi/baca-semua'),
  daftarDevice: (expo_token: string, platform: string) => post<null>('/me/device', { expo_token, platform }),
  hapusDevice: (expo_token: string) => request<null>('DELETE', '/me/device', { expo_token }),

  // --- master & antrian
  poliklinik: () => get<Poliklinik[]>('/poliklinik'),
  jadwal: (poliId: string, tanggal?: string) => get<Jadwal>(`/poliklinik/${poliId}/jadwal${tanggal ? `?tanggal=${tanggal}` : ''}`),
  caraBayar: () => get<CaraBayar>('/cara-bayar'),
  daftarAntrian: (p: { poliklinik_id: string; dokter_id: string; cara_bayar: string; tanggal?: string; perusahaan_asuransi_id?: string }) => post<Antrian>('/antrian', p, true, DAFTAR_ANTRIAN_TIMEOUT_MS),
  antrianAktif: () => get<Antrian[]>('/antrian?aktif=1'),
  antrianMendatang: () => get<Antrian[]>('/antrian?mendatang=1'),
  antrian: (id: string) => get<Antrian>(`/antrian/${id}`),
  antrianStatus: (id: string) => get<AntrianStatus>(`/antrian/${id}/status`),
  batalAntrian: (id: string) => request<null>('DELETE', `/antrian/${id}`),

  // --- rekam medis
  kunjungan: (page = 1) => get<KunjunganList>(`/rekam-medis/kunjungan?page=${page}`),
  kunjunganDetail: (id: string) => get<KunjunganItem>(`/rekam-medis/kunjungan/${id}`),
  lab: () => get<LabItem[]>('/rekam-medis/lab'),
  labDetail: (id: string) => get<LabDetail>(`/rekam-medis/lab/${id}`),
  resep: () => get<ResepItem[]>('/rekam-medis/resep'),
  alergi: () => get<Alergi[]>('/rekam-medis/alergi'),

  // --- tagihan & pembayaran
  tagihan: () => get<Tagihan[]>('/tagihan'),
  tagihanDetail: (id: string) => get<TagihanDetail>(`/tagihan/${id}`),
  bayar: (id: string, metode: PayMetode, bank?: string) => post<Pembayaran>(`/tagihan/${id}/bayar`, { metode, bank }),
  riwayatPembayaran: () => get<Pembayaran[]>('/pembayaran'),
  pembayaran: (id: string) => get<Pembayaran>(`/pembayaran/${id}`),
  simulasiBayar: (id: string) => post<Pembayaran>(`/pembayaran/${id}/simulasi-bayar`),
};
