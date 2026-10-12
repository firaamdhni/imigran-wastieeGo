"use client";
import { useState } from "react";

const ikonMata = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
const ikonMataCoret = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18.5 18.5 0 0 1 5-5.9M9.9 4.2A10.7 10.7 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22" /></svg>
);

/* input kata sandi dengan tombol mata (tampil/sembunyi) */
export default function PasswordField({ id, label, value, onChange, placeholder, autoComplete }) {
  const [tampil, setTampil] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={tampil ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="mata"
        aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        onClick={() => setTampil((t) => !t)}
      >
        {tampil ? ikonMata : ikonMataCoret}
      </button>
    </div>
  );
}
