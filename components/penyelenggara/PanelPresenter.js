import { Logo } from "@/components/Icons";
import KodeQR from "./KodeQR";
import PesertaTabel from "./PesertaTabel";
import EvaluasiPanel from "./EvaluasiPanel";
import DetailEvent from "./DetailEvent";
import KlaimRewardPanel from "./KlaimRewardPanel";

const angka = (n) => Number(n || 0).toLocaleString("id-ID");

/* PanelPresenter - Presenter (Dumb) Component: hanya menerima props dan menampilkan UI */
export default function PanelPresenter({
  data, memuat, galat, tab, setTab, cari, setCari,
  proses, tautan, periksa, formDetail, versiSampul,
  onBukaDetail, onTutupDetail, onUbahForm, onUbahReward, onTambahReward, onHapusReward,
  onUbahMisi, onTambahMisi, onHapusMisi,
  onPilihSampul, onHapusSampul, onSimpanDetail,
  onPeriksa, onTutupPeriksa, onVerifikasi, onNilai, onTetapkan, onTandai, onBukaKembali, onSalinKode, onUnduhQR,
  onTambahContoh, onHapusContoh, onMuatUlang, onKeluar,
  onPilihAcara, onBukaBuatAcara,
}) {
  const selesai = data?.acara.status === "selesai";
  const adaContoh = Boolean(data?.ringkasan.adaContoh);

  return (
    <div id="app-panel">
      <header className="pnl-atas">
        <div className="pnl-merek">
          <Logo />
          <span className="pnl-label">PANEL PENYELENGGARA{data ? ` · ${data.acara.nama}` : ""}</span>
        </div>
        <div className="pnl-aksi">
          {data?.daftarAcara && data.daftarAcara.length > 1 && (
            <select
              className="pnl-select-acara"
              value={data.acara.kode}
              onChange={(e) => onPilihAcara(e.target.value)}
              aria-label="Pilih Event Aktif"
            >
              {data.daftarAcara.map((ac) => (
                <option key={ac.kode} value={ac.kode}>
                  {ac.nama} ({ac.kode}) {ac.status === "selesai" ? "— [Selesai]" : "— [Aktif]"}
                </option>
              ))}
            </select>
          )}
          <button className="btn kecil rosa btn-buat-event-baru" onClick={onBukaBuatAcara} title="Buat event baru dengan akun yang sama">
            + Event Baru
          </button>
          {data && <span className={"pnl-status " + (selesai ? "selesai" : "berlangsung")}>{selesai ? "Acara selesai" : "Acara berlangsung"}</span>}
          <button className="btn kecil putih" onClick={onMuatUlang}>Muat ulang</button>
          <button className="btn kecil" onClick={onKeluar}>Keluar</button>
        </div>
      </header>

      <main className="pnl-isi">
        {memuat && <p className="pnl-info">Memuat data peserta...</p>}
        {galat && <p className="pnl-galat" role="alert">{galat}</p>}

        {data && selesai && tab !== "detail" && (
          <div className="pnl-acara-selesai-banner">
            <div className="selesai-banner-teks">
              <span className="selesai-ikon">🏁</span>
              <div>
                <b>Event Ini Telah Selesai!</b>
                <p>Pemenang telah ditetapkan dan reward telah dikunci. Kamu bisa langsung membuat event baru untuk kegiatan berikutnya menggunakan akun yang sama.</p>
              </div>
            </div>
            <button className="btn kecil" onClick={onBukaBuatAcara}>
              + Buat Event Baru Sekarang
            </button>
          </div>
        )}

        {data && tab === "detail" && formDetail && (
          <DetailEvent
            acara={data.acara} misi={data.misi} form={formDetail} versiSampul={versiSampul} proses={proses}
            terkunciReward={selesai}
            ubahForm={onUbahForm} ubahReward={onUbahReward} tambahReward={onTambahReward} hapusReward={onHapusReward}
            ubahMisi={onUbahMisi} tambahMisi={onTambahMisi} hapusMisi={onHapusMisi}
            onPilihSampul={onPilihSampul} onHapusSampul={onHapusSampul} onSimpan={onSimpanDetail} onKembali={onTutupDetail}
          />
        )}

        {data && tab !== "detail" && (
          <>
            <section className="pnl-kode" aria-label="Kode acara dan QR">
              <div className="pnl-kode-info">
                <small>Kode acara. Peserta memindai QR di samping lewat menu Scan, atau mengetik kodenya.</small>
                <b aria-label={`Kode acara ${data.acara.kode}`}>{data.acara.kode}</b>
                <span>{data.acara.waktu} · {data.acara.lokasi} · oleh {data.penyelenggara.nama}</span>
                <div className="pnl-kode-aksi">
                  <button className="btn kecil" onClick={onSalinKode}>Salin kode</button>
                  <button className="btn kecil putih" onClick={onUnduhQR}>Unduh QR</button>
                  <button className="btn kecil rosa" onClick={onBukaDetail}>Detail event</button>
                </div>
              </div>
              <figure className="pnl-qr">
                <KodeQR teks={tautan} label={`QR untuk bergabung ke acara ${data.acara.nama}, kode ${data.acara.kode}`} />
                <figcaption>Pindai untuk bergabung</figcaption>
              </figure>
            </section>

            <section className="pnl-statistik" aria-label="Ringkasan acara">
              <div className="pnl-stat"><b>{angka(data.ringkasan.total)}</b><small>Peserta bergabung</small></div>
              <div className="pnl-stat"><b>{angka(data.ringkasan.totalEmisi)}</b><small>Total skor (gCO₂e)</small></div>
              <div className="pnl-stat"><b>{data.ringkasan.sudahDinilai}/{data.ringkasan.total}</b><small>Peserta sudah dinilai</small></div>
              <div className="pnl-stat"><b>{data.ringkasan.rataProgres}%</b><small>Rata-rata progres misi</small></div>
              <div className="pnl-stat"><b>{angka(data.ringkasan.selesaiSemua)}</b><small>Menyelesaikan semua misi</small></div>
            </section>

            <div className="pnl-tab" role="tablist" aria-label="Menu penyelenggara">
              <button role="tab" id="tab-peserta" aria-selected={tab === "peserta"} aria-controls="panel-peserta" onClick={() => setTab("peserta")}>
                Peserta ({data.ringkasan.total})
              </button>
              <button role="tab" id="tab-klaim" aria-selected={tab === "klaim"} aria-controls="panel-klaim" onClick={() => setTab("klaim")}>
                🎁 Klaim Hadiah
              </button>
              <button role="tab" id="tab-evaluasi" aria-selected={tab === "evaluasi"} aria-controls="panel-evaluasi" onClick={() => setTab("evaluasi")}>
                Evaluasi &amp; Pemenang
              </button>
            </div>

            {tab === "peserta" ? (
              <div role="tabpanel" id="panel-peserta" aria-labelledby="tab-peserta">
                {!selesai && (
                  <div className="pnl-contoh-bar">
                    <p><b>Data contoh.</b> Belum ada peserta sungguhan? Tambahkan peserta contoh untuk menguji evaluasi dan reward.</p>
                    {adaContoh ? (
                      <button className="btn kecil bahaya" disabled={proses} onClick={onHapusContoh}>Hapus peserta contoh</button>
                    ) : (
                      <button className="btn kecil" disabled={proses} onClick={onTambahContoh}>Tambah peserta contoh</button>
                    )}
                  </div>
                )}
                <PesertaTabel peserta={data.peserta} pemenang={data.pemenang} cari={cari} setCari={setCari} />
              </div>
            ) : tab === "klaim" ? (
              <div role="tabpanel" id="panel-klaim" aria-labelledby="tab-klaim">
                <KlaimRewardPanel acara={data.acara} onMuatUlang={onMuatUlang} />
              </div>
            ) : (
              <div role="tabpanel" id="panel-evaluasi" aria-labelledby="tab-evaluasi">
                <EvaluasiPanel
                  data={data} proses={proses} periksa={periksa}
                  onPeriksa={onPeriksa} onTutupPeriksa={onTutupPeriksa} onVerifikasi={onVerifikasi} onNilai={onNilai}
                  onTetapkan={onTetapkan} onTandai={onTandai} onBukaKembali={onBukaKembali}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
