"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Bell, Menu, X, LogOut, User, FolderHeart, ChevronDown, ChevronRight, LayoutDashboard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import SearchBox from "./SearchBox";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileGenresOpen, setMobileGenresOpen] = useState(false);
    const [mobileCountriesOpen, setMobileCountriesOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [loadingAuth, setLoadingAuth] = useState(true);

    const ADMIN_UID = [process.env.NEXT_PUBLIC_ADMIN_UIDS];
    console.log('ADMIN_UID: ' + ADMIN_UID);

    // --- LOGIC AUTH ---
    const [user, setUser] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);



    const loginUrl = pathname === "/login"
        ? "/login"
        : `/login?redirect=${encodeURIComponent(pathname)}`;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };

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

    // Swipe gesture để mở menu
    useEffect(() => {
        const handleTouchStart = (e) => {
            touchStartX.current = e.touches[0].clientX;
            touchEndX.current = e.touches[0].clientX;
        };

        const handleTouchMove = (e) => {
            touchEndX.current = e.touches[0].clientX;
        };

        const handleTouchEnd = () => {
            const diff = touchEndX.current - touchStartX.current;

            // Vuốt từ trái qua phải để mở (chỉ khi menu đang đóng)
            if (!isMobileMenuOpen && touchStartX.current < 100 && diff > 40) {
                setIsMobileMenuOpen(true);
            }
            // Vuốt từ phải qua trái để đóng (chỉ khi menu đang mở)
            else if (isMobileMenuOpen && diff < -60) {
                setIsMobileMenuOpen(false);
            }

            // Reset
            touchStartX.current = 0;
            touchEndX.current = 0;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobileMenuOpen]);

    // Khóa scroll khi menu mở
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

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

    const mainLinks = [
        { name: "Phim Lẻ", href: "/danh-sach/phim-le" },
        { name: "Phim Bộ", href: "/danh-sach/phim-bo" },
        { name: "TV Shows", href: "/danh-sach/tv-shows" },
        { name: "Hoạt Hình", href: "/danh-sach/hoat-hinh" },
        { name: "Chiếu Rạp", href: "/danh-sach/phim-chieu-rap" },
        { name: "Bộ lọc", href: "/filter" },
    ];
    if (pathname && pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <nav
            className={"fixed top-0 w-full z-50"}
        >
            <div className={`absolute inset-0 transition-all duration-500 z-[-1] ${isScrolled
                ? "bg-[#050505]/80 backdrop-blur-md shadow-lg"
                : "bg-gradient-to-b from-black/80 to-transparent"
                }`} />
            <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">

                {/* LEFT: HAMBURGER (Mobile) + LOGO + MENU (Desktop) */}
                <div className="flex items-center gap-4 md:gap-12">

                    {/* HAMBURGER MENU - Chỉ hiện trên mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden text-white hover:text-primary transition-colors"
                        aria-label="Menu"
                    >
                        <Menu size={28} />
                    </button>

                    {/* LOGO */}
                    <Link href="/" className="group flex items-center gap-1">
                        <span className="text-3xl md:text-4xl font-black font-display tracking-tighter group-hover:scale-105 transition-transform">
                            <span className="text-white">CINE</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">PRO</span>
                        </span>
                    </Link>

                    {/* MENU DESKTOP */}
                    <ul className="hidden lg:flex items-center gap-6">
                        {mainLinks.map((link) => (
                            <li key={link.name}>
                                <Link href={link.href} className={`text-sm text-center font-bold uppercase flex items-center tracking-wide transition-colors ${pathname === link.href ? "text-primary" : "text-gray-300 hover:text-white"}`}>
                                    {link.name}
                                </Link>
                            </li>
                        ))}

                        {/* DROPDOWN THỂ LOẠI */}
                        <li className="relative group py-4">
                            <button className={`flex items-center gap-1 text-sm font-bold uppercase tracking-wide transition-colors ${pathname.includes('/the-loai') ? "text-primary" : "text-gray-300 group-hover:text-white"}`}>
                                Thể Loại
                                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            <div className="absolute top-full left-0 w-37 backdrop-blur-xl bg-background/90 border border-white/10 rounded-lg shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="py-2">
                                    {featuredGenres.map((genre) => (
                                        <Link
                                            key={genre.slug}
                                            href={`/the-loai/${genre.slug}`}
                                            className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 bg-white/5">
                                    <Link
                                        href="/filter"
                                        className="block px-4 py-2 text-center text-sm font-bold text-primary hover:text-white hover:bg-primary/20 transition-colors"
                                    >
                                        XEM TẤT CẢ
                                    </Link>
                                </div>
                            </div>
                        </li>

                        {/* DROPDOWN QUỐC GIA */}
                        <li className="relative group py-4">
                            <button className={`flex items-center gap-1 text-sm font-bold uppercase tracking-wide transition-colors ${pathname.includes('/quoc-gia') ? "text-primary" : "text-gray-300 group-hover:text-white"}`}>
                                Quốc Gia
                                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            <div className="absolute top-full left-0 w-96 backdrop-blur-xl bg-background/90 border border-white/10 rounded-lg shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Chọn quốc gia</span>
                                </div>

                                <div className="p-4 grid grid-cols-3 gap-2">
                                    {countries.map((country) => (
                                        <Link
                                            key={country.slug}
                                            href={`/quoc-gia/${country.slug}`}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all group/item"
                                        >
                                            <span className="text-xs opacity-50 font-mono group-hover/item:opacity-100 group-hover/item:text-primary transition-opacity">
                                                {country.code}
                                            </span>
                                            <span className="truncate">{country.name}</span>
                                        </Link>
                                    ))}
                                </div>

                                <div className="border-t border-white/10 bg-white/5">
                                    <Link
                                        href="/filter"
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
                                <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-white ">Hủy</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowSearch(true)} className="flex items-center text-gray-300 hover:text-white">
                                <Search size={22} />
                            </button>
                        )}
                    </div>

                    {/* Notification */}
                    {user && (
                        // <button className="text-gray-300 hover:text-white relative hidden md:block">
                        //     <Bell size={22} />
                        //     <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        // </button>
                        <NotificationBell />
                    )}

                    {/* USER SECTION */}
                    {loadingAuth ? (
                        <div className="w-8 h-8 rounded-md bg-white/10 animate-pulse"></div>
                    ) : user ? (
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
                                <ChevronDown size={14} className={`text-white transition-transform hidden md:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-black/80 border backdrop-blur-md border-white/10 rounded-lg shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden">
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
                                    {user && user.uid == ADMIN_UID && (
                                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
                                            <LayoutDashboard size={16} /> Admin
                                        </Link>
                                    )}

                                    <div className="h-px bg-white/10 my-2 mx-4"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-500/10 transition-colors text-sm text-left font-bold"
                                    >
                                        <LogOut size={16} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href={loginUrl}
                            className="
    relative
    bg-primary hover:bg-white
    text-black font-bold
    px-5 py-2 rounded-md
    text-sm whitespace-nowrap
    transition-all duration-300
    shadow-[0_0_15px_rgba(74,222,128,0.35)]
    hover:scale-105

    animate-[pulse_2s_ease-in-out_infinite]
  "
                        >
                            Đăng nhập
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping"></span>

                        </Link>

                    )}
                </div>
            </div>

            {/* MOBILE SLIDE-OUT MENU */}
            <>
                {/* Backdrop */}
                <div
                    className={`lg:hidden transition-opacity duration-300 will-change-opacity ${isMobileMenuOpen ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none -z-10'
                        }`}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />

                {/* Slide Menu */}
                <div
                    ref={mobileMenuRef}
                    className={`lg:hidden fixed w-[85%] max-w-sm bg-[#0a0a0a]/80  border-r border-white/10 shadow-2xl transition-transform duration-300 ease-out z-50 will-change-transform flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        height: '100vh',
                        height: '100dvh',
                        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1">
                            <span className="text-2xl font-black font-display tracking-tighter">
                                <span className="text-white">CINE</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">PRO</span>
                            </span>
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* User Info (nếu đã đăng nhập) */}
                    {user && (
                        <Link
                            href="/ho-so"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                        alt="User"
                                        className="w-12 h-12 rounded-lg object-cover border border-white/20"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-bold truncate">{user.displayName || "Thành viên"}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* Menu Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">

                        {/* Main Links */}
                        {mainLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg font-bold text-sm transition-all ${pathname === link.href
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Thể Loại Dropdown */}
                        <div>
                            <button
                                onClick={() => setMobileGenresOpen(!mobileGenresOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                            >
                                <span>Thể Loại</span>
                                <ChevronRight
                                    size={18}
                                    className={`transition-transform duration-200 ${mobileGenresOpen ? 'rotate-90' : ''}`}
                                />
                            </button>

                            <div className={`overflow-hidden transition-all duration-200 ${mobileGenresOpen ? 'max-h-96 mt-2' : 'max-h-0'
                                }`}>
                                <div className="pl-4 space-y-1">
                                    {featuredGenres.map((genre) => (
                                        <Link
                                            key={genre.slug}
                                            href={`/the-loai/${genre.slug}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                    <Link
                                        href="/the-loai"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-4 py-2 rounded-lg text-sm text-primary font-bold hover:bg-primary/20 transition-all mt-2"
                                    >
                                        Xem tất cả
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Quốc Gia Dropdown */}
                        <div>
                            <button
                                onClick={() => setMobileCountriesOpen(!mobileCountriesOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                            >
                                <span>Quốc Gia</span>
                                <ChevronRight
                                    size={18}
                                    className={`transition-transform duration-200 ${mobileCountriesOpen ? 'rotate-90' : ''}`}
                                />
                            </button>

                            <div className={`overflow-hidden transition-all duration-200 ${mobileCountriesOpen ? 'max-h-[500px] mt-2' : 'max-h-0'
                                }`}>
                                <div className="pl-4 grid grid-cols-2 gap-1">
                                    {countries.map((country) => (
                                        <Link
                                            key={country.slug}
                                            href={`/quoc-gia/${country.slug}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <span className="text-xs opacity-50 font-mono">{country.code}</span>
                                            <span className="truncate text-xs">{country.name}</span>
                                        </Link>
                                    ))}
                                </div>
                                <Link
                                    href="/filter"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg text-sm text-primary font-bold hover:bg-primary/20 transition-all mt-2 ml-4"
                                >
                                    Xem tất cả →
                                </Link>
                            </div>
                        </div>

                        {/* User Actions */}
                        {user ? (
                            <>
                                <div className="h-px bg-white/10 my-4"></div>
                                <Link
                                    href="/ho-so"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <User size={18} /> Hồ sơ của tôi
                                </Link>
                                <Link
                                    href="/tu-phim"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <FolderHeart size={18} /> Tủ phim
                                </Link>
                                {user && user.uid == ADMIN_UID && (
                                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
                                        <LayoutDashboard size={18} /> Admin
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-500 hover:bg-gray-500/10 transition-all font-bold"
                                >
                                    <LogOut size={18} /> Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="h-px bg-white/10 my-4"></div>
                                <Link
                                    href={loginUrl}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-lg font-bold bg-primary text-black text-center shadow-lg hover:scale-105 transition-all"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </>
        </nav>
    );
}