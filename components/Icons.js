/* Ikon & ilustrasi SVG yang dipakai di beberapa halaman */
export function Avatar({ pipi = false }) {
  return (
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="26" r="15" fill="#f3c9a0" />
      <path d="M8 24c0-12 9-17 16-17s16 5 16 17c-4-7-10-9-16-9S12 17 8 24z" fill="#2b2a1f" />
      <circle cx="18" cy="27" r="1.8" fill="#2b2a1f" />
      <circle cx="30" cy="27" r="1.8" fill="#2b2a1f" />
      {pipi && <>
        <circle cx="14" cy="31" r="2.4" fill="#f7a8a8" opacity=".7" />
        <circle cx="34" cy="31" r="2.4" fill="#f7a8a8" opacity=".7" />
      </>}
      <path d="M20 33q4 3 8 0" stroke="#2b2a1f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="logo" aria-label="WastieeGo">
      <span>Wa</span><span>st</span><span>ie</span><span>eGo</span>
    </div>
  );
}

export const IkonPanahKiri = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
);
