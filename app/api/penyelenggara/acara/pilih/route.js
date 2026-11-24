import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik, punya } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

/* Penyelenggara berganti ke event lain miliknya */
export const POST = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const b = await bacaBody(request);
  const kode = String(b.kode || "").trim().toUpperCase();

  if (!kode) throw new GalatAplikasi("Kode event wajib diisi.", 400);

  const hasil = await ubahDb((db) => {
    const { p } = acaraMilik(db, id);
    if (!punya(db.acara, kode) || db.acara[kode].penyelenggaraId !== p.id) {
      throw new GalatAplikasi("Event tidak ditemukan atau bukan milik Anda.", 404);
    }
    p.kodeAcara = kode;
    return { kode, nama: db.acara[kode].nama };
  });

  return jawab({ ok: true, pesan: "Berhasil beralih ke event " + hasil.nama, ...hasil });
});
