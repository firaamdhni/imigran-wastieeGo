import { WasteItem } from "../models/WasteItem";

/**
 * WasteClassifierService - OOP Service layer yang mengenkapsulasi
 * logika inferensi/klasifikasi jenis sampah dan estimasi emisi karbon.
 */
export class WasteClassifierService {
  constructor() {
    this.catalog = [
      { jenis: "Plastik", nama: "Gelas plastik", emisi: 150 },
      { jenis: "Plastik", nama: "Botol plastik", emisi: 250 },
      { jenis: "Kertas", nama: "Kardus", emisi: 300 },
      { jenis: "Aluminium", nama: "Kaleng aluminium", emisi: 400 },
      { jenis: "Organik", nama: "Sisa Makanan", emisi: 120 },
      { jenis: "Kaca", nama: "Botol Kaca", emisi: 350 },
    ];
  }

  /**
   * Mengambil katalog jenis sampah yang didukung
   */
  getCatalog() {
    return [...this.catalog];
  }

  /**
   * Mengklasifikasikan sampah dari foto (simulasi AI / computer vision)
   * @param {string|null} imageSrc - URL atau base64 gambar
   * @returns {Promise<WasteItem>}
   */
  async classify(imageSrc = null) {
    // Simulasi latensi inferensi AI model
    await new Promise((resolve) => setTimeout(resolve, 800));
    const randomPick = this.catalog[Math.floor(Math.random() * this.catalog.length)];

    return new WasteItem({
      jenis: randomPick.jenis,
      nama: randomPick.nama,
      emisi: randomPick.emisi,
      fotoUrl: imageSrc,
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance untuk digunakan di seluruh aplikasi
export const wasteClassifierService = new WasteClassifierService();
