import MovieCard from "../../../components/MovieCard";
import Pagination from "../../../components/Pagination";

const API_CONFIG = {
  baseUrl: "https://phimapi.com/v1/api/the-loai",
  imgHost: "https://phimimg.com/",
  revalidate: 3600,
};

async function getMoviesByGenre(slug, page = 1) {
  try {
    const res = await fetch(`${API_CONFIG.baseUrl}/${slug}?page=${page}&limit=24`, {
      next: { revalidate: API_CONFIG.revalidate },
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  return { title: `Phim ${title} - CinePro` };
}

export default async function GenreDetailPage({ params, searchParams }) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const currentPage = Number(search?.page) || 1;
  const data = await getMoviesByGenre(slug, currentPage);

  const movies = data?.data?.items || [];
  const { totalItems = 0, totalItemsPerPage = 24 } = data?.data?.params?.pagination || {};
  const totalPages = Math.max(1, Math.ceil(totalItems / totalItemsPerPage));
  const pageTitle = data?.data?.titlePage || slug.toUpperCase().replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 pt-24">
      {/* Header Section */}
      <header className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">
            KHO PHIM <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">{pageTitle}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">
            Tuyển tập phim {pageTitle} hay nhất
          </p>
        </div>
        <div className="hidden md:block">
          <span className="text-xs text-gray-500 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
            PAGE {currentPage} / {totalPages}
          </span>
        </div>
      </header>

      {/* Movie Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map((movie) => (
          <MovieCard
            key={movie._id}
            movie={{
              ...movie,
              poster_url: movie.poster_url?.startsWith("http")
                ? movie.poster_url
                : `${API_CONFIG.imgHost}${movie.poster_url}`,
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {movies.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-white/5 rounded-lg border border-white/5">
          Chưa có phim nào thuộc thể loại này.
        </div>
      )}

      {/* Pagination Component */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        basePath={`/the-loai/${slug}`} 
      />
    </div>
  );
}