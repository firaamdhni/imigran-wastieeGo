# 📊 Panduan & Naskah Slide Presentasi UTS POPL A
## Proyek: WastieeGo (Smart Waste Sorting & Carbon Tracking Dashboard)

Dokumen ini disusun untuk memudahkan tim dalam membuat file slide (PowerPoint / Google Slides / Canva) serta membagi giliran bicara saat **Demo Live** di hadapan Dosen & Asisten Lab.

---

## 📑 Struktur Slide Presentasi (Slide-by-Slide)

### Slide 1: Judul Proyek & Tim
* **Judul**: WastieeGo: Platform Interaktif Pemilahan Sampah & Pelacakan Emisi Karbon Berbasis Web
* **Mata Kuliah**: Praktikum Pemrograman Berorientasi Objek Lanjut (POPL) Kelas A - UTS
* **Daftar Tim**:
  - Anggota 1: [Nama Lengkap] - [NIM] (Role: OOP Architecture & Lead)
  - Anggota 2: [Nama Lengkap] - [NIM] (Role: UI/UX & Container-Presenter Pattern)
  - Anggota 3: [Nama Lengkap] - [NIM] (Role: Docker DevOps & State Management)

---

### Slide 2: Deskripsi Proyek & Latar Belakang Masalah
* **Latar Belakang**:
  - Sampah di acara kampus sering menumpuk dan tercampur tanpa pemilahan yang tepat.
  - Kurangnya kesadaran pengunjung karena tidak adanya insentif atau metrik konkret atas kontribusi mereka terhadap lingkungan.
* **Tujuan**:
  - Menyediakan aplikasi web gamifikasi pemilahan sampah dengan misi pengurangan emisi karbon secara real-time.
* **Manfaat**:
  - Memberikan visualisasi nyata emisi yang dihemat ($gCO_2e$) bagi pengunjung dan mendukung inisiatif *green event* bagi panitia.
* **Target Pengguna**:
  - Peserta acara / mahasiswa (User utama).
  - Penyelenggara acara / panitia (*Event Organizer*).

---

### Slide 3: Tampilan & Fungsionalitas Utama Aplikasi
* **Fitur 1: Dashboard Beranda & Visualisasi Emisi**
  - Ringkasan profil peserta, status event, progress ring emisi karbon terpadu, dan edukasi WasteInfo.
* **Fitur 2: Scan QR Acara & Registrasi Penyelenggara**
  - Bergabung ke acara resmi menggunakan pemindaian QR code.
* **Fitur 3: Pengerjaan Misi Lingkungan (Misi Page)**
  - Daftar misi berbasis kuota waktu dan target $gCO_2e$.
* **Fitur 4: Kamera Cerdas & Analisis Sampah (Smart Camera)**
  - Mengambil foto sampah dan mengestimasi jenis serta nilai reduksi emisi karbon.
* **Fitur 5: Riwayat Setoran Sampah (History)**
  - Rekapitulasi sampah yang telah disetor dengan filter kategori (Plastik, Kertas, Aluminium, Organik) dan total akumulasi emisi.

---

### Slide 4: Arsitektur & Teknologi Berbasis OOP
* **Framework**: Next.js 15 (React 19, JavaScript ES6+).
* **Alasan Pemilihan**:
  1. Mendukung OOP modern (Class, Encapsulation, Abstraction, Singleton Service).
  2. Ringan dan efisien untuk containerization Docker multi-stage.
  3. Memiliki ekosistem luas dan siap dideploy ke Google Cloud Platform (GCP).
* **Penerapan OOP Domain Models**:
  - `class WasteItem`: Enkapsulasi data sampah, kalkulasi emisi, dan formatting tanggal/badge warna.
  - `class Mission`: Enkapsulasi target, capaian emisi, persentase kelulusan, dan status selesai.
  - `class WasteClassifierService`: Service enkapsulasi katalog dan logika estimasi emisi.

---

### Slide 5: Penerapan Design Pattern pada Kode
* **1. Container-Presenter Pattern**:
  - *Contoh*: `RiwayatContainer.js` (Smart Component - data, filter, state) memisahkan diri dari `RiwayatPresenter.js` (Dumb Component - pure visual rendering).
* **2. Provider Pattern (Context API)**:
  - `StoreProvider` (`lib/store.js`) & `ToastProvider` (`lib/toast.js`): Menyediakan state bersama ke seluruh hierarki komponen tanpa *prop drilling*.
* **3. Custom Hooks Pattern**:
  - `useStore()` dan `useToast()` untuk abstraksi logika stateful.
* **4. Singleton Service Pattern**:
  - `wasteClassifierService` diekspor sebagai satu instance tunggal untuk layanan klasifikasi.

---

### Slide 6: Kontainerisasi dengan Docker
* **Link Docker Hub Publik**:  
  👉 `https://hub.docker.com/r/mahasiswa/wastieego-app` (Tag: `mahasiswa/wastieego-app:v1-UTS`)
* **Poin Penting Dockerfile**:
  - **Multi-Stage Build (4 Stages)**: `base` → `deps` → `builder` → `runner`.
  - **Output Standalone**: Memanfaatkan fitur `output: "standalone"` Next.js sehingga ukuran image berkurang drastis dari ~1GB menjadi ~150MB.
  - **Keamanan (Least Privilege)**: Menggunakan non-root user `nextjs` (UID 1001).
  - **Port**: Membuka port `3000`.
