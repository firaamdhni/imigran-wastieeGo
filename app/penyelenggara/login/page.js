"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IkonPanahKiri, Logo } from "@/components/Icons";
import PasswordField from "@/components/PasswordField";
import { panggilApi } from "@/lib/api";

export default function LoginPenyelenggaraPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [proses, setProses] = useState(false);

  /* sudah masuk sebagai penyelenggara? langsung ke panel */
  useEffect(() => {
    panggilApi("/api/penyelenggara/session").then((r) => { if (r.ok) router.replace("/penyelenggara"); });
  }, [router]);

  const kirim = async (e) => {
    e.preventDefault();
    setProses(true);
    setErr("");
    const r = await panggilApi("/api/penyelenggara/session", { method: "POST", body: { email: email.trim(), password: pass } });
    setProses(false);
    if (r.ok) return router.push("/penyelenggara");
    setErr(r.data?.error || "Tidak dapat terhubung ke server.");
  };

  return (
    <div id="app-auth">
      <div className="auth-kiri">
        <button className="balik" aria-label="Kembali ke halaman masuk" onClick={() => router.push("/login")}>{IkonPanahKiri}</button>
        <Logo />
        <p>Masuk sebagai penyelenggara untuk memantau peserta acara dan menetapkan pemenang beserta rewardnya.</p>
      </div>

      <div className="auth-kanan">
        <section className="form-auth">
          <h1>Penyelenggara</h1>
          <p className="sub">Masuk dengan e-mail dan kata sandi yang kamu buat saat mendaftar sebagai penyelenggara</p>
          <form onSubmit={kirim} noValidate>
            <div className="field">
              <label htmlFor="pn-email">E-mail penyelenggara</label>
              <input id="pn-email" type="email" autoComplete="username" placeholder="Masukkan e-mail penyelenggara" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <PasswordField id="pn-pass" label="Kata Sandi" value={pass} onChange={setPass} placeholder="Masukkan Kata Sandi" autoComplete="current-password" />
            <p className="error" role="alert">{err}</p>
            <button className="btn-lebar" disabled={!email.trim() || !pass || proses}>{proses ? "Memeriksa..." : "Masuk"}</button>
          </form>
          <p className="pindah">Belum punya akun penyelenggara? Masuk sebagai peserta, lalu buka <b>Profil → Jadi Penyelenggara</b>.</p>
          <p className="pindah"><Link href="/login">Masuk sebagai peserta</Link></p>
        </section>
      </div>
    </div>
  );
}
