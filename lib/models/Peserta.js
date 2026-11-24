import { MISI_AWAL, TOTAL_TARGET } from "../eventConfig.js";

const HASIL_VERIFIKASI = ["asli", "tidak_asli"];
const POLA_BERKAS = /^[a-f0-9]{20}\.jpg$/;

const rapikanVerifikasi = (v) =>
  v && HASIL_VERIFIKASI.includes(v.hasil) ? { hasil: v.hasil, waktu: Number(v.waktu) || 0 } : null;

/**
 * Peserta - Domain Model OOP untuk peserta yang bergabung di sebuah acara.
 * Mengenkapsulasi capaian misi, aktivitas (setoran) yang diunggah, hasil verifikasi,
 * dan perhitungan skor yang dipakai penyelenggara.
 */
export class Peserta {
  constructor({ id, nama, bergabungPada = Date.now(), capai = [], terakhirAktif = null, demo = false, aktivitas = [], penilaian = null, klaim = {}, misi = null }) {
    this.id = id || Peserta.normalisasiId(nama);
    this.nama = nama || "Tanpa nama";
    this.bergabungPada = Number(bergabungPada) || Date.now();
    const daftarMisi = Array.isArray(misi) && misi.length ? misi : null;
    if (daftarMisi) {
      this.capai = daftarMisi.map((m, i) => Math.min(m.target, Math.max(0, Number(capai[i]) || 0)));
      this.daftarMisi = daftarMisi;
    } else if (Array.isArray(capai) && capai.length) {
      this.capai = capai.map((c) => Math.max(0, Number(c) || 0));
      this.daftarMisi = null;
    } else {
      this.capai = MISI_AWAL.map(() => 0);
      this.daftarMisi = null;
    }
    this.terakhirAktif = terakhirAktif;
    this.demo = Boolean(demo); // penanda internal data uji coba (supaya bisa dihapus), tidak ditampilkan
    this.aktivitas = (Array.isArray(aktivitas) ? aktivitas : []).map(Peserta.rapikanAktivitas);
    this.penilaian = Peserta.rapikanPenilaian(penilaian);
    this.peringkat = null; // diisi oleh EvaluasiService.urutkan()
    this.klaim = Peserta.rapikanKlaim(klaim);
  }

  static rapikanKlaim(klaim) {
    if (!klaim || typeof klaim !== "object") return {};
    const hasil = {};
    for (const [kunci, val] of Object.entries(klaim)) {
      if (val && typeof val === "object") {
        hasil[kunci] = {
          kode: String(val.kode || ""),
          diklaim: Boolean(val.diklaim),
          diklaimPada: val.diklaimPada ? Number(val.diklaimPada) : null,
          reward: String(val.reward || "Reward Penyelesaian Misi Lingkungan"),
        };
      }
    }
    return hasil;
  }

  /* ---------- aktivitas & verifikasi ---------- */
  static rapikanAktivitas(a) {
    const v1 = rapikanVerifikasi(a.v1);
    return {
      id: String(a.id),
      jenis: String(a.jenis || "Umum"),
      nama: String(a.nama || "Sampah"),
      emisi: Math.max(0, Number(a.emisi) || 0),
      timestamp: Number(a.timestamp) || 0,
      foto: a.foto === "demo" || POLA_BERKAS.test(String(a.foto)) ? a.foto : null, // nama berkas foto, "demo", atau tanpa foto
      v1,
      v2: v1?.hasil === "asli" ? rapikanVerifikasi(a.v2) : null, // Verifikasi 2 hanya berlaku setelah Verifikasi 1 = asli
    };
  }

  /* "ditolak" = salah satu verifikasi menyatakan tidak asli; "terverifikasi" = kedua-duanya asli.
     Sisanya "menunggu", kecuali peserta sudah dinilai penyelenggara: aktivitas yang tidak ditolak dianggap "diterima",
     jadi setelah dinilai tidak ada lagi aktivitas yang berstatus menunggu. */
  static statusAktivitas(a, sudahDinilai = false) {
    if (a.v1?.hasil === "tidak_asli" || a.v2?.hasil === "tidak_asli") return "ditolak";
    if (a.v1?.hasil === "asli" && a.v2?.hasil === "asli") return "terverifikasi";
    return sudahDinilai ? "diterima" : "menunggu";
  }

  static rapikanPenilaian(p) {
    if (!p) return null;
    if (p.mode === "otomatis") return { mode: "otomatis", nilai: null, catatan: String(p.catatan || ""), waktu: Number(p.waktu) || 0 };
    if (p.mode === "manual" && Number.isFinite(Number(p.nilai))) {
      return { mode: "manual", nilai: Math.max(0, Math.round(Number(p.nilai))), catatan: String(p.catatan || ""), waktu: Number(p.waktu) || 0 };
    }
    return null;
  }

