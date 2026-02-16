import MovieCard from "../../components/MovieCard";

export const dynamic = 'force-dynamic';
import { getMovieData, searchMoviesHybrid } from "@/lib/movieService";

async function searchMovies(keyword) {
  if (!keyword) return null;
  // return await getMovieData(`/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=30`, { cache: "no-store" });
  return await searchMoviesHybrid(keyword);
}

export default async function SearchPage({ searchParams }) {
  const { keyword } = await searchParams;
  const data = await searchMovies(keyword);
  
  const movies = data?.data?.items || [];
  const total = movies.length;

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 m-15">
      <div className="mb-12 border-b border-white/10 pb-6">
        <p className="text-gray-500 text-sm font-mono mb-2">KẾT QUẢ TÌM KIẾM CHO:</p>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
          "{keyword}"
        </h1>
        <p className="text-primary mt-2 font-bold text-lg">
          TÌM THẤY {total} BỘ PHIM
        </p>
      </div>

      {/* Grid kết quả */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard 
                key={movie._id} 
                movie={{
                    ...movie,
                    poster_url: movie.poster_url,
                    slug: movie.slug
                }} 
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-white/5 bg-white/5 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-400 mb-2">KHÔNG TÌM THẤY PHIM NÀO</h2>
          <p className="text-gray-600">Thử tìm bằng từ khóa ngắn gọn hơn (ví dụ: "Mai", "Dao", "Marvel")</p>
        </div>
      )}
    </div>
  );
}