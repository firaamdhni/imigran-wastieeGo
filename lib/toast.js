"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext({ toast() {}, toastNanti() {} });
const KUNCI_TOAST = "wastieego_toast";

export function ToastProvider({ children }) {
  const [teks, setTeks] = useState("");
  const [tampil, setTampil] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((t) => {
    setTeks(t);
    setTampil(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTampil(false), 2400);
  }, []);

  /* toast yang muncul di halaman BERIKUTNYA (dipakai sebelum pindah halaman) */
  const toastNanti = useCallback((t) => {
    try { sessionStorage.setItem(KUNCI_TOAST, t); } catch (e) {}
  }, []);

  /* tampilkan toast titipan dari halaman sebelumnya */
  useEffect(() => {
    try {
      const t = sessionStorage.getItem(KUNCI_TOAST);
      if (t) { sessionStorage.removeItem(KUNCI_TOAST); toast(t); }
    } catch (e) {}
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, toastNanti }}>
      {children}
      <div id="toast" role="status" className={tampil ? "tampil" : ""}>{teks}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
