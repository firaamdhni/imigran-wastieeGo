const angka = (n) => Number(n || 0).toLocaleString("id-ID");
const waktu = (ts) => new Date(ts).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export const LABEL_PENILAIAN = { belum: "Belum dinilai", otomatis: "Otomatis", manual: "Manual" };

/* daftar peserta yang sudah bergabung, urut berdasarkan peringkat evaluasi */
export default function PesertaTabel({ peserta, pemenang, cari, setCari }) {
  const kata = cari.trim().toLowerCase();
  const tampil = kata ? peserta.filter((p) => p.nama.toLowerCase().includes(kata)) : peserta;
  const hadiah = (id) => pemenang.find((w) => w.pesertaId === id);

  return (
    <>
      <div className="pnl-alat">
        <input
          type="search" className="pnl-cari" placeholder="Cari nama peserta" aria-label="Cari nama peserta"
          value={cari} onChange={(e) => setCari(e.target.value)}
        />
        <small>Menampilkan {tampil.length} dari {peserta.length} peserta</small>
      </div>

      {peserta.length === 0 ? (
        <p className="pnl-kosong">Belum ada peserta yang bergabung. Peserta muncul di sini setelah memindai QR acara.</p>
      ) : (
        <div className="pnl-tabel-bungkus">
          <table className="pnl-tabel">
            <caption className="pnl-sr">Daftar peserta acara</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Peserta</th>
                <th scope="col">Bergabung</th>
                <th scope="col">Progres misi</th>
                <th scope="col" className="angka">Misi selesai</th>
                <th scope="col" className="angka">Aktivitas</th>
                <th scope="col" className="angka">Skor (gCO₂e)</th>
                <th scope="col">Penilaian</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((p) => (
                <tr key={p.id}>
                  <td><span className={"pnl-rank" + (p.peringkat <= 3 ? " top" : "")}>{p.peringkat}</span></td>
                  <th scope="row" className="pnl-nama">
                    {p.nama}
                    {hadiah(p.id) && (
                      <span className="pnl-juara-lencana" title={hadiah(p.id).reward}>
                        {hadiah(p.id).tingkat === 1 ? `Juara ${hadiah(p.id).peringkat}` : "Penerima reward"}
                      </span>
                    )}
                  </th>
                  <td>{waktu(p.bergabungPada)}</td>
                  <td>
                    <div className="pnl-progres">
                      <div className="pnl-bar" role="progressbar" aria-label={`Progres misi ${p.nama}`} aria-valuenow={p.persentase} aria-valuemin={0} aria-valuemax={100}>
                        <i style={{ width: `${p.persentase}%` }} />
                      </div>
                      <span>{p.persentase}%</span>
                    </div>
                  </td>
                  <td className="angka">{p.misiSelesai}/{p.totalMisi}</td>
                  <td className="angka">{angka(p.jumlahAktivitas)}</td>
                  <td className="angka"><b>{angka(p.skor)}</b></td>
                  <td><span className={"pnl-nilai-lencana " + p.statusPenilaian}>{LABEL_PENILAIAN[p.statusPenilaian]}</span></td>
                </tr>
              ))}
              {tampil.length === 0 && (
                <tr><td colSpan={8} className="pnl-kosong-sel">Tidak ada peserta dengan nama tersebut.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
