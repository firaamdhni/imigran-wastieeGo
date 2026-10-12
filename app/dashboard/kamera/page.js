"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { wasteClassifierService } from "@/lib/services/WasteClassifierService";


function Kamera() {
  const router = useRouter();
  const params = useSearchParams();
  const { misi, sudahGabung, tambahCapaian, bukaPopup } = useStore();
  const { toast, toastNanti } = useToast();

  const poster = params.get("mode") === "poster";
  const misiParam = params.get("misi");
  const misiAktif = misiParam !== null && misi[+misiParam] ? +misiParam : null;
  const bolehMasuk = poster || sudahGabung;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);
  const nomorAnalisis = useRef(0);

  const [facing, setFacing] = useState("environment");
  const [pesan, setPesan] = useState("");
  const [foto, setFoto] = useState(null);        // data URL hasil jepretan / galeri
  const [hasil, setHasil] = useState(null);      // hasil analisis (mode sampah)
  const [memuat, setMemuat] = useState(false);

  /* belum gabung acara -> kembali ke beranda dan tampilkan pop-up */
  useEffect(() => {
    if (!bolehMasuk) { router.replace("/dashboard"); bukaPopup(); }
  }, [bolehMasuk, router, bukaPopup]);

  /* nyalakan kamera; dimatikan lagi saat pindah halaman / ganti kamera */
  useEffect(() => {
    if (!bolehMasuk) return;
    let batal = false;
    let stream = null;
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPesan("Kamera tidak didukung di browser ini. Pilih foto dari galeri.");
        return;
      }
      setPesan("Membuka kamera...");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false });
        if (batal) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPesan("");
      } catch (err) {
        if (!batal) setPesan("Kamera tidak bisa dibuka. Izinkan akses kamera di browser, atau pilih foto dari galeri.");
      }
    })();
    return () => {
      batal = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [facing, bolehMasuk]);

  const senterNyala = useRef(false);
  const toggleSenter = async () => {
    const track = streamRef.current && streamRef.current.getVideoTracks()[0];
    const cap = track && track.getCapabilities ? track.getCapabilities() : null;
    if (!cap || !cap.torch) return toast("Lampu tidak tersedia di perangkat ini");
    senterNyala.current = !senterNyala.current;
    try { await track.applyConstraints({ advanced: [{ torch: senterNyala.current }] }); }
    catch (e) { toast("Lampu tidak bisa dinyalakan"); }
  };

  /* misi yang akan menerima emisi: misi terpilih, atau misi pertama yang belum selesai */
  const misiTujuan = useCallback(() => {
    let i = misiAktif;
    if (i == null || misi[i].capai >= misi[i].target) i = misi.findIndex((m) => m.capai < m.target);
    return i;
  }, [misi, misiAktif]);

  const tampilHasil = async (src) => {
    setFoto(src);
    if (poster) return; // poster: tanpa analisis, tinggal konfirmasi
    const nomor = ++nomorAnalisis.current;
    setHasil(null);
    setMemuat(true);
    const h = await wasteClassifierService.classify(src);
    if (nomor !== nomorAnalisis.current) return; // sudah foto ulang / pindah halaman
    setHasil(h);
    setMemuat(false);
  };

  const ambilFoto = () => {
    const v = videoRef.current;
    if (!streamRef.current || !v || !v.videoWidth) return toast("Kamera belum siap");
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    tampilHasil(c.toDataURL("image/jpeg", 0.85));
  };

  const ulang = () => {
    nomorAnalisis.current++;
    setFoto(null); setHasil(null); setMemuat(false);
  };

  /* tutup kamera -> kembali ke halaman asal */
  const keluarKamera = () => {
    if (poster) return router.push("/dashboard/penyelenggara");
    router.push(misiAktif != null ? "/dashboard/misi" : "/dashboard");
  };

  const simpanKeMisi = () => {
    const i = misiTujuan();
    if (!hasil || i < 0) return;
    tambahCapaian(i, hasil.emisi, hasil);
    toastNanti("Tersimpan! Emisi karbon berkurang " + hasil.emisi.toLocaleString("id-ID") + " gCO₂e.");
    keluarKamera();
  };

  const pakaiPoster = () => {
    // poster dititipkan sementara ke halaman penyelenggara
    try { sessionStorage.setItem("wastieego_poster", foto); }
    catch (e) { toastNanti("Foto terlalu besar untuk disimpan sementara"); }
    keluarKamera();
  };

  const dariGaleri = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => tampilHasil(r.result);
    r.readAsDataURL(f);
    e.target.value = "";
  };

  if (!bolehMasuk) return null;

  const tujuan = hasil ? misiTujuan() : -1;
  const konteks = poster
    ? "Arahkan kamera ke poster atau flyer acara Anda"
    : misiAktif == null
      ? "Foto sampah di sekitarmu sebelum dibuang ke tempatnya"
      : "Misi: " + misi[misiAktif].teks;

  return (
    <section id="view-foto">
      <div className="foto-wrap">
        <div className="foto-atas">
          <h1 className={poster ? "poster-judul" : undefined}>{poster ? "Foto Flyer/Poster" : "FOTO SAMPAH"}</h1>
          <small>{konteks}</small>
        </div>

        <div className={"kamera" + (poster ? " poster" : "") + (foto ? " hasil" : "")}>
          <video ref={videoRef} autoPlay playsInline muted />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {foto && <img src={foto} alt="Foto yang diambil" />}
          <div className="kamera-grid" aria-hidden="true" />
          <p className="kamera-pesan">{pesan}</p>
          <button className="kb k-tutup" aria-label="Tutup kamera" onClick={keluarKamera}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
          <button className="kb k-senter" aria-label="Nyalakan lampu" onClick={toggleSenter}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
          </button>
          <button className="kb k-ganti" aria-label="Ganti kamera" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-15-6.7L3 8M3 3v5h5M3 12a9 9 0 0 0 15 6.7L21 16M21 21v-5h-5" /></svg>
          </button>
          <button className="k-rana" aria-label="Ambil foto" onClick={ambilFoto} />
        </div>

        <div className="galeri"><button onClick={() => inputRef.current?.click()}>atau pilih foto dari galeri</button></div>

        {poster && foto && (
          <div className="poster-aksi">
            <button className="btn putih" onClick={ulang}>Foto ulang</button>
            <button className="btn" onClick={pakaiPoster}>Gunakan foto</button>
          </div>
        )}

        {!poster && foto && (
          <div className="analisis" aria-live="polite">
            <h2>Hasil Analisis</h2>
            {memuat && <p>Menganalisis foto...</p>}
            {hasil && (
              <dl>
                <dt>Jenis sampah</dt><dd>{hasil.jenis}</dd>
                <dt>Perkiraan</dt><dd>{hasil.nama}</dd>
                <dt>Emisi berkurang</dt><dd>{hasil.emisi.toLocaleString("id-ID")} gCO₂e</dd>
                <dt>Masuk ke</dt><dd>{tujuan < 0 ? "Semua misi sudah selesai" : "Misi " + (tujuan + 1)}</dd>
              </dl>
            )}
            <p className="catatan">Hasil analisis masih simulasi, belum terhubung ke model klasifikasi.</p>
            <div className="aksi">
              <button className="btn putih" onClick={ulang}>Foto ulang</button>
              <button className="btn" disabled={!hasil || tujuan < 0} onClick={simpanKeMisi}>Simpan ke misi</button>
            </div>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={dariGaleri} />
    </section>
  );
}

export default function KameraPage() {
  return (
    <Suspense fallback={null}>
      <Kamera />
    </Suspense>
  );
}
