import { BATAS_REWARD, KATEGORI_ACARA } from "@/lib/eventConfig";
import { labelRentang } from "./penerima";

const angka = (n) => Number(n || 0).toLocaleString("id-ID");

/* pesan kesalahan formulir (kosong bila sah): dipakai untuk menonaktifkan tombol simpan */
export function galatForm(form, terkunciReward) {
  if (!form.nama.trim()) return "Nama event wajib diisi.";
  if (!form.lokasi.trim()) return "Lokasi wajib diisi.";
  if (Array.isArray(form.misi)) {
    if (form.misi.length < 1) return "Minimal harus ada 1 misi event.";
    for (const [i, m] of form.misi.entries()) {
      if (!m.teks.trim()) return `Deskripsi Misi ${i + 1} wajib diisi.`;
      const target = Number(m.target);
      if (!target || target < 50 || target > 50000) return `Target Misi ${i + 1} harus antara 50 sampai 50.000 gCO₂e.`;
    }
  }
  if (terkunciReward) return "";
  let total = 0;
  for (const [i, r] of form.reward.entries()) {
    const jumlah = Number(r.jumlah);
    if (!r.nama.trim()) return `Nama reward tingkat ${i + 1} wajib diisi.`;
    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > BATAS_REWARD.jumlahPerTingkat) return `Jumlah penerima tingkat ${i + 1} harus bilangan bulat 1–${BATAS_REWARD.jumlahPerTingkat}.`;
    total += jumlah;
  }
  if (total > BATAS_REWARD.total) return `Total penerima reward maksimal ${BATAS_REWARD.total} orang.`;
  return "";
}

