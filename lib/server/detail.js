import { Peserta } from "../models/Peserta";
import { evaluasiService } from "../services/EvaluasiService";
import { GalatAplikasi } from "./http";
import { punya } from "./acara";

/* record peserta di sebuah acara, atau 404 */
export function ambilPeserta(a, pesertaId) {
  if (typeof pesertaId !== "string" || !punya(a.peserta, pesertaId)) throw new GalatAplikasi("Peserta tidak ditemukan.", 404);
  return a.peserta[pesertaId];
}

/* data halaman "periksa": ringkasan peserta (lengkap dengan peringkat) + daftar aktivitasnya */
export function bangunDetail(a, pesertaId) {
  ambilPeserta(a, pesertaId);
  const urut = evaluasiService.urutkan(Object.values(a.peserta).map(Peserta.fromJSON));
  const p = urut.find((x) => x.id === pesertaId);
  return { peserta: p.toTampilan(), aktivitas: p.toDaftarAktivitas() };
}
