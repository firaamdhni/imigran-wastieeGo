"use client";
/* =========================================================
   STORE - Provider Pattern & State Management
   Menyimpan data aplikasi (event, misi, capaian, dan riwayat setoran).
   Menerapkan prinsip OOP dengan model WasteItem & Mission.
   ========================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Sesi } from "./session";
import { WasteItem } from "./models/WasteItem";
import { Mission } from "./models/Mission";
import { MISI_AWAL, NAMA_MISI_PENDEK, TOTAL_TARGET } from "./eventConfig";
import { panggilApi } from "./api";
import { kecilkanFoto } from "./foto";

const KUNCI_STATE = "wastieego_state";
export const DURASI_AWAL = 4 * 3600 + 32 * 60; // sisa waktu acara saat bergabung (detik)

export { NAMA_MISI_PENDEK, TOTAL_TARGET };

const RIWAYAT_DEFAULT = [
  { id: "w-init-1", jenis: "Plastik", nama: "Botol air mineral 600ml", emisi: 250, timestamp: Date.now() - 3600000 * 2 },
  { id: "w-init-2", jenis: "Aluminium", nama: "Kaleng minuman soda", emisi: 400, timestamp: Date.now() - 3600000 * 5 },
  { id: "w-init-3", jenis: "Kertas", nama: "Kardus kemasan makanan", emisi: 300, timestamp: Date.now() - 3600000 * 8 },
  { id: "w-init-4", jenis: "Plastik", nama: "Gelas cup kopi plastik", emisi: 100, timestamp: Date.now() - 3600000 * 20 },
];

const AWAL = {
  nama: "Inipira",
  handle: "@piwagemas",
  acara: "", // nama acara yang diikuti (dari server saat bergabung)
  kodeAcara: null,
  sudahGabung: false,
  daftarMisi: MISI_AWAL,
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
        const daftarMisi = Array.isArray(s.daftarMisi) && s.daftarMisi.length ? s.daftarMisi : MISI_AWAL;
        d = {
          ...d,
          sudahGabung: !!s.sudahGabung && !!s.kodeAcara, // tanpa kode acara = belum terhubung ke acara mana pun
          kodeAcara: s.kodeAcara || null,
          acara: s.acara || "",
          daftarMisi,
          capai: daftarMisi.map((_, i) => (s.capai && s.capai[i]) || 0),
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
          kodeAcara: data.kodeAcara,
          acara: data.acara,
          daftarMisi: data.daftarMisi,
          capai: data.capai,
          batas: data.batas,
          penyelenggara: data.penyelenggara && { ...data.penyelenggara, poster: null },
          riwayat: data.riwayat,
        })
      );
    } catch (e) {}
  }, [data, siap]);

  /* kirim capaian ke server supaya penyelenggara acara bisa melihat peserta & menilai hasilnya.
     Gagal kirim (offline / acara selesai) tidak mengganggu pemakaian lokal. */
  useEffect(() => {
    if (!siap || !data.sudahGabung || !data.kodeAcara) return;
    const t = setTimeout(async () => {
      const r = await panggilApi("/api/event/sinkron", {
        method: "POST",
        body: { kode: data.kodeAcara, nama: data.nama, capai: data.capai },
      });
      if (r.ok && r.data?.misi) {
        setData((prev) => {
          const bedaMisi = JSON.stringify(prev.daftarMisi) !== JSON.stringify(r.data.misi);
          if (!bedaMisi) return prev;
          return {
            ...prev,
            daftarMisi: r.data.misi,
            capai: r.data.misi.map((_, idx) => prev.capai[idx] || 0),
          };
        });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [siap, data.sudahGabung, data.kodeAcara, data.nama, data.capai]);

  /* unggah aktivitas (setoran + foto bukti) satu per satu ke server supaya penyelenggara bisa memeriksanya.
     Gagal karena jaringan/server -> dicoba lagi 8 detik kemudian. Ditolak server (acara selesai, dll) -> dilepas. */
  const sedangUnggah = useRef(false);
  const [cobaLagi, setCobaLagi] = useState(0);
  useEffect(() => {
    if (!siap || !data.sudahGabung || !data.kodeAcara || sedangUnggah.current) return;
    const item = (data.riwayat || []).find((r) => r.kodeAcara === data.kodeAcara && r.terkirim === false);
    if (!item) return;
    sedangUnggah.current = true;
    (async () => {
      const foto = item.fotoUrl ? await kecilkanFoto(item.fotoUrl).catch(() => null) : null;
      const r = await panggilApi("/api/event/aktivitas", {
        method: "POST",
        body: {
          kode: item.kodeAcara, nama: data.nama,
          aktivitas: { id: item.id, jenis: item.jenis, nama: item.nama, emisi: item.emisi, timestamp: item.timestamp, foto },
        },
      });
      sedangUnggah.current = false;
      if (r.ok || (r.status >= 400 && r.status < 500)) {
        setData((d) => ({ ...d, riwayat: (d.riwayat || []).map((x) => (x.id === item.id ? { ...x, terkirim: true } : x)) }));
      } else {
        setTimeout(() => setCobaLagi((n) => n + 1), 8000);
      }
    })();
  }, [siap, data.sudahGabung, data.kodeAcara, data.riwayat, data.nama, cobaLagi]);

  /* detak jam untuk timer hitung mundur */
  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* Model OOP Misi */
  const misi = useMemo(
    () =>
      (data.daftarMisi || MISI_AWAL).map(
        (m, i) =>
          new Mission({
            id: m.id || i + 1,
            teks: m.teks,
            target: m.target,
            capai: data.capai[i] || 0,
          })
      ),
    [data.daftarMisi, data.capai]
  );

  /* Model OOP Riwayat Setoran Sampah */
  const riwayatItems = useMemo(
    () => (data.riwayat || []).map((r) => (r instanceof WasteItem ? r : WasteItem.fromJSON(r))),
    [data.riwayat]
  );

  /* acara = { kode, nama } dari server. Pindah ke acara lain memulai capaian dari awal (0). */
  const gabungAcara = useCallback((acara) => {
    setData((d) => {
      const sama = d.kodeAcara === acara.kode;
      const daftarMisi = Array.isArray(acara.misi) && acara.misi.length ? acara.misi : (d.daftarMisi || MISI_AWAL);
      return {
        ...d,
        sudahGabung: true,
        kodeAcara: acara.kode,
        acara: acara.nama,
        daftarMisi,
        batas: Date.now() + DURASI_AWAL * 1000,
        capai: daftarMisi.map((_, i) => (sama ? d.capai[i] || 0 : 0)), // Progres selalu mulai dari 0 (kosong)
      };
    });
  }, []);

  const tambahCapaian = useCallback((i, emisi, wasteData = null) => {
    setData((d) => {
      const daftar = d.daftarMisi || MISI_AWAL;
      const targetMisi = (daftar[i] && daftar[i].target) || 1000;
      const capai = [...d.capai];
      capai[i] = Math.min(targetMisi, (capai[i] || 0) + emisi);

      let riwayatBaru = d.riwayat ? [...d.riwayat] : [];
      if (wasteData) {
        const itemBaru = new WasteItem({
          jenis: wasteData.jenis,
          nama: wasteData.nama,
          emisi: wasteData.emisi || emisi,
          fotoUrl: wasteData.fotoUrl || null,
          timestamp: Date.now(),
        });
        /* setoran saat mengikuti acara ditandai belum terunggah; diunggah otomatis oleh efek di atas */
        const penanda = d.sudahGabung && d.kodeAcara ? { kodeAcara: d.kodeAcara, terkirim: false } : {};
        riwayatBaru = [{ ...itemBaru.toJSON(), ...penanda }, ...riwayatBaru];
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
  const totalTarget = (misi || []).reduce((a, m) => a + (m.target || 0), 0) || 1;
  const capai = (misi || []).reduce((a, m) => a + (m.capai || 0), 0);
  return Math.min(100, Math.round((capai / totalTarget) * 100));
}
