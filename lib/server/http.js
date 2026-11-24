import { NextResponse } from "next/server";

/* galat yang pesannya aman ditampilkan ke pengguna */
export class GalatAplikasi extends Error {
  constructor(pesan, status = 400) {
    super(pesan);
    this.status = status;
  }
}

export const jawab = (data, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function bacaBody(request) {
  try {
    const b = await request.json();
    if (b && typeof b === "object") return b;
  } catch (e) {}
  throw new GalatAplikasi("Isi permintaan harus berupa JSON.", 400);
}

/* pembungkus handler: GalatAplikasi -> respons rapi, galat lain -> 500 tanpa membocorkan detail */
export function tangani(handler) {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (e) {
      if (e instanceof GalatAplikasi) return jawab({ error: e.message }, e.status);
      console.error(e);
      return jawab({ error: "Terjadi kesalahan di server." }, 500);
    }
  };
}
