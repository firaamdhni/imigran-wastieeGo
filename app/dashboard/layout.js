"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import JoinPopup from "@/components/JoinPopup";
import { StoreProvider, useStore } from "@/lib/store";
import { Sesi } from "@/lib/session";

/* cek sesi login: belum masuk -> kembali ke /login */
function Penjaga({ children }) {
  const router = useRouter();
  const { siap } = useStore();
  const masuk = siap && Sesi.ambil();

  useEffect(() => {
    if (siap && !Sesi.ambil()) {
      /* dibuka dari tautan QR tapi belum login: titip kodenya, dipakai di halaman Scan setelah login */
      try {
        const kode = new URLSearchParams(window.location.search).get("kode");
        if (kode) sessionStorage.setItem("wastieego_kode_tertunda", kode);
      } catch (e) {}
      router.replace("/login");
    }
  }, [siap, router]);

  if (!masuk) return null;
  return (
    <div id="app-utama">
      <Sidebar />
      <main>{children}</main>
      <JoinPopup />
    </div>
  );
}

/* Satu layout untuk SEMUA halaman dashboard:
   beranda, misi, riwayat, profil, penyelenggara, kamera, scan */
export default function DashboardLayout({ children }) {
  return (
    <StoreProvider>
      <Penjaga>{children}</Penjaga>
    </StoreProvider>
  );
}
