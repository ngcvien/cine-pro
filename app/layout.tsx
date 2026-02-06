import "./globals.css";
import Navbar from "../components/Navbar";
// Import font của bạn (ví dụ Inter, Outfit...)
import { Inter, Outfit } from "next/font/google"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "CinePro - Xem Phim Online Chất Lượng Cao",
  description: "Web xem phim miễn phí với giao diện hiện đại",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#050505] text-white font-sans antialiased selection:bg-primary selection:text-black min-h-screen relative">
        
        {/* --- GLOBAL BACKGROUND (Đã chỉnh tối hơn) --- */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            
            {/* 1. Đốm sáng xanh lá (Đã giảm opacity từ 60 -> 30) */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] opacity-30" />
            
            {/* 2. Đốm sáng xanh dương (Đã giảm opacity từ 60 -> 30) */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[120px] opacity-30" />
            
            {/* 3. Lớp Noise (Đã giảm opacity từ 20 -> 10 để bớt trắng) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
            
            {/* 4. (Mới) Lớp phủ đen mờ toàn màn hình để nền sâu hơn nữa */}
            <div className="absolute inset-0 bg-black/20" />
        </div>

        <Navbar />

        <main className="relative z-0 pt-15">
            {children}
        </main>
        
      </body>
    </html>
  );
}