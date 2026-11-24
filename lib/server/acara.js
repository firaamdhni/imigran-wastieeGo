import crypto from "node:crypto";
import { GalatAplikasi } from "./http.js";
import { MISI_AWAL, REWARD_BAWAAN } from "../eventConfig.js";
import { detailAcaraService } from "../services/DetailAcaraService.js";

const BATAS_PESERTA = 5000;
const HURUF_KODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa I, O, 0, 1 agar tidak membingungkan

export const punya = (obj, kunci) => Object.prototype.hasOwnProperty.call(obj, kunci);

/* kode acara selalu huruf besar tanpa spasi/simbol, jadi "k7m 2qx" == "K7M2QX" */
export const normalisasiKode = (k) => String(k ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export function buatKodeAcara(db) {
  for (let i = 0; i < 50; i++) {
    let k = "";
    for (let j = 0; j < 6; j++) k += HURUF_KODE[crypto.randomInt(HURUF_KODE.length)];
    if (!punya(db.acara, k)) return k;
  }
  throw new GalatAplikasi("Gagal membuat kode acara. Coba lagi.", 500);
}

/* penyelenggara + acara miliknya; 401 jika akun sudah tidak ada */
export function acaraMilik(db, penyelenggaraId) {
  const p = punya(db.penyelenggara, penyelenggaraId) ? db.penyelenggara[penyelenggaraId] : null;
  const a = p && punya(db.acara, p.kodeAcara) ? db.acara[p.kodeAcara] : null;
  if (!p || !a) throw new GalatAplikasi("Akun penyelenggara tidak ditemukan. Silakan masuk lagi.", 401);
  return { p, a };
}

export function cariAcara(db, kode) {
  const k = normalisasiKode(kode);
  if (!k || !punya(db.acara, k)) throw new GalatAplikasi("Kode acara tidak ditemukan. Periksa lagi kode dari penyelenggara.", 404);
  return db.acara[k];
}

/* ---------- validasi masukan peserta ---------- */
export function bersihkanNama(nama) {
  const n = typeof nama === "string" ? nama.trim().replace(/\s+/g, " ") : "";
  if (!n || n.length > 40) throw new GalatAplikasi("Nama peserta tidak valid.");
  return n;
}

export const angkaAman = (v, maks) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(maks, Math.max(0, n)) : 0;
};

/* Buat/perbarui peserta di sebuah acara. Capaian misi hanya boleh naik (maks lama vs baru),
   jadi permintaan yang diulang atau data lokal yang direset tidak menurunkan progres. */
export function catatPeserta(a, id, nama, { capai = [] } = {}) {
  if (a.status === "selesai") throw new GalatAplikasi("Acara ini sudah selesai.", 409);
  const sekarang = Date.now();
  const daftarMisi = misiAcara(a);
  let p = punya(a.peserta, id) ? a.peserta[id] : null;
  if (!p) {
    if (Object.keys(a.peserta).length >= BATAS_PESERTA) throw new GalatAplikasi("Kuota peserta acara ini penuh.", 409);
    p = a.peserta[id] = { id, nama, bergabungPada: sekarang, capai: daftarMisi.map(() => 0), aktivitas: [], penilaian: null, klaim: {} };
  }
  p.aktivitas ??= [];
  p.penilaian ??= null;
  p.klaim ??= {};
  p.nama = nama;
  p.capai = daftarMisi.map((m, i) => Math.max(p.capai?.[i] || 0, Math.round(angkaAman(capai[i], m.target))));
  p.terakhirAktif = sekarang;
  return p;
}

/* data acara yang aman dibagikan ke peserta & tampilan */
export const infoAcara = (a) => {
  const jam = detailAcaraService.uraiJam(a.waktu); // acara lama menyimpan waktu sebagai teks bebas, mis. "08.00 - 17.00"
  return {
    kode: a.kode, nama: a.nama, waktu: a.waktu, lokasi: a.lokasi, detail: a.detail, status: a.status, selesaiPada: a.selesaiPada,
    deskripsiSingkat: a.deskripsiSingkat || "", kategori: a.kategori || "", tanggal: a.tanggal || "",
    waktuMulai: a.waktuMulai || jam.mulai || "", waktuSelesai: a.waktuSelesai || jam.selesai || "",
    adaSampul: Boolean(a.sampul),
    misi: misiAcara(a),
  };
};

