import MovieCard from "../../../components/MovieCard";
import Pagination from "../../../components/Pagination";
import { getMovieData } from "@/lib/movieService";

async function getMoviesByCountry(slug, page = 1) {
  return await getMovieData(`/v1/api/quoc-gia/${slug}?limit=24&page=${page}`);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getMoviesByCountry(slug);

  const title = `Phim ${data.data.titlePage || slug}`;
  return {
    title: `${title} | CinePro`,
    description: `Danh sách phim ${title} mới nhất.`,
  };
}

export default async function CountryPage({ params, searchParams }) {
  const { slug } = await params;
  const page = (await searchParams)?.page || 1;

  const data = await getMoviesByCountry(slug, page);

  if (!data?.data?.items) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Không tìm thấy phim cho quốc gia này.
      </div>
    );
  }

  const movies = data.data.items;
  const pagination = data.data.params.pagination;
  const title = data.data.titlePage || slug;
  const totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);

  if (slug === 'viet-nam') {
    return <VietnamPage movies={movies} currentPage={Number(page)} totalPages={totalPages} title={title} />;
  }

  // ── DEFAULT THEME ──
  return (
    <div className="min-h-screen pt-24 pb-20 font-sans">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 border-b border-white/10 pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
              PHIM <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">{title}</span>
            </h1>
            <p className="mt-2 text-gray-400 text-sm font-mono uppercase tracking-widest">Khám phá điện ảnh thế giới</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => <MovieCard key={movie._id} movie={movie} />)}
        </div>
        <div className="mt-12">
          <Pagination currentPage={Number(page)} totalPages={totalPages} basePath={`/quoc-gia/${slug}`} />
        </div>
      </div>
    </div>
  );
}

