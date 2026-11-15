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
  kuota: number; terpakai: number; sisa_kuota: number | null; penuh: boolean; perkiraan_dilayani: string | null;
};
export type Jadwal = { tanggal: string; bisa_daftar: boolean; libur: string | null; dokter: DokterJadwal[] };

export type CaraBayar = { jenis: ('BPJS' | 'UMUM' | 'ASURANSI')[]; asuransi: { id: string; nama_perusahaan: string }[] };
export type CaraBayarJenis = CaraBayar['jenis'][number];

export type Antrian = {
  id: string; kode_pendaftaran: string | null; nomor: string; poliklinik: string | null; dokter: string | null;
  tanggal: string | null; jam_daftar: string | null; cara_bayar: string | null; status: string;
  hari_ini: boolean; sudah_dipanggil: boolean; sudah_checkin: boolean; qr: string;
};
export type PosisiChip = { nomor: string; jenis: 'dilayani' | 'menunggu' | 'saya' };
export type AntrianStatus = {
  nomor_saya: string; nomor_dipanggil: number | null; antrian_di_depan: number;
  estimasi_menit: number; status: string; sudah_dipanggil: boolean;
  tanggal: string; hari_ini: boolean;
  rata_rata_menit: number;
  perkiraan_dipanggil: { dari: string; sampai: string; menit: number } | null;
  posisi: PosisiChip[];
  checkin: { sudah: boolean; jam: string | null };
  lokasi: string | null;
};
export type Preferensi = { wa_giliran_dekat: boolean; wa_jadwal_berubah: boolean };

export type Beranda = {
  rs: string | null; nama: string | null; nomor_rm: string | null;
  antrian_aktif: { id: string; nomor: string; poliklinik: string | null; dokter: string | null; status: string } | null;
  antrian_mendatang: { id: string; nomor: string; tanggal: string; poliklinik: string | null; dokter: string | null } | null;
};

export type Diagnosa = { kode: string; nama: string };
export type KunjunganItem = { id: string; tanggal: string | null; poliklinik: string | null; dokter: string | null; jenis: string; diagnosa: Diagnosa[] };
export type KunjunganList = { items: KunjunganItem[]; page: number; last_page: number };
export type ResepItem = { nama: string; jumlah: number; aturan: string | null; tanggal?: string | null; dokter?: string | null };
export type LabItem = { id: string; tanggal: string; jumlah_indikator: number; jumlah_abnormal: number };
export type LabStatus = 'normal' | 'di_atas' | 'di_bawah' | null;
export type LabDetail = {
  id: string; tanggal: string | null;
  hasil: { nama: string; hasil: string | null; satuan: string | null; nilai_rujukan: string | null; status: LabStatus; abnormal: boolean; catatan: string | null }[];
};

export type Ringkasan = {
  id: string; tanggal: string | null; poliklinik: string | null; dokter: string | null;
  penjelasan_dokter: string | null;
  lab: { nama: string; hasil: string | null; nilai: number | null; satuan: string | null; nilai_rujukan: string | null;
    batas_min: number | null; batas_maks: number | null; status: LabStatus; abnormal: boolean }[];
  lab_baru: boolean;
  obat: { nama: string; jumlah: number; aturan: string | null }[];
  kontrol_berikutnya: string | null;
  tersinkron_satusehat: boolean;
};

export type Tahap = {
  kode: string; label: string; keterangan: string; selesai: boolean; state: 'selesai' | 'sekarang' | 'menunggu';
  lokasi?: string | null; antrian_id?: string;
};
export type ResepStatus = {
  nomor: string | null; status: 'diterima' | 'disiapkan' | 'siap' | 'diserahkan'; status_label: string; langkah: 1 | 2 | 3;
  jam_diterima: string | null; jam_disiapkan: string | null; jam_diambil: string | null;
  jumlah_obat: number; jumlah_racik: number; item: { nama: string; jumlah: number; aturan: string | null }[];
};
export type KunjunganHariIni = {
  tanggal: string; pendaftaran_id: string; tahap_selesai: number; tahap_total: number; tahapan: Tahap[]; resep: ResepStatus | null;
};
export type Alergi = { jenis: string; nama: string; keterangan: string | null };

export type Tagihan = { id: string; invoice: string | null; tanggal: string | null; poliklinik: string | null; total: number; status: 'belum_bayar' | 'lunas' };
export type TagihanDetail = Tagihan & {
  items: { label: string; kategori: string; jumlah: number; harga: number; subtotal: number }[];
  kelompok: { nama: string; total: number }[];
};

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
