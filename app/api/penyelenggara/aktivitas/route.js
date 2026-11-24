import { bacaDb, ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik } from "@/lib/server/acara";
import { ambilPeserta, bangunDetail } from "@/lib/server/detail";
import { evaluasiService } from "@/lib/services/EvaluasiService";

export const dynamic = "force-dynamic";

/* riwayat aktivitas (setoran + foto) yang diunggah satu peserta, lengkap dengan status verifikasinya */
export const GET = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const { a } = acaraMilik(await bacaDb(), id);
  return jawab(bangunDetail(a, request.nextUrl.searchParams.get("peserta")));
});

/* verifikasi satu aktivitas: tahap 1 atau 2, hasil "asli" | "tidak_asli" | null (batalkan) */
export const PATCH = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const b = await bacaBody(request);
  const detail = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    if (a.status === "selesai") throw new GalatAplikasi("Evaluasi sudah dikunci. Buka kembali evaluasi untuk mengubah verifikasi.", 409);
    const p = ambilPeserta(a, b.pesertaId);
    const aktivitas = (p.aktivitas || []).find((z) => z.id === b.aktivitasId);
    if (!aktivitas) throw new GalatAplikasi("Aktivitas tidak ditemukan.", 404);
    const v = evaluasiService.terapkanVerifikasi(aktivitas, b.tahap, b.hasil === undefined ? null : b.hasil);
    if (!v.ok) throw new GalatAplikasi(v.error, 400);
    return bangunDetail(a, b.pesertaId);
  });
  return jawab(detail);
});
