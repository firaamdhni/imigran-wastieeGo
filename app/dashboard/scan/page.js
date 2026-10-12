"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/* menggambar QR contoh (simulasi) */
function gambarQR(c) {
  const g = c.getContext("2d"), n = 25, sel = c.width / n;
  g.fillStyle = "#f4f7ef"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#111";
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const finder = (x, y) => {
    g.fillStyle = "#111"; g.fillRect(x * sel, y * sel, 7 * sel, 7 * sel);
    g.fillStyle = "#f4f7ef"; g.fillRect((x + 1) * sel, (y + 1) * sel, 5 * sel, 5 * sel);
    g.fillStyle = "#111"; g.fillRect((x + 2) * sel, (y + 2) * sel, 3 * sel, 3 * sel);
  };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    const tengah = x > 8 && x < n - 9 && y > 8 && y < n - 9;
    if (!f && !tengah && rnd() > 0.5) g.fillRect(x * sel, y * sel, sel, sel);
  }
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  const t = c.width / 2, r = 46;
  g.fillStyle = "#fff"; g.beginPath(); g.roundRect(t - r, t - r, r * 2, r * 2, 18); g.fill();
  g.fillStyle = "#1f5a2f"; g.beginPath(); g.ellipse(t - 8, t + 4, 12, 26, -0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#4c8f4a"; g.beginPath(); g.ellipse(t + 10, t - 2, 12, 24, 0.5, 0, Math.PI * 2); g.fill();
}

/* halaman scan QR untuk bergabung ke acara */
export default function ScanPage() {
  const router = useRouter();
  const { gabungAcara } = useStore();
  const canvasRef = useRef(null);
  const timers = useRef([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (canvasRef.current) gambarQR(canvasRef.current);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const pindai = () => {
    setStatus("Memindai...");
    timers.current.push(setTimeout(() => {
      setStatus("Berhasil bergabung!");
      gabungAcara();
      timers.current.push(setTimeout(() => router.push("/dashboard"), 900));
    }, 900));
  };

  return (
    <section id="view-scan">
      <div className="scan">
        <button className="kembali" onClick={() => router.push("/dashboard")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Kembali
        </button>
        <h1>Scan QR untuk bergabung!</h1>
        <p>Scan sekarang dan jadilah bagian dari aksi kecil untuk bumi</p>
        <div className="bingkai">
          <div className="pita">SCAN DI SINI</div>
          <canvas id="qr" ref={canvasRef} width={400} height={400} />
        </div>
        <div className="kontrol">
          <button className="rana" aria-label="Pindai QR" onClick={pindai} />
          <button className="senter" aria-label="Nyalakan lampu">
            <svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
          </button>
        </div>
        <div className="pindai-status" role="status">{status}</div>
      </div>
    </section>
  );
}