// ── VIETNAM THEME COMPONENT ──
function VietnamPage({ movies, currentPage, totalPages, title }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,700;0,800;0,900;1,400&display=swap');

        .vn-page { font-family: 'Be Vietnam Pro', sans-serif; }

        /* ── Nền đỏ thắm phân lớp ── */
        .vn-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: #0a0101;
        }
        .vn-bg-red {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(218,37,29,0.22) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 0%  80%,  rgba(160,20,10,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 100% 30%, rgba(218,37,29,0.08) 0%, transparent 60%);
        }

        /* ── Ngôi sao vàng to giữa nền ── */
        .vn-star-bg {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -55%);
          width: min(70vw, 600px);
          height: min(70vw, 600px);
          pointer-events: none; z-index: 0;
          opacity: 0.028;
          background: url("data:image/svg+xml,%3Csvg viewBox='-1 -1 2 2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='0,-0.95 0.224,-0.309 0.902,-0.309 0.363,0.118 0.559,0.757 0,0.382 -0.559,0.757 -0.363,0.118 -0.902,-0.309 -0.224,-0.309' fill='%23FFDD00'/%3E%3C/svg%3E") center/contain no-repeat;
          filter: blur(4px);
        }

        /* ── Grid gạch chéo mờ ── */
        .vn-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            repeating-linear-gradient(45deg,  rgba(218,37,29,0.025) 0px, rgba(218,37,29,0.025) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(-45deg, rgba(218,37,29,0.015) 0px, rgba(218,37,29,0.015) 1px, transparent 1px, transparent 40px);
          mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 80%);
        }

        /* ── Vignette cạnh ── */
        .vn-vignette {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%);
        }

        /* ── Noise ── */
        .vn-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px; mix-blend-mode: overlay;
        }

        /* ── Tiêu đề ── */
        .vn-title {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.05;
          text-transform: uppercase;
          overflow: visible;
          padding-top: 0.08em;
        }

        /* ── Shimmer vàng ── */
        .vn-shimmer {
          background: linear-gradient(90deg, #da251d, #FFDD00, #da251d, #FFDD00);
          background-size: 300% 100%;
          animation: vnbar 4s linear infinite;
          height: 2px; border-radius: 1px;
        }
        @keyframes vnbar {
          0%   { background-position: 0% center; }
          100% { background-position: 300% center; }
        }

        /* ── Tag pills ── */
        .vn-tag {
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 11px; border-radius: 3px;
        }

        /* ── Ngôi sao inline ── */
        .vn-star-inline {
          display: inline-block;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          background: #FFDD00;
          flex-shrink: 0;
        }

        /* ── Card hover đỏ-vàng ── */
        .vn-card-wrap { position: relative; border-radius: 13px; overflow: hidden; }
        .vn-card-wrap::after {
          content: '';
          position: absolute; inset: -1px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(218,37,29,0), rgba(255,221,0,0));
          transition: background 0.35s; z-index: 0; pointer-events: none;
        }
        .vn-card-wrap:hover::after {
          background: linear-gradient(135deg, rgba(218,37,29,0.5), rgba(255,221,0,0.4));
        }

        /* ── Divider đỏ ── */
        .vn-divider {
          width: 3px; border-radius: 2px; flex-shrink: 0;
          background: linear-gradient(to bottom, #da251d, #FFDD00, transparent);
        }

        /* ── Số đếm phim badge ── */
        .vn-badge {
          font-size: 11px; font-weight: 700;
          padding: 5px 14px; border-radius: 4px;
          background: rgba(218,37,29,0.12);
          border: 1px solid rgba(218,37,29,0.3);
          color: #fca5a5;
          letter-spacing: 0.04em;
        }

        /* ── Cờ mini trang trí ── */
        .vn-flag-mini {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 20px; border-radius: 3px;
          background: #da251d; position: relative; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(218,37,29,0.4);
        }
        .vn-flag-mini::after {
          content: '★';
          color: #FFDD00; font-size: 11px; line-height: 1;
        }
      `}</style>

      {/* Layers nền */}
      <div className="vn-bg" />
      <div className="vn-bg-red" />
      <div className="vn-star-bg" />
      <div className="vn-grid" />
      <div className="vn-vignette" />
      <div className="vn-noise" />

      <div className="vn-page relative z-10 container mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24">

        {/* ── HEADER ── */}
        <div className="relative mb-14 overflow-hidden">

          {/* Chữ nền trang trí */}
          <div className="absolute -top-6 -right-4 text-[100px] md:text-[160px] font-black uppercase text-red-900/10 select-none pointer-events-none leading-none tracking-tighter">
            VIET NAM
          </div>

          <div className="relative z-10 max-w-3xl">

            {/* Tags + cờ */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <div className="vn-flag-mini" />
              <span className="vn-tag bg-red-900/30 border border-red-700/30 text-red-300">
                🇻🇳 Điện ảnh Việt
              </span>
              <span className="vn-tag bg-yellow-500/8 border border-yellow-500/20 text-yellow-300/80">
                Tự hào · Hào hùng
              </span>
            </div>

            {/* Tiêu đề chính */}
            <div className="flex items-start gap-4 mb-3">
              <div className="vn-divider h-16 md:h-20 mt-1" />
              <div>
                <div className="vn-title text-6xl md:text-8xl xl:text-9xl" style={{
                  background: "linear-gradient(160deg, #fff 0%, #fca5a5 30%, #da251d 60%, #9b1c1c 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Phim
                </div>
                <div className="vn-title text-6xl md:text-8xl xl:text-9xl" style={{
                  background: "linear-gradient(135deg, #FFDD00 0%, #fbbf24 40%, #f59e0b 70%, #d97706 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Việt Nam
                </div>
              </div>
            </div>

            <p className="text-red-200/60 text-sm font-light leading-relaxed max-w-lg ml-8 md:ml-9 italic">
              "Tuyển tập những bộ phim Việt hay nhất — từ điện ảnh chiến tranh hào hùng đến tình cảm gia đình đậm chất quê hương."
            </p>

            {/* Shimmer + badge */}
            <div className="flex items-center gap-4 mt-6 ml-8 md:ml-9">
              <div className="vn-shimmer w-12" />
              <div className="vn-shimmer flex-1 max-w-[60px]" style={{ opacity: 0.4 }} />
              <span className="vn-badge">
                Trang {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* ── GRID PHIM ── */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {movies.map((movie) => (
              <div key={movie._id} className="vn-card-wrap">
                <div className="relative z-10">
                  <MovieCard movie={movie} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="vn-star-inline w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-red-300/40 text-sm">Chưa có phim nào.</p>
          </div>
        )}

        {/* ── PAGINATION ── */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="vn-shimmer w-8" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/50">Chuyển trang</span>
            <div className="vn-shimmer flex-1" />
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/quoc-gia/viet-nam" />
        </div>

      </div>
    </>
  );
}