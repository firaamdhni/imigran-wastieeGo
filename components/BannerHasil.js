"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { panggilApi } from "@/lib/api";

/* Presenter: hanya menampilkan hasil acara untuk peserta (murni props) */
export function TampilanBannerHasil({ hasil }) {
  if (!hasil || hasil.acara.status !== "selesai" || !hasil.sudahGabung) return null;

  if (hasil.menang) {
    const { peringkat, tingkat, reward, diberikan } = hasil.menang;
    return (
      <section className="kartu banner banner-menang" role="status">
        <h2>{tingkat === 1 ? `Selamat! Kamu juara ${peringkat} 🎉` : `Selamat! Kamu peringkat ${peringkat} 🎉`}</h2>
        <p>Reward untukmu: <b>{reward}</b></p>
        <small>{diberikan ? "Reward sudah diserahkan oleh panitia." : "Temui panitia acara untuk mengambil rewardmu."}</small>
      </section>
    );
  }

  return (
    <section className="kartu banner" role="status">
      <h2>Acara {hasil.acara.nama} sudah selesai</h2>
      <p>Terima kasih sudah ikut memilah sampah dan mengurangi emisi karbon!</p>
    </section>
  );
}

/* Container: banner di beranda setelah penyelenggara mengakhiri acara.
   Pemenang melihat juara & reward, peserta lain melihat ucapan terima kasih. */
export default function BannerHasil() {
  const { nama, kodeAcara, siap, sudahGabung } = useStore();
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    if (!siap || !sudahGabung || !kodeAcara) return;
    let batal = false;
    const muat = async () => {
      const r = await panggilApi(`/api/event/status?kode=${encodeURIComponent(kodeAcara)}&peserta=${encodeURIComponent(nama)}`);
      if (!batal && r.ok) setHasil(r.data);
    };
    muat();
    const t = setInterval(muat, 30000);
    return () => { batal = true; clearInterval(t); };
  }, [siap, sudahGabung, kodeAcara, nama]);

  return <TampilanBannerHasil hasil={hasil} />;
}
