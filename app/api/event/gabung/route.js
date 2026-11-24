import { ubahDb } from "@/lib/server/db";
import { bacaBody, jawab, tangani } from "@/lib/server/http";
import { Peserta } from "@/lib/models/Peserta";
import { bersihkanNama, catatPeserta, cariAcara, infoAcara } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

/* peserta bergabung ke acara dengan kode dari penyelenggara */
export const POST = tangani(async (request) => {
  const b = await bacaBody(request);
  const nama = bersihkanNama(b.nama);
  const acara = await ubahDb((db) => {
    const a = cariAcara(db, b.kode);
    catatPeserta(a, Peserta.normalisasiId(nama), nama);
    return infoAcara(a);
  });
  return jawab({ ok: true, acara });
});
