"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import SearchBox from "./SearchBox";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef(null);

  // --- DANH SÁCH THỂ LOẠI NỔI BẬT (Cho Dropdown) ---
  const featuredGenres = [
    { name: "Hành Động", slug: "hanh-dong" },
    { name: "Tình Cảm", slug: "tinh-cam" },
    { name: "Cổ Trang", slug: "co-trang" },
    { name: "Kinh Dị", slug: "kinh-di" },
    { name: "Hoạt Hình", slug: "hoat-hinh" },
    { name: "Viễn Tưởng", slug: "vien-tuong" },
  ];

  // Các link chính khác
  const mainLinks = [
    { name: "Phim Lẻ", href: "/danh-sach/phim-le" },
    { name: "Phim Bộ", href: "/danh-sach/phim-bo" },
    { name: "TV Shows", href: "/danh-sach/tv-shows" },
    { name: "Hoạt Hình", href: "/danh-sach/hoat-hinh" },
    { name: "Chiếu Rạp", href: "/danh-sach/phim-chieu-rap" },

  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        setShowMobileMenu(false); 
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowProfileMenu(false);
    router.push("/");
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled || showMobileMenu
          ? "bg-background/70 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-gradient-to-b from-black/80 to-transparent  border-transparent"
      }`}>
      <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
        
        {/* LOGO & DESKTOP MENU */}
        <div className="flex items-center gap-8 md:gap-12">
          <Link href="/" className="group flex items-center gap-1">
            <span className="text-3xl md:text-4xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400 group-hover:scale-105 transition-transform">
              CINE<span className="text-white">PRO</span>
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
          </ul>
        </div>

        {/* RIGHT SECTION (Search & User) - Giữ nguyên */}
        <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
            <div className="hidden md:block w-full max-w-[300px]">
                <SearchBox />
            </div>

            {loading ? (
                <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse"></div>
            ) : user ? (
                <div className="relative" ref={profileRef}>
                    <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 focus:outline-none">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-green-600 p-[2px]">
                            <img src={user.photoURL || "https://api.dicebear.com/9.x/initials/svg?seed=User"} alt="User" className="w-full h-full rounded-full object-cover bg-black" />
                        </div>
                    </button>
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-[#121212] border border-white/10 rounded-lg shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                             <div className="px-4 py-3 border-b border-white/10 mb-2">
                                <p className="text-sm text-white font-bold truncate">{user.displayName}</p>
                             </div>
                             <Link href="/tu-phim" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> Tủ Phim Của Tôi
                             </Link>
                             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors mt-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Đăng Xuất
                             </button>
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={handleLogin} className="bg-primary hover:bg-green-400 text-black font-extrabold text-sm px-5 py-2.5 rounded-full transition-transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,65,0.4)]">
                    ĐĂNG NHẬP
                </button>
            )}

            <button className="lg:hidden text-white p-1" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                {showMobileMenu ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
            </button>
        </div>
      </div>
      
      {/* MOBILE MENU */}
      <div className={`lg:hidden fixed inset-x-0 top-[64px] md:top-[80px] bg-background/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 overflow-hidden ${showMobileMenu ? "max-h-screen opacity-100 py-6" : "max-h-0 opacity-0 py-0"}`}>
         <div className="container mx-auto px-4 space-y-4">
            <div className="mb-6"><SearchBox /></div>
            
            {/* Link Trang Chủ Mobile */}
            <Link href="/" onClick={() => setShowMobileMenu(false)} className={`block text-lg font-bold ${pathname === "/" ? 'text-primary' : 'text-gray-300'}`}>
                Trang Chủ
            </Link>

            {/* Link Thể Loại Mobile (Liệt kê ra luôn) */}
            <div className="py-2 border-l-2 border-white/10 pl-4 space-y-3">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Thể Loại</p>
                {featuredGenres.map(g => (
                    <Link key={g.slug} href={`/the-loai/${g.slug}`} onClick={() => setShowMobileMenu(false)} className="block text-base text-gray-300 hover:text-primary">
                        {g.name}
                    </Link>
                ))}
                <Link href="/the-loai" onClick={() => setShowMobileMenu(false)} className="block text-base text-primary font-bold">
                    → Tất Cả
                </Link>
            </div>

            {/* Các link còn lại */}
            {mainLinks.map((link) => (
                <Link key={link.name} href={link.href} onClick={() => setShowMobileMenu(false)} className={`block text-lg font-bold ${pathname === link.href ? 'text-primary' : 'text-gray-300'}`}>
                    {link.name}
                </Link>
            ))}

            {!loading && user && (
                 <Link href="/tu-phim" onClick={() => setShowMobileMenu(false)} className="block text-lg font-bold text-gray-300">Tủ Phim</Link>
            )}

             {!loading && !user && (
                 <div className="pt-4 border-t border-white/10">
                     <button onClick={handleLogin} className="w-full bg-white/10 text-white font-bold py-3 rounded-lg hover:bg-primary hover:text-black transition-colors">
                        ĐĂNG NHẬP
                     </button>
                 </div>
             )}
         </div>
      </div>
    </nav>
  );
}