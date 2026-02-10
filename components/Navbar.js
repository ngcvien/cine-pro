"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Bell, Menu, X, LogOut, User, Film, FolderHeart, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import SearchBox from "./SearchBox";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [loadingAuth, setLoadingAuth] = useState(true);

    // --- LOGIC AUTH ---
    const [user, setUser] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const loginUrl = pathname === "/login"
        ? "/login"
        : `/login?redirect=${encodeURIComponent(pathname)}`;

    useEffect(() => {
        // Lắng nghe trạng thái đăng nhập
        console.log("Navbar: Bắt đầu lắng nghe Auth..."); // Log 1
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("Navbar: Trạng thái user thay đổi:", currentUser); // Log 2
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // Xử lý Đăng xuất
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };
    // ------------------

    // Detect scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Đóng menu user khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [userMenuRef]);

    const featuredGenres = [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Cổ Trang", slug: "co-trang" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Hoạt Hình", slug: "hoat-hinh" },
        { name: "Viễn Tưởng", slug: "vien-tuong" },
    ];

    const countries = [
        { name: 'Việt Nam', slug: 'viet-nam', code: 'VN' },
        { name: 'Trung Quốc', slug: 'trung-quoc', code: 'CN' },
        { name: 'Hàn Quốc', slug: 'han-quoc', code: 'KR' },
        { name: 'Thái Lan', slug: 'thai-lan', code: 'TH' },
        { name: 'Âu Mỹ', slug: 'au-my', code: 'US' },
        { name: 'Nhật Bản', slug: 'nhat-ban', code: 'JP' },
        { name: 'Ấn Độ', slug: 'an-do', code: 'IN' },
        { name: 'Hồng Kông', slug: 'hong-kong', code: 'HK' },
        { name: 'Đài Loan', slug: 'dai-loan', code: 'TW' },
        { name: 'Anh', slug: 'anh', code: 'GB' },
        { name: 'Pháp', slug: 'phap', code: 'FR' },
        { name: 'Canada', slug: 'canada', code: 'CA' },
    ];

    // Các link chính khác
    const mainLinks = [
        { name: "Phim Lẻ", href: "/danh-sach/phim-le" },
        { name: "Phim Bộ", href: "/danh-sach/phim-bo" },
        { name: "TV Shows", href: "/danh-sach/tv-shows" },
        { name: "Hoạt Hình", href: "/danh-sach/hoat-hinh" },
        { name: "Chiếu Rạp", href: "/danh-sach/phim-chieu-rap" },
        { name: "Bộ lọc", href: "/filter" },


    ];

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-[#050505]/90 backdrop-blur-md shadow-lg" : "bg-gradient-to-b from-black/80 to-transparent"
                }`}
        >
            <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">

                {/* LEFT: LOGO & MENU */}
                {/* LOGO & DESKTOP MENU */}
                <div className="flex items-center gap-8 md:gap-12">
                    <Link href="/" className="group flex items-center gap-1">
                        <span className="text-3xl md:text-4xl font-black font-display tracking-tighter group-hover:scale-105 transition-transform">
                            <span className="text-white">CINE</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">PRO</span>
                        </span>
                    </Link>

                    {/* MENU DESKTOP */}
                    <ul className="hidden lg:flex items-center gap-6">

                        {/* 1. Trang Chủ */}
                        {/* <li>
                <Link href="/" className={`text-sm font-bold uppercase tracking-wide transition-colors ${pathname === "/" ? "text-primary" : "text-gray-300 hover:text-white"}`}>
                    Trang Chủ
                </Link>
            </li> */}



                        {/* 3. Các link chính còn lại (Phim Lẻ, Phim Bộ) */}
                        {mainLinks.map((link) => (
                            <li key={link.name}>
                                <Link href={link.href} className={`text-sm font-bold uppercase tracking-wide transition-colors ${pathname === link.href ? "text-primary" : "text-gray-300 hover:text-white"}`}>
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                        {/* 2. DROPDOWN THỂ LOẠI (Dùng Group Hover CSS) */}
                        <li className="relative group py-4 "> {/* py-4 để mở rộng vùng hover */}
                            <button className={`flex items-center gap-1 text-sm font-bold uppercase tracking-wide transition-colors ${pathname.includes('/the-loai') ? "text-primary" : "text-gray-300 group-hover:text-white"}`}>
                                Thể Loại
                                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {/* Dropdown Content */}
                            <div className="absolute top-full left-0 w-37  backdrop-blur-xl bg-background/90 border border-white/10 rounded-lg shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="py-2">
                                    {featuredGenres.map((genre) => (
                                        <Link
                                            key={genre.slug}
                                            href={`/the-loai/${genre.slug}`}
                                            className="block px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-primary hover:pl-6 transition-all"
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-white/10 my-1 mx-4"></div>
                                    <Link
                                        href="/the-loai"
                                        className="block px-4 py-2 text-sm font-bold text-white hover:bg-primary hover:text-black transition-colors"
                                    >
                                        TẤT CẢ
                                    </Link>
                                </div>
                            </div>
                        </li>

                        {/* 3. Quốc Gia */}
                        <li className="relative group py-4"> {/* py-4 để mở rộng vùng hover */}
                            <button
                                className={`flex items-center gap-1 text-sm font-bold uppercase tracking-wide transition-colors 
        ${pathname.includes('/quoc-gia') ? "text-primary" : "text-gray-300 group-hover:text-white"}`}
                            >
                                Quốc Gia
                                <svg
                                    className="w-4 h-4 transition-transform group-hover:rotate-180"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Content */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[480px] backdrop-blur-xl bg-black/90 border border-white/10 rounded-lg shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">

                                {/* Header (Optional) */}
                                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Chọn quốc gia</span>
                                </div>

                                {/* Grid Layout cho nhiều quốc gia */}
                                <div className="p-4 grid grid-cols-3 gap-2">
                                    {countries.map((country) => (
                                        <Link
                                            key={country.slug}
                                            href={`/quoc-gia/${country.slug}`}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all group/item"
                                        >
                                            {/* Cờ (Dùng text hoặc icon ảnh) */}
                                            <span className="text-xs opacity-50 font-mono group-hover/item:opacity-100 group-hover/item:text-primary transition-opacity">
                                                {country.code}
                                            </span>
                                            <span className="truncate">{country.name}</span>
                                        </Link>
                                    ))}
                                </div>

                                {/* Footer Link */}
                                <div className="border-t border-white/10 bg-white/5">
                                    <Link
                                        href="/filter" // Trang danh sách tất cả quốc gia (nếu có)
                                        className="block px-4 py-3 text-center text-sm font-bold text-primary hover:text-white hover:bg-primary/20 transition-colors"
                                    >
                                        XEM TẤT CẢ QUỐC GIA
                                    </Link>
                                </div>
                            </div>
                        </li>


                    </ul>
                </div>

                {/* RIGHT: SEARCH & USER */}
                <div className="flex items-center gap-4 md:gap-6">

                    {/* Search Box */}
                    <div className={`transition-all duration-300 ${showSearch ? 'w-full absolute inset-0 bg-black z-50 px-4 flex items-center' : ''} md:relative md:w-auto md:bg-transparent md:p-0`}>
                        {showSearch ? (
                            <div className="w-full md:w-[300px] flex items-center gap-2">
                                <SearchBox autoFocus />
                                <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-white md:hidden">Hủy</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowSearch(true)} className="text-gray-300 hover:text-white">
                                <Search size={22} />
                            </button>
                        )}
                    </div>

                    {/* Notification (Chỉ hiện khi đã login) */}
                    {user && (
                        <button className="text-gray-300 hover:text-white relative">
                            <Bell size={22} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        </button>
                    )}

                    {/* --- USER SECTION (QUAN TRỌNG) --- */}
                    {loadingAuth ? (
                        // 1. ĐANG LOAD -> Hiện Skeleton (Khung xám mờ)
                        <div className="w-8 h-8 rounded-md bg-white/10 animate-pulse"></div>
                    ) : user ? (
                        // 2. ĐÃ ĐĂNG NHẬP -> Hiện Avatar
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 group focus:outline-none"
                            >
                                <img
                                    src={user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                    alt="User"
                                    className="w-8 h-8 rounded-md object-cover border border-transparent group-hover:border-white transition-all"
                                />
                                <ChevronDown size={14} className={`text-white transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-black/95 border border-white/10 rounded-lg shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/10 mb-2">
                                        <p className="text-sm text-white font-bold truncate">{user.displayName || "Thành viên"}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>

                                    <Link href="/ho-so" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
                                        <User size={16} /> Hồ sơ của tôi
                                    </Link>
                                    <Link href="/tu-phim" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
                                        <FolderHeart size={16} /> Tủ phim
                                    </Link>

                                    <div className="h-px bg-white/10 my-2 mx-4"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors text-sm text-left font-bold"
                                    >
                                        <LogOut size={16} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // 3. CHƯA ĐĂNG NHẬP -> Hiện nút Đăng nhập
                        <Link
                            href={loginUrl}
                            className="bg-primary hover:bg-white text-black font-bold px-5 py-2 rounded-md transition-all text-sm shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:scale-105 whitespace-nowrap"
                        >
                            Đăng nhập
                        </Link>
                    )}

                </div>
            </div>

            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-[#0a0a0a] border-t border-white/10 shadow-2xl animate-in slide-in-from-top-5">
                    <div className="flex flex-col p-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg font-bold ${pathname === link.href ? "bg-white/10 text-white" : "text-gray-400"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Mobile User Actions */}
                        {!user && (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-3 rounded-lg font-bold bg-primary/20 text-primary mt-4 text-center border border-primary/20"
                            >
                                Đăng nhập ngay
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

