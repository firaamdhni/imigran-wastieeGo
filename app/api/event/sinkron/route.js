import { ubahDb } from "@/lib/server/db";
import { bacaBody, jawab, tangani } from "@/lib/server/http";
import { Peserta } from "@/lib/models/Peserta";
import { bersihkanNama, catatPeserta, cariAcara, misiAcara } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

/* Peserta mengirim capaian misi terbarunya ke acara yang diikuti (nilai hanya boleh naik).
   Skor dihitung dari aktivitas yang diunggah lewat /api/event/aktivitas, bukan dari angka kiriman peserta. */
export const POST = tangani(async (request) => {
  const b = await bacaBody(request);
  const nama = bersihkanNama(b.nama);
  const hasil = await ubahDb((db) => {
    const a = cariAcara(db, b.kode);
    const p = catatPeserta(a, Peserta.normalisasiId(nama), nama, { capai: Array.isArray(b.capai) ? b.capai : [] });
    return { bergabungPada: p.bergabungPada, misi: misiAcara(a) };
  });
  return jawab({ ok: true, ...hasil });
});
