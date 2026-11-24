/* Peserta contoh: data uji coba agar panel evaluasi bisa dicoba tanpa peserta sungguhan.
   Aktivitasnya disusun dari katalog sampah asli (WasteClassifierService), lengkap dengan foto ilustrasi.
   id berawalan "d:" (peserta sungguhan "u:") sehingga tidak mungkin bertabrakan dengan nama peserta asli. */

/* urutan: gelas plastik, botol plastik, kardus, kaleng aluminium, sisa makanan, botol kaca */
const KATALOG = [
  { jenis: "Plastik", nama: "Gelas plastik", emisi: 150 },
  { jenis: "Plastik", nama: "Botol plastik", emisi: 250 },
  { jenis: "Kertas", nama: "Kardus", emisi: 300 },
  { jenis: "Aluminium", nama: "Kaleng aluminium", emisi: 400 },
  { jenis: "Organik", nama: "Sisa Makanan", emisi: 120 },
  { jenis: "Kaca", nama: "Botol Kaca", emisi: 350 },
];

/* komposisi = jumlah tiap item katalog (urutan di atas). 26 peserta: peringkat 1-3 mendapat hadiah utama,
   4-23 (20 orang) mendapat voucher, 24-26 belum mendapat reward. Juara 3 dan 4 sengaja seri 3.690 gCO₂e
   (uji aturan seri di batas hadiah utama: Nadia unggul karena misi selesainya lebih banyak). */
const DATA = [
  { nama: "Aulia Rahma", capai: [1500, 500, 1500], komposisi: [2, 1, 6, 3, 2, 3] },    // 17 aktivitas, 4.840
  { nama: "Rizky Pratama", capai: [1500, 500, 1180], komposisi: [3, 3, 4, 3, 3, 1] },  // 17 aktivitas, 4.310
  { nama: "Nadia Putri", capai: [1500, 500, 790], komposisi: [4, 2, 0, 5, 2, 1] },     // 14 aktivitas, 3.690
  { nama: "Fajar Ramadhan", capai: [1500, 420, 640], komposisi: [0, 2, 2, 5, 2, 1] },  // 12 aktivitas, 3.690
  { nama: "Siti Maulida", komposisi: [1, 3, 5, 1, 0, 2] },       // 12 aktivitas, 3.500
  { nama: "Dimas Saputra", komposisi: [1, 5, 4, 1, 0, 1] },      // 12 aktivitas, 3.350
  { nama: "Intan Permata", komposisi: [3, 1, 1, 2, 0, 4] },      // 11 aktivitas, 3.200
  { nama: "Teuku Alfi", komposisi: [2, 5, 1, 3, 0, 0] },         // 11 aktivitas, 3.050
  { nama: "Putri Amelia", komposisi: [1, 2, 5, 1, 0, 1] },       // 10 aktivitas, 2.900
  { nama: "Muhammad Iqbal", komposisi: [2, 2, 3, 0, 0, 3] },     // 10 aktivitas, 2.750
  { nama: "Rahmat Hidayat", komposisi: [3, 1, 0, 3, 0, 2] },     // 9 aktivitas, 2.600
  { nama: "Zahra Salsabila", komposisi: [2, 2, 2, 0, 0, 3] },    // 9 aktivitas, 2.450
  { nama: "Teuku Rayhan", komposisi: [0, 5, 1, 1, 0, 1] },       // 8 aktivitas, 2.300
  { nama: "Cut Nabila", komposisi: [2, 3, 0, 1, 0, 2] },         // 8 aktivitas, 2.150
  { nama: "Ahmad Fauzi", komposisi: [2, 0, 3, 2, 0, 0] },        // 7 aktivitas, 2.000
  { nama: "Maya Sari", komposisi: [2, 1, 3, 1, 0, 0] },          // 7 aktivitas, 1.850
  { nama: "Bayu Setiawan", komposisi: [1, 0, 4, 0, 0, 1] },      // 6 aktivitas, 1.700
  { nama: "Dewi Anggraini", komposisi: [2, 1, 1, 0, 0, 2] },     // 6 aktivitas, 1.550
  { nama: "Hendra Wijaya", komposisi: [0, 2, 3, 0, 0, 0] },      // 5 aktivitas, 1.400
  { nama: "Nurul Hidayah", komposisi: [1, 0, 1, 2, 0, 0] },      // 4 aktivitas, 1.250
  { nama: "Ilham Maulana", komposisi: [1, 1, 0, 0, 0, 2] },      // 4 aktivitas, 1.100
  { nama: "Fitri Handayani", komposisi: [1, 0, 0, 2, 0, 0] },    // 3 aktivitas, 950
  { nama: "Rina Marlina", komposisi: [1, 1, 0, 1, 0, 0] },       // 3 aktivitas, 800 (penerima voucher terakhir, peringkat 23)
  { nama: "Yusuf Ramli", komposisi: [0, 0, 1, 0, 0, 1] },        // 2 aktivitas, 650
  { nama: "Khairul Anwar", komposisi: [0, 2, 0, 0, 0, 0] },      // 2 aktivitas, 500
  { nama: "Lia Safitri", komposisi: [0, 0, 0, 0, 0, 1] },        // 1 aktivitas, 350
];

