import RiwayatContainer from "@/components/riwayat/RiwayatContainer";

export const metadata = {
  title: "Riwayat Setoran Sampah - WastieeGo",
  description: "Daftar riwayat setoran dan pengurangan emisi karbon dari pemilahan sampah",
};

/**
 * Halaman Riwayat Setoran Sampah
 * Menerapkan pola Container-Presenter. Page bertindak sebagai entrypoint route Next.js
 * yang memuat Container Component.
 */
export default function RiwayatPage() {
  return <RiwayatContainer />;
}