/* semua acara yang dibuat oleh satu penyelenggara */
export function daftarAcaraPenyelenggara(db, p) {
  const list = Object.values(db.acara || {}).filter((a) => a.penyelenggaraId === p.id);
  list.sort((x, y) => (y.dibuatPada || 0) - (x.dibuatPada || 0));
  return list.map((a) => ({
    kode: a.kode,
    nama: a.nama,
    status: a.status,
    dibuatPada: a.dibuatPada,
    aktif: a.kode === p.kodeAcara,
  }));
}

/* misi acara: kustomisasi penyelenggara, atau misi bawaan MISI_AWAL */
export const misiAcara = (a) =>
  Array.isArray(a?.misi) && a.misi.length
    ? a.misi.map((m, i) => ({ id: Number(m.id) || i + 1, teks: String(m.teks || ""), target: Number(m.target) || 1000 }))
    : MISI_AWAL;

/* reward acara: bawaan (3 hadiah utama + 20 voucher) sampai penyelenggara mengubahnya */
export const rewardAcara = (a) =>
  (Array.isArray(a.reward) && a.reward.length ? a.reward : REWARD_BAWAAN).map((r) => ({ nama: r.nama, jumlah: r.jumlah }));

/* ---------- Klaim reward per misi ---------- */
export function ambilAtauBuatKlaimMisi(a, p, misiId) {
  const mId = Number(misiId);
  const daftarMisi = misiAcara(a);
  const misiIndex = daftarMisi.findIndex((m) => m.id === mId);
  if (misiIndex < 0) throw new GalatAplikasi("Misi tidak ditemukan.", 404);

  const target = daftarMisi[misiIndex].target;
  const capai = p.capai?.[misiIndex] || 0;
  if (capai < target) {
    throw new GalatAplikasi(`Misi ${mId} belum selesai. Progres saat ini ${capai}/${target} gCO₂e.`, 400);
  }

  p.klaim ??= {};
  let k = p.klaim[mId];
  if (!k || !k.kode) {
    const acak = crypto.randomBytes(3).toString("hex").toUpperCase();
    const kode = `CLM-${a.kode}-M${mId}-${acak}`;
    k = p.klaim[mId] = {
      kode,
      diklaim: false,
      diklaimPada: null,
      reward: "Reward Penyelesaian Misi Lingkungan",
    };
  }
  return {
    ...k,
    misiId: mId,
    teksMisi: daftarMisi[misiIndex].teks,
    target,
    capai,
  };
}

export function prosesKlaimReward(a, kodeKlaim) {
  const kodeBersih = String(kodeKlaim || "").trim().toUpperCase();
  if (!kodeBersih) throw new GalatAplikasi("Kode klaim tidak boleh kosong.", 400);
  const daftarMisi = misiAcara(a);

  // Cari peserta dan misiId yang memiliki kode ini
  for (const p of Object.values(a.peserta || {})) {
    if (!p.klaim) continue;
    for (const [mId, k] of Object.entries(p.klaim)) {
      if (k.kode && k.kode.toUpperCase() === kodeBersih) {
        const misiId = Number(mId);
        const teksMisi = daftarMisi.find((m) => m.id === misiId)?.teks || `Misi ${misiId}`;

        if (k.diklaim) {
          return {
            sudahDiklaim: true,
            error: "QR Code ini SUDAH PERNAH DIKLAIM!",
            peserta: { id: p.id, nama: p.nama },
            misiId,
            teksMisi,
            reward: k.reward || "Reward Penyelesaian Misi Lingkungan",
            diklaimPada: k.diklaimPada,
          };
        }

        // Tandai klaim
        k.diklaim = true;
        k.diklaimPada = Date.now();

        return {
          sukses: true,
          pesan: "Hadiah berhasil diklaim!",
          peserta: { id: p.id, nama: p.nama },
          misiId,
          teksMisi,
          reward: k.reward || "Reward Penyelesaian Misi Lingkungan",
          diklaimPada: k.diklaimPada,
        };
      }
    }
  }

  throw new GalatAplikasi("Kode klaim tidak valid atau tidak terdaftar pada acara ini.", 404);
}
