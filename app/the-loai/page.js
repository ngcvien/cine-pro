import Link from "next/link";

// 1. DANH SÁCH THỂ LOẠI CỐ ĐỊNH (Không cần gọi API nữa -> Web nhanh như gió)
const STATIC_CATEGORIES = [
  { name: "Hành Động", slug: "hanh-dong" },
  { name: "Tình Cảm", slug: "tinh-cam" },
  { name: "Hài Hước", slug: "hai-huoc" },
  { name: "Cổ Trang", slug: "co-trang" },
  { name: "Tâm Lý", slug: "tam-ly" },
  { name: "Hình Sự", slug: "hinh-su" },
  { name: "Chiến Tranh", slug: "chien-tranh" },
  { name: "Thể Thao", slug: "the-thao" },
  { name: "Võ Thuật", slug: "vo-thuat" },
  { name: "Viễn Tưởng", slug: "vien-tuong" },
  { name: "Phiêu Lưu", slug: "phieu-luu" },
  { name: "Khoa Học", slug: "khoa-hoc" },
  { name: "Kinh Dị", slug: "kinh-di" },
  { name: "Âm Nhạc", slug: "am-nhac" },
  { name: "Thần Thoại", slug: "than-thoai" },
  { name: "Tài Liệu", slug: "tai-lieu" },
  { name: "Gia Đình", slug: "gia-dinh" },
  { name: "Học Đường", slug: "hoc-duong" },
  { name: "Bí Ẩn", slug: "bi-an" },
  { name: "Kinh Điển", slug: "kinh-dien" },
];

// 2. Metadata giao diện (Mô tả, Màu sắc, Bóng đổ)
const GENRE_METADATA = {
  "hanh-dong": { desc: "Kịch tính • Nghẹt thở", color: "from-red-600 to-orange-600", shadow: "shadow-red-900/20" },
  "tinh-cam": { desc: "Lãng mạn • Sâu lắng", color: "from-pink-500 to-rose-600", shadow: "shadow-pink-900/20" },
  "hai-huoc": { desc: "Giải trí • Vui nhộn", color: "from-yellow-400 to-orange-500", shadow: "shadow-yellow-900/20" },
  "co-trang": { desc: "Sử thi • Hào hùng", color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-900/20" },
  "tam-ly": { desc: "Cảm xúc • Nội tâm", color: "from-purple-500 to-indigo-600", shadow: "shadow-purple-900/20" },
  "hinh-su": { desc: "Phá án • Tội phạm", color: "from-slate-500 to-slate-700", shadow: "shadow-slate-900/20" },
  "chien-tranh": { desc: "Hùng tráng • Bi kịch", color: "from-orange-800 to-red-900", shadow: "shadow-orange-900/20" },
  "the-thao": { desc: "Đam mê • Nhiệt huyết", color: "from-blue-500 to-cyan-600", shadow: "shadow-blue-900/20" },
  "vo-thuat": { desc: "Đấu võ • Đỉnh cao", color: "from-red-700 to-rose-900", shadow: "shadow-red-900/20" },
  "vien-tuong": { desc: "Tương lai • Sci-Fi", color: "from-cyan-500 to-blue-700", shadow: "shadow-cyan-900/20" },
  "phieu-luu": { desc: "Khám phá • Hành trình", color: "from-green-500 to-emerald-700", shadow: "shadow-green-900/20" },
  "khoa-hoc": { desc: "Vũ trụ • Bí ẩn", color: "from-indigo-600 to-violet-800", shadow: "shadow-indigo-900/20" },
  "kinh-di": { desc: "Rùng rợn • Ám ảnh", color: "from-gray-800 to-black", shadow: "shadow-gray-900/20" },
  "am-nhac": { desc: "Giai điệu • Cảm hứng", color: "from-fuchsia-500 to-pink-600", shadow: "shadow-fuchsia-900/20" },
  "than-thoai": { desc: "Huyền bí • Quyền năng", color: "from-amber-500 to-yellow-700", shadow: "shadow-amber-900/20" },
  "tai-lieu": { desc: "Sự thật • Đời sống", color: "from-stone-500 to-stone-700", shadow: "shadow-stone-900/20" },
  "gia-dinh": { desc: "Gắn kết • Yêu thương", color: "from-sky-400 to-blue-500", shadow: "shadow-sky-900/20" },
  "hoc-duong": { desc: "Tuổi trẻ • Tình bạn", color: "from-lime-500 to-green-600", shadow: "shadow-lime-900/20" },
  "bi-an": { desc: "Huyền bí • Hack não", color: "from-violet-600 to-purple-800", shadow: "shadow-violet-900/20" },
  "kinh-dien": { desc: "Bất hủ • Thời gian", color: "from-amber-700 to-yellow-800", shadow: "shadow-amber-900/20" },
};

const DEFAULT_META = { desc: "Tuyển tập đặc sắc", color: "from-gray-700 to-gray-900", shadow: "shadow-gray-900/20" };

export const metadata = {
  title: "Khám Phá Thể Loại - CinePro",
};

export default function CategoriesPage() {
  // Không cần gọi API, dùng luôn biến STATIC_CATEGORIES
  const categories = STATIC_CATEGORIES;

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden pt-28 pb-20">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header Tối giản */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter uppercase">
            DANH MỤC <span className="text-primary">PHIM</span>
          </h1>
          <div className="h-1 w-20 bg-primary mt-4 rounded-full"></div>
        </div>

        {/* GRID STYLE TYPOGRAPHY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categories.map((cat) => {
              const meta = GENRE_METADATA[cat.slug] || DEFAULT_META;

              return (
                <Link 
                  key={cat.slug} 
                  href={`/the-loai/${cat.slug}`}
                  className={`group relative h-36 rounded-xl overflow-hidden bg-[#121212] border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${meta.shadow}`}
                >
                    {/* 1. Hiệu ứng Gradient nền khi hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${meta.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out`} />
                    
                    {/* 2. CHỮ CHÌM KHỔNG LỒ (Watermark) */}
                    <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-20 transition-opacity duration-300 select-none pointer-events-none">
                        <span className="text-7xl font-black uppercase tracking-tighter text-white whitespace-nowrap">
                            {cat.name}
                        </span>
                    </div>

                    {/* 3. Nội dung chính */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                        {/* Tên Thể Loại */}
                        <h3 className="text-2xl font-black text-white uppercase tracking-wider group-hover:translate-x-2 transition-transform duration-300">
                            {cat.name}
                        </h3>
                        
                        {/* Dòng mô tả & Thanh gạch ngang */}
                        <div className="flex items-center gap-3 mt-1 opacity-60 group-hover:opacity-100 group-hover:text-black/80 transition-all duration-300 group-hover:translate-x-2 delay-75">
                            <div className="h-[2px] w-6 bg-primary group-hover:bg-black"></div>
                            <p className="text-xs font-bold uppercase tracking-widest">
                                {meta.desc}
                            </p>
                        </div>
                    </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}