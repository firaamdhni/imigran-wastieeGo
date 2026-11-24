import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { Peserta } from "@/lib/models/Peserta";
import { bersihkanNama, catatPeserta, cariAcara } from "@/lib/server/acara";
import { dekodeFoto, simpanFoto } from "@/lib/server/foto";

export const dynamic = "force-dynamic";

const MAKS_AKTIVITAS_PER_PESERTA = 300;
const MAKS_BODY_BYTE = 1_000_000;
const POLA_ID = /^[A-Za-z0-9_-]{1,64}$/;
const teks = (v, maks) => (typeof v === "string" ? v.trim().slice(0, maks) : "");

/* Peserta mengunggah satu aktivitas (setoran sampah) + foto buktinya, agar bisa diperiksa penyelenggara.
   Idempotent: id aktivitas yang sama tidak dicatat dua kali. */
export const POST = tangani(async (request) => {
  if (Number(request.headers.get("content-length") || 0) > MAKS_BODY_BYTE) throw new GalatAplikasi("Data terlalu besar.", 413);
  const b = await bacaBody(request);
  const nama = bersihkanNama(b.nama);
  const x = b.aktivitas && typeof b.aktivitas === "object" ? b.aktivitas : {};

  const id = typeof x.id === "string" && POLA_ID.test(x.id) ? x.id : "";
  const emisi = Math.round(Number(x.emisi));
  if (!id) throw new GalatAplikasi("ID aktivitas tidak valid.");
  if (!Number.isFinite(emisi) || emisi < 1 || emisi > 2000) throw new GalatAplikasi("Nilai emisi aktivitas tidak valid.");
  const sekarang = Date.now();
  const waktu = Number.isFinite(Number(x.timestamp)) ? Math.min(Number(x.timestamp), sekarang) : sekarang;
  const foto = x.foto ? dekodeFoto(x.foto) : null;

  const hasil = await ubahDb(async (db) => {
    const a = cariAcara(db, b.kode);
    const p = catatPeserta(a, Peserta.normalisasiId(nama), nama);
    if (p.aktivitas.some((z) => z.id === id)) return { duplikat: true };
    if (p.aktivitas.length >= MAKS_AKTIVITAS_PER_PESERTA) throw new GalatAplikasi("Batas aktivitas per peserta tercapai.", 409);
    p.aktivitas.push({
      id, jenis: teks(x.jenis, 30) || "Umum", nama: teks(x.nama, 60) || "Sampah", emisi, timestamp: waktu,
      foto: foto ? await simpanFoto(a.kode, foto) : null, v1: null, v2: null,
    });
    return { duplikat: false };
  });
  return jawab({ ok: true, ...hasil }, hasil.duplikat ? 200 : 201);
});
