import crypto from "node:crypto";
import { promisify } from "node:util";
import { GalatAplikasi } from "./http";

/* =========================================================
   AKUN & SESI PENYELENGGARA
   - Kata sandi di-hash dengan scrypt + salt acak (tidak pernah disimpan polos).
   - Sesi = cookie httpOnly bertanda tangan HMAC (SESSION_SECRET), berisi id penyelenggara.
   ========================================================= */
const scrypt = promisify(crypto.scrypt);

export const NAMA_COOKIE = "wastieego_penyelenggara";
const MASA_AKTIF_DETIK = 8 * 3600;

const G = globalThis;
G.__wastieegoBatas ??= new Map();

function rahasia() {
  const prod = process.env.NODE_ENV === "production";
  const r = process.env.SESSION_SECRET || (prod ? "" : "rahasia-dev-wastieego");
  if (!r) throw new GalatAplikasi("SESSION_SECRET belum diatur di server.", 500);
  return r;
}

/* ---------- kata sandi ---------- */
export async function hashKataSandi(kata) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(kata, salt, 64)).toString("hex");
  return { salt, hash };
}

/* akun tidak ada pun tetap menghitung hash, agar waktu respons tidak membocorkan e-mail yang terdaftar */
const PALSU = { salt: "0".repeat(32), hash: "0".repeat(128) };
export async function cocokKataSandi(kata, akun) {
  const { salt, hash } = akun || PALSU;
  const hitung = await scrypt(kata, salt, 64);
  const asli = Buffer.from(hash, "hex");
  return Boolean(akun) && asli.length === hitung.length && crypto.timingSafeEqual(asli, hitung);
}

/* ---------- token sesi ---------- */
const tandatangan = (isi) => crypto.createHmac("sha256", rahasia()).update(isi).digest("hex");

export function buatToken(id) {
  const isi = `p.${id}.${Math.floor(Date.now() / 1000) + MASA_AKTIF_DETIK}`;
  return `${isi}.${tandatangan(isi)}`;
}

/* mengembalikan id penyelenggara kalau token asli & belum kedaluwarsa, selain itu null */
export function idDariToken(token) {
  if (!token) return null;
  const bagian = token.split(".");
  if (bagian.length !== 4) return null;
  const [jenis, id, exp, sig] = bagian;
  const a = Buffer.from(sig);
  const b = Buffer.from(tandatangan(`${jenis}.${id}.${exp}`));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return jenis === "p" && Number(exp) > Date.now() / 1000 ? id : null;
}

export function wajibPenyelenggara(request) {
  const id = idDariToken(request.cookies.get(NAMA_COOKIE)?.value);
  if (!id) throw new GalatAplikasi("Sesi penyelenggara tidak valid. Silakan masuk lagi.", 401);
  return id;
}

export function pasangCookie(response, request, id) {
  const https = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set({
    name: NAMA_COOKIE, value: buatToken(id), httpOnly: true, sameSite: "lax", path: "/", secure: https, maxAge: MASA_AKTIF_DETIK,
  });
}

export function hapusCookie(response) {
  response.cookies.set({ name: NAMA_COOKIE, value: "", httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/* ---------- pembatas percobaan (per alamat IP, disimpan di memori) ---------- */
export const alamatKlien = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "lokal";

export function cekBatas(kunci, maks, jendelaMs, pesan) {
  const r = G.__wastieegoBatas.get(kunci);
  if (r && Date.now() - r.mulai < jendelaMs && r.n >= maks) throw new GalatAplikasi(pesan, 429);
}

export function catatPercobaan(kunci, jendelaMs) {
  const m = G.__wastieegoBatas;
  const sekarang = Date.now();
  if (m.size > 1000) for (const [k, v] of m) if (sekarang - v.mulai >= v.jendela) m.delete(k);
  const r = m.get(kunci);
  if (!r || sekarang - r.mulai >= jendelaMs) m.set(kunci, { n: 1, mulai: sekarang, jendela: jendelaMs });
  else r.n += 1;
}

export const hapusPercobaan = (kunci) => G.__wastieegoBatas.delete(kunci);
