"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IkonPanahKiri, Logo } from "@/components/Icons";
import PasswordField from "@/components/PasswordField";

export default function RegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");

  const kirim = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Format e-mail belum benar.");
    if (pass.length < 6) return setErr("Kata sandi minimal 6 karakter.");
    if (pass !== pass2) return setErr("Konfirmasi kata sandi tidak sama.");
    setErr("");
    // TODO: kirim data pendaftaran ke backend
    try { sessionStorage.setItem("wastieego_user_baru", user.trim()); } catch (e) {}
    router.push("/login");
  };

  const bisaKirim = user.trim() && email.trim() && pass && pass2;

  return (
    <div id="app-auth">
      <div className="auth-kiri">
        <button className="balik" aria-label="Kembali" onClick={() => router.push("/login")}>{IkonPanahKiri}</button>
        <Logo />
        <p>Ayo buang sampah pada tempatnya dan ukur jumlah emisi karbon yang dapat kamu kurangi hari ini!</p>
      </div>

      <div className="auth-kanan">
        <section className="form-auth">
          <h1>Selamat Datang</h1>
          <p className="sub">Ayo buang sampah pada tempatnya dan ukur jumlah emisi karbon yang dapat kamu kurangi hari ini!</p>
          <div className="pemisah">Belum Punya Akun?</div>
          <h2>Daftar Akun</h2>
          <form onSubmit={kirim} noValidate>
            <div className="field">
              <label htmlFor="d-user">Nama pengguna</label>
              <input id="d-user" autoComplete="username" placeholder="Masukkan nama pengguna" value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="d-email">E-mail</label>
              <input id="d-email" type="email" autoComplete="email" placeholder="Masukkan alamat E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <PasswordField id="d-pass" label="Kata Sandi" value={pass} onChange={setPass} placeholder="Masukkan Kata Sandi" autoComplete="new-password" />
            <PasswordField id="d-pass2" label="Konfirmasi Kata Sandi" value={pass2} onChange={setPass2} placeholder="Konfirmasi Kata Sandi" autoComplete="new-password" />
            <p className="error" role="alert">{err}</p>
            <div className="tautan-kanan"><Link href="/login">Sudah Punya Akun?</Link></div>
            <button className="btn-lebar" disabled={!bisaKirim}>Daftar</button>
          </form>
        </section>
      </div>
    </div>
  );
}
