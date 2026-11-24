import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { buatKodeAcara, acaraMilik } from "@/lib/server/acara";
import { MISI_AWAL, REWARD_BAWAAN } from "@/lib/eventConfig";

export const dynamic = "force-dynamic";

const teks = (v, maks) => (typeof v === "string" && v.trim().length <= maks ? v.trim() : "");

/* Penyelenggara membuat event baru menggunakan akun yang sama */
export const POST = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const b = await bacaBody(request);

  const nama = teks(b.nama, 80);
  const waktu = teks(b.waktu, 80);
  const lokasi = teks(b.lokasi, 120);
  const detail = teks(b.detail, 500);

  if (!nama) throw new GalatAplikasi("Nama event wajib diisi.", 400);
  if (!lokasi) throw new GalatAplikasi("Lokasi event wajib diisi.", 400);

  const hasil = await ubahDb((db) => {
    const { p } = acaraMilik(db, id);
    const kode = buatKodeAcara(db);
    const sekarang = Date.now();

    db.acara[kode] = {
      kode,
      penyelenggaraId: p.id,
      nama,
      waktu: waktu || "Waktu acara",
      lokasi,
      detail: detail || "",
      status: "berlangsung",
      selesaiPada: null,
      dibuatPada: sekarang,
      misi: [...MISI_AWAL],
      reward: [...REWARD_BAWAAN],
      peserta: {},
      pemenang: [],
    };

    // Jadikan acara ini sebagai acara aktif
    p.kodeAcara = kode;

    return { kode, nama };
  });

  return jawab({ ok: true, pesan: "Event baru berhasil dibuat!", ...hasil }, 201);
});
