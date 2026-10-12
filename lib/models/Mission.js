export class Mission {
  constructor({ id, teks, target, capai = 0, deskripsi = "" }) {
    this.id = id;
    this.teks = teks;
    this.target = Number(target) || 0;
    this.capai = Number(capai) || 0;
    this.deskripsi = deskripsi;
  }

  tambahCapaian(jumlah) {
    this.capai = Math.min(this.target, this.capai + jumlah);
    return this.capai;
  }

  getPersentase() {
    if (this.target === 0) return 100;
    return Math.min(100, Math.round((this.capai / this.target) * 100));
  }

  isSelesai() {
    return this.capai >= this.target;
  }

  getSisaTarget() {
    return Math.max(0, this.target - this.capai);
  }

  toJSON() {
    return {
      id: this.id,
      teks: this.teks,
      target: this.target,
      capai: this.capai,
      deskripsi: this.deskripsi,
    };
  }

  static fromJSON(data) {
    return new Mission(data);
  }
}
