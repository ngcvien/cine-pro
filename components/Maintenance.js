import Link from "next/link";

export default function Maintenance({ 
    title = "Tạm Dừng Để Bảo Trì", 
    message = "Khu vực này đang được nâng cấp hệ thống máy chủ và tối ưu hóa tính năng. Quá trình này sẽ diễn ra trong chốc lát. Vui lòng quay lại sau!" 
}) {
    return (
        <div className="min-h-screen  flex items-center justify-center px-4 font-sans relative overflow-hidden">
            {/* Lớp nền mờ */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#00FF41]/5 to-transparent opacity-50"></div>
            
            <div className="relative z-10 text-center max-w-md">
                {/* Chấm xanh nhấp nháy báo hiệu hệ thống vẫn đang hoạt động ngầm */}
                <div className="flex justify-center mb-6">
                    <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00FF41]"></span>
                    </span>
                </div>

                <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">
                    {title}
                </h1>
                
                <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed">
                    {message}
                </p>

                <Link 
                    href="/" 
                    className="inline-block px-8 py-3 bg-[#111] text-gray-300 border border-white/10 hover:border-[#00FF41]/50 hover:text-white font-bold text-xs uppercase tracking-widest transition-all rounded-md shadow-lg"
                >
                    Quay Về Trang Chủ
                </Link>
            </div>
        </div>
    );
}