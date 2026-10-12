import "./globals.css";
import { ToastProvider } from "@/lib/toast";

export const metadata = {
  title: "WastieeGo",
  description: "Aplikasi gamifikasi pengelolaan sampah untuk acara: ukur emisi karbon yang kamu kurangi.",
  appleWebApp: { capable: true, title: "WastieeGo" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f7a63",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
