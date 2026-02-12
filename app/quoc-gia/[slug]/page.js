import MovieCard from "../../../components/MovieCard";
import Pagination from "../../../components/Pagination";
import { Star } from "lucide-react";
import { getMovieData } from "@/lib/movieService";

// Hàm lấy dữ liệu từ API
async function getMoviesByCountry(slug, page = 1) {
    return await getMovieData(`/v1/api/quoc-gia/${slug}?limit=24&page=${page}`);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  // Format lại tên cho đẹp (ví dụ: viet-nam -> Việt Nam)
  const title = slug === 'viet-nam' ? 'Phim Việt Nam' : `Phim Quốc Gia ${slug}`;
  return {
    title: `${title} | CinePro`,
    description: `Danh sách phim ${title} mới nhất.`,
  };
}

export default async function CountryPage({ params, searchParams }) {
  const { slug } = await params;
  const page = (await searchParams)?.page || 1;

  const data = await getMoviesByCountry(slug, page);

  if (!data || !data.data || !data.data.items) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Không tìm thấy phim cho quốc gia này.
      </div>
    );
  }

  const movies = data.data.items;
  const pagination = data.data.params.pagination;
  const title = data.data.titlePage || slug;

  // --- LOGIC THEME VIỆT NAM ---
  const isVietnam = slug === 'viet-nam';

  // Cấu hình màu sắc dựa trên quốc gia
  const theme = isVietnam ? {
    // Theme Cờ Đỏ Sao Vàng
    wrapper: "bg-gradient-to-b from-[#da251d] via-[#a81612] to-[#4a0806]", // Nền đỏ chuyển sắc
    textTitle: "text-[#FFFF00] drop-shadow-[0_2px_4px_rgba(100,0,0,0.5)]", // Chữ vàng
    textSub: "text-yellow-200",
    border: "border-[#FFFF00]/30",
    iconColor: "#FFFF00",
    cardHover: "hover:shadow-[0_0_20px_rgba(255,255,0,0.5)] hover:border-[#FFFF00]", // Hover phát sáng vàng
    starOverlay: true // Bật lớp phủ ngôi sao mờ
  } : {
    // Theme Mặc định (Dark)
    wrapper: "bg-[#050505]",
    textTitle: "text-white",
    textSub: "text-gray-400",
    border: "border-white/10",
    iconColor: "#4ade80", // Màu primary xanh mặc định
    cardHover: "",
    starOverlay: false
  };

  return (
    <div className={`min-h-screen pt-24 pb-20 font-sans relative overflow-hidden transition-colors duration-500 ${theme.wrapper}`}>

      {/* --- HIỆU ỨNG NGÔI SAO CHÌM CHO VIỆT NAM --- */}
      {theme.starOverlay && (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {/* Ngôi sao lớn giữa màn hình */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Star size={600} fill="#FFFF00" stroke="none" />
          </div>
          {/* Các ngôi sao nhỏ rải rác (pattern) */}
          <div className="absolute top-10 left-10"><Star size={40} fill="#FFFF00" stroke="none" /></div>
          <div className="absolute bottom-20 right-20"><Star size={60} fill="#FFFF00" stroke="none" /></div>
          <div className="absolute top-40 right-10"><Star size={30} fill="#FFFF00" stroke="none" /></div>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-8 relative z-10">

        {/* HEADER */}
        <div className={`mb-10 border-b pb-6 flex items-end justify-between ${theme.border}`}>
          <div>
            <h1 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-3 ${theme.textTitle}`}>
              {isVietnam && <Star size={40} fill={theme.iconColor} stroke="none" className="animate-pulse" />}

              <span >
                PHIM
              </span>
              {title}
            </h1>
            <p className={`mt-2 font-mono text-sm uppercase tracking-widest ${theme.textSub}`}>
              {isVietnam ? "Tự hào điện ảnh Việt" : "Khám phá điện ảnh thế giới"}
            </p>
          </div>
        </div>

        {/* MOVIE GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className={`transition-all duration-300 rounded-xl overflow-hidden ${theme.cardHover}`}
            >
              {/* Truyền custom class vào MovieCard nếu cần, hoặc bọc ngoài như này */}
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="mt-12">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(pagination.totalItems / pagination.totalItemsPerPage)}
            basePath={`/quoc-gia/${slug}`}
          />
        </div>
      </div>
    </div>
  );
}