import { ubahDb } from "@/lib/server/db";
import { GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik } from "@/lib/server/acara";
import { buatPesertaContoh, hapusPesertaContoh } from "@/lib/server/contoh";

export const dynamic = "force-dynamic";

function bisaDiubah(a) {
  if (a.status === "selesai") throw new GalatAplikasi("Buka kembali evaluasi dulu sebelum mengubah peserta contoh.", 409);
}

/* tambah peserta contoh ke acara milik penyelenggara (menggantikan contoh yang sudah ada) */
export const POST = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const jumlah = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    bisaDiubah(a);
    hapusPesertaContoh(a);
    const contoh = buatPesertaContoh();
    contoh.forEach((p) => { a.peserta[p.id] = p; });
    return contoh.length;
  });
  return jawab({ ok: true, jumlah }, 201);
});

/* hapus semua peserta contoh; peserta sungguhan tidak disentuh */
export const DELETE = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const dihapus = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    bisaDiubah(a);
    return hapusPesertaContoh(a);
  });
  return jawab({ ok: true, dihapus });
});