* **Docker Compose**:
  - Disediakan `docker-compose.yml` untuk menjalankan aplikasi secara cepat dengan `docker-compose up -d`.

---

### Slide 7: Manajemen Versi (Git & GitHub Workflow)
* **Aturan & Penerapan Branching per Fitur**:
  - `feat_authentikasi/12-10-2026` (Login, Register, Session)
  - `feat_dashboard_beranda/12-10-2026` (Sidebar, Beranda, Cincin Emisi)
  - `feat_scan_acara/12-10-2026` (Scan QR & Popup Acara)
  - `feat_misi_acara/12-10-2026` (Model OOP Mission & Misi Page)
  - `feat_kamera_klasifikasi/12-10-2026` (Model WasteItem & WasteClassifierService)
  - `feat_riwayat_setoran/12-10-2026` (Riwayat Container-Presenter & Styling)
  - `feat_penyelenggara_profil/12-10-2026` (Profil & Pendaftaran Penyelenggara)
  - `feat_kontainerisasi_docker/12-10-2026` (Dockerfile, Docker Compose, Docs)
* **Standar Pesan Commit**:
  - `feat:` penambahan fitur baru
  - `fix:` perbaikan error/bug
  - `style:` perubahan styling UI
  - `chore:` konfigurasi docker, dependencies, dokumentasi
* **Bukti Kolaborasi**:
  - Commit history teratur mencerminkan pembagian kontribusi masing-masing anggota tim.

---

### Slide 8: Rencana Pengembangan ke Depan (Roadmap)
1. **AI Vision Model Riil**: Integrasi model deteksi objek (YOLOv8/TensorFlow.js) langsung di kamera browser.
2. **Backend & Persistent Database**: Migrasi data dari localStorage ke backend PostgreSQL/Node.js dengan authentication JWT.
3. **Penyelenggara Dashboard**: Halaman analitik khusus panitia untuk melihat total sampah dan sertifikat emisi tereduksi.
4. **Cloud Deployment (GCP Cloud Run)**: Integrasi CI/CD dari GitHub ke GCP menggunakan Docker image yang telah dibuat.

---

## 🎙️ Skenario & Panduan Demo Live Masing-Masing Anggota

Setiap anggota memiliki jatah waktu untuk mendemonstrasikan keahliannya secara langsung di hadapan penguji:

### 👤 Anggota 1: Demo Fungsionalitas Aplikasi Web
1. **Langkah Demo**:
   - Buka browser di `http://localhost:3000`.
   - Lakukan alur registrasi / login.
   - Buka Beranda: Tunjukkan nama user, lingkaran statistik emisi ($gCO_2e$), dan kartu WasteInfo.
   - Buka menu **Scan QR**: Tunjukkan simulasi bergabung ke acara *INFEST*.
   - Buka menu **Misi**: Tunjukkan 3 misi lingkungan dengan progress bar dan timer hitung mundur.
   - Buka **Kamera**: Ambil foto sampel sampah, tunggu hasil analisis OOP service, lalu klik **"Simpan ke Misi"**.
   - Buka menu **Riwayat**: Tunjukkan bahwa sampah yang baru saja difoto otomatis masuk ke daftar riwayat, filter berdasarkan kategori (Plastik, Kertas, Aluminium), dan tunjukkan akumulasi total emisi yang dihemat!

---

### 👤 Anggota 2: Demo Arsitektur OOP & Git/GitHub
1. **Langkah Demo**:
   - Buka repository GitHub di browser:
     - Tunjukkan halaman **Branches** (tunjukkan branch `feat_.../{tanggal}`).
     - Tunjukkan halaman **Commit History**: perlihatkan bahwa setiap commit mematuhi aturan (`feat:`, `style:`, `chore:`).
     - Buka salah satu commit pribadi Anda dan jelaskan perubahan baris kode di dalamnya.
   - Buka VS Code / Editor:
     - Tunjukkan file model OOP `lib/models/WasteItem.js` dan `lib/models/Mission.js`.
     - Jelaskan konsep *Encapsulation* dan method yang ada di dalamnya.
     - Tunjukkan implementasi *Container-Presenter Pattern* pada `components/riwayat/RiwayatContainer.js` dan `RiwayatPresenter.js`.

---

### 👤 Anggota 3: Demo Kontainerisasi Docker & Docker Hub
1. **Langkah Demo**:
   - Buka file `Dockerfile` di editor dan jelaskan 4-stage build (`base`, `deps`, `builder`, `runner`) serta optimasi `output: "standalone"`.
   - Buka Terminal dan jalankan proses:
     ```bash
     # Tunjukkan proses build & tag berakhiran -UTS
     docker build -t <username>/wastieego-app:v1-UTS .
     
     # Tunjukkan image yang sudah terbuat
     docker images | grep wastieego
     
     # Jalankan kontainer
     docker run -d -p 3000:3000 --name wastieego-live <username>/wastieego-app:v1-UTS
     ```
   - Verifikasi kontainer berjalan dengan `docker ps` dan buka `http://localhost:3000` di browser.
   - Buka halaman publik **Docker Hub** di browser (`https://hub.docker.com/r/<username>/wastieego-app`), tunjukkan bahwa tag `v1-UTS` telah terunggah dan dapat diakses publik.
