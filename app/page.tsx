import MovieCard from "../components/MovieCard";

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

export default async function Home() {
  const data = await getNewMovies();
  const movies = data?.items || [];

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            PHIM MỚI <span className="text-primary">CẬP NHẬT</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base mt-2 font-mono">
            DANH SÁCH CÁC BỘ PHIM VỪA ĐƯỢC THÊM VÀO HỆ THỐNG.
          </p>
        </div>
        
        <div className="hidden md:block">
            <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-white transition-colors">
                XEM TẤT CẢ ///
            </span>
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">Đang tải dữ liệu hoặc lỗi kết nối...</p>
        </div>
      )}
    </div>
  );
}