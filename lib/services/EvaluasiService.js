/**
 * EvaluasiService - Service layer untuk evaluasi hasil acara:
 * mengurutkan peserta (leaderboard), merangkum statistik, dan memvalidasi pilihan pemenang.
 * Fungsinya murni (tanpa akses file/jaringan) sehingga mudah diuji.
 */
export class EvaluasiService {
  getKriteria() {
    return [
      "Skor otomatis: total emisi karbon (gCO₂e) dari aktivitas peserta yang tidak ditolak saat verifikasi.",
      "Setiap aktivitas dicek dua kali (Verifikasi 1 dan Verifikasi 2) apakah asli atau tidak. Aktivitas yang dinyatakan tidak asli tidak dihitung.",
      "Penyelenggara boleh memberi nilai manual. Jika hasil peserta sudah benar, penilaian manual boleh dilewati dan skor otomatis dipakai.",
      "Jika skor sama: peserta dengan lebih banyak misi selesai menang, lalu yang aktivitasnya lebih banyak, lalu yang bergabung lebih dulu.",
      "Pemenang mengikuti peringkat teratas secara otomatis. Reward tiap peringkat diatur di Detail Event.",
    ];
  }

  /** @param {import("../models/Peserta").Peserta[]} daftar */
  urutkan(daftar) {
    const urut = [...daftar].sort(
      (a, b) =>
        b.getSkor() - a.getSkor() ||
        b.getMisiSelesai() - a.getMisiSelesai() ||
        b.getJumlahDihitung() - a.getJumlahDihitung() ||
        a.bergabungPada - b.bergabungPada ||
        a.id.localeCompare(b.id)
    );
    urut.forEach((p, i) => { p.peringkat = i + 1; });
    return urut;
  }

  rangkum(urut) {
    const total = urut.length;
    return {
      total,
      totalEmisi: urut.reduce((s, p) => s + p.getSkor(), 0),
      adaContoh: urut.some((p) => p.demo), // hanya untuk tombol tambah/hapus data uji coba; tidak ditampilkan di baris peserta
      sudahDinilai: urut.filter((p) => p.getStatusPenilaian() !== "belum").length,
      rataProgres: total ? Math.round(urut.reduce((s, p) => s + p.getPersentaseMisi(), 0) / total) : 0,
      selesaiSemua: urut.filter((p) => p.getPersentaseMisi() >= 100).length,
    };
  }

  /**
   * Mengubah hasil verifikasi satu aktivitas (record mentah di database).
   * tahap 1 atau 2; hasil "asli" | "tidak_asli" | null (batalkan).
   * Verifikasi 2 baru bisa diisi setelah Verifikasi 1 = asli; mengubah Verifikasi 1 menjadi bukan "asli" menghapus Verifikasi 2.
   */
  terapkanVerifikasi(aktivitas, tahap, hasil, waktu = Date.now()) {
    if (tahap !== 1 && tahap !== 2) return { ok: false, error: "Tahap verifikasi harus 1 atau 2." };
    if (hasil !== null && hasil !== "asli" && hasil !== "tidak_asli") return { ok: false, error: "Hasil verifikasi harus asli atau tidak asli." };
    const baru = hasil ? { hasil, waktu } : null;
    if (tahap === 1) {
      aktivitas.v1 = baru;
      if (hasil !== "asli") aktivitas.v2 = null;
    } else {
      if (aktivitas.v1?.hasil !== "asli") return { ok: false, error: "Selesaikan Verifikasi 1 (asli) terlebih dahulu." };
      aktivitas.v2 = baru;
    }
    return { ok: true };
  }

  /** mode "otomatis" (lewati penilaian manual) | "manual" (nilai gCO₂e) | null (hapus penilaian) */
  validasiPenilaian(b) {
    if (b.mode === null) return { ok: true, penilaian: null };
    const catatan = typeof b.catatan === "string" ? b.catatan.trim() : "";
    if (catatan.length > 200) return { ok: false, error: "Catatan maksimal 200 karakter." };
    if (b.mode === "otomatis") return { ok: true, penilaian: { mode: "otomatis", nilai: null, catatan } };
    if (b.mode === "manual") {
      const nilai = Number(b.nilai);
      if (b.nilai === "" || b.nilai === null || !Number.isFinite(nilai) || nilai < 0 || nilai > 1_000_000) {
        return { ok: false, error: "Nilai manual harus berupa angka 0 sampai 1.000.000." };
      }
      return { ok: true, penilaian: { mode: "manual", nilai: Math.round(nilai), catatan } };
    }
    return { ok: false, error: "Mode penilaian tidak dikenal." };
  }

  /** reward berurutan -> tingkat dengan rentang peringkat: [{ tingkat, nama, jumlah, dari, sampai }] */
  susunReward(reward) {
    let dari = 1;
    return reward.map((r, i) => {
      const tingkat = { tingkat: i + 1, nama: r.nama, jumlah: r.jumlah, dari, sampai: dari + r.jumlah - 1 };
      dari += r.jumlah;
      return tingkat;
    });
  }

  /**
   * Pemenang mengikuti peringkat teratas secara otomatis; tidak ada pilihan manual.
   * @param urut peserta yang sudah diurutkan (urutkan())
   * @returns {{peringkat:number, pesertaId:string, tingkat:number, reward:string}[]}
   */
  tentukanPemenang(urut, reward) {
    const tingkat = this.susunReward(reward);
    return urut.flatMap((p) => {
      const t = tingkat.find((x) => p.peringkat >= x.dari && p.peringkat <= x.sampai);
      return t ? [{ peringkat: p.peringkat, pesertaId: p.id, tingkat: t.tingkat, reward: t.nama }] : [];
    });
  }
}

export const evaluasiService = new EvaluasiService();
