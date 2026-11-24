import { bacaDb } from "@/lib/server/db";
import { jawab, tangani } from "@/lib/server/http";
import { Peserta } from "@/lib/models/Peserta";
import { cariAcara, punya } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

/* Status acara untuk satu peserta. Hanya hasil milik peserta itu sendiri yang dikembalikan. */
export const GET = tangani(async (request) => {
  const q = request.nextUrl.searchParams;
  const id = Peserta.normalisasiId(q.get("peserta") || "");
  const a = cariAcara(await bacaDb(), q.get("kode"));
  const menang = a.pemenang.find((w) => w.pesertaId === id) || null;
  return jawab({
    acara: { nama: a.nama, status: a.status, selesaiPada: a.selesaiPada },
    sudahGabung: punya(a.peserta, id),
    menang: menang && { peringkat: menang.peringkat, tingkat: menang.tingkat, reward: menang.reward, diberikan: !!menang.diberikan },
  });
});
