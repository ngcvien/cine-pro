import Link from "next/link";
import { ShieldCheck, AlertTriangle, ScrollText, Eye, Lock, RefreshCw, UserCheck, BookOpen } from "lucide-react";

export const metadata = {
  title: "Điều Khoản Sử Dụng - CinePro",
  description: "Điều khoản và điều kiện sử dụng dịch vụ CinePro",
};

const sections = [
  {
    id: 1,
    icon: BookOpen,
    title: "Giới thiệu chung",
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/15",
    content: (
      <p>
        Chào mừng bạn đến với <span className="text-primary font-bold">CinePro</span>. Bằng việc truy cập và sử dụng trang web này, bạn đồng ý tuân thủ các Điều khoản và Điều kiện dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ ngay lập tức.
      </p>
    ),
  },
  {
    id: 2,
    icon: AlertTriangle,
    title: "Miễn trừ trách nhiệm nội dung",
    color: "text-yellow-400",
    bg: "bg-yellow-500/8",
    border: "border-yellow-500/15",
    content: (
      <div className="bg-yellow-500/8 border border-yellow-500/20 p-4 rounded-xl">
        <p className="flex gap-3 text-yellow-200/90 leading-relaxed">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-yellow-400" />
          <span>
            CinePro hoạt động như một công cụ tìm kiếm và tổng hợp nội dung. Chúng tôi{" "}
            <strong className="text-yellow-300">không lưu trữ</strong> bất kỳ tập tin video nào trên máy chủ của mình. Tất cả nội dung được liên kết từ các nguồn bên thứ ba không thuộc quyền kiểm soát của chúng tôi.
          </span>
        </p>
      </div>
    ),
  },
  {
    id: 3,
    icon: Eye,
    title: "Quyền sở hữu trí tuệ",
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/15",
    content: (
      <p>
        Giao diện, logo, mã nguồn và thiết kế của website thuộc quyền sở hữu của CinePro. Nghiêm cấm mọi hành vi sao chép, chỉnh sửa hoặc phân phối lại mà không có sự đồng ý bằng văn bản.
      </p>
    ),
  },
  {
    id: 4,
    icon: UserCheck,
    title: "Trách nhiệm người dùng",
    color: "text-purple-400",
    bg: "bg-purple-500/8",
    border: "border-purple-500/15",
    content: (
      <ul className="space-y-2.5">
        {[
          "Không sử dụng website vào mục đích vi phạm pháp luật.",
          "Không can thiệp, phá hoại hệ thống máy chủ hoặc cơ sở dữ liệu.",
          "Tự chịu trách nhiệm bảo mật tài khoản cá nhân.",
          "Cư xử văn minh trong các khu vực bình luận và đánh giá.",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-purple-400">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 5,
    icon: Lock,
    title: "Thu thập dữ liệu",
    color: "text-cyan-400",
    bg: "bg-cyan-500/8",
    border: "border-cyan-500/15",
    content: (
      <>
        <p className="mb-3">
          Chúng tôi thu thập thông tin cơ bản (Email, Tên hiển thị) thông qua Google/Facebook Login nhằm mục đích:
        </p>
        <ul className="space-y-2.5">
          {[
            "Lưu trữ lịch sử xem phim và danh sách yêu thích của bạn.",
            "Đồng bộ hóa trải nghiệm trên nhiều thiết bị.",
            "Chúng tôi cam kết không chia sẻ dữ liệu này cho bên thứ ba.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 6,
    icon: RefreshCw,
    title: "Thay đổi điều khoản",
    color: "text-orange-400",
    bg: "bg-orange-500/8",
    border: "border-orange-500/15",
    content: (
      <p>
        CinePro có quyền thay đổi, chỉnh sửa các điều khoản này bất cứ lúc nào để phù hợp với hoạt động vận hành. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.
      </p>
    ),
  },
];

export default function DieuKhoanPage() {
  return (
    <div className="min-h-screen text-white pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
        .terms-page { font-family: 'Be Vietnam Pro', sans-serif; }
        .terms-title {
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.0;
          text-transform: uppercase;
        }
        .section-card {
          position: relative;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .section-card:hover {
          transform: translateY(-2px);
        }
        .toc-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #9ca3af;
          transition: all 0.2s;
          text-decoration: none;
          border: 1px solid transparent;
        }
        .toc-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
        }
        .toc-num {
          font-size: 10px;
          font-weight: 800;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      <div className="terms-page relative z-10 container mx-auto px-4 md:px-8 pt-20 md:pt-28">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-10 tracking-wide">
          <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-300">Điều khoản sử dụng</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">

          {/* ── NỘI DUNG CHÍNH ── */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-primary/15 rounded-xl border border-primary/25">
                  <ScrollText size={22} className="text-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 border border-white/10 px-3 py-1 rounded-full bg-white/3">
                  Cập nhật: 09/02/2026
                </span>
              </div>

              <h1 className="terms-title text-4xl md:text-6xl text-white mb-4">
                Điều khoản<br />
                <span className="text-primary">sử dụng</span>
              </h1>
              <p className="text-gray-400 text-base leading-relaxed max-w-xl font-light">
                Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ. Việc tiếp tục truy cập đồng nghĩa với việc bạn chấp nhận toàn bộ nội dung bên dưới.
              </p>
              {/* Accent line */}
              <div className="mt-6 h-px w-full bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />
            </div>

            {/* Sections */}
            <div className="space-y-5">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    id={`section-${s.id}`}
                    className={`section-card rounded-2xl border ${s.border} ${s.bg} p-6 md:p-7`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-black/30 border ${s.border}`}>
                        <Icon size={16} className={s.color} />
                      </div>
                      <h2 className="font-bold text-white text-base tracking-wide">
                        <span className={`${s.color} mr-1.5 font-black`}>{s.id}.</span>
                        {s.title}
                      </h2>
                    </div>
                    <div className="text-sm text-gray-300/90 leading-relaxed pl-1">
                      {s.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agree CTA */}
            <div className="mt-10 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/3 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <p className="font-bold text-white text-base mb-1">Bạn đồng ý với các điều khoản?</p>
                <p className="text-sm text-gray-400 font-light">Quay lại trang chủ và bắt đầu trải nghiệm CinePro.</p>
              </div>
              <Link
                href="/"
                className="flex-shrink-0 flex items-center gap-2 bg-primary hover:bg-green-300 text-black font-black px-6 py-3 rounded-xl text-sm transition-colors shadow-[0_0_24px_rgba(74,222,128,0.3)]"
              >
                <ShieldCheck size={17} />
                Đồng ý & Về trang chủ
              </Link>
            </div>
          </div>

          {/* ── TOC SIDEBAR (Desktop) ── */}
          <aside className="hidden lg:block w-[220px] xl:w-[240px] flex-shrink-0 sticky top-24">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 px-3 mb-3">
                Mục lục
              </p>
              <nav className="space-y-0.5">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a key={s.id} href={`#section-${s.id}`} className="toc-link">
                      <span className={`toc-num ${s.bg} ${s.color} border ${s.border}`}>
                        {s.id}
                      </span>
                      {s.title}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-4 pt-4 border-t border-white/8">
                <Link
                  href="/"
                  className="toc-link text-primary hover:text-primary hover:bg-primary/8 border-transparent hover:border-primary/20 font-semibold"
                  style={{ color: "inherit" }}
                >
                  <ShieldCheck size={14} className="text-primary" />
                  <span className="text-primary">Đồng ý & Về trang chủ</span>
                </Link>
              </div>
            </div>

            {/* Last updated card */}
            <div className="mt-3 bg-white/2 border border-white/6 rounded-xl px-4 py-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Phiên bản</p>
              <p className="text-xs text-gray-300 font-medium">09/02/2026</p>
              <p className="text-[11px] text-gray-500 mt-1 font-light">CinePro · Tất cả quyền được bảo lưu.</p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}