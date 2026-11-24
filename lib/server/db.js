import { promises as fs } from "node:fs";
import path from "node:path";
import { migrasiContoh } from "./contoh";

/* =========================================================
   DB - penyimpanan JSON file (tanpa dependensi tambahan).
   Cocok untuk 1 server/kontainer. Untuk skala lebih besar,
   ganti isi file ini dengan PostgreSQL tanpa mengubah API route.

   Bentuk data (versi 2):
   {
     versi: 2,
     penyelenggara: { [id]: { id, email, nama, hp, salt, hash, dibuatPada, kodeAcara } },
     acara: { [kode]: { kode, penyelenggaraId, nama, waktu, lokasi, detail, status,
                        selesaiPada, dibuatPada, pemenang: [...],
                        peserta: { [id]: { id, nama, bergabungPada, capai, terakhirAktif, aktivitas: [...], penilaian } } } }
   }
   ========================================================= */
const DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");
export const DIR_DATA = DIR;

/* antrean disimpan di globalThis agar semua route (yang bisa dikompilasi terpisah) memakai satu antrean */
const G = globalThis;
G.__wastieegoAntrian ??= Promise.resolve();

function dbBaru() {
  return { versi: 2, penyelenggara: {}, acara: {} };
}

async function baca() {
  let teks;
  try {
    teks = await fs.readFile(FILE, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return dbBaru();
    throw e;
  }
  const db = JSON.parse(teks); // file rusak: jangan ditimpa diam-diam
  if (db.versi === 2) return migrasiContoh({ ...dbBaru(), ...db });
  /* file dari versi lama (satu acara tanpa akun penyelenggara): simpan sebagai cadangan, mulai baru */
  try { await fs.rename(FILE, path.join(DIR, "db.v1.cadangan.json")); } catch (e) {}
  return dbBaru();
}

/* tulis ke file sementara lalu rename, supaya file tidak pernah setengah tertulis */
async function tulis(db) {
  await fs.mkdir(DIR, { recursive: true });
  const sementara = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(sementara, JSON.stringify(db, null, 2));
  await fs.rename(sementara, FILE);
}

/* jalankan satu per satu agar baca-ubah-tulis tidak saling menimpa */
function antre(fn) {
  const hasil = G.__wastieegoAntrian.then(fn);
  G.__wastieegoAntrian = hasil.catch(() => {});
  return hasil;
}

export const bacaDb = () => antre(baca);

/* mutator boleh melempar galat untuk membatalkan; perubahan baru ditulis kalau mutator selesai */
export const ubahDb = (mutator) =>
  antre(async () => {
    const db = await baca();
    const hasil = await mutator(db);
    await tulis(db);
    return hasil;
  });
