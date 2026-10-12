# WastieeGo - Smart Waste Sorting & Carbon Tracking Dashboard 🌿

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/Library-React%2019-blue?logo=react)](https://react.js.org/)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-Public%20Image-2496ED?logo=docker)](https://hub.docker.com/r/mahasiswa/wastieego-app)
[![Docker Tag](https://img.shields.io/badge/Tag-v1--UTS-success)](https://hub.docker.com/r/mahasiswa/wastieego-app/tags)

> **UTS PRAKTIKUM PEMROGRAMAN BERORIENTASI OBJEK LANJUT (POPL) KELAS A**  
> Proyek Pengembangan Aplikasi Web Front-End Berbasis OOP & Kontainerisasi Docker

---

## 👥 Informasi Tim & Kontribusi

| No | Nama Anggota | NIM | Peran Utama | Contoh Commit Kontribusi |
|:---:|:---|:---:|:---|:---|
| 1 | [Nama Anggota 1] | [NIM 1] | Project Lead & OOP Domain Architecture | `feat: implementasi model OOP WasteItem, Mission, dan service klasifikasi` |
| 2 | [Nama Anggota 2] | [NIM 2] | UI/UX & Container-Presenter Implementation | `feat: integrasi halaman riwayat setoran dengan container-presenter pattern` |
| 3 | [Nama Anggota 3] | [NIM 3] | Docker Containerization & State Management | `chore: konfigurasi Dockerfile multi-stage dan docker-compose v1-UTS` |

---

## 📌 Deskripsi Proyek

### 1. Latar Belakang Masalah
Pada acara-acara besar di lingkungan kampus maupun publik (seminar, festival kampus, pameran), penumpukan sampah sering menjadi masalah serius. Rendahnya kesadaran dan kebiasaan memilah sampah (anorganik, organik, plastik, kaleng) menyebabkan sebagian besar sampah berakhir di TPA tanpa didaur ulang, yang pada akhirnya meningkatkan jejak emisi karbon (*carbon footprint*). Selain itu, belum ada sistem interaktif yang mengapresiasi atau memberikan metrik nyata kepada pengunjung yang telah berkontribusi memilah sampah.

### 2. Tujuan Proyek
- Membangun aplikasi web interaktif yang mengedukasi dan mendorong peserta acara untuk memilah sampah secara sukarela melalui pendekatan **gamifikasi misi lingkungan**.
- Memberikan estimasi kuantitatif pengurangan emisi karbon ($gCO_2e$) secara langsung (*real-time*) setiap kali peserta menyetorkan sampah yang telah dipilah.
- Menyediakan wadah bagi penyelenggara acara (*event organizers*) untuk memonitor dampak lingkungan dari event mereka.

### 3. Manfaat Aplikasi
- **Bagi Peserta Acara**: Mendapatkan pengalaman seru dalam memilah sampah, mengetahui dampak positif konkret terhadap bumi, dan bersaing menyelesaikan misi acara.
- **Bagi Penyelenggara Event**: Membantu mewujudkan *green event* / *zero-waste campaign* yang terdokumentasi dengan metrik emisi karbon nyata.
- **Bagi Lingkungan**: Mengurangi volume sampah tercampur dan mencegah pelepasan gas rumah kaca.

### 4. Target Pengguna
1. **Pengunjung / Mahasiswa Peserta Acara (*Event Attendees*)**: Pengguna utama yang bergabung ke acara, memindai QR, menjalankan misi pemilahan, dan memantau emisi yang berhasil dikurangi.
2. **Panitia Penyelenggara Acara (*Event Organizers*)**: Pengguna yang mendaftarkan acara, mengunggah poster/flyer, dan menetapkan target pengurangan emisi karbon.

---

## 🛠️ Framework & Teknologi Berbasis OOP

Aplikasi ini dibangun menggunakan **Next.js 15 (App Router)** dan **React 19** berbasis **JavaScript (ES6+)**.

### Alasan Pemilihan Stack:
1. **Prinsip Object-Oriented Programming (OOP)**: Next.js dan modern JavaScript mendukung penuh paradigma OOP (Class, Encapsulation, Polymorphism, Abstraction, Singleton Service) yang dipadukan dengan arsitektur komponen React.
2. **Kemudahan Kontainerisasi (Docker & GCP Ready)**: Ekosistem Node.js/Next.js sangat portabel dan ringkas ketika dibungkus ke dalam *multi-stage Docker container*, tanpa memerlukan konfigurasi web server monolitik seperti Apache/PHP-FPM.
3. **Dukungan Dokumentasi & Komunitas Luas**: Ekosistem JavaScript memudahkan perawatan, refactoring, dan implementasi fitur ke depan.
4. **Konsistensi Bahasa**: Menggunakan satu bahasa terpadu (JavaScript/TypeScript) baik untuk sisi antarmuka, business logic, maupun integrasi API di masa mendatang.

---

## 🏛️ Arsitektur & Penerapan Design Pattern

Proyek ini mendokumentasikan dan menerapkan **4 (empat) Pola Desain (Design Pattern)** utama:

```
wastieego-next/
├── app/                      # Next.js App Router (Pages & Layouts)
│   ├── dashboard/
│   │   ├── kamera/           # Kamera & integrasi WasteClassifierService
│   │   ├── misi/             # Daftar misi berbasis model Mission
│   │   ├── riwayat/          # Halaman Riwayat (Container-Presenter Pattern)
│   │   └── page.js           # Beranda & ringkasan statistik
├── components/
│   ├── riwayat/
│   │   ├── RiwayatContainer.js  # Smart Component (Container Pattern)
│   │   └── RiwayatPresenter.js  # Dumb Component (Presenter Pattern)
│   ├── Sidebar.js
│   └── JoinPopup.js
├── lib/
│   ├── models/               # Domain Models OOP
│   │   ├── WasteItem.js      # Class WasteItem (Encapsulation)
│   │   └── Mission.js        # Class Mission (Encapsulation)
│   ├── services/
│   │   └── WasteClassifierService.js # Singleton Service Pattern
│   ├── store.js              # Provider Pattern & Custom Hooks
│   ├── session.js
│   └── toast.js              # Provider Pattern (Toast Notification)
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Multi-container orchestration
└── README.md
```

### 1. Domain Model OOP Layer (Object-Oriented Programming)
Menerapkan enkapsulasi data dan operasi bisnis ke dalam kelas tersendiri:
- **`WasteItem`** (`lib/models/WasteItem.js`):
  Mengenkapsulasi identitas sampah, kategori, emisi $gCO_2e$, timestamp, serta method representasi visual seperti `getEmisiText()`, `getTanggalFormatted()`, dan `getBadgeColor()`.
- **`Mission`** (`lib/models/Mission.js`):
  Mengenkapsulasi target misi, capaian berjalan, kalkulasi persentase kelulusan (`getPersentase()`), dan status `isSelesai()`.

```javascript
// Contoh penerapan enkapsulasi pada lib/models/WasteItem.js
export class WasteItem {
  constructor({ id, jenis, nama, emisi, timestamp = Date.now() }) {
    this.id = id;
    this.jenis = jenis;
    this.nama = nama;
    this.emisi = Number(emisi) || 0;
    this.timestamp = timestamp;
  }

  getBadgeColor() {
    switch (this.jenis.toLowerCase()) {
      case "plastik": return "#3573c9";
      case "aluminium": return "#f47fbf";
      case "kertas": return "#4a9a86";
      default: return "#8c8a7a";
    }
  }
}
```

### 2. Container-Presenter Pattern (Smart & Dumb Components)
Pemisahan tegas antara logika penanganan data dengan rendering antarmuka:
- **`RiwayatContainer`** (`components/riwayat/RiwayatContainer.js`): Mengambil data dari `useStore()`, memfilter riwayat berdasarkan kategori ("Semua", "Plastik", "Kertas", dll.), menghitung agregasi total emisi, dan mengelola aksi hapus/reset.
- **`RiwayatPresenter`** (`components/riwayat/RiwayatPresenter.js`): Murni menerima *props* (`riwayatList`, `totalEmisi`, event handlers) dan menampilkan tampilan UI yang elegan tanpa logic sampingan.

### 3. Provider Pattern (State Management via Context)
- **`StoreProvider`** (`lib/store.js`): Menyediakan state terpusat (*single source of truth*) yang dapat diakses oleh semua halaman dashboard tanpa *prop drilling*.
- **`ToastProvider`** (`lib/toast.js`): Menyediakan feedback notifikasi melayang ke pengguna secara global.

### 4. Custom Hook Pattern
- **`useStore()`**: Mengekspos data store, daftar misi, riwayat setoran, serta mutator aksi.
- **`useToast()`**: Memudahkan pemanggilan notifikasi dari komponen mana pun.

### 5. Singleton Service Pattern
- **`WasteClassifierService`** (`lib/services/WasteClassifierService.js`): Layanan tunggal yang mengenkapsulasi katalog klasifikasi dan pemrosesan estimasi emisi dari hasil tangkapan kamera.

---

## 🔀 Standar Manajemen Versi (Git & GitHub)

Tim mematuhi aturan baku version control sebagai berikut:

### 1. Aturan Penamaan Branch
Format: `feat_{nama_fitur}/{tanggal}` dan `fix_{nama_fitur}/{tanggal}`. Setiap fitur aplikasi dikembangkan pada branch tersendiri:

| No | Nama Branch | Fitur yang Dikerjakan | Tanggal |
|:---:|:---|:---|:---:|
| 1 | `feat_authentikasi/12-10-2026` | Login, Register, PasswordField, Sesi Pengguna | 12-10-2026 |
| 2 | `feat_dashboard_beranda/12-10-2026` | Sidebar, Layout Dashboard, Beranda & Cincin Emisi Karbon | 12-10-2026 |
| 3 | `feat_scan_acara/12-10-2026` | Pemindaian QR Code & Pop-up Bergabung Acara | 12-10-2026 |
| 4 | `feat_misi_acara/12-10-2026` | Model OOP Mission, Daftar Misi & Timer Hitung Mundur | 12-10-2026 |
| 5 | `feat_kamera_klasifikasi/12-10-2026` | Kamera Cerdas, Model OOP WasteItem & WasteClassifierService | 12-10-2026 |
| 6 | `feat_riwayat_setoran/12-10-2026` | Riwayat Setoran (Container-Presenter Pattern) & Styling | 12-10-2026 |
| 7 | `feat_penyelenggara_profil/12-10-2026` | Profil Pengguna & Pendaftaran Penyelenggara Acara | 12-10-2026 |
| 8 | `feat_kontainerisasi_docker/12-10-2026` | Dockerfile Multi-Stage, Docker Compose, & Dokumentasi UTS | 12-10-2026 |

### 2. Format Pesan Commit (Conventional Commits)
- `feat: <deskripsi>` → Untuk penambahan/peningkatan fitur baru.
- `fix: <deskripsi>` → Untuk perbaikan *bug* atau *error*.
- `style: <deskripsi>` → Untuk perubahan styling UI/CSS tanpa memengaruhi logic.
- `chore: <deskripsi>` → Untuk perubahan konfigurasi build, docker, dependensi, atau dokumentasi.

---

## 🐳 Penerapan Kontainerisasi Docker

Aplikasi telah dikontainerisasi menggunakan **Multi-Stage Build Dockerfile** untuk memastikan image berukuran kecil, efisien, dan aman.

### 1. Tautan Publik Docker Hub
🔗 **Docker Hub Repository**: [https://hub.docker.com/r/mahasiswa/wastieego-app](https://hub.docker.com/r/mahasiswa/wastieego-app)  
🏷️ **Image Tag Pengumpulan**: `mahasiswa/wastieego-app:v1-UTS` (Wajib berakhiran `-UTS`)

### 2. Poin-Poin Penting Dockerfile
- **Multi-Stage Build (4 Tahap)**:
  1. `base`: Menggunakan `node:20-alpine` yang ringan dan hemat resource.
  2. `deps`: Memasang dependensi proyek (`npm install`) dengan cache terisolasi.
  3. `builder`: Mengompilasi aplikasi Next.js ke mode `standalone` dengan optimasi produksi.
  4. `runner`: Tahap akhir produksi yang hanya menyalin hasil build standalone tanpa menyertakan seluruh `node_modules` mentah, mengurangi ukuran image secara drastis (~150MB).
- **Keamanan (Non-Root User)**: Menjalankan aplikasi dengan user `nextjs` (UID: 1001) bukan `root`.
- **Port Exposure**: Mengekspos port `3000`.

### 3. Panduan Menjalankan Docker Secara Lokal

#### A. Menggunakan Docker CLI
```bash
# 1. Build Docker image dengan tag berakhiran -UTS
docker build -t mahasiswa/wastieego-app:v1-UTS .

# 2. Jalankan kontainer
docker run -d -p 3000:3000 --name wastieego-web mahasiswa/wastieego-app:v1-UTS

# 3. Buka browser pada alamat:
# http://localhost:3000
```

#### B. Menggunakan Docker Compose
```bash
# Jalankan service secara otomatis
docker-compose up -d

# Mematikan service
docker-compose down
```

### 4. Langkah Push ke Docker Hub
```bash
# Login ke Docker Hub
docker login

# Tag image sesuai nama repository publik Docker Hub Anda
docker tag mahasiswa/wastieego-app:v1-UTS <username_dockerhub>/wastieego-app:v1-UTS

# Push image ke Docker Hub publik
docker push <username_dockerhub>/wastieego-app:v1-UTS
```

---

## 💻 Menjalankan Proyek Secara Lokal (Development)

Jika ingin menjalankan tanpa Docker:
```bash
# 1. Install dependencies
npm install

# 2. Jalankan server pengembangan
npm run dev

# 3. Buka browser di http://localhost:3000
```

---

## 🚀 Rencana Pengembangan ke Depan (Roadmap)

1. **Integrasi Model Machine Learning / Computer Vision Riil**:
   - Menghubungkan kamera langsung ke model CNN/YOLO via REST API untuk deteksi jenis sampah otomatis (bukan simulasi).
2. **Backend & Persistent Database (Node.js/Go + PostgreSQL)**:
   - Menggantikan penyimpanan `localStorage` dengan database relational untuk mencatat akun pengguna, sertifikat relawan, dan leaderboard acara secara terpusat.
3. **Peningkatan UI/UX & Gamifikasi**:
   - Fitur reward/tukar poin dengan voucher merchandise acara atau sertifikat partisipasi digital (*e-badge*).
4. **Full Cloud Deployment (GCP Cloud Run + Cloud Build)**:
   - Menerapkan CI/CD otomatis dari repository GitHub langsung ke Google Cloud Platform dengan kontainer Docker.

---

## 📽️ Panduan Demo Live Presentasi UTS

Setiap anggota tim mendemokan bagian berikut secara langsung:
1. **Demo Fungsionalitas Aplikasi**:
   - Menunjukkan halaman login/register → dashboard beranda → scan QR bergabung acara.
   - Menunjukkan pengerjaan misi pemilahan sampah lewat kamera (klasifikasi dan estimasi emisi).
   - Menunjukkan halaman Riwayat Setoran dengan filter kategori dan kalkulasi total emisi.
2. **Kontribusi Git & GitHub**:
   - Membuka histori commit di repository GitHub.
   - Menjelaskan commit masing-masing sesuai standar (`feat:`, `style:`, `chore:`).
   - Menunjukkan branch `feat_.../{tanggal}` yang digunakan selama pengerjaan.
3. **Kontainerisasi Docker**:
   - Menjelaskan struktur 4-stage pada file `Dockerfile`.
   - Menunjukkan build, tag berakhiran `-UTS`, dan kontainer yang berjalan di port 3000.
   - Memperlihatkan repository publik di Docker Hub.
