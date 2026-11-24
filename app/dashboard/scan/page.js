"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { panggilApi } from "@/lib/api";
import { ambilKodeDariTeks } from "@/lib/kodeAcara";

/* kode yang dititipkan saat peserta membuka tautan QR sebelum login */
const KUNCI_TERTUNDA = "wastieego_kode_tertunda";

function Scan() {
  const router = useRouter();
  const params = useSearchParams();
  const { gabungAcara, nama } = useStore();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sibuk = useRef(false); // true selama menggabung / setelah berhasil, agar QR yang sama tidak diproses berulang
  const timers = useRef([]);
  const [status, setStatus] = useState("");
  const [kode, setKode] = useState("");
  const [pesanKamera, setPesanKamera] = useState("Membuka kamera...");
  const [kameraAktif, setKameraAktif] = useState(false);
  const [senter, setSenter] = useState(false);

  /* kode dari tautan QR (?kode=...) atau yang dititipkan sebelum login */
  useEffect(() => {
    let k = ambilKodeDariTeks(params.get("kode") || "");
    try {
      const tertunda = sessionStorage.getItem(KUNCI_TERTUNDA);
      if (tertunda) { sessionStorage.removeItem(KUNCI_TERTUNDA); k = k || ambilKodeDariTeks(tertunda); }
    } catch (e) {}
    if (k) { setKode(k); setStatus("Kode acara terisi dari QR. Tekan tombol bulat untuk bergabung."); }
  }, [params]);

  /* bergabung ke acara: dipakai oleh pemindai kamera maupun kode yang diketik */
  const gabung = useCallback(async (masukan) => {
    if (sibuk.current) return;
    const k = ambilKodeDariTeks(masukan);
    if (!k) return setStatus("Kode acara belum benar. Periksa lagi kode dari penyelenggara.");
    sibuk.current = true;
    setStatus("Memeriksa kode...");
    const r = await panggilApi("/api/event/gabung", { method: "POST", body: { kode: k, nama } });
    if (!r.ok) {
      setStatus(r.data?.error || "Tidak dapat terhubung ke server.");
      timers.current.push(setTimeout(() => { sibuk.current = false; }, 2500)); // jeda sebelum boleh mencoba lagi
      return;
    }
    setKode(k);
    setStatus("Berhasil bergabung di " + r.data.acara.nama + "!");
    gabungAcara(r.data.acara);
    timers.current.push(setTimeout(() => router.push("/dashboard"), 900));
  }, [nama, gabungAcara, router]);

  const gabungRef = useRef(gabung);
  useEffect(() => { gabungRef.current = gabung; });

  /* kamera + pemindaian QR: BarcodeDetector bila ada, jsQR sebagai cadangan (Chrome Windows, Firefox, Safari) */
  useEffect(() => {
    let batal = false;
    let jeda;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return setPesanKamera("Kamera tidak didukung di browser ini. Ketik kode acara di bawah.");
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (batal) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setKameraAktif(true);

        const detektor = typeof BarcodeDetector !== "undefined" ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
        const jsQR = detektor ? null : (await import("jsqr")).default;
        const kanvas = document.createElement("canvas");
        const ctx = kanvas.getContext("2d", { willReadFrequently: true });

        const periksa = async () => {
          if (batal) return;
          if (video.readyState >= 2 && !sibuk.current) {
            let teks = "";
            try {
              if (detektor) {
                teks = (await detektor.detect(video))[0]?.rawValue || "";
              } else {
                kanvas.width = video.videoWidth;
                kanvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const gambar = ctx.getImageData(0, 0, kanvas.width, kanvas.height);
                teks = jsQR(gambar.data, gambar.width, gambar.height)?.data || "";
              }
            } catch (e) {}
            if (teks) gabungRef.current(teks);
          }
          jeda = setTimeout(periksa, 250);
        };
        periksa();
      } catch (e) {
        setPesanKamera(
          location.protocol === "http:" && location.hostname !== "localhost"
            ? "Kamera hanya bisa dipakai lewat https atau localhost. Ketik kode acara di bawah."
            : "Kamera tidak bisa dibuka. Izinkan akses kamera, atau ketik kode acara di bawah."
        );
      }
    })();
    const t = timers.current;
    return () => {
      batal = true;
      clearTimeout(jeda);
      t.forEach(clearTimeout);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const nyalakanSenter = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track?.getCapabilities?.().torch) return setStatus("Lampu tidak tersedia di perangkat ini.");
    try {
      await track.applyConstraints({ advanced: [{ torch: !senter }] });
      setSenter(!senter);
    } catch (e) {
      setStatus("Lampu tidak bisa dinyalakan.");
    }
  };

  return (
    <section id="view-scan">
      <div className="scan">
        <button className="kembali" onClick={() => router.push("/dashboard")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Kembali
        </button>
        <h1>Scan QR untuk bergabung!</h1>
        <p>Arahkan kamera ke QR dari penyelenggara. Tidak bisa memindai? Ketik kode acara di bawah, lalu tekan tombol bulat.</p>
        <div className="bingkai">
          <div className="pita">SCAN DI SINI</div>
          <div className="pemindai">
            <video ref={videoRef} muted playsInline hidden={!kameraAktif} aria-label="Pratinjau kamera untuk memindai QR" />
            {kameraAktif ? <div className="pemindai-bidik" aria-hidden="true" /> : <p className="pemindai-pesan">{pesanKamera}</p>}
          </div>
        </div>
        <div className="kode-acara">
          <label htmlFor="kode-acara">Kode acara</label>
          <input
            id="kode-acara" value={kode} maxLength={10} autoComplete="off" placeholder="Contoh: K7M2QX"
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") gabung(kode); }}
          />
        </div>
        <div className="kontrol">
          <button className="rana" aria-label="Gabung dengan kode acara" onClick={() => gabung(kode)} />
          <button className="senter" aria-label="Nyalakan lampu" aria-pressed={senter} onClick={nyalakanSenter}>
            <svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
          </button>
        </div>
        <div className="pindai-status" role="status">{status}</div>
      </div>
    </section>
  );
}

/* halaman scan QR untuk bergabung ke acara (useSearchParams butuh Suspense) */
export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <Scan />
    </Suspense>
  );
}
