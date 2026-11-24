"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { panggilApi } from "@/lib/api";

export default function KlaimRewardPanel({ acara, onMuatUlang }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sibukRef = useRef(false);
  const terakhirDipindaiRef = useRef("");
  const waktuTerakhirRef = useRef(0);

  const [kameraAktif, setKameraAktif] = useState(false);
  const [pesanKamera, setPesanKamera] = useState("Membuka kamera pemindai...");
  const [senter, setSenter] = useState(false);

  const [kodeManual, setKodeManual] = useState("");
  const [sedangKirim, setSedangKirim] = useState(false);

  const [hasilKlaim, setHasilKlaim] = useState(null);
  const [daftarKlaim, setDaftarKlaim] = useState([]);
  const [memuatDaftar, setMemuatDaftar] = useState(true);
  const [cari, setCari] = useState("");

  /* Muat daftar riwayat klaim */
  const muatRiwayat = useCallback(async () => {
    setMemuatDaftar(true);
    const r = await panggilApi("/api/penyelenggara/klaim");
    setMemuatDaftar(false);
    if (r.ok && r.data?.riwayatKlaim) {
      setDaftarKlaim(r.data.riwayatKlaim);
    }
  }, []);

  useEffect(() => {
    muatRiwayat();
  }, [muatRiwayat]);

  /* Eksekusi klaim ke API (otomatis tanpa ketik kode) */
  const eksekusiKlaim = useCallback(async (kode) => {
    if (!kode) return;
    const kodeBersih = kode.trim().toUpperCase();
    if (!kodeBersih) return;

    // Hindari pemindaian berulang terhadap kode yang sama dalam selang 4 detik
    const sekarang = Date.now();
    if (terakhirDipindaiRef.current === kodeBersih && sekarang - waktuTerakhirRef.current < 4000) {
      return;
    }
    terakhirDipindaiRef.current = kodeBersih;
    waktuTerakhirRef.current = sekarang;
    sibukRef.current = true;
    setSedangKirim(true);

    try {
      const r = await panggilApi("/api/penyelenggara/klaim", {
        method: "POST",
        body: { kodeKlaim: kodeBersih },
      });

      if (r.ok && r.data?.data) {
        // SUKSES KLAIM
        const d = r.data.data;
        setHasilKlaim({
          tipe: "sukses",
          judul: "🎉 Hadiah Berhasil Diklaim!",
          pesan: `Reward untuk ${d.peserta.nama} (${d.teksMisi || "Misi " + d.misiId}) berhasil diverifikasi dan diserahkan. QR Code sekarang telah dinonaktifkan.`,
          waktu: new Date(d.diklaimPada).toLocaleTimeString("id-ID"),
          kode: kodeBersih,
        });
        muatRiwayat();
        if (onMuatUlang) onMuatUlang();
      } else if (r.data?.sudahDiklaim) {
        // SUDAH PERNAH DIKLAIM
        const d = r.data.data;
        const waktuKlaim = d?.diklaimPada
          ? new Date(d.diklaimPada).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
          : "sebelumnya";
        setHasilKlaim({
          tipe: "peringatan",
          judul: "⚠️ QR Code Sudah Pernah Diklaim!",
          pesan: `Reward ini sudah pernah diklaim oleh ${d?.peserta?.nama || "peserta"} pada ${waktuKlaim}. QR Code ini TIDAK BISA digunakan lagi!`,
          kode: kodeBersih,
        });
      } else {
        // GAGAL / KODE TIDAK VALID
        setHasilKlaim({
          tipe: "bahaya",
          judul: "❌ QR Code Tidak Valid",
          pesan: r.data?.error || "Kode klaim tidak terdaftar pada acara ini.",
          kode: kodeBersih,
        });
      }
    } catch (e) {
      setHasilKlaim({
        tipe: "bahaya",
        judul: "❌ Terjadi Kesalahan",
        pesan: "Tidak dapat menghubungi server. Coba lagi.",
        kode: kodeBersih,
      });
    } finally {
      setSedangKirim(false);
      // Tunggu 3.5 detik sebelum scanner membaca kode berikutnya
      setTimeout(() => {
        sibukRef.current = false;
      }, 3500);
    }
  }, [muatRiwayat, onMuatUlang]);

  const eksekusiRef = useRef(eksekusiKlaim);
  useEffect(() => { eksekusiRef.current = eksekusiKlaim; });

  /* Kamera Scanner Otomatis */
  useEffect(() => {
    let batal = false;
    let jeda;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPesanKamera("Kamera tidak didukung di peramban ini. Gunakan input manual di bawah.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (batal) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setKameraAktif(true);

        const detektor = typeof BarcodeDetector !== "undefined" ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
        const jsQR = detektor ? null : (await import("jsqr")).default;
        const kanvas = document.createElement("canvas");
        const ctx = kanvas.getContext("2d", { willReadFrequently: true });

        const periksa = async () => {
          if (batal) return;
          if (video.readyState >= 2 && !sibukRef.current) {
            let teks = "";
            try {
              if (detektor) {
                const barcodes = await detektor.detect(video);
                teks = barcodes[0]?.rawValue || "";
              } else {
                kanvas.width = video.videoWidth;
                kanvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const gambar = ctx.getImageData(0, 0, kanvas.width, kanvas.height);
                teks = jsQR(gambar.data, gambar.width, gambar.height)?.data || "";
              }
            } catch (err) {}

            if (teks && !sibukRef.current) {
              eksekusiRef.current(teks);
            }
          }
          jeda = setTimeout(periksa, 250);
        };
        periksa();
      } catch (e) {
        setPesanKamera("Kamera tidak dapat diakses. Pastikan izin kamera aktif atau gunakan input manual.");
      }
    })();

    return () => {
      batal = true;
      clearTimeout(jeda);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const nyalakanSenter = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track?.getCapabilities?.().torch) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !senter }] });
      setSenter(!senter);
    } catch (e) {}
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!kodeManual.trim()) return;
    eksekusiKlaim(kodeManual.trim());
    setKodeManual("");
  };

  const klaimTerfilter = daftarKlaim.filter((k) =>
    k.pesertaNama.toLowerCase().includes(cari.toLowerCase()) ||
    (k.kode && k.kode.toLowerCase().includes(cari.toLowerCase()))
  );

  const totalDiklaim = daftarKlaim.filter((k) => k.diklaim).length;

  return (
    <div className="pnl-klaim-wrap">
      {/* Kolom Kiri: Scanner Kamera Otomatis & Input Manual */}
      <section className="pnl-klaim-scanner-card" aria-label="Pemindai QR Klaim">
        <div className="pnl-klaim-card-head">
          <div className="pnl-klaim-ikon-head" aria-hidden="true">📷</div>
          <div>
            <h3>Pemindai QR Hadiah Peserta</h3>
            <p>Arahkan kamera ke QR Code di ponsel peserta. Sistem akan <b>langsung memverifikasi secara otomatis</b>.</p>
          </div>
        </div>

        {/* Viewfinder Kamera */}
        <div className="pnl-pemindai-bingkai">
          <video ref={videoRef} muted playsInline hidden={!kameraAktif} aria-label="Kamera Scanner QR Klaim" />
          {kameraAktif ? (
            <div className={`pnl-pemindai-reticle ${sedangKirim ? "reticle-sibuk" : ""}`}>
              <div className="reticle-garis" />
              {sedangKirim && <span className="reticle-label">Memverifikasi QR...</span>}
            </div>
          ) : (
            <div className="pnl-pemindai-pesan">
              <p>{pesanKamera}</p>
            </div>
          )}

          {kameraAktif && (
            <button
              className={`pnl-senter-btn ${senter ? "aktif" : ""}`}
              onClick={nyalakanSenter}
              title="Nyalakan/matikan lampu flash"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
              </svg>
            </button>
          )}
        </div>

        {/* Notifikasi Hasil Scan Instan */}
        {hasilKlaim && (
          <div className={`pnl-hasil-klaim-banner ${hasilKlaim.tipe}`} role="alert">
            <div className="hasil-klaim-ikon">
              {hasilKlaim.tipe === "sukses" ? "✓" : hasilKlaim.tipe === "peringatan" ? "⚠️" : "✕"}
            </div>
            <div className="hasil-klaim-teks">
              <b>{hasilKlaim.judul}</b>
              <p>{hasilKlaim.pesan}</p>
              <small className="hasil-kode-info">Kode: {hasilKlaim.kode}</small>
            </div>
            <button className="btn-tutup-hasil" onClick={() => setHasilKlaim(null)} aria-label="Tutup notifikasi">
              ×
            </button>
          </div>
        )}

        {/* Input Manual Cadangan */}
        <form className="pnl-klaim-manual-form" onSubmit={handleManualSubmit}>
          <label htmlFor="input-kode-klaim">Tidak bisa memindai? Masukkan kode referral klaim:</label>
          <div className="input-group">
            <input
              id="input-kode-klaim"
              type="text"
              value={kodeManual}
              onChange={(e) => setKodeManual(e.target.value.toUpperCase())}
              placeholder="Contoh: CLM-K7M2QX-M1-XXXX"
              maxLength={25}
              autoComplete="off"
            />
            <button className="btn kecil" type="submit" disabled={sedangKirim || !kodeManual.trim()}>
              {sedangKirim ? "Memproses..." : "Klaim"}
            </button>
          </div>
        </form>
      </section>

      {/* Kolom Kanan: Tabel Riwayat Klaim Acara */}
      <section className="pnl-klaim-tabel-card" aria-label="Daftar Hadiah yang Telah Diklaim">
        <div className="pnl-klaim-tabel-head">
          <div>
            <h3>Riwayat Hadiah Diklaim</h3>
            <p>Total hadiah yang telah diserahkan: <b>{totalDiklaim} hadiah</b></p>
          </div>
          <button className="btn kecil putih" onClick={muatRiwayat} disabled={memuatDaftar}>
            {memuatDaftar ? "Menyegarkan..." : "Segarkan"}
          </button>
        </div>

        <div className="pnl-klaim-cari-wrap">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama peserta atau kode klaim..."
          />
        </div>

        <div className="pnl-tabel-scroll">
          <table className="pnl-tabel">
            <thead>
              <tr>
                <th>No</th>
                <th>Peserta</th>
                <th>Misi</th>
                <th>Kode Referral</th>
                <th>Status</th>
                <th>Waktu Klaim</th>
              </tr>
            </thead>
            <tbody>
              {klaimTerfilter.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tabel-kosong">
                    {memuatDaftar ? "Memuat data klaim..." : "Belum ada hadiah yang diklaim."}
                  </td>
                </tr>
              ) : (
                klaimTerfilter.map((k, idx) => (
                  <tr key={idx} className={k.diklaim ? "baris-diklaim" : ""}>
                    <td>{idx + 1}</td>
                    <td><b>{k.pesertaNama}</b></td>
                    <td>
                      <span className="lencana-misi">Misi {k.misiId}</span>
                      <small className="misi-teks-mini">{k.misiTeks}</small>
                    </td>
                    <td><code className="kode-klaim-tag">{k.kode}</code></td>
                    <td>
                      {k.diklaim ? (
                        <span className="status-badge hijau">✓ SUDAH DIKLAIM</span>
                      ) : (
                        <span className="status-badge kuning">BELUM DIKLAIM</span>
                      )}
                    </td>
                    <td>
                      {k.diklaimPada ? (
                        new Date(k.diklaimPada).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
