import { NextResponse } from "next/server";
import { bacaDb } from "@/lib/server/db";
import { GalatAplikasi, tangani } from "@/lib/server/http";
import { wajibPenyelenggara } from "@/lib/server/sesi";
import { acaraMilik } from "@/lib/server/acara";
import { ambilPeserta } from "@/lib/server/detail";
import { bacaFoto } from "@/lib/server/foto";
import { buatSvgFoto } from "@/lib/server/contoh";

export const dynamic = "force-dynamic";

/* foto bukti satu aktivitas; hanya penyelenggara pemilik acara yang boleh melihatnya */
export const GET = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const { a } = acaraMilik(await bacaDb(), id);
  const q = request.nextUrl.searchParams;
  const header = { "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" };

  /* foto sampul acara */
  if (q.get("sampul")) {
    if (!a.sampul) throw new GalatAplikasi("Foto sampul belum ada.", 404);
    let isi;
    try { isi = await bacaFoto(a.kode, a.sampul); } catch (e) { throw new GalatAplikasi("Foto sampul tidak ditemukan.", 404); }
    return new NextResponse(isi, { headers: { ...header, "Cache-Control": "private, no-cache", "Content-Type": "image/jpeg" } });
  }

  const p = ambilPeserta(a, q.get("peserta"));
  const aktivitas = (p.aktivitas || []).find((z) => z.id === q.get("id"));
  if (!aktivitas || !aktivitas.foto) throw new GalatAplikasi("Foto tidak ditemukan.", 404);

  if (aktivitas.foto === "demo") {
    return new NextResponse(buatSvgFoto(aktivitas.jenis, aktivitas.nama), {
      headers: { ...header, "Content-Type": "image/svg+xml; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" },
    });
  }
  let isi;
  try { isi = await bacaFoto(a.kode, aktivitas.foto); } catch (e) { throw new GalatAplikasi("Foto tidak ditemukan.", 404); }
  return new NextResponse(isi, { headers: { ...header, "Content-Type": "image/jpeg" } });
});
