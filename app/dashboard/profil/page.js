"use client";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Icons";
import { Sesi } from "@/lib/session";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";

const panah = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
);
const centang = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>
);
const ikonFoto = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-5 4 4 3-3 4 4" /></svg>
);

const AKTIVITAS = [
  { warna: "kuning", judul: "PILMIPA 2025", poin: 50 },
  { warna: "biru", judul: "INFEST 2025", poin: 25 },
  { warna: "pink", judul: "PILMIPA 2025", poin: 50 },
];

/* halaman profil & pengaturan akun */
export default function ProfilPage() {
  const router = useRouter();
  const { nama, handle, reset } = useStore();
  const { toast } = useToast();

  const keluar = () => {
    Sesi.hapus();
    reset();
    router.push("/login");
  };

  return (
    <section id="view-profil">
      <div className="profil-atas">
        <h1>PROFIL</h1>
        <button className="ganti" onClick={() => toast("Peran vendor belum tersedia di prototipe")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" /></svg>
          Ganti Peran
        </button>
      </div>

      <div className="profil-isi">
        <div className="identitas">
          <div className="foto"><Avatar pipi /></div>
          <h2>{nama}</h2>
          <div className="user">{handle}</div>
          <div className="lencana">
            <svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" stroke="#2f7a63" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            GREEN CONTRIBUTOR
          </div>
          <p className="member">Member since 2026</p>
          <button className="btn kecil" onClick={() => toast("Edit profil belum tersedia di prototipe")}>EDIT PROFIL</button>
        </div>

        <div>
          <div className="dampak">
            <span className="tag">ECO-HERO!</span>
            <h3>DAMPAK SAYA</h3>
            <div className="total"><b>2.4 KG</b><small>SAMPAH YANG DIKONTRIBUSIKAN</small></div>
            <p className="motto">Setiap kontribusi berarti.</p>
            <div className="rincian">
              <div><b>1.2 KG</b><small>PLASTIK</small></div>
              <div><b>0.8 KG</b><small>KERTAS</small></div>
              <div><b>0.4 KG</b><small>ALUMINIUM</small></div>
            </div>
          </div>

          <div className="aktivitas">
            <h3>AKTIVITAS TERBARU</h3>
            <div className="event-daftar">
              {AKTIVITAS.map((a, i) => (
                <article className={"event-kartu " + a.warna} key={i}>
                  <div className="event-ikon" aria-hidden="true">{ikonFoto}</div>
                  <div><b>{a.judul}</b><small>{centang}TERVERIFIKASI +{a.poin} POIN</small></div>
                </article>
              ))}
            </div>
          </div>

          <aside className="penyelenggara">
            <div className="pen-ikon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></svg>
            </div>
            <div className="pen-teks">
              <b>Punya event sendiri?</b>
              <p>Jadikan event-mu lebih ramah lingkungan bersama WastieeGo.</p>
              <button className="pen-btn" onClick={() => router.push("/dashboard/penyelenggara")}>
                JADI PENYELENGGARA <span aria-hidden="true">→</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="akun-band">
        <div className="akun-isi">
          <h3>AKUN</h3>
          <ul className="akun-daftar">
            {["Keamanan", "Privasi", "Notifikasi", "Pengaturan"].map((m) => (
              <li key={m}>
                <button onClick={() => toast(`Menu ${m} belum tersedia di prototipe`)}>{m}{panah}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="keluar-baris">
        <button className="keluar" onClick={keluar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          KELUAR
        </button>
      </div>
    </section>
  );
}
