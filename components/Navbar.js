"use client";
import { useState, useEffect } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 1. Import router

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [keyword, setKeyword] = useState(""); // 2. State lưu từ khóa
    const router = useRouter(); // 3. Khởi tạo router

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    // 4. Hàm xử lý khi nhấn Enter
    const handleSearch = (e) => {
        if (e.key === "Enter" && keyword.trim() !== "") {
            router.push(`/tim-kiem?keyword=${keyword}`);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-background/90 backdrop-blur-md border-b border-white/5 shadow-lg">
            <Link href="/" className="text-2xl font-black tracking-tighter text-white hover:text-primary transition-colors duration-300">
                CINE<span className="text-primary">PRO</span>.
            </Link>

            {/* Menu Danh mục - Đã cập nhật link đúng */}
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 font-mono tracking-wide">
                <Link href="/" className="hover:text-primary transition-colors">PHIM MỚI</Link>
                <Link href="/danh-sach/phim-bo" className="hover:text-primary transition-colors">PHIM BỘ</Link>
                <Link href="/danh-sach/phim-le" className="hover:text-primary transition-colors">PHIM LẺ</Link>
                <Link href="/danh-sach/hoat-hinh" className="hover:text-primary transition-colors">ANIME</Link>
            </div>

            <div className="flex items-center gap-6">
                {/* Ô tìm kiếm đã hoạt động */}
                <div className="hidden md:block relative group">
                    <input
                        type="text"
                        placeholder="Gõ tên phim..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={handleSearch}
                        className="bg-transparent border-b-2 border-gray-800 text-white text-sm font-bold focus:border-primary focus:outline-none w-32 focus:w-64 transition-all duration-300 placeholder-gray-600 pb-1"
                    />
                    <span className="absolute right-0 bottom-2 text-primary text-xs opacity-0 group-focus-within:opacity-100 transition-opacity">↵ ENTER</span>
                </div>

                {user ? (
                    <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <div className="flex flex-col items-end cursor-pointer group">
                            <Link href="/tu-phim">
                                <span className="text-[10px] text-gray-500 font-bold uppercase group-hover:text-primary transition-colors">
                                    Tủ Phim
                                </span>
                                <span className="text-sm font-bold text-white uppercase tracking-wider leading-none group-hover:text-primary transition-colors">
                                    {user.displayName?.split(" ")[0]}
                                </span>
                            </Link>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-red-500 font-black hover:bg-red-500/10 px-3 py-2 rounded transition-colors uppercase"
                        >
                            Thoát
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="text-sm font-bold bg-primary text-black px-5 py-2 hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,65,0.4)]"
                    >
                        ĐĂNG NHẬP
                    </button>
                )}
            </div>
        </nav>
    );
}