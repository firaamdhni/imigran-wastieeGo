"use client";
import { useEffect, useState } from "react";

const angka = (n) => Number(n || 0).toLocaleString("id-ID");
const waktu = (ts) => new Date(ts).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
const LABEL_STATUS = { terverifikasi: "Terverifikasi", ditolak: "Ditolak", menunggu: "Menunggu", diterima: "Diterima" };

/* satu tahap verifikasi: pilih Asli / Tidak asli; klik pilihan yang sama lagi untuk membatalkan */
function Verifikasi({ nomor, nilai, aktif, nonaktif, onPilih }) {
  const hasil = nilai?.hasil || null;
  const mati = nonaktif || !aktif;
  return (
    <div className="pnl-verif" role="group" aria-label={`Verifikasi ${nomor}`}>
      <span className="pnl-verif-label">Verifikasi {nomor}</span>
      <button type="button" className={"pnl-pilih asli" + (hasil === "asli" ? " dipilih" : "")} aria-pressed={hasil === "asli"} disabled={mati} onClick={() => onPilih(hasil === "asli" ? null : "asli")}>
        Asli
      </button>
      <button type="button" className={"pnl-pilih tidak" + (hasil === "tidak_asli" ? " dipilih" : "")} aria-pressed={hasil === "tidak_asli"} disabled={mati} onClick={() => onPilih(hasil === "tidak_asli" ? null : "tidak_asli")}>
        Tidak asli
      </button>
    </div>
  );
}

/* penilaian akhir: lewati penilaian manual (hasil sudah benar) atau beri nilai manual */
function FormNilai({ peserta, terkunci, proses, onNilai, onKembali }) {
  const [manual, setManual] = useState(peserta.statusPenilaian === "manual");
  const [nilai, setNilai] = useState(String(peserta.nilaiManual ?? peserta.skorOtomatis));
  const [catatan, setCatatan] = useState(peserta.catatan || "");

  useEffect(() => {
    setNilai(String(peserta.nilaiManual ?? peserta.skorOtomatis));
    setCatatan(peserta.catatan || "");
  }, [peserta.id, peserta.nilaiManual, peserta.skorOtomatis, peserta.catatan]);

  const mati = terkunci || proses;
  const status = {
    belum: "Belum dinilai.",
    otomatis: `Hasil dinyatakan benar, memakai skor otomatis (${angka(peserta.skorOtomatis)} gCO₂e).`,
    manual: `Nilai manual: ${angka(peserta.nilaiManual)} gCO₂e${peserta.catatan ? ` · ${peserta.catatan}` : ""}`,
  }[peserta.statusPenilaian];
  const nilaiSah = nilai !== "" && Number.isFinite(Number(nilai)) && Number(nilai) >= 0 && Number(nilai) <= 1000000;

  return (
    <section className="pnl-kartu" aria-label="Penilaian akhir">
      <h3>Penilaian akhir</h3>
      <p className="pnl-info">Setelah memeriksa aktivitas, tentukan nilai peserta. Jika hasilnya sudah benar, penilaian manual boleh dilewati.</p>
      <p className="pnl-status-nilai" role="status">{status}</p>
      <div className="pnl-aksi-nilai">
        <button type="button" className="btn kecil" disabled={mati} onClick={() => { setManual(false); onNilai({ mode: "otomatis" }); }}>
          Hasil sudah benar, lewati penilaian manual
        </button>
        <button type="button" className={"btn kecil putih"} aria-pressed={manual} disabled={mati} onClick={() => setManual(true)}>
          Beri nilai manual
        </button>
        {peserta.statusPenilaian !== "belum" && (
          <button type="button" className="btn kecil bahaya" disabled={mati} onClick={() => { setManual(false); onNilai({ mode: null }); }}>
            Hapus penilaian
          </button>
        )}
      </div>
      {manual && (
        <div className="pnl-form-nilai">
          <label className="pnl-lbl">
            <span>Nilai (gCO₂e)</span>
            <input type="number" min="0" max="1000000" step="1" inputMode="numeric" value={nilai} disabled={mati} onChange={(e) => setNilai(e.target.value)} />
          </label>
          <label className="pnl-lbl">
            <span>Catatan (opsional)</span>
            <input maxLength={200} placeholder="Alasan penilaian" value={catatan} disabled={mati} onChange={(e) => setCatatan(e.target.value)} />
          </label>
          <button type="button" className="btn kecil" disabled={mati || !nilaiSah} onClick={() => onNilai({ mode: "manual", nilai: Number(nilai), catatan })}>
            Simpan nilai manual
          </button>
        </div>
      )}
      <div className="pnl-kembali-bawah">
        <button type="button" className={"btn kecil" + (peserta.statusPenilaian === "belum" ? " putih" : "")} onClick={onKembali}>
          {peserta.statusPenilaian === "belum" ? "← Kembali ke daftar peserta" : "Selesai, kembali ke daftar peserta"}
        </button>
      </div>
    </section>
  );
}

