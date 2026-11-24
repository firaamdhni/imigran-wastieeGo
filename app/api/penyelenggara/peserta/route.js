import { bacaDb } from "@/lib/server/db";
import { jawab, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik, infoAcara, rewardAcara, misiAcara, daftarAcaraPenyelenggara } from "@/lib/server/acara";
import { Peserta } from "@/lib/models/Peserta";
import { evaluasiService } from "@/lib/services/EvaluasiService";

export const dynamic = "force-dynamic";

/* peserta yang bergabung di acara MILIK penyelenggara yang login, diurutkan sebagai leaderboard */
export const GET = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const db = await bacaDb();
  const { p, a } = acaraMilik(db, id);
  const daftarMisi = misiAcara(a);
  const urut = evaluasiService.urutkan(Object.values(a.peserta).map((pesertaRaw) => Peserta.fromJSON({ ...pesertaRaw, misi: daftarMisi })));
  return jawab({
    penyelenggara: { nama: p.nama, email: p.email },
    acara: infoAcara(a),
    daftarAcara: daftarAcaraPenyelenggara(db, p),
    peserta: urut.map((x) => x.toTampilan()),
    ringkasan: evaluasiService.rangkum(urut),
    pemenang: a.pemenang,
    kriteria: evaluasiService.getKriteria(),
    reward: evaluasiService.susunReward(rewardAcara(a)), // tingkat reward + rentang peringkat
    misi: daftarMisi,
  });
});
