import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata = {
  title: "CinePro - Xem phim đẳng cấp",
  description: "Web xem phim giao diện tối giản",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-background text-white antialiased">
        <Navbar /> {/* Hiển thị Navbar ở mọi trang */}
        <main className="pt-24 min-h-screen">
            {children}
        </main>
      </body>
    </html>
  );
}