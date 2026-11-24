import { bacaDb, ubahDb } from "@/lib/server/db";
import { bacaBody, jawab, tangani, GalatAplikasi } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik, prosesKlaimReward } from "@/lib/server/acara";
import { MISI_AWAL } from "@/lib/eventConfig";

export const dynamic = "force-dynamic";

/* Mengambil daftar semua reward misi yang telah diklaim di acara penyelenggara */
export const GET = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const { a } = acaraMilik(await bacaDb(), id);

  const riwayatKlaim = [];
  for (const p of Object.values(a.peserta || {})) {
    if (!p.klaim) continue;
    for (const [mId, k] of Object.entries(p.klaim)) {
      const misiId = Number(mId);
      const m = MISI_AWAL.find((x) => x.id === misiId);
      riwayatKlaim.push({
        pesertaId: p.id,
        pesertaNama: p.nama,
        misiId,
        misiTeks: m?.teks || `Misi ${misiId}`,
        kode: k.kode,
        diklaim: Boolean(k.diklaim),
        diklaimPada: k.diklaimPada,
        reward: k.reward || "Reward Penyelesaian Misi Lingkungan",
      });
    }
  }

  // Urutkan yang sudah diklaim terlebih dahulu (terbaru di atas)
  riwayatKlaim.sort((x, y) => (y.diklaimPada || 0) - (x.diklaimPada || 0));

  return jawab({ ok: true, riwayatKlaim });
});

/* Memproses scan QR klaim reward dari peserta (instan tanpa input ulang) */
export const POST = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const b = await bacaBody(request);
  const kodeKlaim = b.kodeKlaim;

  if (!kodeKlaim) {
    throw new GalatAplikasi("Kode klaim wajib diisi.", 400);
  }

  const hasil = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    return prosesKlaimReward(a, kodeKlaim);
  });

  if (hasil.sudahDiklaim) {
    return jawab({ ok: false, sudahDiklaim: true, error: hasil.error, data: hasil }, 400);
  }

  return jawab({ ok: true, data: hasil });
});
