"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IkonPanahKiri } from "@/components/Icons";
import { panggilApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";

const KUNCI_DRAFT = "wastieego_draft_pen";
const KUNCI_POSTER = "wastieego_poster";
const KOSONG = { nama: "", acara: "", email: "", hp: "", waktu: "", lokasi: "", detail: "" };

/* form daftar sebagai penyelenggara: membuat akun penyelenggara (e-mail + kata sandi) dan acaranya */
export default function PenyelenggaraPage() {
  const router = useRouter();
  const { simpanPenyelenggara } = useStore();
  const { toast } = useToast();
  const [f, setF] = useState(KOSONG);
  const [pass, setPass] = useState(""); // kata sandi sengaja tidak disimpan ke draft
  const [pass2, setPass2] = useState("");
  const [poster, setPoster] = useState(null);
  const [err, setErr] = useState("");
  const [proses, setProses] = useState(false);

  /* pulihkan isi form & poster (kalau baru kembali dari kamera) */
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(KUNCI_DRAFT));
      if (d) setF((s) => ({ ...s, ...d }));
      const p = sessionStorage.getItem(KUNCI_POSTER);
      // TODO: kirim poster ke backend/OCR agar data acara terisi otomatis
      if (p) setPoster(p);
    } catch (e) {}
  }, []);

  const ubah = (k) => (e) => {
    const baru = { ...f, [k]: e.target.value };
    setF(baru);
    /* isi form disimpan sementara, supaya tidak hilang saat pindah ke halaman kamera */
    try { sessionStorage.setItem(KUNCI_DRAFT, JSON.stringify(baru)); } catch (e) {}
  };

  const unggah = () => {
    try { sessionStorage.setItem(KUNCI_DRAFT, JSON.stringify(f)); } catch (e) {}
    router.push("/dashboard/kamera?mode=poster");
  };

  const lengkap = Object.values(f).every((v) => v.trim()) && pass && pass2;

  const kirim = async (e) => {
    e.preventDefault();
    const hp = f.hp.replace(/[\s-]/g, "");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Format e-mail penyelenggara belum benar.");
    if (!/^(\+62|62|0)8\d{7,12}$/.test(hp)) return setErr("Nomor HP belum benar. Contoh: 081234567890");
    if (pass.length < 8) return setErr("Kata sandi minimal 8 karakter.");
    if (pass !== pass2) return setErr("Konfirmasi kata sandi tidak sama.");
    setErr("");
    setProses(true);
    const r = await panggilApi("/api/penyelenggara/daftar", {
      method: "POST",
      body: {
        nama: f.nama, namaAcara: f.acara, email: f.email, hp,
        waktu: f.waktu, lokasi: f.lokasi, detail: f.detail, password: pass,
      },
    });
    setProses(false);
    if (!r.ok) return setErr(r.data?.error || "Tidak dapat terhubung ke server.");
    simpanPenyelenggara({
      nama: f.nama.trim(), acara: f.acara.trim(), email: f.email.trim(), hp,
      waktu: f.waktu.trim(), lokasi: f.lokasi.trim(), detail: f.detail.trim(), poster,
    });
    try { sessionStorage.removeItem(KUNCI_DRAFT); sessionStorage.removeItem(KUNCI_POSTER); } catch (e) {}
    toast("Akun penyelenggara dibuat. Kode acaramu: " + r.data.kodeAcara);
    router.push("/penyelenggara");
  };

  return (
    <section id="view-penyelenggara">
      <div className="pen-atas">
        <button className="pen-balik" aria-label="Kembali ke profil" onClick={() => router.push("/dashboard/profil")}>
          {IkonPanahKiri}
        </button>
      </div>

      <div className="pen-wrap">
        <h1>Daftar Sebagai Penyelenggara</h1>
        <button type="button" className={"pen-unggah" + (poster ? " terisi" : "")} onClick={unggah}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {poster && <img src={poster} alt="Pratinjau poster acara" />}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 17V8M8 11l4-4 4 4" /></svg>
          <span>
            {poster
              ? "Poster tersimpan. Klik untuk mengganti foto."
              : "Unggah foto Poster/Flyer acara Anda dan data akan tersimpan secara otomatis"}
          </span>
        </button>

        <form onSubmit={kirim} noValidate>
          <div className="ul-field"><label htmlFor="p-nama">Penyelenggara</label>
            <input id="p-nama" placeholder="Masukkan Nama Penyelenggara Acara" autoComplete="organization" maxLength={60} value={f.nama} onChange={ubah("nama")} /></div>
          <div className="ul-field"><label htmlFor="p-acara">Nama Acara</label>
            <input id="p-acara" placeholder="Masukkan Nama Acara" maxLength={80} value={f.acara} onChange={ubah("acara")} /></div>
          <div className="ul-field"><label htmlFor="p-email">E-mail Penyelenggara (dipakai untuk masuk)</label>
            <input id="p-email" type="email" placeholder="Masukkan E-mail Penyelenggara" autoComplete="email" maxLength={100} value={f.email} onChange={ubah("email")} /></div>
          <div className="ul-field"><label htmlFor="p-hp">No Hp Penyelenggara</label>
            <input id="p-hp" type="tel" inputMode="tel" placeholder="Masukkan No Hp Penyelenggara" autoComplete="tel" value={f.hp} onChange={ubah("hp")} /></div>
          <div className="ul-field"><label htmlFor="p-waktu">Waktu Acara</label>
            <input id="p-waktu" placeholder="Masukkan Rentang Waktu Acara Berlangsung" maxLength={80} value={f.waktu} onChange={ubah("waktu")} /></div>
          <div className="ul-field"><label htmlFor="p-lokasi">Lokasi Acara</label>
            <input id="p-lokasi" placeholder="Masukkan Lokasi Dimana Acara Berlangsung" maxLength={120} value={f.lokasi} onChange={ubah("lokasi")} /></div>
          <div className="ul-field"><label htmlFor="p-detail">Detail Acara</label>
            <textarea id="p-detail" rows={2} placeholder="Masukkan Informasi Seputar Acara Yang Akan Berlangsung" maxLength={500} value={f.detail} onChange={ubah("detail")} /></div>
          <div className="ul-field"><label htmlFor="p-pass">Kata Sandi Penyelenggara</label>
            <input id="p-pass" type="password" placeholder="Minimal 8 karakter" autoComplete="new-password" maxLength={72} value={pass} onChange={(e) => setPass(e.target.value)} /></div>
          <div className="ul-field"><label htmlFor="p-pass2">Konfirmasi Kata Sandi</label>
            <input id="p-pass2" type="password" placeholder="Ulangi Kata Sandi" autoComplete="new-password" maxLength={72} value={pass2} onChange={(e) => setPass2(e.target.value)} /></div>
          <p className="error" role="alert" style={{ marginLeft: 0 }}>{err}</p>
          <div className="pen-aksi"><button className="btn-lebar pen-kirim" disabled={!lengkap || proses}>{proses ? "Mendaftarkan..." : "Daftar Sebagai Penyelenggara"}</button></div>
        </form>
      </div>
    </section>
  );
}
