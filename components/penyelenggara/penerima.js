/* Penerima reward = peserta berperingkat teratas sesuai reward bertingkat acara.
   reward: [{ tingkat, nama, jumlah, dari, sampai }] (dari server); peserta sudah berurutan menurut peringkat. */
export function hitungPenerima(peserta, reward) {
  return peserta.flatMap((p) => {
    const t = reward.find((x) => p.peringkat >= x.dari && p.peringkat <= x.sampai);
    return t ? [{ ...p, tingkat: t.tingkat, reward: t.nama }] : [];
  });
}

export const labelRentang = (dari, sampai) => (dari === sampai ? `Peringkat ${dari}` : `Peringkat ${dari}–${sampai}`);
