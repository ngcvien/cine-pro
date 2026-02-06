"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import SearchBox from "./SearchBox"; // Import thanh tìm kiếm bạn vừa tạo

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const pathname = usePathname(); // Để biết đang ở trang nào
  const router = useRouter();
  const profileRef = useRef(null);

  // 1. Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. Lắng nghe sự kiện cuộn trang (để đổi màu nền navbar)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Đóng menu profile khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await signOut(auth);
    setShowProfileMenu(false);
    router.push("/");
  };

  // Danh sách Link Menu
  const navLinks = [
    { name: "Trang Chủ", href: "/" },
    { name: "Phim Lẻ", href: "/danh-sach/phim-le" },
    { name: "Phim Bộ", href: "/danh-sach/phim-bo" },
    { name: "Hoạt Hình", href: "/danh-sach/hoat-hinh" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled || showMobileMenu
          ? "bg-background/90 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-gradient-to-b from-black/80 to-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
        
        {/* --- 1. LOGO & DESKTOP MENU --- */}
        <div className="flex items-center gap-8 md:gap-12">
          {/* LOGO */}
          <Link href="/" className="group flex items-center gap-1">
            <span className="text-3xl md:text-4xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400 group-hover:scale-105 transition-transform">
              CINE<span className="text-white">PRO</span>
            </span>
          </Link>

          {/* DESKTOP LINKS */}
          <ul className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`text-sm font-bold uppercase tracking-wide transition-colors ${
                      isActive ? "text-primary" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* --- 2. SEARCH & USER ACTION --- */}
        <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
            
            {/* THANH TÌM KIẾM (Hiện trên PC, ẩn trên Mobile để đưa vào menu) */}
            <div className="hidden md:block w-full max-w-[300px]">
                <SearchBox />
            </div>

            {/* USER PROFILE */}
            {user ? (
                <div className="relative" ref={profileRef}>
                    {/* Avatar Button */}
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-green-600 p-[2px]">
                            <img 
                                src={user.photoURL || "https://api.dicebear.com/9.x/initials/svg?seed=User"} 
                                alt="User" 
                                className="w-full h-full rounded-full object-cover bg-black"
                            />
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-[#121212] border border-white/10 rounded-lg shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                             <div className="px-4 py-3 border-b border-white/10 mb-2">
                                <p className="text-sm text-white font-bold truncate">{user.displayName || "Người dùng"}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                             </div>
                             
                             <Link 
                                href="/tu-phim" 
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors"
                                onClick={() => setShowProfileMenu(false)}
                             >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                Tủ Phim Của Tôi
                             </Link>
                             
                             <Link 
                                href="/ho-so" 
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors"
                                onClick={() => setShowProfileMenu(false)}
                             >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Cài Đặt Hồ Sơ
                             </Link>

                             <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors mt-1"
                             >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Đăng Xuất
                             </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link href="/dang-nhap">
                    <button className="bg-primary hover:bg-green-400 text-black font-extrabold text-sm px-5 py-2.5 rounded-full transition-transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,65,0.4)]">
                        ĐĂNG NHẬP
                    </button>
                </Link>
            )}

            {/* HAMBURGER BUTTON (Mobile Only) */}
            <button 
                className="lg:hidden text-white p-1"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
                {showMobileMenu ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
            </button>
        </div>
      </div>

      {/* --- 3. MOBILE MENU OVERLAY --- */}
      {/* Hiển thị khi bấm nút Hamburger */}
      <div 
        className={`lg:hidden fixed inset-x-0 top-[64px] md:top-[80px] bg-background/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 overflow-hidden ${
            showMobileMenu ? "max-h-screen opacity-100 py-6" : "max-h-0 opacity-0 py-0"
        }`}
      >
         <div className="container mx-auto px-4 space-y-6">
            {/* Search Box Mobile */}
            <div className="mb-6">
                <SearchBox />
            </div>

            {/* Mobile Links */}
            <ul className="space-y-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.name}>
                        <Link 
                            href={link.href}
                            className={`block text-lg font-bold ${isActive ? 'text-primary pl-4 border-l-4 border-primary' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => setShowMobileMenu(false)}
                        >
                            {link.name}
                        </Link>
                    </li>
                  );
                })}
                {/* Link Tủ Phim Mobile */}
                {user && (
                    <li>
                         <Link 
                            href="/tu-phim"
                            className={`block text-lg font-bold ${pathname === '/tu-phim' ? 'text-primary pl-4 border-l-4 border-primary' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Tủ Phim
                        </Link>
                    </li>
                )}
            </ul>

             {/* Login Button Mobile (nếu chưa đăng nhập) */}
             {!user && (
                 <div className="pt-4 border-t border-white/10">
                     <Link href="/dang-nhap" onClick={() => setShowMobileMenu(false)}>
                        <button className="w-full bg-white/10 text-white font-bold py-3 rounded-lg hover:bg-primary hover:text-black transition-colors">
                            ĐĂNG NHẬP TÀI KHOẢN
                        </button>
                     </Link>
                 </div>
             )}
         </div>
      </div>
    </nav>
  );
}