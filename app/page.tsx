import MovieCard from "../components/MovieCard";
import HeroSection from "../components/HeroSection";
import WatchingNow from "../components/WatchingNow";
import Link from "next/link";

async function getNewMovies() {
  try {
    const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1", {
      next: { revalidate: 60 }, 
    });
    
    if (!res.ok) {
      throw new Error("Không thể tải danh sách phim");
    }
    
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getFeaturedMovie() {
  try {
    const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1", {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      throw new Error("Không thể tải phim nổi bật");
    }
    
    const data = await res.json();
    return data?.items?.[0] || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function Home() {
  const [data, featuredMovie] = await Promise.all([
    getNewMovies(),
    getFeaturedMovie()
  ]);
  
  const movies = data?.items || [];

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 space-y-16">
      {/* Hero Section */}
      {featuredMovie && <HeroSection featuredMovie={featuredMovie} />}

      {/* Watching Now Section */}
      <WatchingNow />

      {/* New Movies Section */}
      <div>
        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              PHIM MỚI <span className="text-primary">CẬP NHẬT</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 font-mono">
              DANH SÁCH CÁC BỘ PHIM VỪA ĐƯỢC THÊM VÀO HỆ THỐNG.
            </p>
          </div>
          
          <Link href="/danh-sach/phim-moi-cap-nhat" className="hidden md:block">
            <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-primary transition-colors">
              XEM TẤT CẢ ///
            </span>
          </Link>
        </div>

        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {movies.map((movie: any) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">Đang tải dữ liệu hoặc lỗi kết nối...</p>
          </div>
        )}
      </div>
    </div>
  );
}
