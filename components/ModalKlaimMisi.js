"use client";
import { useEffect, useState } from "react";
import { panggilApi } from "@/lib/api";
import KodeQR from "@/components/penyelenggara/KodeQR";

export default function ModalKlaimMisi({ misi, kodeAcara, namaPeserta, onClose, onKlaimBerhasil }) {
  const [klaim, setKlaim] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [disalin, setDisalin] = useState(false);

  // Ambil / buat kode klaim
  useEffect(() => {
    let aktif = true;
    (async () => {
      setMemuat(true);
      setGalat("");
      const url = `/api/event/klaim?kode=${encodeURIComponent(kodeAcara)}&nama=${encodeURIComponent(namaPeserta)}&misiId=${misi.id}`;
      const r = await panggilApi(url);
      if (!aktif) return;
      setMemuat(false);
      if (r.ok && r.data?.klaim) {
        setKlaim(r.data.klaim);
      } else {
        setGalat(r.data?.error || "Gagal memuat kode klaim. Pastikan misi sudah selesai.");
      }
    })();
    return () => { aktif = false; };
  }, [misi.id, kodeAcara, namaPeserta]);

  // Polling status klaim tiap 3 detik selama modal terbuka dan belum diklaim
  useEffect(() => {
    if (!klaim || klaim.diklaim) return;
    const interval = setInterval(async () => {
      const url = `/api/event/klaim?kode=${encodeURIComponent(kodeAcara)}&nama=${encodeURIComponent(namaPeserta)}&misiId=${misi.id}`;
      const r = await panggilApi(url);
      if (r.ok && r.data?.klaim?.diklaim) {
        setKlaim(r.data.klaim);
        if (onKlaimBerhasil) onKlaimBerhasil(misi.id);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [klaim, misi.id, kodeAcara, namaPeserta, onKlaimBerhasil]);

  const salinKode = () => {
    if (!klaim?.kode) return;
    navigator.clipboard?.writeText(klaim.kode);
    setDisalin(true);
    setTimeout(() => setDisalin(false), 2000);
  };

  const sudahDiklaim = Boolean(klaim?.diklaim);

  return (
    <div className="latar-klaim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-klaim" role="dialog" aria-modal="true" aria-labelledby="judul-klaim">
        <button className="tutup-klaim" onClick={onClose} aria-label="Tutup modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <div className="klaim-header">
          <div className="klaim-badge-ikon" aria-hidden="true">🎁</div>
          <h2 id="judul-klaim">Klaim Hadiah Misi</h2>
          <p className="klaim-sub">{misi.teks}</p>
          <span className="klaim-reward-tag">{klaim?.reward || "Reward Penyelesaian Misi Lingkungan"}</span>
        </div>

        {memuat && (
          <div className="klaim-status-box memuat">
            <div className="klaim-spinner" />
            <p>Menyiapkan QR Code klaim hadiah...</p>
          </div>
        )}

        {galat && (
          <div className="klaim-status-box galat">
            <p>⚠️ {galat}</p>
          </div>
        )}

        {!memuat && klaim && (
          <div className="klaim-konten">
            <div className={`klaim-qr-wrap ${sudahDiklaim ? "terklaim" : ""}`}>
              <KodeQR teks={klaim.kode} ukuran={190} label={`QR Klaim Hadiah Misi ${misi.id}`} />
              {sudahDiklaim && (
                <div className="klaim-stempel-overlay">
                  <div className="stempel-cap">
                    <span>SUDAH DIKLAIM</span>
                  </div>
                </div>
              )}
            </div>

            <div className="klaim-kode-bar">
              <span className="label-kode">KODE REFF KLAIM</span>
              <b className="teks-kode">{klaim.kode}</b>
              <button className="btn-salin-kode" onClick={salinKode} type="button">
                {disalin ? "✓ Tersalin" : "Salin"}
              </button>
            </div>

            {sudahDiklaim ? (
              <div className="klaim-pesan sukses">
                <span className="ikon-sukses">✓</span>
                <div>
                  <b>Hadiah Sudah Diklaim!</b>
                  <p>
                    Reward telah diserahkan pada{" "}
                    {klaim.diklaimPada
                      ? new Date(klaim.diklaimPada).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                      : "acara ini"}
                    . QR Code ini sudah dinonaktifkan dan tidak bisa dipakai lagi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="klaim-pesan info">
                <p>
                  📲 <b>Perlihatkan QR Code ini ke Penyelenggara/Panitia</b> di lokasi acara.
                  Panitia akan langsung memindai QR ini untuk menyerahkan hadiahmu.
                </p>
                <small className="catatan-klaim">
                  *QR code ini bersifat <b>sekali pakai (one-time claim)</b> khusus untuk misi ini.
                </small>
              </div>
            )}
          </div>
        )}

        <div className="klaim-bawah">
          <button className="btn putih lebar" onClick={onClose}>
            {sudahDiklaim ? "Selesai" : "Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}
