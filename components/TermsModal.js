"use client";

import { X, ShieldCheck, ScrollText, AlertTriangle } from "lucide-react";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop (Nền tối mờ) */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <ScrollText size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Điều khoản sử dụng</h2>
                <p className="text-xs text-gray-400">Cập nhật lần cuối: 09/02/2026</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY (Scrollable Content) */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-gray-300 space-y-6 leading-relaxed">
          
          <section>
            <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                1. Giới thiệu chung
            </h3>
            <p>
              Chào mừng bạn đến với <span className="text-primary font-bold">CinePro</span>. Bằng việc truy cập và sử dụng trang web này, bạn đồng ý tuân thủ các Điều khoản và Điều kiện dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ ngay lập tức.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                2. Miễn trừ trách nhiệm nội dung
            </h3>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="flex gap-2 text-yellow-200">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
                    <span>
                        CinePro hoạt động như một công cụ tìm kiếm và tổng hợp nội dung. Chúng tôi <b>không lưu trữ</b> bất kỳ tập tin video nào trên máy chủ của mình. Tất cả nội dung được liên kết từ các nguồn bên thứ ba không thuộc quyền kiểm soát của chúng tôi.
                    </span>
                </p>
            </div>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">3. Quyền sở hữu trí tuệ</h3>
            <p>
              Giao diện, logo, mã nguồn và thiết kế của website thuộc quyền sở hữu của CinePro. Nghiêm cấm mọi hành vi sao chép, chỉnh sửa hoặc phân phối lại mà không có sự đồng ý bằng văn bản.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">4. Trách nhiệm người dùng</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Không sử dụng website vào mục đích vi phạm pháp luật.</li>
                <li>Không can thiệp, phá hoại hệ thống máy chủ hoặc cơ sở dữ liệu.</li>
                <li>Tự chịu trách nhiệm bảo mật tài khoản cá nhân.</li>
                <li>Cư xử văn minh trong các khu vực bình luận/đánh giá.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">5. Thu thập dữ liệu</h3>
            <p>
              Chúng tôi thu thập thông tin cơ bản (Email, Tên hiển thị) thông qua Google/Facebook Login nhằm mục đích:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Lưu trữ lịch sử xem phim và danh sách yêu thích của bạn.</li>
                <li>Đồng bộ hóa trải nghiệm trên nhiều thiết bị.</li>
                <li>Chúng tôi cam kết không chia sẻ dữ liệu này cho bên thứ ba.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">6. Thay đổi điều khoản</h3>
            <p>
              CinePro có quyền thay đổi, chỉnh sửa các điều khoản này bất cứ lúc nào để phù hợp với hoạt động vận hành. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.
            </p>
          </section>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/10 bg-[#0f0f0f] rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Đóng
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold bg-primary text-black hover:bg-green-400 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(74,222,128,0.3)]"
          >
            <ShieldCheck size={18} />
            Tôi đồng ý & Tiếp tục
          </button>
        </div>

      </div>
    </div>
  );
}