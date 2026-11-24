/* Mengecilkan foto (data URL) sebelum diunggah ke server sebagai bukti aktivitas.
   Foto kamera bisa berukuran MB; untuk pemeriksaan keaslian 640px sudah cukup jelas. Hanya dipakai di browser. */
export function kecilkanFoto(sumber, maksSisi = 640, kualitas = 0.7) {
  return new Promise((selesai, gagal) => {
    const img = new Image();
    img.onload = () => {
      const skala = Math.min(1, maksSisi / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * skala));
      c.height = Math.max(1, Math.round(img.height * skala));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      selesai(c.toDataURL("image/jpeg", kualitas));
    };
    img.onerror = () => gagal(new Error("Foto tidak bisa dibaca"));
    img.src = sumber;
  });
}