/* halaman Detail Event (Edit Event): informasi dasar, waktu & lokasi, detail, misi, dan reward peserta */
export default function DetailEvent({
  acara, misi, form, ubahForm, ubahReward, tambahReward, hapusReward,
  ubahMisi, tambahMisi, hapusMisi,
  versiSampul, proses, terkunciReward,
  onPilihSampul, onHapusSampul, onSimpan, onKembali,
}) {
  const sampul = form.sampulBaru || (acara.adaSampul && !form.hapusSampul ? `/api/penyelenggara/foto?sampul=1&v=${versiSampul}` : null);
  const galat = galatForm(form, terkunciReward);
  let dari = 1;
  const tingkat = form.reward.map((r) => {
    const jumlah = Math.max(0, Math.floor(Number(r.jumlah) || 0));
    const t = { dari, sampai: dari + Math.max(jumlah, 1) - 1, jumlah };
    dari += jumlah;
    return t;
  });

  return (
    <div className="dtl">
      <header className="dtl-atas">
        <button type="button" className="dtl-balik" aria-label="Kembali ke panel" onClick={onKembali}>←</button>
        <h1>EDIT EVENT</h1>
      </header>

      <section className="dtl-banner" aria-label="Ringkasan event">
        <div>
          <h2>{form.nama.trim() || "Event-mu"}</h2>
          <p>EDIT INFORMASI EVENT-MU</p>
        </div>
        <span className="dtl-kode">Kode {acara.kode}</span>
      </section>

      <section aria-labelledby="dtl-h-tampilan">
        <h2 className="dtl-judul" id="dtl-h-tampilan">TAMPILAN EVENT</h2>
        <p className="dtl-ket">Gunakan foto yang menggambarkan event-mu.</p>
        <div className="dtl-foto">
          {sampul ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sampul} alt={`Foto sampul ${acara.nama}`} />
          ) : (
            <span>Belum ada foto sampul</span>
          )}
          <label className="dtl-ubah-foto">
            <span>{sampul ? "UBAH FOTO" : "UNGGAH FOTO"}</span>
            <input type="file" accept="image/*" disabled={proses} onChange={(e) => { onPilihSampul(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
        {sampul && <button type="button" className="dtl-teks-tombol" onClick={onHapusSampul}>Hapus foto</button>}
      </section>

      <section aria-labelledby="dtl-h-dasar">
        <h2 className="dtl-judul" id="dtl-h-dasar">INFORMASI DASAR</h2>
        <div className="dtl-kartu kuning">
          <label className="dtl-field"><span className="dtl-tag">Nama Event</span>
            <input value={form.nama} maxLength={80} onChange={(e) => ubahForm({ nama: e.target.value })} /></label>
          <label className="dtl-field"><span className="dtl-tag">Deskripsi Singkat</span>
            <textarea rows={2} value={form.deskripsiSingkat} maxLength={120} onChange={(e) => ubahForm({ deskripsiSingkat: e.target.value })} /></label>
          <label className="dtl-field"><span className="dtl-tag">Kategori Event</span>
            <select value={form.kategori} onChange={(e) => ubahForm({ kategori: e.target.value })}>
              <option value="">Pilih kategori</option>
              {KATEGORI_ACARA.map((k) => <option key={k} value={k}>{k}</option>)}
            </select></label>
        </div>
      </section>

      <section aria-labelledby="dtl-h-waktu">
        <h2 className="dtl-judul" id="dtl-h-waktu">WAKTU &amp; LOKASI</h2>
        <div className="dtl-kartu hijau">
          <label className="dtl-field"><span className="dtl-tag terang">Tanggal</span>
            <input type="date" value={form.tanggal} onChange={(e) => ubahForm({ tanggal: e.target.value })} /></label>
          <div className="dtl-dua">
            <label className="dtl-field"><span className="dtl-tag terang">Waktu Mulai</span>
              <input type="time" value={form.waktuMulai} onChange={(e) => ubahForm({ waktuMulai: e.target.value })} /></label>
            <label className="dtl-field"><span className="dtl-tag terang">Waktu Selesai</span>
              <input type="time" value={form.waktuSelesai} onChange={(e) => ubahForm({ waktuSelesai: e.target.value })} /></label>
          </div>
          <label className="dtl-field"><span className="dtl-tag terang">Lokasi</span>
            <input value={form.lokasi} maxLength={120} onChange={(e) => ubahForm({ lokasi: e.target.value })} /></label>
        </div>
      </section>

      <section aria-labelledby="dtl-h-detail">
        <h2 className="dtl-judul" id="dtl-h-detail">DETAIL EVENT</h2>
        <textarea className="dtl-detail" rows={6} maxLength={1000} aria-label="Detail event" value={form.detail} onChange={(e) => ubahForm({ detail: e.target.value })} />
        <div className="dtl-baris-ket">
          <span className="dtl-hint">Ceritakan sedikit tentang event ini.</span>
          <small>{form.detail.length}/1000</small>
        </div>
      </section>

      <section aria-labelledby="dtl-h-misi">
        <h2 className="dtl-judul" id="dtl-h-misi">MISI &amp; REWARD EVENT</h2>

        <div className="dtl-kartu biru">
          <h3>MISI EVENT</h3>
          <p>Atur misi dan target pengurangan emisi karbon yang dapat diselesaikan oleh peserta.</p>
          {(form.misi || []).map((m, i) => (
            <div className="dtl-baris putih reward" key={i}>
              <div className="dtl-reward-isi">
                <label className="dtl-mini">
                  <span>Misi {i + 1}</span>
                  <input
                    value={m.teks}
                    placeholder="Contoh: Kurangi emisi di area gedung D"
                    maxLength={150}
                    onChange={(e) => ubahMisi(i, { teks: e.target.value })}
                  />
                </label>
                <label className="dtl-mini jumlah">
                  <span>Target (gCO₂e)</span>
                  <input
                    type="number"
                    min="50"
                    max="50000"
                    step="50"
                    inputMode="numeric"
                    value={m.target}
                    onChange={(e) => ubahMisi(i, { target: e.target.value })}
                  />
                </label>
              </div>
              <div className="dtl-baris-sisi">
                <button
                  type="button"
                  className="dtl-hapus"
                  aria-label={`Hapus misi ${i + 1}`}
                  disabled={(form.misi || []).length <= 1}
                  onClick={() => hapusMisi(i)}
                  title="Hapus misi ini"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="dtl-tambah dtl-tambah-misi"
            disabled={(form.misi || []).length >= 5}
            onClick={tambahMisi}
          >
            + Tambah Misi
          </button>
        </div>

        <div className="dtl-kartu pink">
          <h3>REWARD PESERTA</h3>
          <p>Atur reward berdasarkan peringkat akhir. Pemenang ditentukan otomatis dari peringkat teratas.</p>
          {form.reward.map((r, i) => (
            <div className="dtl-baris putih reward" key={i}>
              <div className="dtl-reward-isi">
                <label className="dtl-mini"><span>Reward tingkat {i + 1}</span>
                  <input value={r.nama} maxLength={BATAS_REWARD.panjangNama} disabled={terkunciReward} onChange={(e) => ubahReward(i, { nama: e.target.value })} /></label>
                <label className="dtl-mini jumlah"><span>Penerima</span>
                  <input type="number" min="1" max={BATAS_REWARD.jumlahPerTingkat} inputMode="numeric" value={r.jumlah} disabled={terkunciReward} onChange={(e) => ubahReward(i, { jumlah: e.target.value })} /></label>
              </div>
              <div className="dtl-baris-sisi">
                <span className="dtl-rentang">{labelRentang(tingkat[i].dari, tingkat[i].sampai)}</span>
                <button type="button" className="dtl-hapus" aria-label={`Hapus reward tingkat ${i + 1}`} disabled={terkunciReward || form.reward.length <= 1} onClick={() => hapusReward(i)}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="dtl-tambah" disabled={terkunciReward || form.reward.length >= BATAS_REWARD.tingkat} onClick={tambahReward}>+ Tambah Reward</button>
          {terkunciReward && <p className="dtl-catatan">Reward terkunci karena pemenang sudah ditetapkan. Buka kembali evaluasi untuk mengubahnya.</p>}
        </div>
      </section>

      {galat && <p className="dtl-galat" role="alert">{galat}</p>}
      <button type="button" className="dtl-simpan" disabled={Boolean(galat) || proses} onClick={onSimpan}>
        {proses ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
      </button>
    </div>
  );
}
