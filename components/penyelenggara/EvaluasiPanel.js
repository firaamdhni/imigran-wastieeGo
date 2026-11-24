import PeriksaPeserta from "./PeriksaPeserta";
import { LABEL_PENILAIAN } from "./PesertaTabel";
import { hitungPenerima, labelRentang } from "./penerima";

const angka = (n) => Number(n || 0).toLocaleString("id-ID");
const waktu = (ts) => new Date(ts).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

/* evaluasi hasil: periksa aktivitas peserta, nilai, lalu tetapkan pemenang (otomatis dari peringkat teratas) */
export default function EvaluasiPanel({
  data, proses, periksa,
  onPeriksa, onTutupPeriksa, onVerifikasi, onNilai, onTetapkan, onTandai, onBukaKembali,
}) {
  const { acara, peserta, pemenang, kriteria, reward } = data;
  const selesai = acara.status === "selesai";
  const penerima = hitungPenerima(peserta, reward);
  const belumDinilai = penerima.filter((p) => p.statusPenilaian === "belum").length;

  if (periksa.id) {
    return (
      <PeriksaPeserta
        detail={periksa.detail} memuat={periksa.memuat} terkunci={selesai} proses={proses}
        onKembali={onTutupPeriksa} onVerifikasi={onVerifikasi} onNilai={onNilai}
      />
    );
  }

  return (
    <>
      <section className="pnl-kartu">
        <h2>Kriteria penilaian</h2>
        <ul className="pnl-kriteria">{kriteria.map((k) => <li key={k}>{k}</li>)}</ul>
      </section>

      <section className="pnl-kartu" aria-label="Periksa aktivitas peserta">
        <h2>Periksa aktivitas peserta</h2>
        <p className="pnl-info">
          Buka tiap peserta untuk melihat riwayat aktivitas dan foto yang diunggah, verifikasi keasliannya, lalu beri nilai
          ({data.ringkasan.sudahDinilai} dari {data.ringkasan.total} peserta sudah dinilai).
        </p>
        {peserta.length === 0 ? (
          <p className="pnl-kosong">Belum ada peserta, jadi belum ada yang bisa diperiksa.</p>
        ) : (
          <div className="pnl-tabel-bungkus pnl-tabel-tinggi">
            <table className="pnl-tabel">
              <caption className="pnl-sr">Peserta yang perlu diperiksa</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Peserta</th>
                  <th scope="col" className="angka">Aktivitas</th>
                  <th scope="col" className="angka">Menunggu</th>
                  <th scope="col" className="angka">Skor (gCO₂e)</th>
                  <th scope="col">Penilaian</th>
                  <th scope="col"><span className="pnl-sr">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {peserta.map((p) => (
                  <tr key={p.id}>
                    <td><span className={"pnl-rank" + (p.peringkat <= 3 ? " top" : "")}>{p.peringkat}</span></td>
                    <th scope="row" className="pnl-nama">{p.nama}</th>
                    <td className="angka">{angka(p.jumlahAktivitas)}</td>
                    <td className="angka">{p.menunggu > 0 ? angka(p.menunggu) : <span aria-label="tidak ada yang menunggu">–</span>}</td>
                    <td className="angka"><b>{angka(p.skor)}</b></td>
                    <td><span className={"pnl-nilai-lencana " + p.statusPenilaian}>{LABEL_PENILAIAN[p.statusPenilaian]}</span></td>
                    <td className="angka">
                      <button className="btn kecil" onClick={() => onPeriksa(p.id)} aria-label={`${selesai ? "Lihat" : "Periksa"} aktivitas ${p.nama}`}>
                        {selesai ? "Lihat" : "Periksa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selesai ? (
        <section className="pnl-kartu" aria-label="Pemenang acara">
          <h2>Pemenang &amp; reward</h2>
          <p className="pnl-info">Ditetapkan {waktu(acara.selesaiPada)}. Penerima melihat hasilnya di beranda aplikasi mereka.</p>
          {reward.map((t) => {
            const daftar = pemenang.filter((w) => w.tingkat === t.tingkat);
            if (!daftar.length) return null;
            const sudah = daftar.filter((w) => w.diberikan).length;
            const semua = sudah === daftar.length;
            return (
              <div className="pnl-tingkat" key={t.tingkat}>
                <div className="pnl-tingkat-kepala">
                  <div>
                    <h3>{t.nama}</h3>
                    <small>{labelRentang(t.dari, t.dari + daftar.length - 1)} · {sudah} dari {daftar.length} sudah diberikan</small>
                  </div>
                  <button className={"btn kecil" + (semua ? " putih" : "")} disabled={proses} onClick={() => onTandai({ tingkat: t.tingkat, diberikan: !semua })}>
                    {semua ? "Batalkan semua tanda" : "Tandai semua diberikan"}
                  </button>
                </div>
                <div className="pnl-tabel-bungkus pnl-tabel-tinggi">
                  <table className="pnl-tabel">
                    <caption className="pnl-sr">Penerima {t.nama}</caption>
                    <thead>
                      <tr><th scope="col">#</th><th scope="col">Peserta</th><th scope="col" className="angka">Skor (gCO₂e)</th><th scope="col">Reward</th></tr>
                    </thead>
                    <tbody>
                      {daftar.map((w) => (
                        <tr key={w.pesertaId}>
                          <td><span className={"pnl-rank" + (w.tingkat === 1 ? " top" : "")}>{w.peringkat}</span></td>
                          <th scope="row" className="pnl-nama">{w.nama}{w.tingkat === 1 && <span className="pnl-juara-lencana">Juara {w.peringkat}</span>}</th>
                          <td className="angka"><b>{angka(w.skor)}</b></td>
                          <td>
                            <button className={"btn kecil" + (w.diberikan ? " putih" : "")} disabled={proses} aria-pressed={w.diberikan} onClick={() => onTandai({ pesertaId: w.pesertaId, diberikan: !w.diberikan })}>
                              {w.diberikan ? "Sudah diberikan ✓" : "Tandai diberikan"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <div className="pnl-aksi-bawah">
            <button className="btn kecil bahaya" disabled={proses} onClick={onBukaKembali}>Buka kembali evaluasi</button>
          </div>
        </section>
      ) : peserta.length > 0 && (
        <section className="pnl-kartu" aria-label="Pemenang dan reward">
          <h2>Pemenang &amp; reward</h2>
          <p className="pnl-info">
            Pemenang mengikuti peringkat teratas secara otomatis dan berubah mengikuti hasil verifikasi dan penilaian.
            Reward tiap peringkat diatur di <b>Detail event</b>.
          </p>
          {reward.map((t) => {
            const daftar = penerima.filter((p) => p.tingkat === t.tingkat);
            return (
              <div className="pnl-tingkat" key={t.tingkat}>
                <div className="pnl-tingkat-kepala">
                  <div>
                    <h3>{t.nama}</h3>
                    <small>{labelRentang(t.dari, t.sampai)} · {daftar.length} dari {t.jumlah} penerima terisi</small>
                  </div>
                </div>
                {daftar.length === 0 ? (
                  <p className="pnl-kosong-kecil">Belum ada peserta di peringkat ini.</p>
                ) : (
                  <div className="pnl-tabel-bungkus pnl-tabel-tinggi">
                    <table className="pnl-tabel">
                      <caption className="pnl-sr">Calon penerima {t.nama}</caption>
                      <thead>
                        <tr><th scope="col">#</th><th scope="col">Peserta</th><th scope="col" className="angka">Skor (gCO₂e)</th><th scope="col">Penilaian</th></tr>
                      </thead>
                      <tbody>
                        {daftar.map((p) => (
                          <tr key={p.id}>
                            <td><span className={"pnl-rank" + (t.tingkat === 1 ? " top" : "")}>{p.peringkat}</span></td>
                            <th scope="row" className="pnl-nama">{p.nama}</th>
                            <td className="angka"><b>{angka(p.skor)}</b></td>
                            <td><span className={"pnl-nilai-lencana " + p.statusPenilaian}>{LABEL_PENILAIAN[p.statusPenilaian]}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {belumDinilai > 0 && (
            <p className="pnl-catatan" role="status">{belumDinilai} dari {penerima.length} penerima belum diperiksa atau dinilai.</p>
          )}
          <div className="pnl-aksi-bawah">
            <button className="btn" disabled={penerima.length === 0 || proses} onClick={onTetapkan}>Tetapkan pemenang &amp; akhiri acara</button>
          </div>
        </section>
      )}
    </>
  );
}
