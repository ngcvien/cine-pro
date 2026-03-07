import Link from "next/link";
import { Facebook, Twitter, Instagram, Github, Mail, ShieldAlert } from "lucide-react";

export default function Footer() {
  
  return (
    <footer className="bg-[#050505]/40 border-t border-white/10 pt-10 md:pt-16 pb-6 md:pb-8 font-sans relative z-[-1]">
      <div className="container mx-auto px-4 md:px-8">

        {/* --- MOBILE: Logo + tagline compact --- */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
              <span className="text-black font-black text-lg">C</span>
            </div>
            <span className="text-xl font-black text-white tracking-tighter">
              CINE<span className="text-primary">PRO</span>
            </span>
          </Link>
          <a href="mailto:support@cinepro.com" className="flex items-center gap-1.5 text-xs text-primary font-semibold">
            <Mail size={13} />
            support@cinepro.com
          </a>
        </div>

        {/* --- MOBILE: 2 cột link gọn --- */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 md:hidden">
          <MobileLink href="/danh-sach/phim-le">Phim Lẻ Mới</MobileLink>
          <MobileLink href="/danh-sach/phim-bo">Phim Bộ Hot</MobileLink>
          <MobileLink href="/danh-sach/hoat-hinh">Anime & Hoạt Hình</MobileLink>
          <MobileLink href="/danh-sach/tv-shows">TV Shows</MobileLink>
          <MobileLink href="/danh-sach/phim-vietsub">Phim Vietsub</MobileLink>
          <MobileLink href="/faq">Câu hỏi thường gặp</MobileLink>
          <MobileLink href="/dmca">Chính sách DMCA</MobileLink>
          <MobileLink href="/privacy">Bảo mật thông tin</MobileLink>
        </div>

        {/* --- MOBILE: Disclaimer thu gọn --- */}
        <div className="flex items-start gap-2 mb-6 md:hidden bg-white/3 border border-white/5 rounded-lg px-3 py-2.5">
          <ShieldAlert size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            CinePro không lưu trữ tệp tin trên máy chủ. Nội dung do bên thứ ba cung cấp.
          </p>
        </div>

        {/* --- DESKTOP: Grid 4 cột (ẩn trên mobile) --- */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* CỘT 1: THƯƠNG HIỆU */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <span className="text-black font-black text-xl">C</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                CINE<span className="text-primary">PRO</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed text-justify">
              Trải nghiệm điện ảnh đỉnh cao ngay tại nhà. Cập nhật liên tục các bộ phim bom tấn, phim bộ và anime mới nhất với chất lượng HD vietsub miễn phí.
            </p>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h3 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Khám Phá</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <FooterLink href="/danh-sach/phim-le">Phim Lẻ Mới</FooterLink>
              <FooterLink href="/danh-sach/phim-bo">Phim Bộ Hot</FooterLink>
              <FooterLink href="/danh-sach/hoat-hinh">Anime & Hoạt Hình</FooterLink>
              <FooterLink href="/danh-sach/tv-shows">TV Shows</FooterLink>
              <FooterLink href="/danh-sach/phim-vietsub">Phim Vietsub</FooterLink>
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ */}
          <div>
            <h3 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Hỗ Trợ</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <FooterLink href="/faq">Câu hỏi thường gặp</FooterLink>
              <FooterLink href="/lien-he">Liên hệ quảng cáo</FooterLink>
              <FooterLink href="/dmca">Chính sách DMCA</FooterLink>
              <FooterLink href="/privacy">Bảo mật thông tin</FooterLink>
              <li className="flex items-center gap-2 text-primary text-sm">
                <Mail size={14} />
                <span>support@cinepro.com</span>
              </li>
            </ul>
          </div>

          {/* CỘT 4: MIỄN TRỪ TRÁCH NHIỆM */}
          <div className="bg-[#121212] p-5 rounded-xl border border-white/5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
              <ShieldAlert size={15} className="text-red-500" />
              Miễn trừ trách nhiệm
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed text-justify">
              CinePro không lưu trữ bất kỳ tệp tin nào trên máy chủ. Tất cả nội dung được cung cấp bởi các bên thứ ba không liên kết.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Vui lòng liên hệ nhà cung cấp dịch vụ lưu trữ video để khiếu nại nội dung.
            </p>
          </div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="border-t border-white/8 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} <span className="text-white font-bold">CinePro</span>. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs font-bold text-gray-500">
            <Link href="/dieu-khoan" className="hover:text-white transition-colors">Điều khoản</Link>
            <Link href="#" className="hover:text-white transition-colors">Bảo mật</Link>
            <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

// --- SUB COMPONENTS CHO GỌN ---

const MobileLink = ({ href, children }) => (
  <Link href={href} className="text-xs text-gray-400 hover:text-primary transition-colors truncate block py-0.5">
    {children}
  </Link>
);

const FooterLink = ({ href, children }) => (
  <li>
    <Link href={href} className="hover:text-primary hover:pl-2 transition-all duration-300 block">
      {children}
    </Link>
  </li>
);

const SocialIcon = ({ icon, href }) => (
  <Link 
    href={href} 
    className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary hover:text-black flex items-center justify-center transition-all text-gray-400"
  >
    {icon}
  </Link>
);