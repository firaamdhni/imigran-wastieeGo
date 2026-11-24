import { BATAS_REWARD, KATEGORI_ACARA } from "../eventConfig.js";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;
const POLA_JAM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * DetailAcaraService - aturan murni untuk data detail acara (tanpa akses file/jaringan):
 * validasi isian "Detail Event", format tanggal/jam bahasa Indonesia, dan validasi daftar reward.
 */
export class DetailAcaraService {
  tanggalSah(t) {
    const m = POLA_TANGGAL.exec(t);
    if (!m) return false;
    const [th, bl, tg] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const d = new Date(Date.UTC(th, bl - 1, tg));
    return d.getUTCFullYear() === th && d.getUTCMonth() === bl - 1 && d.getUTCDate() === tg;
  }

  formatTanggal(t) {
    if (!this.tanggalSah(t)) return "";
    const [th, bl, tg] = t.split("-").map(Number);
    return `${tg} ${BULAN[bl - 1]} ${th}`;
  }

  /* "08:00" -> "08.00" (gaya penulisan jam yang dipakai aplikasi) */
  formatJam(j) {
    return POLA_JAM.test(j) ? j.replace(":", ".") : "";
  }

  /* teks waktu tampilan, mis. "24 Agustus 2025, 08.00 - 15.00". Tanpa isian baru, teks lama dipertahankan. */
  formatWaktu({ tanggal = "", waktuMulai = "", waktuSelesai = "" }, cadangan = "") {
    const jam = [this.formatJam(waktuMulai), this.formatJam(waktuSelesai)].filter(Boolean).join(" - ");
    const teks = [this.formatTanggal(tanggal), jam].filter(Boolean).join(", ");
    return teks || cadangan;
  }

  /* mengambil jam dari teks bebas lama seperti "08.00 - 17.00" supaya formulir terisi otomatis */
  uraiJam(teks) {
    const m = /(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/.exec(String(teks ?? ""));
    if (!m) return {};
    const jam = (h, mnt) => `${String(h).padStart(2, "0")}:${mnt}`;
    const mulai = jam(m[1], m[2]), selesai = jam(m[3], m[4]);
    return POLA_JAM.test(mulai) && POLA_JAM.test(selesai) ? { mulai, selesai } : {};
  }

  /** daftar reward berurutan dari peringkat 1: [{ nama, jumlah }] */
  validasiReward(input) {
    const { tingkat, jumlahPerTingkat, total, panjangNama } = BATAS_REWARD;
    if (!Array.isArray(input) || input.length < 1 || input.length > tingkat) {
      return { ok: false, error: `Reward harus terdiri dari 1 sampai ${tingkat} tingkat.` };
    }
    const reward = [];
    let jumlahTotal = 0;
    for (const [i, r] of input.entries()) {
      const nama = typeof r?.nama === "string" ? r.nama.trim() : "";
      const jumlah = Number(r?.jumlah);
      if (!nama || nama.length > panjangNama) return { ok: false, error: `Nama reward tingkat ${i + 1} wajib diisi (maksimal ${panjangNama} karakter).` };
      if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > jumlahPerTingkat) {
        return { ok: false, error: `Jumlah penerima tingkat ${i + 1} harus bilangan bulat 1 sampai ${jumlahPerTingkat}.` };
      }
      jumlahTotal += jumlah;
      reward.push({ nama, jumlah });
    }
    if (jumlahTotal > total) return { ok: false, error: `Total penerima reward maksimal ${total} orang.` };
    return { ok: true, reward };
  }

  /** validasi daftar misi acara: [{ id, teks, target }] */
  validasiMisi(input) {
    if (!Array.isArray(input) || input.length < 1 || input.length > 5) {
      return { ok: false, error: "Jumlah misi acara harus antara 1 sampai 5 misi." };
    }
    const misi = [];
    for (const [i, m] of input.entries()) {
      const teks = typeof m?.teks === "string" ? m.teks.trim() : "";
      const target = Number(m?.target);
      if (!teks || teks.length > 150) {
        return { ok: false, error: `Deskripsi Misi ${i + 1} wajib diisi (maksimal 150 karakter).` };
      }
      if (!Number.isInteger(target) || target < 50 || target > 50_000) {
        return { ok: false, error: `Target emisi Misi ${i + 1} harus antara 50 sampai 50.000 gCO₂e.` };
      }
      misi.push({
        id: i + 1,
        teks,
        target,
      });
    }
    return { ok: true, misi };
  }

  /** validasi isian Detail Event; reward & misi boleh tidak dikirim (berarti tidak diubah) */
  validasi(b) {
    const teks = (v) => (typeof v === "string" ? v.trim() : "");
    const d = {
      nama: teks(b.nama),
      deskripsiSingkat: teks(b.deskripsiSingkat),
      kategori: teks(b.kategori),
      tanggal: teks(b.tanggal),
      waktuMulai: teks(b.waktuMulai),
      waktuSelesai: teks(b.waktuSelesai),
      lokasi: teks(b.lokasi),
      detail: teks(b.detail),
    };
    if (!d.nama || d.nama.length > 80) return { ok: false, error: "Nama event wajib diisi (maksimal 80 karakter)." };
    if (d.deskripsiSingkat.length > 120) return { ok: false, error: "Deskripsi singkat maksimal 120 karakter." };
    if (d.kategori && !KATEGORI_ACARA.includes(d.kategori)) return { ok: false, error: "Kategori event tidak dikenal." };
    if (d.tanggal && !this.tanggalSah(d.tanggal)) return { ok: false, error: "Tanggal event tidak valid." };
    if ((d.waktuMulai && !POLA_JAM.test(d.waktuMulai)) || (d.waktuSelesai && !POLA_JAM.test(d.waktuSelesai))) {
      return { ok: false, error: "Format waktu mulai/selesai tidak valid." };
    }
    if (!d.lokasi || d.lokasi.length > 120) return { ok: false, error: "Lokasi wajib diisi (maksimal 120 karakter)." };
    if (d.detail.length > 1000) return { ok: false, error: "Detail event maksimal 1000 karakter." };
    if (b.reward !== undefined) {
      const r = this.validasiReward(b.reward);
      if (!r.ok) return r;
      d.reward = r.reward;
    }
    if (b.misi !== undefined) {
      const m = this.validasiMisi(b.misi);
      if (!m.ok) return m;
      d.misi = m.misi;
    }
    return { ok: true, data: d };
  }
}

export const detailAcaraService = new DetailAcaraService();
