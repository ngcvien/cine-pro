"use client";
import Link from "next/link";

export default function Catalog({ title, data, currentPage, basePath }) {
  // 1. Xử lý dữ liệu an toàn
  const movies = data?.items || [];
  const pagination = data?.params?.pagination || {};
  const totalItems = pagination.totalItems || 0;
  const totalItemsPerPage = pagination.totalItemsPerPage || 10;
  
  // Tính tổng số trang (vì API đôi khi trả về totalPages, đôi khi không)
  const totalPages = Math.ceil(totalItems / totalItemsPerPage) || 1;

  // 2. Hàm xử lý link ảnh (API phimimg trả về đường dẫn tương đối)
  const getPoster = (url) => {
    if (!url) return "https://via.placeholder.com/300x450?text=No+Image";
    return url.includes("http") ? url : `https://phimimg.com/${url}`;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* --- HEADER --- */}
        <div className="mb-8 border-l-4 border-primary pl-4">
          <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-wide">
            {title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Trang {currentPage} / {totalPages}
          </p>
        </div>

        {/* --- MOVIE GRID --- */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <Link key={movie._id} href={`/phim/${movie.slug}`} className="group relative block">
                <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 group-hover:border-primary transition-all duration-300 relative shadow-lg bg-surface">
                  {/* Ảnh Poster */}
                  <img
                    src={getPoster(movie.poster_url)}
                    alt={movie.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Overlay đen mờ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  
                  {/* Năm phát hành (Góc trên phải) */}
                  <div className="absolute top-2 right-2">
                      <span className="bg-primary text-black text-[10px] font-bold px-2 py-1 rounded shadow-md">
                          {movie.year}
                      </span>
                  </div>
                  
                  {/* Tên phim (Góc dưới) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                       <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {movie.name}
                       </h3>
                       <p className="text-gray-400 text-xs mt-1 truncate">
                          {movie.origin_name}
                       </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface/30 rounded-lg border border-white/5">
              <p className="text-gray-500">Chưa có dữ liệu cho mục này.</p>
          </div>
        )}

        {/* --- PAGINATION (PHÂN TRANG) --- */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-3">
            {/* Nút Trước */}
            {currentPage > 1 ? (
              <Link href={`${basePath}?page=${currentPage - 1}`}>
                <button className="px-5 py-2.5 bg-surface border border-white/10 rounded-lg hover:bg-primary hover:text-black transition-all text-sm font-bold">
                  ❮ Trước
                </button>
              </Link>
            ) : (
              <button disabled className="px-5 py-2.5 bg-white/5 text-gray-600 rounded-lg text-sm font-bold cursor-not-allowed">
                ❮ Trước
              </button>
            )}

            {/* Số trang */}
            <span className="px-4 py-2 bg-primary text-black font-black rounded-lg text-sm shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              {currentPage}
            </span>

            {/* Nút Sau */}
            {currentPage < totalPages ? (
              <Link href={`${basePath}?page=${currentPage + 1}`}>
                <button className="px-5 py-2.5 bg-surface border border-white/10 rounded-lg hover:bg-primary hover:text-black transition-all text-sm font-bold">
                  Sau ❯
                </button>
              </Link>
            ) : (
              <button disabled className="px-5 py-2.5 bg-white/5 text-gray-600 rounded-lg text-sm font-bold cursor-not-allowed">
                Sau ❯
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}