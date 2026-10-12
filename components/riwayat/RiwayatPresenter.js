"use client";

/**
 * RiwayatPresenter - Presentational (Dumb) Component
 * Mengikuti Design Pattern "Container-Presenter Pattern".
 * Komponen ini hanya bertugas merender UI dan menerima data serta event callback via props.
 */
export default function RiwayatPresenter({
  riwayatList,
  kategoriAktif,
  setKategoriAktif,
  daftarKategori,
  totalEmisi,
  totalItem,
  onHapusItem,
  onResetRiwayat,
}) {
  return (
    <section id="view-riwayat" className="riwayat-section">
      <header className="riwayat-header">
        <div className="riwayat-header-text">
          <h1>Riwayat Setoran Sampah</h1>
          <p>
            Daftar sampah yang telah kamu foto, pilah, dan setorkan untuk
            mendukung pengurangan emisi karbon selama acara berlangsung.
          </p>
        </div>
        {riwayatList.length > 0 && (
          <button
            className="btn-reset-riwayat"
            onClick={onResetRiwayat}
            title="Bersihkan riwayat simulasi"
          >
            Reset Riwayat
          </button>
        )}
      </header>

      {/* Ringkasan Statistik Riwayat */}
      <div className="riwayat-stats">
        <div className="stat-card">
          <span className="stat-label">Total Sampah Terdata</span>
          <b className="stat-value">{totalItem} <span>item</span></b>
        </div>
        <div className="stat-card highlight">
          <span className="stat-label">Total Emisi Berkurang</span>
          <b className="stat-value">{totalEmisi.toLocaleString("id-ID")} <span>gCO₂e</span></b>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status Partisipasi</span>
          <b className="stat-value status-aktif">Aktif Berkontribusi</b>
        </div>
      </div>

      {/* Filter Kategori Sampah */}
      <div className="kategori-filter">
        {daftarKategori.map((kat) => (
          <button
            key={kat}
            className={`filter-pill ${kategoriAktif === kat ? "aktif" : ""}`}
            onClick={() => setKategoriAktif(kat)}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Daftar Item Riwayat */}
      <div className="riwayat-list-container">
        {riwayatList.length === 0 ? (
          <div className="riwayat-kosong">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 12h6M12 9v6" />
            </svg>
            <h3>Belum ada setoran pada kategori ini</h3>
            <p>Gunakan fitur Scan Sampah pada kamera untuk mulai memilah dan mencatat sampah!</p>
          </div>
        ) : (
          <div className="riwayat-grid">
            {riwayatList.map((item) => (
              <div key={item.id} className="riwayat-card">
                <div className="riwayat-card-kiri">
                  <span
                    className="badge-jenis"
                    style={{ backgroundColor: item.getBadgeColor ? item.getBadgeColor() : "#3573c9" }}
                  >
                    {item.jenis}
                  </span>
                  <div className="item-info">
                    <h4>{item.nama}</h4>
                    <small>{item.getTanggalFormatted ? item.getTanggalFormatted() : new Date(item.timestamp).toLocaleString("id-ID")}</small>
                  </div>
                </div>

                <div className="riwayat-card-kanan">
                  <div className="emisi-badge">
                    +{item.emisi.toLocaleString("id-ID")} gCO₂e
                  </div>
                  <button
                    className="btn-hapus"
                    onClick={() => onHapusItem(item.id)}
                    title="Hapus setoran ini"
                    aria-label="Hapus item"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
