"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { panggilApi } from "@/lib/api";
import ModalKlaimMisi from "@/components/ModalKlaimMisi";

/* halaman daftar misi + timer */
export default function MisiPage() {
  const router = useRouter();
  const { misi, sudahGabung, sisaDetik, bukaPopup, kodeAcara, nama } = useStore();
  const [misiKlaim, setMisiKlaim] = useState(null);
  const [statusKlaimMap, setStatusKlaimMap] = useState({});

  /* belum gabung acara -> kembali ke beranda dan tampilkan pop-up */
  useEffect(() => {
    if (!sudahGabung) { router.replace("/dashboard"); bukaPopup(); }
  }, [sudahGabung, router, bukaPopup]);

  /* Periksa status klaim untuk misi yang sudah selesai */
  const cekStatusKlaim = useCallback(async () => {
    if (!sudahGabung || !kodeAcara || !nama) return;
    const selesaiList = misi.filter((m) => m.capai >= m.target);
    for (const m of selesaiList) {
      const url = `/api/event/klaim?kode=${encodeURIComponent(kodeAcara)}&nama=${encodeURIComponent(nama)}&misiId=${m.id}`;
      const r = await panggilApi(url);
      if (r.ok && r.data?.klaim) {
        setStatusKlaimMap((prev) => ({
          ...prev,
          [m.id]: Boolean(r.data.klaim.diklaim),
        }));
      }
    }
  }, [sudahGabung, kodeAcara, nama, misi]);

  useEffect(() => {
    cekStatusKlaim();
  }, [cekStatusKlaim]);

  if (!sudahGabung) return null;

  const jam = Math.floor(sisaDetik / 3600);
  const menit = Math.floor((sisaDetik % 3600) / 60);

  return (
    <section id="view-misi">
      <header className="misi-hero">
        <svg className="ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="13" height="16" rx="2" /><path d="M8 4V3h5v1M8 9h5M8 12h3" /><circle cx="17" cy="17" r="5" fill="#fbf3b0" /><path d="M17 14v3l2 1" /></svg>
        <h1>Misi acara</h1>
        <p>Foto sampah di sekitarmu sebelum dibuang ke tempatnya dan penuhi misi dari acara ini!</p>
        <div className="timer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>
          <span>{jam} jam {menit} menit</span>
        </div>
      </header>

      <div className="daftar-misi">
        {misi.map((m, i) => {
          const pct = Math.min(100, (m.capai / m.target) * 100);
          const selesai = pct >= 100;
          const sudahKlaim = Boolean(statusKlaimMap[m.id]);

          return (
            <div className={`misi ${selesai ? "misi-selesai" : ""}`} key={i}>
              <div className="misi-atas">
                <p>{m.teks}</p>
                <span className="co2">{m.target.toLocaleString("id-ID")} gCO₂e</span>
              </div>
              <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${pct}%` }} />
              </div>
              <div className="misi-bawah">
                <small>{Math.round(pct)}% selesai</small>
                {selesai ? (
                  <button
                    className={`btn kecil ${sudahKlaim ? "btn-klaim-sudah" : "btn-klaim-aktif"}`}
                    onClick={() => setMisiKlaim(m)}
                    title={sudahKlaim ? "Lihat bukti klaim reward" : "Tampilkan QR untuk klaim reward"}
                  >
                    {sudahKlaim ? "✓ Hadiah Diklaim" : "🎁 Klaim Hadiah (QR)"}
                  </button>
                ) : (
                  <button
                    className="btn kecil"
                    onClick={() => router.push(`/dashboard/kamera?misi=${i}`)}
                  >
                    Kerjakan Misi
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {misiKlaim && (
        <ModalKlaimMisi
          misi={misiKlaim}
          kodeAcara={kodeAcara}
          namaPeserta={nama}
          onClose={() => setMisiKlaim(null)}
          onKlaimBerhasil={(misiId) => {
            setStatusKlaimMap((prev) => ({ ...prev, [misiId]: true }));
          }}
        />
      )}
    </section>
  );
}
