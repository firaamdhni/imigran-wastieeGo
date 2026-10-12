/* Sesi login (ganti dengan token/cookie dari backend). Hanya dipanggil di browser. */
const KUNCI = "wastieego_sesi";

export const Sesi = {
  simpan(nama) {
    try { localStorage.setItem(KUNCI, JSON.stringify({ nama })); } catch (e) {}
  },
  ambil() {
    try { return JSON.parse(localStorage.getItem(KUNCI)); } catch (e) { return null; }
  },
  hapus() {
    try { localStorage.removeItem(KUNCI); } catch (e) {}
  },
};
