/* Pembungkus fetch ke API route. Tidak pernah melempar galat:
   jaringan putus -> { ok:false, status:0 } agar aplikasi tetap jalan secara lokal. */
export async function panggilApi(url, { method = "GET", body } = {}) {
  try {
    const r = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null };
  }
}
