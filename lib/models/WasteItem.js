export class WasteItem {
  constructor({ id, jenis, nama, emisi, timestamp = Date.now(), fotoUrl = null }) {
    this.id = id || `waste_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.jenis = jenis || "Umum";
    this.nama = nama || "Sampah";
    this.emisi = Number(emisi) || 0; // dalam gCO2e
    this.timestamp = timestamp;
    this.fotoUrl = fotoUrl;
  }

  getEmisiText() {
    return `${this.emisi.toLocaleString("id-ID")} gCO₂e`;
  }

  getTanggalFormatted() {
    return new Date(this.timestamp).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  getBadgeColor() {
    switch (this.jenis.toLowerCase()) {
      case "plastik":
        return "#3573c9";
      case "kertas":
        return "#4a9a86";
      case "aluminium":
        return "#f47fbf";
      case "organik":
        return "#2f7a63";
      default:
        return "#8c8a7a";
    }
  }

  toJSON() {
    return {
      id: this.id,
      jenis: this.jenis,
      nama: this.nama,
      emisi: this.emisi,
      timestamp: this.timestamp,
      fotoUrl: this.fotoUrl,
    };
  }

  static fromJSON(data) {
    return new WasteItem(data);
  }
}
