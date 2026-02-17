import Link from "next/link";
import { Facebook, Twitter, Instagram, Github, Mail, ShieldAlert } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 font-sans relative z-[-1]">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* --- GRID CONTENT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
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
            <div className="flex gap-4 pt-2">
              <SocialIcon icon={<Facebook size={18} />} href="#" />
              <SocialIcon icon={<Twitter size={18} />} href="#" />
              <SocialIcon icon={<Instagram size={18} />} href="#" />
              <SocialIcon icon={<Github size={18} />} href="#" />
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Khám Phá</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <FooterLink href="/danh-sach/phim-le">Phim Lẻ Mới</FooterLink>
              <FooterLink href="/danh-sach/phim-bo">Phim Bộ Hot</FooterLink>
              <FooterLink href="/danh-sach/hoat-hinh">Anime & Hoạt Hình</FooterLink>
              <FooterLink href="/danh-sach/tv-shows">TV Shows</FooterLink>
              <FooterLink href="/danh-sach/phim-vietsub">Phim Vietsub</FooterLink>
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ & GIÚP ĐỠ */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Hỗ Trợ</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <FooterLink href="/faq">Câu hỏi thường gặp</FooterLink>
              <FooterLink href="/lien-he">Liên hệ quảng cáo</FooterLink>
              <FooterLink href="/dmca">Chính sách DMCA</FooterLink>
              <FooterLink href="/privacy">Bảo mật thông tin</FooterLink>
              <li className="flex items-center gap-2 text-primary">
                <Mail size={14} />
                <span>support@cinepro.com</span>
              </li>
            </ul>
          </div>

          {/* CỘT 4: MIỄN TRỪ TRÁCH NHIỆM */}
          <div className="bg-[#121212] p-5 rounded-xl border border-white/5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase">
              <ShieldAlert size={16} className="text-red-500" />
              Miễn trừ trách nhiệm
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed text-justify">
              CinePro không lưu trữ bất kỳ tệp tin nào trên máy chủ của chúng tôi. Tất cả nội dung được cung cấp bởi các bên thứ ba không liên kết.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Vui lòng liên hệ với nhà cung cấp dịch vụ lưu trữ video video để khiếu nại nội dung.
            </p>
          </div>

        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} <span className="text-white font-bold">CinePro</span>. All rights reserved. 
            <br className="md:hidden"/> Designed for movie lovers.
          </p>
          
          <div className="flex gap-6 text-xs font-bold text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">Điều khoản</Link>
            <Link href="#" className="hover:text-white transition-colors">Bảo mật</Link>
            <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

// --- SUB COMPONENTS CHO GỌN ---

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