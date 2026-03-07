import "./globals.css";
import Navbar from "../components/Navbar";
import { Inter, Outfit } from "next/font/google";
import React from "react";
import Footer from "../components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "CinePro - Xem Phim Online Chất Lượng Cao",
  description: "Web xem phim miễn phí với giao diện hiện đại",
  openGraph: {
    images: [
      {
        url: '/og-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'CinePro Banner',
      },
    ],
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning={true} >
      <body className="bg-[#050505] text-white font-sans antialiased selection:bg-primary selection:text-black min-h-screen relative flex flex-col no-scrollbar">

        {/* --- GLOBAL BACKGROUND --- */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">

          {/* Base */}
          <div className="absolute inset-0 bg-[#050505]" />

          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 100%)",
          }} />

          {/* Orb xanh lá — góc trên trái */}
          <div className="absolute" style={{
            top: "-15%", left: "-12%",
            width: "55vw", height: "55vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 65%)",
            filter: "blur(60px)",
          }} />

          {/* Orb tím — góc dưới phải */}
          <div className="absolute" style={{
            bottom: "-20%", right: "-15%",
            width: "60vw", height: "60vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%)",
            filter: "blur(70px)",
          }} />

          {/* Orb xanh dương nhạt — giữa phải */}
          <div className="absolute" style={{
            top: "35%", right: "5%",
            width: "30vw", height: "30vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)",
            filter: "blur(50px)",
          }} />

          {/* Scanlines ngang mờ */}
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
            backgroundSize: "100% 4px",
          }} />

          {/* Noise grain */}
          <div className="absolute inset-0 opacity-[0.028]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "160px",
            mixBlendMode: "overlay",
          }} />

          {/* Vignette cạnh */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)",
          }} />
        </div>

        <Navbar />

        <main className="flex-1 relative z-0  " >
          {children}
        </main>
        <Footer />

      </body>

    </html>
  );
}