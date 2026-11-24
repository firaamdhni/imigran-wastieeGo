"use client";
import { useState } from "react";
import { panggilApi } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function ModalBuatAcara({ onClose, onAcaraDibuat }) {
  const { toast } = useToast();
  const [f, setF] = useState({ nama: "", waktu: "", lokasi: "", detail: "" });
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState("");

  const ubah = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const kirim = async (e) => {
    e.preventDefault();
    if (!f.nama.trim()) return setGalat("Nama event wajib diisi.");
    if (!f.lokasi.trim()) return setGalat("Lokasi event wajib diisi.");
    setGalat("");
    setProses(true);

    const r = await panggilApi("/api/penyelenggara/acara/baru", {
      method: "POST",
      body: {
        nama: f.nama.trim(),
        waktu: f.waktu.trim() || "Segera",
        lokasi: f.lokasi.trim(),
        detail: f.detail.trim(),
      },
    });

    setProses(false);
    if (!r.ok) return setGalat(r.data?.error || "Gagal membuat event baru. Coba lagi.");

    toast(`Event "${r.data.nama}" berhasil dibuat dengan kode ${r.data.kode}!`);
    onAcaraDibuat(r.data.kode);
    onClose();
  };

  return (
    <div className="latar-klaim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-klaim modal-buat-acara" role="dialog" aria-modal="true" aria-labelledby="judul-buat-acara">
        <button className="tutup-klaim" onClick={onClose} aria-label="Tutup modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <div className="klaim-header">
          <div className="klaim-badge-ikon" aria-hidden="true">🎪</div>
          <h2 id="judul-buat-acara">Buat Event Baru</h2>
          <p className="klaim-sub">Buat event dan kode baru menggunakan akun penyelenggaramu.</p>
        </div>

        <form onSubmit={kirim} className="form-buat-acara">
          <div className="field-acara">
            <label htmlFor="ev-nama">Nama Event *</label>
            <input
              id="ev-nama"
              value={f.nama}
              onChange={ubah("nama")}
              placeholder="Contoh: Green Festival Kampus 2026"
              maxLength={80}
              required
            />
          </div>

          <div className="field-acara">
            <label htmlFor="ev-lokasi">Lokasi Event *</label>
            <input
              id="ev-lokasi"
              value={f.lokasi}
              onChange={ubah("lokasi")}
              placeholder="Contoh: Lapangan Utama Gedung Rektorat"
              maxLength={120}
              required
            />
          </div>

          <div className="field-acara">
            <label htmlFor="ev-waktu">Waktu Event</label>
            <input
              id="ev-waktu"
              value={f.waktu}
              onChange={ubah("waktu")}
              placeholder="Contoh: 28 Agustus 2026, 08.00 - 16.00"
              maxLength={80}
            />
          </div>

          <div className="field-acara">
            <label htmlFor="ev-detail">Detail / Deskripsi Event</label>
            <textarea
              id="ev-detail"
              rows={3}
              value={f.detail}
              onChange={ubah("detail")}
              placeholder="Deskripsi singkat seputar kegiatan event..."
              maxLength={500}
            />
          </div>

          {galat && <p className="error-teks" role="alert">{galat}</p>}

          <div className="aksi-buat-acara">
            <button type="button" className="btn kecil putih" onClick={onClose} disabled={proses}>
              Batal
            </button>
            <button type="submit" className="btn kecil" disabled={proses || !f.nama.trim() || !f.lokasi.trim()}>
              {proses ? "Membuat Event..." : "+ Buat Event Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
