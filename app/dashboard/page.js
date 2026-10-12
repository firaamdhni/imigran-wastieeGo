"use client";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Icons";
import { NAMA_MISI_PENDEK, TOTAL_TARGET, persenTotal, useStore } from "@/lib/store";

const KELILING = 263.9; // keliling cincin (2 * pi * 42)
const WARNA = ["#3573c9", "#f47fbf", "#4a9a86"];

/* halaman beranda */
export default function BerandaPage() {
  const router = useRouter();
  const { nama, acara, sudahGabung: g, misi } = useStore();

  let offset = 0;
  const segmen = misi.map((m) => {
    const panjang = (m.capai / TOTAL_TARGET) * KELILING;
    const s = { panjang, offset };
    offset += panjang;
    return s;
  });

  return (
    <section id="view-beranda">
      <header className="hero">
        <button className="lonceng" aria-label="Notifikasi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
        </button>
        <h1>Halo, <span>{nama}</span>!</h1>
        <p>
          {g
            ? "Terimakasih sudah bergabung ke sebuah acara! ikuti dan penuhi misi untuk mendapatkan hadiah"
            : "Ayo bergabung ke acara yang sedang anda ikuti dan penuhi misi untuk mendapatkan hadiah"}
        </p>
      </header>

      <div className="isi">
        <div>
          <div className={"kartu" + (g ? " bersinar" : "")}>
            <div className="profil">
              <div className="avatar" aria-hidden="true"><Avatar /></div>
              <div>
                <b>{nama}</b>
                <small>{g ? "Anda berada diacara " + acara : "Anda belum bergabung di acara manapun!"}</small>
              </div>
            </div>
            <button className="btn" onClick={() => router.push(g ? "/dashboard/misi" : "/dashboard/scan")}>
              {g ? "Selesaikan Misi" : "Bergabung ke acara"}
            </button>
          </div>

          <div className="statistik">
            <div className="cincin" role="img" aria-label="Progres emisi karbon">
              <svg viewBox="0 0 100 100">
                <circle className="dasar" cx="50" cy="50" r="42" />
                {segmen.map((s, i) => (
                  <circle
                    key={i}
                    className="seg"
                    cx="50" cy="50" r="42"
                    stroke={WARNA[i]}
                    strokeDasharray={`${s.panjang} ${KELILING - s.panjang}`}
                    strokeDashoffset={-s.offset}
                  />
                ))}
              </svg>
              <div className="angka">{persenTotal(misi)}%</div>
            </div>
            <div className="legenda">
              {misi.map((m, i) => (
                <div className="baris" key={i}>
                  <div className="bar"><i style={{ width: `${(m.capai / m.target) * 100}%` }} /></div>
                  {NAMA_MISI_PENDEK[i]}: {Math.round(m.capai).toLocaleString("id-ID")} gCO₂e tercapai
                </div>
              ))}
            </div>
          </div>
        </div>

        <article className="kartu wasteinfo">
          <h2>WasteInfo</h2>
          <div className="infografis" role="img" aria-label="Infografis umur sampah plastik di laut">
            <div className="item"><b>450 tahun</b>Botol Plastik</div>
            <div className="tengah">Umur <em>Sampah Plastik</em> di Laut</div>
            <div className="item"><b>200 tahun</b>Kaleng Aluminium</div>
            <div className="item"><b>450 tahun</b>Popok Bayi</div>
            <div className="item"><b>400 tahun</b>Ring Minuman</div>
            <div className="item"><b>600 tahun</b>Senar Pancing</div>
          </div>
          <a href="#" className="judul" onClick={(e) => e.preventDefault()}>Berapa lama sampah plastik terurai? PULUHAN TAHUN??!...</a>
          <p>Tahukah kamu bahwa tiap jenis sampah plastik membutuhkan waktu berbeda untuk terurai di alam. Pelajari cara memilah dan mengurangi sampah dari sekarang.</p>
        </article>
      </div>
    </section>
  );
}
