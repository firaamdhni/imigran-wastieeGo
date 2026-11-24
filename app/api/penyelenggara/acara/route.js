import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik, infoAcara, rewardAcara } from "@/lib/server/acara";
import { dekodeFoto, hapusFoto, simpanFoto } from "@/lib/server/foto";
import { detailAcaraService } from "@/lib/services/DetailAcaraService";
import { evaluasiService } from "@/lib/services/EvaluasiService";

export const dynamic = "force-dynamic";

const MAKS_BODY_BYTE = 1_000_000;

/* simpan Detail Event: informasi dasar, waktu & lokasi, detail, foto sampul, dan reward.
   Reward terkunci setelah pemenang ditetapkan (buka kembali evaluasi dulu). */
export const PUT = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  if (Number(request.headers.get("content-length") || 0) > MAKS_BODY_BYTE) throw new GalatAplikasi("Data terlalu besar.", 413);
  const b = await bacaBody(request);
  const v = detailAcaraService.validasi(b);
  if (!v.ok) throw new GalatAplikasi(v.error, 400);
  const d = v.data;
  const sampulBaru = b.sampul ? dekodeFoto(b.sampul) : null;

  const hasil = await ubahDb(async (db) => {
    const { a } = acaraMilik(db, id);
    if (d.reward && a.status === "selesai" && JSON.stringify(d.reward) !== JSON.stringify(rewardAcara(a))) {
      throw new GalatAplikasi("Pemenang sudah ditetapkan. Buka kembali evaluasi untuk mengubah reward.", 409);
    }
    a.nama = d.nama;
    a.deskripsiSingkat = d.deskripsiSingkat;
    a.kategori = d.kategori;
    a.tanggal = d.tanggal;
    a.waktuMulai = d.waktuMulai;
    a.waktuSelesai = d.waktuSelesai;
    a.lokasi = d.lokasi;
    a.detail = d.detail;
    a.waktu = detailAcaraService.formatWaktu(d, a.waktu); // teks tampilan untuk peserta
    if (d.reward) a.reward = d.reward;
    if (d.misi) a.misi = d.misi;
    if (sampulBaru || b.hapusSampul === true) {
      const lama = a.sampul;
      a.sampul = sampulBaru ? await simpanFoto(a.kode, sampulBaru) : null;
      if (lama) await hapusFoto(a.kode, lama);
    }
    return { acara: infoAcara(a), reward: evaluasiService.susunReward(rewardAcara(a)), misi: a.misi || [] };
  });
  return jawab({ ok: true, ...hasil });
});
