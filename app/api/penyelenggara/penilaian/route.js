import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik } from "@/lib/server/acara";
import { ambilPeserta, bangunDetail } from "@/lib/server/detail";
import { evaluasiService } from "@/lib/services/EvaluasiService";

export const dynamic = "force-dynamic";

/* penilaian akhir satu peserta:
   mode "manual"    -> penyelenggara memberi nilai sendiri (gCO₂e)
   mode "otomatis"  -> hasil sudah benar, penilaian manual dilewati (skor otomatis dipakai)
   mode null        -> hapus penilaian */
export const PUT = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const b = await bacaBody(request);
  const detail = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    if (a.status === "selesai") throw new GalatAplikasi("Evaluasi sudah dikunci. Buka kembali evaluasi untuk mengubah penilaian.", 409);
    const p = ambilPeserta(a, b.pesertaId);
    const v = evaluasiService.validasiPenilaian({ mode: b.mode === undefined ? null : b.mode, nilai: b.nilai, catatan: b.catatan });
    if (!v.ok) throw new GalatAplikasi(v.error, 400);
    p.penilaian = v.penilaian ? { ...v.penilaian, waktu: Date.now() } : null;
    return bangunDetail(a, b.pesertaId);
  });
  return jawab(detail);
});
