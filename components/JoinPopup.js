"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/* pop-up "Anda belum bergabung di acara manapun!" */
export default function JoinPopup() {
  const router = useRouter();
  const { popup, tutupPopup } = useStore();
  const tutupRef = useRef(null);

  useEffect(() => {
    if (!popup) return;
    tutupRef.current?.focus();
    const esc = (e) => { if (e.key === "Escape") tutupPopup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [popup, tutupPopup]);

  return (
    <div
      className={"latar" + (popup ? " buka" : "")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-popup"
      onClick={(e) => { if (e.target === e.currentTarget) tutupPopup(); }}
    >
      <div className="modal">
        <button className="tutup" ref={tutupRef} aria-label="Tutup" onClick={tutupPopup}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
        <h2 id="judul-popup">Anda belum bergabung di acara manapun!</h2>
        <button className="btn" onClick={() => { tutupPopup(); router.push("/dashboard/scan"); }}>Bergabung ke acara</button>
      </div>
    </div>
  );
}
