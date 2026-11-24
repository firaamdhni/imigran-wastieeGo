/* =========================================================
   QR - pembuat kode QR (standar ISO/IEC 18004), tanpa dependensi.
   Mode byte (UTF-8), koreksi galat level M, versi 1-10 (sampai 213 byte).
   Dipakai panel penyelenggara untuk menampilkan QR tautan bergabung acara.
   ========================================================= */

/* tabel level M untuk versi 1..10 (indeks 0 tidak dipakai) */
const ECC_PER_BLOK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const JUMLAH_BLOK = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const VERSI_MAKS = 10;

const bit = (x, i) => ((x >>> i) & 1) !== 0;

/* ---------- Reed-Solomon di GF(256), polinomial 0x11D ---------- */
function kali(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function pembagiRS(derajat) {
  const hasil = new Array(derajat - 1).fill(0).concat([1]);
  let akar = 1;
  for (let i = 0; i < derajat; i++) {
    for (let j = 0; j < hasil.length; j++) {
      hasil[j] = kali(hasil[j], akar);
      if (j + 1 < hasil.length) hasil[j] ^= hasil[j + 1];
    }
    akar = kali(akar, 0x02);
  }
  return hasil;
}

function sisaRS(data, pembagi) {
  const hasil = pembagi.map(() => 0);
  for (const b of data) {
    const faktor = b ^ hasil.shift();
    hasil.push(0);
    pembagi.forEach((koef, i) => { hasil[i] ^= kali(koef, faktor); });
  }
  return hasil;
}

/* ---------- kapasitas ---------- */
function modulData(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}
const kodeData = (ver) => Math.floor(modulData(ver) / 8) - ECC_PER_BLOK[ver] * JUMLAH_BLOK[ver];

function posisiAlignment(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const langkah = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const hasil = [6];
  for (let pos = ver * 4 + 10; hasil.length < n; pos -= langkah) hasil.splice(1, 0, pos);
  return hasil;
}

/* ---------- penyusunan matriks ---------- */
class Matriks {
  constructor(ver) {
    this.ver = ver;
    this.ukuran = ver * 4 + 17;
    this.modul = Array.from({ length: this.ukuran }, () => new Array(this.ukuran).fill(false));
    this.fungsi = Array.from({ length: this.ukuran }, () => new Array(this.ukuran).fill(false));
    this.gambarPola();
  }

  set(x, y, gelap) { // x = kolom, y = baris
    this.modul[y][x] = gelap;
    this.fungsi[y][x] = true;
  }

  gambarPola() {
    const u = this.ukuran;
    for (let i = 0; i < u; i++) { this.set(6, i, i % 2 === 0); this.set(i, 6, i % 2 === 0); }
    this.finder(3, 3); this.finder(u - 4, 3); this.finder(3, u - 4);
    const pos = posisiAlignment(this.ver);
    const n = pos.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        this.alignment(pos[i], pos[j]);
      }
    }
    this.formatBits(0); // sementara, supaya area format ditandai sebagai fungsi
    this.versiBits();
  }

  finder(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const jarak = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.ukuran && yy >= 0 && yy < this.ukuran) this.set(xx, yy, jarak !== 2 && jarak !== 4);
      }
    }
  }

  alignment(x, y) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  formatBits(mask) {
    const data = (0 << 3) | mask; // level M = 00
    let sisa = data;
    for (let i = 0; i < 10; i++) sisa = (sisa << 1) ^ ((sisa >>> 9) * 0x537);
    const bits = ((data << 10) | sisa) ^ 0x5412;
    const u = this.ukuran;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.set(u - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.set(8, u - 15 + i, bit(bits, i));
    this.set(8, u - 8, true); // modul gelap tetap
  }

  versiBits() {
    if (this.ver < 7) return;
    let sisa = this.ver;
    for (let i = 0; i < 12; i++) sisa = (sisa << 1) ^ ((sisa >>> 11) * 0x1f25);
    const bits = (this.ver << 12) | sisa;
    for (let i = 0; i < 18; i++) {
      const a = this.ukuran - 11 + (i % 3), b = Math.floor(i / 3);
      this.set(a, b, bit(bits, i));
      this.set(b, a, bit(bits, i));
    }
  }

  isiKode(kode) {
    let i = 0;
    const u = this.ukuran;
    for (let kanan = u - 1; kanan >= 1; kanan -= 2) {
      if (kanan === 6) kanan = 5;
      for (let v = 0; v < u; v++) {
        for (let j = 0; j < 2; j++) {
          const x = kanan - j;
          const naik = ((kanan + 1) & 2) === 0;
          const y = naik ? u - 1 - v : v;
          if (!this.fungsi[y][x] && i < kode.length * 8) {
            this.modul[y][x] = bit(kode[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  topeng(m) {
    for (let y = 0; y < this.ukuran; y++) {
      for (let x = 0; x < this.ukuran; x++) {
        let balik;
        switch (m) {
          case 0: balik = (x + y) % 2 === 0; break;
          case 1: balik = y % 2 === 0; break;
          case 2: balik = x % 3 === 0; break;
          case 3: balik = (x + y) % 3 === 0; break;
          case 4: balik = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: balik = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: balik = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: balik = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!this.fungsi[y][x] && balik) this.modul[y][x] = !this.modul[y][x];
      }
    }
  }

  /* skor penalti (aturan N1-N4) untuk memilih topeng terbaik */
  penalti() {
    const u = this.ukuran, m = this.modul;
    let skor = 0;
    const garis = (ambil) => {
      for (let a = 0; a < u; a++) {
        let panjang = 1;
        for (let b = 1; b < u; b++) {
          if (ambil(a, b) === ambil(a, b - 1)) { panjang++; if (panjang === 5) skor += 3; else if (panjang > 5) skor += 1; }
          else panjang = 1;
        }
        // pola mirip finder 1:1:3:1:1 dengan 4 modul terang di salah satu sisi
        const baris = Array.from({ length: u }, (_, b) => (ambil(a, b) ? 1 : 0)).join("");
        for (const pola of ["00001011101", "10111010000"]) {
          let dari = baris.indexOf(pola);
          while (dari !== -1) { skor += 40; dari = baris.indexOf(pola, dari + 1); }
        }
      }
    };
    garis((a, b) => m[a][b]);
    garis((a, b) => m[b][a]);
    for (let y = 0; y < u - 1; y++) for (let x = 0; x < u - 1; x++) {
      if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) skor += 3;
    }
    let gelap = 0;
    for (const baris of m) for (const v of baris) if (v) gelap++;
    skor += (Math.ceil(Math.abs(gelap * 20 - u * u * 10) / (u * u)) - 1) * 10;
    return skor;
  }
}

/* data + koreksi galat, dibagi per blok lalu diselang-seling */
function tambahEcc(data, ver) {
  const nBlok = JUMLAH_BLOK[ver], eccLen = ECC_PER_BLOK[ver];
  const mentah = Math.floor(modulData(ver) / 8);
  const nPendek = nBlok - (mentah % nBlok);
  const lenPendek = Math.floor(mentah / nBlok);
  const pembagi = pembagiRS(eccLen);
  const blok = [];
  for (let i = 0, k = 0; i < nBlok; i++) {
    const dat = data.slice(k, k + lenPendek - eccLen + (i < nPendek ? 0 : 1));
    k += dat.length;
    const ecc = sisaRS(dat, pembagi);
    if (i < nPendek) dat.push(0);
    blok.push(dat.concat(ecc));
  }
  const hasil = [];
  for (let i = 0; i < blok[0].length; i++) {
    blok.forEach((b, j) => { if (i !== lenPendek - eccLen || j >= nPendek) hasil.push(b[i]); });
  }
  return hasil;
}

/**
 * Membuat QR dari teks. Mengembalikan { ukuran, modul } (modul[baris][kolom] = true untuk modul gelap).
 * Melempar Error bila teks terlalu panjang.
 */
export function buatQR(teks) {
  const byte = Array.from(new TextEncoder().encode(String(teks)));
  let ver = 0;
  for (let v = 1; v <= VERSI_MAKS; v++) {
    const bitCacah = v <= 9 ? 8 : 16;
    if (4 + bitCacah + byte.length * 8 <= kodeData(v) * 8) { ver = v; break; }
  }
  if (!ver) throw new Error("Teks terlalu panjang untuk QR");

  const bits = [];
  const tulis = (nilai, n) => { for (let i = n - 1; i >= 0; i--) bits.push((nilai >>> i) & 1); };
  tulis(0b0100, 4);
  tulis(byte.length, ver <= 9 ? 8 : 16);
  byte.forEach((b) => tulis(b, 8));
  const kapasitas = kodeData(ver) * 8;
  tulis(0, Math.min(4, kapasitas - bits.length));
  tulis(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < kapasitas; pad ^= 0xec ^ 0x11) tulis(pad, 8);

  const data = new Array(bits.length / 8).fill(0);
  bits.forEach((b, i) => { data[i >>> 3] |= b << (7 - (i & 7)); });

  const kode = tambahEcc(data, ver);
  const matriks = new Matriks(ver);
  matriks.isiKode(kode);

  let terbaik = -1, skorTerbaik = Infinity;
  for (let m = 0; m < 8; m++) {
    matriks.topeng(m);
    matriks.formatBits(m);
    const s = matriks.penalti();
    if (s < skorTerbaik) { terbaik = m; skorTerbaik = s; }
    matriks.topeng(m); // topeng bersifat XOR: panggil lagi untuk membatalkan
  }
  matriks.topeng(terbaik);
  matriks.formatBits(terbaik);
  return { ukuran: matriks.ukuran, modul: matriks.modul };
}

/* path SVG untuk semua modul gelap (satu path, per baris dijadikan garis panjang) */
export function qrKePath(qr, batas = 4) {
  let d = "";
  for (let y = 0; y < qr.ukuran; y++) {
    let x = 0;
    while (x < qr.ukuran) {
      if (!qr.modul[y][x]) { x++; continue; }
      let akhir = x;
      while (akhir < qr.ukuran && qr.modul[y][akhir]) akhir++;
      d += `M${x + batas},${y + batas}h${akhir - x}v1h-${akhir - x}z`;
      x = akhir;
    }
  }
  return { path: d, lebar: qr.ukuran + batas * 2 };
}

/* PNG untuk diunduh/dicetak (hanya dipanggil di browser, saat tombol diklik) */
export function qrKePng(teks, skala = 12, batas = 4) {
  const qr = buatQR(teks);
  const sisi = (qr.ukuran + batas * 2) * skala;
  const c = document.createElement("canvas");
  c.width = sisi; c.height = sisi;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, sisi, sisi);
  g.fillStyle = "#111";
  qr.modul.forEach((baris, y) => baris.forEach((gelap, x) => { if (gelap) g.fillRect((x + batas) * skala, (y + batas) * skala, skala, skala); }));
  return new Promise((selesai, gagal) => c.toBlob((b) => (b ? selesai(b) : gagal(new Error("Gagal membuat PNG"))), "image/png"));
}
