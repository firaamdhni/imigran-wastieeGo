import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik, rewardAcara } from "@/lib/server/acara";
import { Peserta } from "@/lib/models/Peserta";
import { evaluasiService } from "@/lib/services/EvaluasiService";

export const dynamic = "force-dynamic";

/* Tetapkan pemenang. Pemenang & reward ditentukan otomatis dari peringkat teratas sesuai reward di Detail Event
   (tidak ada pilihan manual). Acara otomatis ditandai selesai: peserta tidak bisa lagi bergabung/menyetor. */
export const POST = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const pemenang = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    if (a.status === "selesai") {
      throw new GalatAplikasi("Pemenang sudah ditetapkan. Buka kembali evaluasi jika ingin mengubahnya.", 409);
    }
    const urut = evaluasiService.urutkan(Object.values(a.peserta).map(Peserta.fromJSON));
    const hasil = evaluasiService.tentukanPemenang(urut, rewardAcara(a));
    if (!hasil.length) throw new GalatAplikasi("Belum ada peserta, jadi belum ada pemenang.", 400);
    const sekarang = Date.now();
    /* nama & skor disalin saat penetapan sebagai catatan akhir */
    a.pemenang = hasil.map((w) => {
      const p = urut.find((x) => x.id === w.pesertaId);
      return { ...w, nama: p.nama, skor: p.getSkorAkhir(), diberikan: false, ditetapkanPada: sekarang };
    });
    a.status = "selesai";
    a.selesaiPada = sekarang;
    return a.pemenang;
  });
  return jawab({ ok: true, pemenang }, 201);
});

/* tandai reward sudah / belum diserahkan: satu penerima ({pesertaId}) atau satu tingkat sekaligus ({tingkat}) */
export const PATCH = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const b = await bacaBody(request);
  if (typeof b.diberikan !== "boolean") throw new GalatAplikasi("Data tidak lengkap.");
  const perPeserta = typeof b.pesertaId === "string";
  if (!perPeserta && !Number.isInteger(b.tingkat)) throw new GalatAplikasi("Data tidak lengkap.");
  const pemenang = await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    const sasaran = a.pemenang.filter((w) => (perPeserta ? w.pesertaId === b.pesertaId : w.tingkat === b.tingkat));
    if (!sasaran.length) throw new GalatAplikasi("Penerima reward tidak ditemukan.", 404);
    sasaran.forEach((w) => { w.diberikan = b.diberikan; });
    return a.pemenang;
  });
  return jawab({ ok: true, pemenang });
});

/* batalkan penetapan: pemenang dihapus dan acara dibuka kembali */
export const DELETE = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  await ubahDb((db) => {
    const { a } = acaraMilik(db, id);
    a.pemenang = [];
    a.status = "berlangsung";
    a.selesaiPada = null;
  });
  return jawab({ ok: true });
});
