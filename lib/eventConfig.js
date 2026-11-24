/* =========================================================
   KONFIGURASI ACARA - dipakai bersama oleh client & server
   (satu sumber kebenaran untuk target misi dan batas pemenang;
   data tiap acara disimpan per penyelenggara di server)
   ========================================================= */

export const KATEGORI_ACARA = ["Pendidikan", "Lingkungan", "Komunitas", "Teknologi", "Budaya", "Olahraga", "Lainnya"];

/* Reward bawaan, berurutan dari peringkat 1: tiap tingkat berlaku untuk `jumlah` peserta berikutnya.
   3 peserta teratas mendapat hadiah utama, 20 peserta di bawahnya mendapat voucher (peringkat 4-23).
   Penyelenggara bisa mengubahnya di Detail Event. */
export const REWARD_BAWAAN = [
  { nama: "Goodie bag + merch event", jumlah: 3 },
  { nama: "Voucher expo event Rp10.000–Rp15.000", jumlah: 20 },
];
export const BATAS_REWARD = { tingkat: 5, jumlahPerTingkat: 100, total: 200, panjangNama: 80 };

export const NAMA_MISI_PENDEK = ["Lingkungan gedung D", "Lokasi utama acara", "Jarak 500m dari lokasi"];

/* target emisi karbon (gCO2e) per misi */
export const MISI_AWAL = [
  { id: 1, teks: "Kurangi emisi karbon di sekitar lingkungan gedung D!", target: 1500, capai: 0 },
  { id: 2, teks: "Kurangi emisi karbon di lokasi utama acara!", target: 500, capai: 0 },
  { id: 3, teks: "Kurangi emisi karbon pada lokasi dengan jarak 500m dari lokasi utama acara", target: 1500, capai: 0 },
];
export const TOTAL_TARGET = MISI_AWAL.reduce((a, m) => a + m.target, 0);
