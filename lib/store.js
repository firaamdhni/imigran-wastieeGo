"use client";
/* =========================================================
   STORE - Provider Pattern & State Management
   Menyimpan data aplikasi (event, misi, capaian, dan riwayat setoran).
   Menerapkan prinsip OOP dengan model WasteItem & Mission.
   ========================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Sesi } from "./session";
import { WasteItem } from "./models/WasteItem";
import { Mission } from "./models/Mission";

const KUNCI_STATE = "wastieego_state";
export const DURASI_AWAL = 4 * 3600 + 32 * 60; // sisa waktu acara saat bergabung (detik)

export const NAMA_MISI_PENDEK = ["Lingkungan gedung D", "Lokasi utama acara", "Jarak 500m dari lokasi"];

/* target emisi karbon (gCO2e) per misi */
const MISI_AWAL = [
  { id: 1, teks: "Kurangi emisi karbon di sekitar lingkungan gedung D!", target: 1500, capai: 0 },
  { id: 2, teks: "Kurangi emisi karbon di lokasi utama acara!", target: 500, capai: 0 },
  { id: 3, teks: "Kurangi emisi karbon pada lokasi dengan jarak 500m dari lokasi utama acara", target: 1500, capai: 0 },
];
export const TOTAL_TARGET = MISI_AWAL.reduce((a, m) => a + m.target, 0);

const RIWAYAT_DEFAULT = [
  { id: "w-init-1", jenis: "Plastik", nama: "Botol air mineral 600ml", emisi: 250, timestamp: Date.now() - 3600000 * 2 },
  { id: "w-init-2", jenis: "Aluminium", nama: "Kaleng minuman soda", emisi: 400, timestamp: Date.now() - 3600000 * 5 },
  { id: "w-init-3", jenis: "Kertas", nama: "Kardus kemasan makanan", emisi: 300, timestamp: Date.now() - 3600000 * 8 },
  { id: "w-init-4", jenis: "Plastik", nama: "Gelas cup kopi plastik", emisi: 100, timestamp: Date.now() - 3600000 * 20 },
];

const AWAL = {
  nama: "Inipira",
  handle: "@piwagemas",
  acara: "INFEST",
  sudahGabung: false,
  capai: [0, 0, 0],
  batas: null, // waktu acara berakhir (timestamp ms)
  penyelenggara: null,
  riwayat: RIWAYAT_DEFAULT,
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(AWAL);
  const [siap, setSiap] = useState(false);
  const [popup, setPopup] = useState(false);
  const [sekarang, setSekarang] = useState(() => Date.now());

  /* muat dari localStorage (hanya di browser) */
  useEffect(() => {
    let d = { ...AWAL };
    try {
      const s = JSON.parse(localStorage.getItem(KUNCI_STATE));
      if (s) {
        d = {
          ...d,
          sudahGabung: !!s.sudahGabung,
          capai: MISI_AWAL.map((_, i) => (s.capai && s.capai[i]) || 0),
          batas: s.batas || null,
          penyelenggara: s.penyelenggara || null,
          riwayat: Array.isArray(s.riwayat) ? s.riwayat : RIWAYAT_DEFAULT,
        };
      }
    } catch (e) {}
    const sesi = Sesi.ambil();
    if (sesi && sesi.nama && sesi.nama !== "Inipira") d.nama = sesi.nama;
    setData(d);
    setSiap(true);
  }, []);

  /* simpan setiap ada perubahan */
  useEffect(() => {
    if (!siap) return;
    try {
      localStorage.setItem(
        KUNCI_STATE,
        JSON.stringify({
          sudahGabung: data.sudahGabung,
          capai: data.capai,
          batas: data.batas,
          penyelenggara: data.penyelenggara && { ...data.penyelenggara, poster: null },
          riwayat: data.riwayat,
        })
      );
    } catch (e) {}
  }, [data, siap]);

  /* detak jam untuk timer hitung mundur */
  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* Model OOP Misi */
  const misi = useMemo(
    () =>
      MISI_AWAL.map(
        (m, i) =>
          new Mission({
            id: m.id,
            teks: m.teks,
            target: m.target,
            capai: data.capai[i] || 0,
          })
      ),
    [data.capai]
  );

  /* Model OOP Riwayat Setoran Sampah */
  const riwayatItems = useMemo(
    () => (data.riwayat || []).map((r) => (r instanceof WasteItem ? r : WasteItem.fromJSON(r))),
    [data.riwayat]
  );

  const gabungAcara = useCallback(() => {
    setData((d) => ({
      ...d,
      sudahGabung: true,
      batas: Date.now() + DURASI_AWAL * 1000,
      capai: [1050, d.capai[1] || 0, d.capai[2] || 0], // contoh capaian awal 30% seperti mockup
    }));
  }, []);

  const tambahCapaian = useCallback((i, emisi, wasteData = null) => {
    setData((d) => {
      const capai = [...d.capai];
      capai[i] = Math.min(MISI_AWAL[i].target, capai[i] + emisi);

      let riwayatBaru = d.riwayat ? [...d.riwayat] : [];
      if (wasteData) {
        const itemBaru = new WasteItem({
          jenis: wasteData.jenis,
          nama: wasteData.nama,
          emisi: wasteData.emisi || emisi,
          fotoUrl: wasteData.fotoUrl || null,
          timestamp: Date.now(),
        });
        riwayatBaru = [itemBaru.toJSON(), ...riwayatBaru];
      }

      return { ...d, capai, riwayat: riwayatBaru };
    });
  }, []);

  const hapusRiwayat = useCallback((id) => {
    setData((d) => ({
      ...d,
      riwayat: (d.riwayat || []).filter((item) => item.id !== id),
    }));
  }, []);

  const resetRiwayat = useCallback(() => {
    setData((d) => ({
      ...d,
      riwayat: [],
    }));
  }, []);

  const simpanPenyelenggara = useCallback((p) => setData((d) => ({ ...d, penyelenggara: p })), []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KUNCI_STATE);
    } catch (e) {}
    setData(AWAL);
  }, []);

  const sisaDetik = data.batas ? Math.max(0, Math.round((data.batas - sekarang) / 1000)) : DURASI_AWAL;

  const value = {
    ...data,
    misi,
    riwayat: riwayatItems,
    siap,
    sisaDetik,
    popup,
    bukaPopup: () => setPopup(true),
    tutupPopup: () => setPopup(false),
    gabungAcara,
    tambahCapaian,
    hapusRiwayat,
    resetRiwayat,
    simpanPenyelenggara,
    reset,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

/* pembantu: persen total progres semua misi */
export function persenTotal(misi) {
  const capai = misi.reduce((a, m) => a + (m.capai || 0), 0);
  return Math.round((capai / TOTAL_TARGET) * 100);
}
