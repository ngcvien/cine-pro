"use client";
import { useState, useEffect } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const router = useRouter();

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
        setIsUserMenuOpen(false);
    };

    const handleSearch = (e) => {
        if (e.key === "Enter" && keyword.trim() !== "") {
            router.push(`/tim-kiem?keyword=${keyword}`);
            setIsSearchFocused(false);
        }
    };

    const categories = [
        { label: "PHIM MỚI", href: "/" },
        { label: "PHIM BỘ", href: "/danh-sach/phim-bo" },
        { label: "PHIM LẺ", href: "/danh-sach/phim-le" },
        { label: "ANIME", href: "/danh-sach/hoat-hinh" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
            <div className="container mx-auto px-4 md:px-8 py-4">
                <div className="flex items-center justify-between gap-6 md:gap-8">
                    
                    {/* LOGO */}
                    <Link href="/" className="flex-shrink-0">
                        <div className="text-2xl font-black tracking-tighter">
                            <span className="text-white">CINE</span>
                            <span className="text-primary">PRO</span>
                        </div>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden lg:flex items-center gap-1">
                        {categories.map((cat) => (
                            <Link key={cat.href} href={cat.href}>
                                <span className="text-xs font-bold text-gray-400 px-4 py-2 rounded-lg hover:text-primary hover:bg-white/5 transition-all duration-300 uppercase tracking-wider">
                                    {cat.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* SEARCH BAR */}
                    <div className="hidden md:flex flex-1 max-w-xs items-center relative">
                        <div className={`relative w-full transition-all duration-300 ${
                            isSearchFocused ? "max-w-md" : "max-w-xs"
                        }`}>
                            <input
                                type="text"
                                placeholder="Tìm phim..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={handleSearch}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 px-4 py-2.5 focus:outline-none focus:border-primary focus:bg-white/10 transition-all duration-300"
                            />
                            <svg
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* RIGHT SECTION: USER & AUTH */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg hover:bg-white/5 transition-colors duration-300 group"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-black font-bold text-sm">
                                        {user.displayName?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-xs text-gray-500 font-medium">Xin chào</p>
                                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                            {user.displayName?.split(" ")[0]}
                                        </p>
                                    </div>
                                    <svg
                                        className={`hidden md:block w-4 h-4 text-gray-400 transition-transform duration-300 ${
                                            isUserMenuOpen ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                        />
                                    </svg>
                                </button>

                                {/* USER MENU DROPDOWN */}
                                {isUserMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-surface/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-md overflow-hidden z-50">
                                        <Link href="/tu-phim">
                                            <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-primary hover:bg-white/5 transition-all duration-300 flex items-center gap-2">
                                                <span>📚</span>
                                                Tủ phim của tôi
                                            </button>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 border-t border-white/5 flex items-center gap-2"
                                        >
                                            <span>🚪</span>
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="px-4 md:px-6 py-2.5 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/50 uppercase tracking-wide"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>

                {/* MOBILE MENU */}
                <div className="lg:hidden flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5 overflow-x-auto">
                    {categories.map((cat) => (
                        <Link key={cat.href} href={cat.href}>
                            <span className="text-xs font-bold text-gray-400 px-3 py-1.5 rounded hover:text-primary hover:bg-white/5 transition-all duration-300 uppercase tracking-wider whitespace-nowrap">
                                {cat.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
