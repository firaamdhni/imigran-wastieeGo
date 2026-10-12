"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import RiwayatPresenter from "./RiwayatPresenter";

const DAFTAR_KATEGORI = ["Semua", "Plastik", "Kertas", "Aluminium", "Organik"];

/**
 * RiwayatContainer - Container (Smart) Component
 * Mengikuti Design Pattern "Container-Presenter Pattern".
 * Komponen ini bertanggung jawab menangani logic, state filtering,
 * koneksi ke store global, dan manajemen aksi user.
 */
export default function RiwayatContainer() {
  const { riwayat, hapusRiwayat, resetRiwayat } = useStore();
  const { toast } = useToast();
  const [kategoriAktif, setKategoriAktif] = useState("Semua");

  const riwayatTersaring = useMemo(() => {
    if (!riwayat || !Array.isArray(riwayat)) return [];
    if (kategoriAktif === "Semua") return riwayat;
    return riwayat.filter(
      (item) => item.jenis && item.jenis.toLowerCase() === kategoriAktif.toLowerCase()
    );
  }, [riwayat, kategoriAktif]);

  const totalEmisi = useMemo(() => {
    if (!riwayat || !Array.isArray(riwayat)) return 0;
    return riwayat.reduce((sum, item) => sum + (item.emisi || 0), 0);
  }, [riwayat]);

  const handleHapusItem = (id) => {
    hapusRiwayat(id);
    toast("Catatan setoran sampah berhasil dihapus");
  };

  const handleResetRiwayat = () => {
    if (confirm("Apakah kamu yakin ingin mereset seluruh riwayat setoran?")) {
      resetRiwayat();
      toast("Seluruh riwayat berhasil direset");
    }
  };

  return (
    <RiwayatPresenter
      riwayatList={riwayatTersaring}
      kategoriAktif={kategoriAktif}
      setKategoriAktif={setKategoriAktif}
      daftarKategori={DAFTAR_KATEGORI}
      totalEmisi={totalEmisi}
      totalItem={riwayat ? riwayat.length : 0}
      onHapusItem={handleHapusItem}
      onResetRiwayat={handleResetRiwayat}
    />
  );
}
