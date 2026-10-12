"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Icons";
import PasswordField from "@/components/PasswordField";
import { Sesi } from "@/lib/session";
import { useToast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    /* sudah login? langsung ke dashboard */
    if (Sesi.ambil()) { router.replace("/dashboard"); return; }
    /* datang dari halaman daftar: isi nama pengguna otomatis */
    try {
      const baru = sessionStorage.getItem("wastieego_user_baru");
      if (baru) {
        sessionStorage.removeItem("wastieego_user_baru");
        setUser(baru);
        toast("Akun berhasil dibuat. Silakan masuk.");
        document.getElementById("l-pass")?.focus();
      }
    } catch (e) {}
  }, [router, toast]);

  const masukKeAplikasi = (nama) => {
    Sesi.simpan(nama);
    router.push("/dashboard");
  };

  const kirim = (e) => {
    e.preventDefault();
    // TODO: ganti dengan panggilan ke backend (cek username & kata sandi)
    masukKeAplikasi(user.trim());
  };

  const bisaKirim = user.trim() && pass;

  return (
    <div id="app-auth">
      <div className="auth-kiri">
        <Logo />
        <p>Ayo buang sampah pada tempatnya dan ukur jumlah emisi karbon yang dapat kamu kurangi hari ini!</p>
      </div>

      <div className="auth-kanan">
        <section className="form-auth">
          <h1>Selamat Datang</h1>
          <p className="sub">Masuk untuk melanjutkan aksi kecilmu untuk bumi</p>
          <button className="btn-google" type="button" onClick={() => masukKeAplikasi("Inipira")}>
            <svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" /><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.9 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
            Lanjutkan dengan Google
          </button>
          <div className="pemisah">Atau masuk dengan</div>
          <form onSubmit={kirim} noValidate>
            <div className="field">
              <label htmlFor="l-user">Nama pengguna</label>
              <input id="l-user" autoComplete="username" placeholder="Masukkan nama pengguna" value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <PasswordField id="l-pass" label="Kata Sandi" value={pass} onChange={setPass} placeholder="Masukkan Kata Sandi" autoComplete="current-password" />
            <div className="tautan-kanan">
              <a href="#" onClick={(e) => { e.preventDefault(); toast("Fitur reset kata sandi belum tersedia di prototipe"); }}>Lupa kata sandi?</a>
            </div>
            <button className="btn-lebar" disabled={!bisaKirim}>Masuk</button>
          </form>
          <p className="pindah">Belum punya akun? <Link href="/register">Daftar</Link></p>
        </section>
      </div>
    </div>
  );
}
