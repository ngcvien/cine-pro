import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google"; // 1. Import Font xịn
import "./globals.css";
import Navbar from "../components/Navbar";

// 2. Cấu hình Font Be Vietnam Pro (Cho nội dung text)
const beVietnamPro = Be_Vietnam_Pro({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ["vietnamese"],
  variable: "--font-be-vietnam",
  display: 'swap',
});

// 3. Cấu hình Font Manrope (Cho tiêu đề - Thay thế Outfit để không lỗi tiếng Việt)
const manrope = Manrope({
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  subsets: ["vietnamese", "latin"],
  variable: "--font-manrope",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CinePro - Xem phim đẳng cấp",
  description: "Web xem phim giao diện tối giản",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${beVietnamPro.variable} ${manrope.variable}`}>
      <body className="bg-background text-white antialiased font-sans selection:bg-primary selection:text-black">
        <Navbar />
        
        {/* 4. QUAN TRỌNG: Thêm pt-20 hoặc pt-24 để đẩy nội dung xuống khỏi Navbar */}
        {/* min-h-screen giúp footer (nếu có) luôn nằm dưới đáy */}
        <main className="min-h-screen pt-24">
          {children}
        </main>
      </body>
    </html>
  );
}