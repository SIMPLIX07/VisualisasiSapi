import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SI BOS Q - BKHIT Lampung",
  description: "Sistem Informasi Bongkar Sapi Karantina Lampung",
  icons: {
    icon: "/assets/img/Logo_Badan_Karantina_Indonesia.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Google Material Symbols untuk ikon */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* Font Inter */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: '"Inter", sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
