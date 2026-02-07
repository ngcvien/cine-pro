import MovieCard from "../components/MovieCard";
import HeroSection from "../components/HeroSection";
import WatchingNow from "../components/WatchingNow";
import ContinueWatching from "../components/ContinueWatching";
import Link from "next/link";

// Hàm chuẩn hóa URL ảnh (để tránh lỗi ảnh 404)
function normalizePosterUrl(movie: any) {
  return {
    ...movie,
    poster_url: movie.poster_url?.startsWith('http') 
      ? movie.poster_url 
      : `https://phimimg.com/${movie.poster_url}`,
    thumb_url: movie.thumb_url?.startsWith('http')
      ? movie.thumb_url
      : `https://phimimg.com/${movie.thumb_url}`
  };
}

// 1. Lấy Phim Mới (Dùng cho Hero Section + List Phim Mới)
async function getNewMovies() {
  try {
    const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1", {
      next: { revalidate: 60 }, 
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch (error) {
    return null;
  }
}

// 2. Lấy Phim Lẻ
async function getSingleMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/phim-le?page=1", {
      next: { revalidate: 3600 }, // Cache lâu hơn chút (1 tiếng)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// 3. Lấy Phim Bộ
async function getSeriesMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/phim-bo?page=1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// 4. Lấy Hoạt Hình
async function getCartoonMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function Home() {
  // Gọi song song tất cả API để tiết kiệm thời gian
  const [newData, singleData, seriesData, cartoonData] = await Promise.all([
    getNewMovies(),
    getSingleMovies(),
    getSeriesMovies(),
    getCartoonMovies()
  ]);
  
  // Chuẩn hóa dữ liệu
  const newMovies = newData?.items?.map(normalizePosterUrl) || [];
  const singleMovies = singleData?.data?.items?.map(normalizePosterUrl) || [];
  const seriesMovies = seriesData?.data?.items?.map(normalizePosterUrl) || [];
  const cartoonMovies = cartoonData?.data?.items?.map(normalizePosterUrl) || [];

  return (
    <div className="container mx-auto px-4 md:px-1 space-y-16 pb-20">
      
      {/* 1. HERO SECTION (Truyền toàn bộ danh sách phim mới vào để chạy Slide) */}
      {newMovies.length > 0 && <HeroSection movies={newMovies} />}

      {/* 2. WATCHING NOW (Phim đang xem - Client Component) */}
      <WatchingNow />

      {/* 3. CONTINUE WATCHING (Tiếp tục xem - Client Component) */}
      <ContinueWatching />

      {/* 4. PHIM MỚI CẬP NHẬT */}
      <MovieSection 
        title="PHIM MỚI" 
        subtitle="CẬP NHẬT" 
        description="DANH SÁCH CÁC BỘ PHIM VỪA ĐƯỢC THÊM VÀO HỆ THỐNG."
        link="/danh-sach/phim-moi-cap-nhat"
        movies={newMovies}
      />

      {/* 5. PHIM LẺ */}
      <MovieSection 
        title="PHIM" 
        subtitle="LẺ" 
        description="CÁC BỘ PHIM ĐIỆN ẢNH HẤP DẪN NHẤT."
        link="/danh-sach/phim-le"
        movies={singleMovies}
      />

      {/* 6. PHIM BỘ */}
      <MovieSection 
        title="PHIM" 
        subtitle="BỘ" 
        description="CÁC SERIES PHIM DÀI TẬP ĐÌNH ĐÁM."
        link="/danh-sach/phim-bo"
        movies={seriesMovies}
      />

       {/* 7. HOẠT HÌNH */}
       <MovieSection 
        title="HOẠT" 
        subtitle="HÌNH" 
        description="THẾ GIỚI ANIME VÀ HOẠT HÌNH ĐẶC SẮC."
        link="/danh-sach/hoat-hinh"
        movies={cartoonMovies}
      />
      
    </div>
  );
}

// --- Component phụ để tái sử dụng giao diện Section ---
function MovieSection({ title, subtitle, description, link, movies }: any) {
    if (!movies || movies.length === 0) return null;

    return (
        <div>
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
                <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                    {title} <span className="text-primary">{subtitle}</span>
                </h2>
                <p className="text-gray-500 text-[10px] md:text-sm mt-2 font-mono uppercase tracking-widest">
                    {description}
                </p>
                </div>
                
                <Link href={link} className="hidden md:block group">
                <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors flex items-center gap-1">
                    XEM TẤT CẢ <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                </Link>
            </div>

            <div className="-mx-4 px-4 md:-mx-8 md:px-8">
                {/* Thanh cuộn ngang ẩn scrollbar */}
                <div className="flex gap-4 overflow-x-auto pb-8 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {movies.map((movie: any) => (
                        <div key={movie._id} className="flex-shrink-0 w-[160px] md:w-[200px]">
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}