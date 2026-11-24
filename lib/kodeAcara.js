/* Helper kode acara yang dipakai bersama oleh panel penyelenggara (membuat tautan QR)
   dan halaman Scan peserta (membaca isi QR / kode yang diketik). */

const normalisasi = (k) => String(k ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* isi QR = tautan bergabung. Kamera bawaan ponsel membukanya langsung ke halaman Scan. */
export const buatTautanGabung = (origin, kode) =>
  `${String(origin).replace(/\/+$/, "")}/dashboard/scan?kode=${encodeURIComponent(normalisasi(kode))}`;

/* Mengambil kode dari: tautan QR (?kode=...) atau teks kode biasa. Tidak valid -> "" */
export function ambilKodeDariTeks(teks) {
  const t = String(teks ?? "").trim();
  if (!t) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) {
    try {
      return normalisasi(new URL(t).searchParams.get("kode"));
    } catch (e) {
      return "";
    }
  }
  const k = normalisasi(t);
  return k.length >= 4 && k.length <= 10 ? k : "";
}
