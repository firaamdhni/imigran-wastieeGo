"use client";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Logo } from "./Icons";
import { useStore } from "@/lib/store";

const HALAMAN = {
  beranda: "/dashboard",
  misi: "/dashboard/misi",
  riwayat: "/dashboard/riwayat",
  profil: "/dashboard/profil",
};

/* menu yang aktif ditentukan dari alamat halaman */
function menuAktif(pathname, mode) {
  if (pathname === "/dashboard") return "beranda";
  if (pathname.startsWith("/dashboard/misi")) return "misi";
  if (pathname.startsWith("/dashboard/riwayat")) return "riwayat";
  if (pathname.startsWith("/dashboard/profil")) return "profil";
  if (pathname.startsWith("/dashboard/penyelenggara")) return "profil";
  if (pathname.startsWith("/dashboard/kamera") && mode === "poster") return "profil";
  return "";
}

function IsiSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const mode = useSearchParams().get("mode");
  const { sudahGabung, bukaPopup } = useStore();
  const aktif = menuAktif(pathname, mode);

  const pindah = (h) => {
    if (h === "misi" && !sudahGabung) return bukaPopup();
    router.push(HALAMAN[h]);
  };
  const tombol = (h) => ({ onClick: () => pindah(h), "aria-current": aktif === h ? "page" : undefined });

  return (
    <>
      <Logo />
      <nav className="nav" aria-label="Navigasi utama">
        <button {...tombol("beranda")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
          <span>Beranda</span>
        </button>
        <button {...tombol("misi")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>
          <span>Misi</span>
        </button>
        <button {...tombol("riwayat")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>
          <span>Riwayat</span>
        </button>
        <button {...tombol("profil")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
          <span>Profil</span>
        </button>
      </nav>
      <button
        className="scan-btn"
        onClick={() => (sudahGabung ? router.push("/dashboard/kamera") : bukaPopup())}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="4" /></svg>
        <span>Scan sampah</span>
      </button>
    </>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Suspense fallback={null}>
        <IsiSidebar />
      </Suspense>
    </aside>
  );
}
