import MovieCard from "../components/MovieCard";
import HeroSection from "../components/HeroSection";
import WatchingNow from "../components/WatchingNow";
import ContinueWatching from "../components/ContinueWatching";
import Link from "next/link";

function normalizePosterUrl(movie: any) {
  return {
    ...movie,
    poster_url: movie.poster_url?.startsWith('http') 
      ? movie.poster_url 
      : `https://phimimg.com/${movie.poster_url}`
  };
}

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

async function getSingleMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/phim-le?page=1", {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Single movies error:", error);
    return null;
  }
}

async function getSeriesMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/phim-bo?page=1", {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Series movies error:", error);
    return null;
  }
}

async function getHotMovies() {
  try {
    const res = await fetch("https://phimapi.com/danh-sach/hoat-hinh?page=1", {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Hot movies error:", error);
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
  const [data, featuredMovie, singleMovies, seriesMovies, hotMovies] = await Promise.all([
    getNewMovies(),
    getFeaturedMovie(),
    getSingleMovies(),
    getSeriesMovies(),
    getHotMovies()
  ]);
  
  console.log("Data structure:", {
    movies: data?.items?.length || 0,
    singles: singleMovies?.data?.items?.length || 0,
    series: seriesMovies?.data?.items?.length || 0,
    hots: hotMovies?.items?.length || 0,
  });
  
  const movies = data?.items || [];
  const singles = singleMovies?.data?.items || [];
  const series = seriesMovies?.data?.items || [];
  const hots = hotMovies?.items || [];

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 space-y-16">
      {/* Hero Section */}
      {featuredMovie && <HeroSection featuredMovie={featuredMovie} />}

      {/* Watching Now Section */}
      <WatchingNow />

      {/* Continue Watching Section */}
      <ContinueWatching />

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
              XEM TẤT CẢ
            </span>
          </Link>
        </div>

        {movies.length > 0 ? (
          <div className="-mx-4 px-4 md:-mx-8 md:px-8">
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
              {movies.map((movie: any) => (
                <div key={movie._id} className="flex-shrink-0 w-40 md:w-48 lg:w-56">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">Đang tải dữ liệu hoặc lỗi kết nối...</p>
          </div>
        )}
      </div>

      {/* Single Movies Section */}
      <div>
        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              PHIM <span className="text-primary">LẺ</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 font-mono">
              CÁC BỘ PHIM HOÀN CHỈNH VỚI MỘT TẬP DUY NHẤT.
            </p>
          </div>
          
          <Link href="/danh-sach/phim-le" className="hidden md:block">
            <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-primary transition-colors">
              XEM TẤT CẢ
            </span>
          </Link>
        </div>

        {singles.length > 0 ? (
          <div className="-mx-4 px-4 md:-mx-8 md:px-8">
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
              {singles.map((movie: any) => (
                <div key={movie._id} className="flex-shrink-0 w-40 md:w-48 lg:w-56">
                  <MovieCard movie={normalizePosterUrl(movie)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">Đang tải dữ liệu hoặc lỗi kết nối...</p>
          </div>
        )}
      </div>

      {/* Series Movies Section */}
      <div>
        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              PHIM <span className="text-primary">BỘ</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 font-mono">
              CÁC SERIES PHIM VỚI NHIỀU TẬP LIÊN TIẾP.
            </p>
          </div>
          
          <Link href="/danh-sach/phim-bo" className="hidden md:block">
            <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-primary transition-colors">
              XEM TẤT CẢ
            </span>
          </Link>
        </div>

        {series.length > 0 ? (
          <div className="-mx-4 px-4 md:-mx-8 md:px-8">
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
              {series.map((movie: any) => (
                <div key={movie._id} className="flex-shrink-0 w-40 md:w-48 lg:w-56">
                  <MovieCard movie={normalizePosterUrl(movie)} />
                </div>
              ))}
            </div>
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