/* halaman periksa satu peserta: riwayat aktivitas yang diunggah, verifikasi dua tahap, lalu penilaian akhir */
export default function PeriksaPeserta({ detail, memuat, terkunci, proses, onKembali, onVerifikasi, onNilai }) {
  return (
    <div className="pnl-periksa">
      <button type="button" className="btn kecil putih" onClick={onKembali}>← Kembali ke daftar peserta</button>

      {!detail ? (
        <p className="pnl-info">{memuat ? "Memuat aktivitas peserta..." : "Data peserta tidak tersedia."}</p>
      ) : (
        <>
          <header className="pnl-periksa-atas">
            <h2>{detail.peserta.nama}</h2>
            <div className="pnl-ringkas">
              <span>Peringkat <b>#{detail.peserta.peringkat}</b></span>
              <span>Skor akhir <b>{angka(detail.peserta.skor)}</b> gCO₂e</span>
              <span>Skor otomatis <b>{angka(detail.peserta.skorOtomatis)}</b> gCO₂e</span>
            </div>
            <div className="pnl-ringkas">
              <span className="pnl-status terverifikasi">{detail.peserta.terverifikasi} terverifikasi</span>
              {detail.peserta.menunggu > 0 && <span className="pnl-status menunggu">{detail.peserta.menunggu} menunggu</span>}
              {detail.peserta.diterima > 0 && <span className="pnl-status diterima">{detail.peserta.diterima} diterima</span>}
              <span className="pnl-status ditolak">{detail.peserta.ditolak} ditolak</span>
            </div>
          </header>

          {terkunci && <p className="pnl-info" role="status">Evaluasi sudah dikunci karena pemenang telah ditetapkan. Buka kembali evaluasi untuk mengubah verifikasi atau penilaian.</p>}

          <section aria-label="Riwayat aktivitas">
            <h3 className="pnl-subjudul">Riwayat aktivitas ({detail.aktivitas.length})</h3>
            <p className="pnl-info">Periksa apakah foto asli dan sesuai jenis sampahnya. Setiap aktivitas dicek dua kali; yang dinyatakan tidak asli tidak dihitung ke skor.</p>
            {detail.aktivitas.length === 0 ? (
              <p className="pnl-kosong">Peserta ini belum mengunggah aktivitas.</p>
            ) : (
              <div className="pnl-akt-grid">
                {detail.aktivitas.map((a) => (
                  <article className={"pnl-akt " + a.status} key={a.id}>
                    <div className="pnl-foto">
                      {a.fotoUrl ? (
                        <a href={a.fotoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buka foto ${a.nama} ukuran penuh`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.fotoUrl} alt={`Foto bukti ${a.nama}`} loading="lazy" />
                        </a>
                      ) : (
                        <span>Tidak ada foto</span>
                      )}
                    </div>
                    <div className="pnl-akt-isi">
                      <div className="pnl-akt-judul">
                        <b>{a.nama}</b>
                        <span className={"pnl-status " + a.status}>{LABEL_STATUS[a.status]}</span>
                      </div>
                      <small>{a.jenis} · {angka(a.emisi)} gCO₂e · {waktu(a.timestamp)}</small>
                      <Verifikasi nomor={1} nilai={a.v1} aktif nonaktif={terkunci || proses} onPilih={(h) => onVerifikasi(a.id, 1, h)} />
                      <Verifikasi nomor={2} nilai={a.v2} aktif={a.v1?.hasil === "asli"} nonaktif={terkunci || proses} onPilih={(h) => onVerifikasi(a.id, 2, h)} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <FormNilai peserta={detail.peserta} terkunci={terkunci} proses={proses} onNilai={onNilai} onKembali={onKembali} />
        </>
      )}
    </div>
  );
}
