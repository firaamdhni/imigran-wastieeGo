"use client";
import { useMemo } from "react";
import { buatQR, qrKePath } from "@/lib/qr";

/* QR sebagai SVG (tajam di layar mana pun, latar putih + zona tenang agar mudah dipindai) */
export default function KodeQR({ teks, ukuran = 176, label }) {
  const qr = useMemo(() => {
    try { return buatQR(teks); } catch (e) { return null; }
  }, [teks]);
  if (!qr) return <p className="pnl-info">QR tidak dapat dibuat.</p>;
  const { path, lebar } = qrKePath(qr, 4);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${lebar} ${lebar}`} width={ukuran} height={ukuran} shapeRendering="crispEdges">
      <rect width={lebar} height={lebar} fill="#fff" />
      <path d={path} fill="#111" />
    </svg>
  );
}