  hitungStatus() {
    const n = { terverifikasi: 0, ditolak: 0, menunggu: 0, diterima: 0 };
    const dinilai = this.penilaian !== null;
    this.aktivitas.forEach((a) => { n[Peserta.statusAktivitas(a, dinilai)]++; });
    return n;
  }

  /* ---------- skor ---------- */
  /* skor otomatis = total emisi aktivitas yang tidak ditolak saat verifikasi */
  getSkorOtomatis() {
    return this.aktivitas.reduce((s, a) => s + (Peserta.statusAktivitas(a) === "ditolak" ? 0 : a.emisi), 0);
  }

  /* skor akhir = nilai manual bila penyelenggara memberikannya, selain itu skor otomatis */
  getSkorAkhir() {
    return this.penilaian?.mode === "manual" ? this.penilaian.nilai : this.getSkorOtomatis();
  }

  getSkor() {
    return this.getSkorAkhir();
  }

  getJumlahAktivitas() {
    return this.aktivitas.length;
  }

  getJumlahDihitung() {
    return this.aktivitas.filter((a) => Peserta.statusAktivitas(a) !== "ditolak").length;
  }

  /* "belum" | "otomatis" | "manual" */
  getStatusPenilaian() {
    return this.penilaian?.mode || "belum";
  }

  /* ---------- misi ---------- */
  getTotalCapai() {
    return this.capai.reduce((a, v) => a + v, 0);
  }

  getPersentaseMisi() {
    const totalTarget = this.daftarMisi
      ? this.daftarMisi.reduce((a, m) => a + (m.target || 0), 0)
      : TOTAL_TARGET;
    return Math.min(100, Math.round((this.getTotalCapai() / (totalTarget || 1)) * 100));
  }

  getMisiSelesai() {
    if (this.daftarMisi) {
      return this.capai.filter((v, i) => v >= (this.daftarMisi[i]?.target || 1000)).length;
    }
    return this.capai.filter((v, i) => v >= (MISI_AWAL[i]?.target || 1000)).length;
  }

  /* ---------- klaim reward ---------- */
  isMisiDiklaim(misiId) {
    return Boolean(this.klaim?.[misiId]?.diklaim);
  }

  getKlaimInfo(misiId) {
    return this.klaim?.[misiId] || null;
  }

  getJumlahKlaim() {
    return Object.values(this.klaim || {}).filter((k) => k.diklaim).length;
  }

  /* ---------- bentuk data ---------- */
  /* bentuk yang disimpan ke database */
  toJSON() {
    return {
      id: this.id,
      nama: this.nama,
      bergabungPada: this.bergabungPada,
      capai: this.capai,
      terakhirAktif: this.terakhirAktif,
      demo: this.demo,
      aktivitas: this.aktivitas,
      penilaian: this.penilaian,
      klaim: this.klaim,
    };
  }

  /* bentuk ringkas untuk daftar/leaderboard di panel (tanpa daftar aktivitas) */
  toTampilan() {
    return {
      id: this.id,
      nama: this.nama,
      bergabungPada: this.bergabungPada,
      terakhirAktif: this.terakhirAktif,
      peringkat: this.peringkat,
      persentase: this.getPersentaseMisi(),
      misiSelesai: this.getMisiSelesai(),
      totalMisi: this.daftarMisi ? this.daftarMisi.length : this.capai.length || MISI_AWAL.length,
      skor: this.getSkorAkhir(),
      skorOtomatis: this.getSkorOtomatis(),
      jumlahAktivitas: this.getJumlahAktivitas(),
      ...this.hitungStatus(),
      statusPenilaian: this.getStatusPenilaian(),
      nilaiManual: this.penilaian?.mode === "manual" ? this.penilaian.nilai : null,
      catatan: this.penilaian?.catatan || "",
      klaim: this.klaim,
      jumlahKlaim: this.getJumlahKlaim(),
    };
  }

  /* daftar aktivitas untuk halaman periksa (terbaru di atas), fotoUrl diarahkan ke route foto milik penyelenggara */
  toDaftarAktivitas() {
    return [...this.aktivitas]
      .sort((x, y) => y.timestamp - x.timestamp)
      .map((a) => ({
        id: a.id, jenis: a.jenis, nama: a.nama, emisi: a.emisi, timestamp: a.timestamp,
        v1: a.v1, v2: a.v2, status: Peserta.statusAktivitas(a, this.penilaian !== null),
        fotoUrl: a.foto ? `/api/penyelenggara/foto?peserta=${encodeURIComponent(this.id)}&id=${encodeURIComponent(a.id)}` : null,
      }));
  }

  static fromJSON(data) {
    return new Peserta(data);
  }

  /* kunci unik peserta dari nama pengguna; prefiks "u:" mencegah kunci seperti "__proto__" */
  static normalisasiId(nama) {
    return "u:" + String(nama ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  }
}
