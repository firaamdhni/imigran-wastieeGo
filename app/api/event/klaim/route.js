import { ubahDb } from "@/lib/server/db";
import { bacaBody, jawab, tangani, GalatAplikasi } from "@/lib/server/http";
import { Peserta } from "@/lib/models/Peserta";
import { bersihkanNama, cariAcara, ambilAtauBuatKlaimMisi } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

/* Peserta mengambil atau menghasilkan kode klaim QR untuk misi yang sudah selesai */
export const GET = tangani(async (request) => {
  const url = new URL(request.url);
  const kode = url.searchParams.get("kode");
  const nama = bersihkanNama(url.searchParams.get("nama"));
  const misiId = url.searchParams.get("misiId");

  if (!kode || !misiId) {
    throw new GalatAplikasi("Parameter kode acara dan misiId wajib diisi.", 400);
  }

  const pId = Peserta.normalisasiId(nama);

  const klaim = await ubahDb((db) => {
    const a = cariAcara(db, kode);
    const p = a.peserta?.[pId];
    if (!p) throw new GalatAplikasi("Peserta belum terdaftar di acara ini.", 404);
    return ambilAtauBuatKlaimMisi(a, p, misiId);
  });

  return jawab({ ok: true, klaim });
});

export const POST = tangani(async (request) => {
  const b = await bacaBody(request);
  const nama = bersihkanNama(b.nama);
  const misiId = b.misiId;
  const kode = b.kode;

  if (!kode || !misiId) {
    throw new GalatAplikasi("Parameter kode acara dan misiId wajib diisi.", 400);
  }

  const pId = Peserta.normalisasiId(nama);

  const klaim = await ubahDb((db) => {
    const a = cariAcara(db, kode);
    const p = a.peserta?.[pId];
    if (!p) throw new GalatAplikasi("Peserta belum terdaftar di acara ini.", 404);
    return ambilAtauBuatKlaimMisi(a, p, misiId);
  });

  return jawab({ ok: true, klaim });
});