const slug = (nama) => nama.toLowerCase().replace(/\s+/g, "-");
const totalDari = (komposisi) => komposisi.reduce((s, n, i) => s + n * KATALOG[i].emisi, 0);

/* progres misi yang masuk akal untuk skor tertentu (peserta teratas bisa saja memberi nilai eksplisit di atas) */
const capaiDari = (total) => [
  Math.min(1500, 1050 + Math.round(total * 0.25)),
  Math.min(500, Math.round(total * 0.12)),
  Math.min(1500, Math.max(0, Math.round(total * 0.3) - 100)),
];

/* item katalog diselang-seling supaya riwayat tidak berkelompok per jenis */
function daftarItem(komposisi) {
  const sisa = [...komposisi];
  const hasil = [];
  while (sisa.some((n) => n > 0)) sisa.forEach((n, i) => { if (n > 0) { hasil.push(KATALOG[i]); sisa[i]--; } });
  return hasil;
}

export function buatPesertaContoh(sekarang = Date.now()) {
  return DATA.map((d, i) => {
    const bergabungPada = sekarang - (DATA.length - i) * 14 * 60 * 1000;
    const id = "d:" + slug(d.nama);
    return {
      id, nama: d.nama, bergabungPada, capai: d.capai || capaiDari(totalDari(d.komposisi)),
      terakhirAktif: sekarang - i * 4 * 60 * 1000, demo: true, penilaian: null,
      aktivitas: daftarItem(d.komposisi).map((it, n) => ({
        id: `demo-${slug(d.nama)}-${n + 1}`, jenis: it.jenis, nama: it.nama, emisi: it.emisi,
        timestamp: bergabungPada + (n + 1) * 6 * 60 * 1000, foto: "demo", v1: null, v2: null,
      })),
    };
  });
}

/* Set contoh versi lama (jumlah peserta berbeda atau tanpa aktivitas) diganti set terbaru, kecuali acara sudah selesai.
   Jangkar waktu diambil dari data lama supaya hasilnya sama di setiap pembacaan sebelum disimpan. */
export function migrasiContoh(db) {
  for (const a of Object.values(db.acara)) {
    if (a.status === "selesai") continue;
    const demo = Object.values(a.peserta || {}).filter((p) => p.demo);
    if (demo.length === 0 || (demo.length === DATA.length && demo.every((p) => Array.isArray(p.aktivitas)))) continue;
    const jangkar = Math.max(...demo.map((p) => Number(p.bergabungPada) || 0)) + 60 * 1000;
    hapusPesertaContoh(a);
    buatPesertaContoh(jangkar).forEach((p) => { a.peserta[p.id] = p; });
  }
  return db;
}

export function hapusPesertaContoh(acara) {
  let n = 0;
  for (const id of Object.keys(acara.peserta)) {
    if (acara.peserta[id].demo) { delete acara.peserta[id]; n++; }
  }
  return n;
}

/* ---------- foto ilustrasi untuk aktivitas contoh (SVG, dibuat saat diminta) ---------- */
const WARNA = { Plastik: "#3573c9", Kertas: "#4a9a86", Aluminium: "#d65fa6", Organik: "#2f7a63", Kaca: "#3d8ea6" };
const BENTUK = {
  Plastik: '<rect x="215" y="52" width="50" height="20" rx="6" fill="#222" opacity=".55"/><rect x="205" y="70" width="70" height="34" rx="8" fill="#fff" opacity=".9"/><rect x="170" y="98" width="140" height="190" rx="36" fill="#fff" opacity=".88"/>',
  Aluminium: '<rect x="175" y="78" width="130" height="212" rx="18" fill="#fff" opacity=".92"/><ellipse cx="240" cy="78" rx="65" ry="14" fill="#fff"/><ellipse cx="240" cy="78" rx="40" ry="7" fill="#222" opacity=".25"/>',
  Kertas: '<rect x="150" y="120" width="180" height="150" fill="#fff" opacity=".92"/><path d="M150 120 L190 76 H290 L330 120Z" fill="#fff" opacity=".7"/><rect x="215" y="120" width="50" height="22" fill="#222" opacity=".18"/>',
  Kaca: '<rect x="222" y="56" width="36" height="70" rx="8" fill="#fff" opacity=".85"/><rect x="178" y="118" width="124" height="170" rx="30" fill="#fff" opacity=".78"/>',
  Organik: '<circle cx="240" cy="192" r="88" fill="#fff" opacity=".9"/><rect x="236" y="86" width="8" height="34" rx="4" fill="#222" opacity=".45"/><ellipse cx="268" cy="100" rx="26" ry="12" fill="#fff" opacity=".7"/>',
};
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function buatSvgFoto(jenis, nama) {
  const warna = WARNA[jenis] || "#8c8a7a";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${warna}"/><stop offset="1" stop-color="#1b1b17"/></linearGradient></defs><rect width="480" height="360" fill="url(#g)"/><ellipse cx="240" cy="300" rx="120" ry="14" fill="#000" opacity=".25"/>${BENTUK[jenis] || BENTUK.Plastik}<text x="240" y="340" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="600" fill="#fff">${esc(nama)}</text></svg>`;
}
