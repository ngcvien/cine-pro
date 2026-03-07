import MovieCard from "../../../components/MovieCard";
import Pagination from "../../../components/Pagination";
import { getMovieData, getAllAPISources } from "@/lib/movieService";

const API_CONFIG = await getAllAPISources();

async function getMoviesByGenre(slug, page = 1) {
  return await getMovieData(`/v1/api/the-loai/${slug}?page=${page}&limit=24`);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getMoviesByGenre(slug);
  const pageTitle = data?.data?.titlePage || slug.toUpperCase().replace(/-/g, " ");
  return { title: `Phim ${pageTitle} - CinePro` };
}

export default async function GenreDetailPage({ params, searchParams }) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const currentPage = Number(search?.page) || 1;
  const data = await getMoviesByGenre(slug, currentPage);

  const movies = data?.data?.items || [];
  const { totalItems = 0, totalItemsPerPage = 24 } = data?.data?.params?.pagination || {};
  const totalPages = Math.max(1, Math.ceil(totalItems / totalItemsPerPage));
  const pageTitle = data?.data?.titlePage || slug.toUpperCase().replace(/-/g, " ");

  const normalizedMovies = movies.map((movie) => ({
    ...movie,
    poster_url: movie.poster_url?.startsWith("http")
      ? movie.poster_url
      : `${API_CONFIG.imageBaseUrl}/${movie.poster_url}`,
  }));

  // ── ROMANCE THEME ──
  if (slug === "tinh-cam") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,700;0,800;0,900;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&display=swap');

          .romance-page { font-family: 'Be Vietnam Pro', sans-serif; }

          /* Ambient nền hồng/đỏ */
          .romance-ambient {
            position: fixed; inset: 0; z-index: 0; pointer-events: none;
            background:
              radial-gradient(ellipse 65% 55% at 0% 0%,   rgba(251,113,133,0.08) 0%, transparent 60%),
              radial-gradient(ellipse 55% 50% at 100% 90%, rgba(244,63,94,0.07)  0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 55% 45%,  rgba(251,207,232,0.04) 0%, transparent 70%);
          }

          /* Hoa văn trái tim mờ */
          .romance-pattern {
            position: fixed; inset: 0; z-index: 0; pointer-events: none;
            opacity: 0.018;
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 42 C20 34 10 28 10 20 C10 14 15 10 20 10 C24 10 28 13 30 16 C32 13 36 10 40 10 C45 10 50 14 50 20 C50 28 40 34 30 42Z' fill='%23f43f5e' /%3E%3C/svg%3E");
            background-size: 60px 60px;
            mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%);
            -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%);
          }

          .romance-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-weight: 900;
            line-height: 1.0;
            background: linear-gradient(135deg, #fff 0%, #fda4af 35%, #fb7185 65%, #e11d48 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .romance-sub {
            font-family: 'Playfair Display', Georgia, serif;
            font-style: italic;
            font-weight: 400;
          }

          .rose-shimmer {
            background: linear-gradient(90deg, #fb7185, #f43f5e, #fda4af, #fb7185);
            background-size: 300% 100%;
            animation: rosebar 4s linear infinite;
            height: 1px;
            border-radius: 1px;
          }
          @keyframes rosebar {
            0%   { background-position: 0% center; }
            100% { background-position: 300% center; }
          }

          .romance-tag {
            font-size: 10px; font-weight: 700;
            letter-spacing: 0.1em; text-transform: uppercase;
            padding: 3px 11px; border-radius: 4px;
          }

          .romance-page-badge {
            font-size: 11px; font-weight: 600;
            padding: 5px 14px; border-radius: 6px;
            background: rgba(244,63,94,0.08);
            border: 1px solid rgba(244,63,94,0.2);
            color: #fda4af;
            letter-spacing: 0.04em;
          }

          /* Hover glow hồng cho card */
          .romance-card-wrap { position: relative; border-radius: 13px; }
          .romance-card-wrap::after {
            content: '';
            position: absolute; inset: -1px; border-radius: 14px;
            background: linear-gradient(135deg, rgba(251,113,133,0), rgba(244,63,94,0));
            transition: background 0.35s; z-index: 0; pointer-events: none;
          }
          .romance-card-wrap:hover::after {
            background: linear-gradient(135deg, rgba(251,113,133,0.45), rgba(244,63,94,0.35));
          }

          /* Quote mark trang trí */
          .romance-quote {
            font-family: 'Playfair Display', serif;
            font-size: 7rem;
            line-height: 1;
            color: rgba(251,113,133,0.08);
            pointer-events: none;
            select: none;
            font-style: italic;
          }
        `}</style>

        <div className="romance-ambient" />
        <div className="romance-pattern" />

        <div className="romance-page relative z-10 container mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24">

          {/* ── HEADER ── */}
          <div className="relative mb-14 overflow-hidden">

            {/* Quote mark trang trí */}
            <div className="romance-quote absolute -top-6 -left-3 select-none pointer-events-none">"</div>

            {/* Glow orbs nhỏ */}
            <div className="absolute top-0 right-8 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(251,113,133,0.12), transparent 70%)", filter: "blur(20px)" }} />
            <div className="absolute bottom-0 right-32 w-24 h-24 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(244,63,94,0.1), transparent 70%)", filter: "blur(15px)" }} />

            <div className="relative z-10 max-w-2xl">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="romance-tag bg-rose-500/10 border border-rose-500/25 text-rose-300">
                  ♥ Tình cảm
                </span>
                <span className="romance-tag bg-pink-500/8 border border-pink-400/18 text-pink-300/80">
                  Lãng mạn · Cảm xúc
                </span>
                <span className="romance-tag bg-white/4 border border-white/8 text-gray-400">
                  Romance · Drama
                </span>
              </div>

              {/* Tiêu đề */}
              <h1 className="romance-title text-5xl md:text-7xl xl:text-8xl mb-3">
                Phim<br />Tình Cảm
              </h1>

              {/* Tagline italic */}
              <p className="romance-sub text-lg md:text-xl text-rose-200/60 mt-3 mb-2">
                "Những câu chuyện chạm đến trái tim"
              </p>
              <p className="text-gray-400/80 text-sm font-light leading-relaxed max-w-lg">
                Tuyển tập phim tình cảm hay nhất — từ những mối tình lãng mạn ngọt ngào đến bi kịch cảm xúc sâu lắng, đong đầy yêu thương.
              </p>

              {/* Shimmer + page badge */}
              <div className="flex items-center gap-4 mt-6">
                <div className="rose-shimmer flex-1 max-w-[120px]" />
                <div className="rose-shimmer flex-1 max-w-[40px]" style={{ opacity: 0.5 }} />
                <span className="romance-page-badge">
                  Trang {currentPage} / {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* ── GRID PHIM ── */}
          {normalizedMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {normalizedMovies.map((movie) => (
                <div key={movie._id} className="romance-card-wrap">
                  <div className="relative z-10">
                    <MovieCard movie={movie} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="romance-title text-4xl opacity-20 mb-3">Chưa có phim</p>
              <p className="text-gray-500 text-sm font-light">Chưa có phim nào thuộc thể loại này.</p>
            </div>
          )}

          {/* ── PAGINATION ── */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="rose-shimmer w-8" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400/50">Chuyển trang</span>
              <div className="rose-shimmer flex-1" />
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/the-loai/${slug}`} />
          </div>

        </div>
      </>
    );
  }

  // ── DEFAULT THEME ──
  return (
    <div className="container mx-auto px-4 py-8 md:px-8 pt-24">
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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {normalizedMovies.map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>

      {normalizedMovies.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-white/5 rounded-lg border border-white/5">
          Chưa có phim nào thuộc thể loại này.
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/the-loai/${slug}`} />
    </div>
  );
}