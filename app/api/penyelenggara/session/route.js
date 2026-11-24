import { bacaDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import {
  alamatKlien, catatPercobaan, cekBatas, cocokKataSandi, hapusCookie, hapusPercobaan, pasangCookie, wajibPenyelenggara,
} from "@/lib/server/sesi";
import { acaraMilik } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

const LIMA_MENIT = 5 * 60 * 1000;

/* cek apakah sesi penyelenggara masih berlaku */
export const GET = tangani(async (request) => {
  const id = wajibPenyelenggara(request);
  const { p } = acaraMilik(await bacaDb(), id);
  return jawab({ ok: true, nama: p.nama, email: p.email, kodeAcara: p.kodeAcara });
});

/* masuk dengan e-mail & kata sandi yang dibuat saat mendaftar sebagai penyelenggara */
export const POST = tangani(async (request) => {
  const kunci = "login:" + alamatKlien(request);
  cekBatas(kunci, 5, LIMA_MENIT, "Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.");
  const b = await bacaBody(request);
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";

  const db = await bacaDb();
  const akun = Object.values(db.penyelenggara).find((p) => p.email === email) || null;
  if (!(await cocokKataSandi(password, akun))) {
    catatPercobaan(kunci, LIMA_MENIT);
    throw new GalatAplikasi("E-mail atau kata sandi salah.", 401);
  }
  hapusPercobaan(kunci);
  const res = jawab({ ok: true });
  pasangCookie(res, request, akun.id);
  return res;
});

/* keluar */
export const DELETE = tangani(async () => {
  const res = jawab({ ok: true });
  hapusCookie(res);
  return res;
});
