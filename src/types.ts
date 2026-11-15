// Bentuk data dari API /api/mobile/v1 (lihat docs/rencana_api_mobile.md di repo kliksimrs).

export type Profil = {
  id: string; pasien_id: string; nama: string; inisial: string; nomor_rm: string | null;
  nik: string | null; nomor_bpjs: string | null; tanggal_lahir: string | null; umur: number | null;
  jenis_kelamin: string | null; nomor_hp: string | null; email: string | null; alamat: string | null;
};

export type AuthResult = { token: string; token_type: string; expires_in: number; profil: Profil; pasien_baru?: boolean };

export type Poliklinik = { id: string; nama: string; nomor_poli: string | null; keterangan: string | null };

export type DokterJadwal = {
  dokter_id: string; nama: string; spesialis: string | null; jam: string;
  kuota: number; terpakai: number; sisa_kuota: number | null;
};
export type Jadwal = { tanggal: string; bisa_daftar: boolean; dokter: DokterJadwal[] };

export type CaraBayar = { jenis: ('BPJS' | 'UMUM' | 'ASURANSI')[]; asuransi: { id: string; nama_perusahaan: string }[] };
export type CaraBayarJenis = CaraBayar['jenis'][number];

export type Antrian = {
  id: string; kode_pendaftaran: string | null; nomor: string; poliklinik: string | null; dokter: string | null;
  tanggal: string | null; jam_daftar: string | null; cara_bayar: string | null; status: string;
  sudah_dipanggil: boolean; qr: string;
};
export type AntrianStatus = {
  nomor_saya: string; nomor_dipanggil: number | null; antrian_di_depan: number;
  estimasi_menit: number; status: string; sudah_dipanggil: boolean;
};

export type Beranda = {
  rs: string | null; nama: string | null; nomor_rm: string | null;
  antrian_aktif: { id: string; nomor: string; poliklinik: string | null; dokter: string | null; status: string } | null;
};

export type Diagnosa = { kode: string; nama: string };
export type KunjunganItem = { id: string; tanggal: string | null; poliklinik: string | null; dokter: string | null; jenis: string; diagnosa: Diagnosa[] };
export type KunjunganList = { items: KunjunganItem[]; page: number; last_page: number };
export type ResepItem = { nama: string; jumlah: number; aturan: string | null; tanggal?: string | null; dokter?: string | null };
export type LabItem = { id: string; tanggal: string; jumlah_indikator: number; jumlah_abnormal: number };
export type LabDetail = {
  id: string; tanggal: string | null;
  hasil: { nama: string; hasil: string | null; satuan: string | null; nilai_rujukan: string | null; abnormal: boolean; catatan: string | null }[];
};
export type Alergi = { jenis: string; nama: string; keterangan: string | null };

export type Tagihan = { id: string; invoice: string | null; tanggal: string | null; poliklinik: string | null; total: number; status: 'belum_bayar' | 'lunas' };
export type TagihanDetail = Tagihan & { items: { label: string; jumlah: number; harga: number; subtotal: number }[] };

export type PayMetode = 'QRIS' | 'VA' | 'EWALLET';
export type Pembayaran = {
  id: string; invoice: string; metode: PayMetode; jumlah: number; status: 'pending' | 'paid' | 'expired';
  gateway: string; payload: { qr_string?: string; bank?: string; va_number?: string; deeplink?: string } | null;
  expires_at: string | null; sisa_detik: number; paid_at: string | null;
};

export type Notifikasi = {
  id: string; tipe: string; judul: string; pesan: string; dibaca: boolean; waktu: string;
  data: { antrian_id?: string; pembayaran_id?: string } | null;
};
export type NotifikasiList = { belum_dibaca: number; items: Notifikasi[] };
