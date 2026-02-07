import "./globals.css";
import Navbar from "../components/Navbar";
import { Inter, Outfit } from "next/font/google";
import React from "react"; // Import React để dùng type

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "CinePro - Xem Phim Online Chất Lượng Cao",
  description: "Web xem phim miễn phí với giao diện hiện đại",
};

// 👇 ĐOẠN QUAN TRỌNG: Thêm khai báo kiểu cho props
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning={true}>
      <body className="bg-[#050505] text-white font-sans antialiased selection:bg-primary selection:text-black min-h-screen relative">
        
        {/* --- GLOBAL BACKGROUND --- */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Đốm sáng xanh lá */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] opacity-30" />
            
            {/* Đốm sáng xanh dương */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[120px] opacity-30" />
            
            {/* Lớp Noise & Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-black/20" />
        </div>

        <Navbar />

        <main className="relative z-0 ">
            {children}
        </main>
        
      </body>
    </html>
  );
}