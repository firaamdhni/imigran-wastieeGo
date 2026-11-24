import crypto from "node:crypto";
import { ubahDb } from "@/lib/server/db";
import { bacaBody, GalatAplikasi, jawab, tangani } from "@/lib/server/http";
import { alamatKlien, catatPercobaan, cekBatas, hashKataSandi, pasangCookie } from "@/lib/server/sesi";
import { buatKodeAcara } from "@/lib/server/acara";

export const dynamic = "force-dynamic";

const SATU_JAM = 3600 * 1000;
const teks = (v, maks) => (typeof v === "string" && v.trim().length <= maks ? v.trim() : "");

/* daftar sebagai penyelenggara: membuat akun (e-mail + kata sandi) sekaligus acaranya + kode acara */
export const POST = tangani(async (request) => {
  const ip = alamatKlien(request);
  cekBatas("daftar:" + ip, 10, SATU_JAM, "Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.");
  catatPercobaan("daftar:" + ip, SATU_JAM);

  const b = await bacaBody(request);
  const data = {
    nama: teks(b.nama, 60),
    namaAcara: teks(b.namaAcara, 80),
    email: teks(b.email, 100).toLowerCase(),
    hp: teks(b.hp, 20).replace(/[\s-]/g, ""),
    waktu: teks(b.waktu, 80),
    lokasi: teks(b.lokasi, 120),
    detail: teks(b.detail, 500),
  };
  const password = typeof b.password === "string" ? b.password : "";

  if (Object.values(data).some((v) => !v)) throw new GalatAplikasi("Data belum lengkap atau terlalu panjang.");
  if (!/^\S+@\S+\.\S+$/.test(data.email)) throw new GalatAplikasi("Format e-mail penyelenggara belum benar.");
  if (!/^(\+62|62|0)8\d{7,12}$/.test(data.hp)) throw new GalatAplikasi("Nomor HP belum benar. Contoh: 081234567890");
  if (password.length < 8 || password.length > 72) throw new GalatAplikasi("Kata sandi harus 8 sampai 72 karakter.");

  /* hash dihitung di luar antrean database agar tidak menahan permintaan lain */
  const { salt, hash } = await hashKataSandi(password);

  const hasil = await ubahDb((db) => {
    if (Object.values(db.penyelenggara).some((p) => p.email === data.email)) {
      throw new GalatAplikasi("E-mail ini sudah terdaftar sebagai penyelenggara. Silakan masuk.", 409);
    }
    const id = crypto.randomBytes(6).toString("hex");
    const kode = buatKodeAcara(db);
    const sekarang = Date.now();
    db.penyelenggara[id] = { id, email: data.email, nama: data.nama, hp: data.hp, salt, hash, dibuatPada: sekarang, kodeAcara: kode };
    db.acara[kode] = {
      kode, penyelenggaraId: id, nama: data.namaAcara, waktu: data.waktu, lokasi: data.lokasi, detail: data.detail,
      status: "berlangsung", selesaiPada: null, dibuatPada: sekarang, peserta: {}, pemenang: [],
    };
    return { id, kode };
  });

  const res = jawab({ ok: true, kodeAcara: hasil.kode }, 201);
  pasangCookie(res, request, hasil.id); // langsung masuk ke panel setelah mendaftar
  return res;
});
