import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DIR_DATA } from "./db";
import { GalatAplikasi } from "./http";

/* Foto aktivitas peserta disimpan sebagai berkas (bukan di db.json) agar database tetap kecil:
   DATA_DIR/foto/<KODE ACARA>/<nama acak>.jpg. Nama berkas dibuat server, jadi tidak bisa disusupi path. */
export const BATAS_FOTO_BYTE = 500 * 1024;
const POLA_DATA_URL = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;

export function dekodeFoto(dataUrl) {
  if (typeof dataUrl !== "string" || dataUrl.length > BATAS_FOTO_BYTE * 1.4 + 100) throw new GalatAplikasi("Foto terlalu besar.", 413);
  const m = POLA_DATA_URL.exec(dataUrl);
  if (!m) throw new GalatAplikasi("Foto harus berupa JPEG.", 400);
  const buf = Buffer.from(m[1], "base64");
  if (buf.length > BATAS_FOTO_BYTE) throw new GalatAplikasi("Foto terlalu besar.", 413);
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) throw new GalatAplikasi("Foto harus berupa JPEG.", 400);
  return buf;
}

const berkas = (kode, nama) => path.join(DIR_DATA, "foto", kode, nama);

export async function simpanFoto(kode, buf) {
  const nama = crypto.randomBytes(10).toString("hex") + ".jpg";
  await fs.mkdir(path.dirname(berkas(kode, nama)), { recursive: true });
  await fs.writeFile(berkas(kode, nama), buf);
  return nama;
}

export const bacaFoto = (kode, nama) => fs.readFile(berkas(kode, nama));

/* menghapus berkas yang sudah tidak dipakai (mis. foto sampul lama); kegagalan tidak penting */
export const hapusFoto = (kode, nama) => fs.unlink(berkas(kode, nama)).catch(() => {});
