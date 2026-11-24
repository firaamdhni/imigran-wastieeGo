"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { panggilApi } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { buatTautanGabung } from "@/lib/kodeAcara";
import { qrKePng } from "@/lib/qr";
import { kecilkanFoto } from "@/lib/foto";
import { hitungPenerima, labelRentang } from "./penerima";
import { MISI_AWAL } from "@/lib/eventConfig";
import PanelPresenter from "./PanelPresenter";
import ModalBuatAcara from "./ModalBuatAcara";

/**
 * PanelContainer - Container (Smart) Component
 * Mengambil data peserta acara milik penyelenggara dari server, menyimpan state form
 * Detail Event, dan menjalankan aksi. Tampilan sepenuhnya ada di PanelPresenter.
 */
export default function PanelContainer() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [tab, setTab] = useState("peserta");
  const [cari, setCari] = useState("");
  const [modalBuatAcara, setModalBuatAcara] = useState(false);
  const [formDetail, setFormDetail] = useState(null); // isian Detail Event yang sedang diedit
  const [versiSampul, setVersiSampul] = useState(0);  // mengganti alamat gambar sampul agar tidak memakai cache lama
  const tabSebelum = useRef("peserta");
  const [proses, setProses] = useState(false);
  const [periksaId, setPeriksaId] = useState(null); // peserta yang sedang diperiksa
  const [detail, setDetail] = useState(null);       // { peserta, aktivitas } milik peserta tsb
  const [memuatDetail, setMemuatDetail] = useState(false);
  const periksaRef = useRef(null);
  useEffect(() => { periksaRef.current = periksaId; }, [periksaId]);

  const muat = useCallback(async () => {
    const r = await panggilApi("/api/penyelenggara/peserta");
    if (r.status === 401) return router.replace("/penyelenggara/login");
    setMemuat(false);
    if (!r.ok) return setGalat(r.data?.error || "Tidak dapat terhubung ke server.");
    setGalat("");
    setData(r.data);
  }, [router]);

  /* aktivitas satu peserta (riwayat setoran + foto + status verifikasi) */
  const muatDetail = useCallback(async (id) => {
    setMemuatDetail(true);
    const r = await panggilApi("/api/penyelenggara/aktivitas?peserta=" + encodeURIComponent(id));
    setMemuatDetail(false);
    if (r.status === 401) return router.replace("/penyelenggara/login");
    if (!r.ok) {
      toast(r.data?.error || "Gagal memuat aktivitas peserta.");
      setPeriksaId(null);
      setDetail(null);
      return;
    }
    setDetail(r.data);
  }, [router, toast]);

  /* muat awal + segarkan otomatis tiap 15 detik selama tab terlihat (termasuk peserta yang sedang diperiksa) */
  useEffect(() => {
    muat();
    const t = setInterval(() => {
      if (document.hidden) return;
      muat();
      if (periksaRef.current) muatDetail(periksaRef.current);
    }, 15000);
    return () => clearInterval(t);
  }, [muat, muatDetail]);

  const jalankan = async (url, opsi, pesanSukses) => {
    setProses(true);
    const r = await panggilApi(url, opsi);
    setProses(false);
    if (r.status === 401) return router.replace("/penyelenggara/login");
    if (!r.ok) return toast(r.data?.error || "Aksi gagal. Coba lagi.");
    toast(pesanSukses);
    muat();
  };

  /* pemenang otomatis dari peringkat teratas; penyelenggara hanya meninjau ringkasan lalu mengonfirmasi */
  const tetapkan = () => {
    const penerima = hitungPenerima(data.peserta, data.reward);
    const baris = data.reward
      .map((t) => {
        const d = penerima.filter((p) => p.tingkat === t.tingkat);
        if (!d.length) return null;
        return d.length <= 3
          ? `${t.nama}: ${d.map((p) => p.nama).join(", ")}`
          : `${t.nama}: ${d.length} peserta (${labelRentang(d[0].peringkat, d[d.length - 1].peringkat)})`;
      })
      .filter(Boolean)
      .join("\n");
    const belum = penerima.filter((p) => p.statusPenilaian === "belum").length;
    const peringatan = belum ? `\n\nPerhatian: ${belum} dari ${penerima.length} penerima belum diperiksa atau dinilai.` : "";
    if (!confirm(`Tetapkan pemenang berikut dan akhiri acara?\n\n${baris}${peringatan}\n\nPeserta tidak bisa lagi menyetor atau bergabung, dan verifikasi dikunci.`)) return;
    jalankan("/api/penyelenggara/pemenang", { method: "POST" }, "Pemenang ditetapkan. Acara selesai.");
  };

  /* body: { pesertaId, diberikan } untuk satu penerima, atau { tingkat, diberikan } untuk satu tingkat reward */
  const tandai = (body) =>
    jalankan("/api/penyelenggara/pemenang", { method: "PATCH", body },
      body.diberikan ? "Reward ditandai sudah diberikan." : "Tanda reward dibatalkan.");

  const bukaKembali = () => {
    if (!confirm("Buka kembali evaluasi? Daftar pemenang dihapus dan peserta bisa menyetor lagi.")) return;
    jalankan("/api/penyelenggara/pemenang", { method: "DELETE" }, "Evaluasi dibuka kembali.");
  };

  const bukaPeriksa = (id) => {
    setPeriksaId(id);
    setDetail(null);
    muatDetail(id);
  };

  const tutupPeriksa = () => {
    setPeriksaId(null);
    setDetail(null);
    muat();
  };

  /* verifikasi & penilaian mengembalikan data peserta terbaru, jadi langsung dipakai tanpa memuat ulang */
  const kirimDetail = async (url, method, body, pesan) => {
    setProses(true);
    const r = await panggilApi(url, { method, body });
    setProses(false);
    if (r.status === 401) return router.replace("/penyelenggara/login");
    if (!r.ok) return toast(r.data?.error || "Aksi gagal. Coba lagi.");
    setDetail(r.data);
    if (pesan) toast(pesan);
    muat(); // peringkat & status daftar ikut berubah
  };

  const verifikasi = (aktivitasId, tahap, hasil) =>
    kirimDetail("/api/penyelenggara/aktivitas", "PATCH", { pesertaId: periksaId, aktivitasId, tahap, hasil });

  const nilai = (body) =>
    kirimDetail("/api/penyelenggara/penilaian", "PUT", { pesertaId: periksaId, ...body },
      body.mode === null ? "Penilaian dihapus." : body.mode === "otomatis" ? "Hasil dinyatakan benar." : "Nilai manual disimpan.");

  /* ---------- Detail Event ---------- */
  const bukaDetail = () => {
    const a = data.acara;
    const sumberMisi = (a?.misi && a.misi.length)
      ? a.misi
      : (data?.misi && data.misi.length ? data.misi : MISI_AWAL);
    const daftarMisi = sumberMisi.map((m, idx) => ({
      id: idx + 1,
      teks: m.teks || "",
      target: String(m.target || 1000),
    }));
    setFormDetail({
      nama: a.nama, deskripsiSingkat: a.deskripsiSingkat, kategori: a.kategori, tanggal: a.tanggal,
      waktuMulai: a.waktuMulai, waktuSelesai: a.waktuSelesai, lokasi: a.lokasi, detail: a.detail || "",
      misi: daftarMisi,
      reward: data.reward.map((r) => ({ nama: r.nama, jumlah: String(r.jumlah) })),
      sampulBaru: null, hapusSampul: false,
    });
    tabSebelum.current = tab;
    setTab("detail");
  };

  const tutupDetail = () => {
    setTab(tabSebelum.current === "detail" ? "peserta" : tabSebelum.current);
    setFormDetail(null);
  };

  const ubahForm = (perubahan) => setFormDetail((f) => ({ ...f, ...perubahan }));
  const ubahMisi = (i, perubahan) => setFormDetail((f) => ({ ...f, misi: f.misi.map((m, j) => (j === i ? { ...m, ...perubahan } : m)) }));
  const tambahMisi = () => setFormDetail((f) => ({
    ...f,
    misi: [...(f.misi || []), { id: (f.misi?.length || 0) + 1, teks: "Misi baru pemilahan sampah", target: "1000" }]
  }));
  const hapusMisi = (i) => setFormDetail((f) => ({
    ...f,
    misi: (f.misi || []).filter((_, j) => j !== i).map((m, idx) => ({ ...m, id: idx + 1 }))
  }));
  const ubahReward = (i, perubahan) => setFormDetail((f) => ({ ...f, reward: f.reward.map((r, j) => (j === i ? { ...r, ...perubahan } : r)) }));
  const tambahReward = () => setFormDetail((f) => ({ ...f, reward: [...f.reward, { nama: "", jumlah: "1" }] }));
  const hapusReward = (i) => setFormDetail((f) => ({ ...f, reward: f.reward.filter((_, j) => j !== i) }));
  const hapusSampul = () => setFormDetail((f) => ({ ...f, sampulBaru: null, hapusSampul: true }));

  /* foto sampul dikecilkan di browser (maks 960px) sebelum diunggah */
  const pilihSampul = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Pilih berkas gambar (JPG atau PNG).");
    if (file.size > 15 * 1024 * 1024) return toast("Ukuran foto maksimal 15 MB.");
    try {
      const sumber = await new Promise((ok, gagal) => {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.onerror = () => gagal(new Error("Foto tidak bisa dibaca"));
        r.readAsDataURL(file);
      });
      let hasil = await kecilkanFoto(sumber, 960, 0.8);
      if (hasil.length > 600000) hasil = await kecilkanFoto(sumber, 800, 0.6);
      if (hasil.length > 650000) return toast("Foto terlalu besar. Pilih foto lain.");
      setFormDetail((f) => ({ ...f, sampulBaru: hasil, hapusSampul: false }));
    } catch (e) {
      toast("Foto tidak bisa dibaca. Coba foto lain.");
    }
  };

  const simpanDetail = async () => {
    const f = formDetail;
    const body = {
      nama: f.nama, deskripsiSingkat: f.deskripsiSingkat, kategori: f.kategori, tanggal: f.tanggal,
      waktuMulai: f.waktuMulai, waktuSelesai: f.waktuSelesai, lokasi: f.lokasi, detail: f.detail,
      misi: (f.misi || []).map((m, idx) => ({ id: idx + 1, teks: m.teks.trim(), target: Number(m.target) || 1000 })),
      ...(data.acara.status !== "selesai" ? { reward: f.reward.map((r) => ({ nama: r.nama, jumlah: Number(r.jumlah) })) } : {}),
      ...(f.sampulBaru ? { sampul: f.sampulBaru } : f.hapusSampul ? { hapusSampul: true } : {}),
    };
    setProses(true);
    const r = await panggilApi("/api/penyelenggara/acara", { method: "PUT", body });
    setProses(false);
    if (r.status === 401) return router.replace("/penyelenggara/login");
    if (!r.ok) return toast(r.data?.error || "Perubahan gagal disimpan. Coba lagi.");
    toast("Perubahan disimpan.");
    setVersiSampul((v) => v + 1);
    setFormDetail((x) => ({
      ...x, sampulBaru: null, hapusSampul: false,
      misi: (r.data.misi && r.data.misi.length ? r.data.misi : x.misi).map((m, idx) => ({ id: idx + 1, teks: m.teks, target: String(m.target) })),
      reward: r.data.reward.map((t) => ({ nama: t.nama, jumlah: String(t.jumlah) })),
    }));
    muat();
  };

  const salinKode = async () => {
    try {
      await navigator.clipboard.writeText(data.acara.kode);
      toast("Kode acara disalin.");
    } catch (e) {
      toast("Tidak bisa menyalin otomatis. Salin kode secara manual.");
    }
  };

  /* QR berisi tautan ke halaman Scan di alamat situs yang sedang dibuka penyelenggara */
  const tautan = data ? buatTautanGabung(window.location.origin, data.acara.kode) : "";

  const unduhQR = async () => {
    try {
      const url = URL.createObjectURL(await qrKePng(tautan));
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-acara-${data.acara.kode}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast("Gagal membuat gambar QR.");
    }
  };

  const tambahContoh = () => jalankan("/api/penyelenggara/contoh", { method: "POST" }, "Peserta contoh ditambahkan.");

  const hapusContoh = () => {
    if (!confirm("Hapus semua peserta contoh? Peserta sungguhan tidak ikut terhapus.")) return;
    jalankan("/api/penyelenggara/contoh", { method: "DELETE" }, "Peserta contoh dihapus.");
  };

  const keluar = async () => {
    await panggilApi("/api/penyelenggara/session", { method: "DELETE" });
    router.push("/penyelenggara/login");
  };

  const pilihAcara = async (kode) => {
    setProses(true);
    const r = await panggilApi("/api/penyelenggara/acara/pilih", {
      method: "POST",
      body: { kode },
    });
    setProses(false);
    if (r.ok) {
      toast("Beralih ke event: " + r.data.nama);
      muat();
    } else {
      toast(r.data?.error || "Gagal beralih event.");
    }
  };

  return (
    <>
      <PanelPresenter
        data={data} memuat={memuat} galat={galat}
        tab={tab} setTab={setTab} cari={cari} setCari={setCari}
        proses={proses} tautan={tautan}
        periksa={{ id: periksaId, detail, memuat: memuatDetail }}
        formDetail={formDetail} versiSampul={versiSampul}
        onBukaDetail={bukaDetail} onTutupDetail={tutupDetail} onUbahForm={ubahForm}
        onUbahMisi={ubahMisi} onTambahMisi={tambahMisi} onHapusMisi={hapusMisi}
        onUbahReward={ubahReward} onTambahReward={tambahReward} onHapusReward={hapusReward}
        onPilihSampul={pilihSampul} onHapusSampul={hapusSampul} onSimpanDetail={simpanDetail}
        onPeriksa={bukaPeriksa} onTutupPeriksa={tutupPeriksa} onVerifikasi={verifikasi} onNilai={nilai}
        onTetapkan={tetapkan} onTandai={tandai} onBukaKembali={bukaKembali}
        onSalinKode={salinKode} onUnduhQR={unduhQR}
        onTambahContoh={tambahContoh} onHapusContoh={hapusContoh}
        onMuatUlang={muat} onKeluar={keluar}
        onPilihAcara={pilihAcara}
        onBukaBuatAcara={() => setModalBuatAcara(true)}
      />

      {modalBuatAcara && (
        <ModalBuatAcara
          onClose={() => setModalBuatAcara(false)}
          onAcaraDibuat={(kodeBaru) => {
            muat();
          }}
        />
      )}
    </>
  );
}
