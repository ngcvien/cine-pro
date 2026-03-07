import MovieCard from "../../../components/MovieCard";
import Pagination from "../../../components/Pagination";
import { getMovieData, getImageUrl } from "@/lib/movieService";

const TITLES = {
    "phim-moi-cap-nhat": "PHIM MỚI CẬP NHẬT",
    "phim-le": "PHIM LẺ",
    "phim-bo": "PHIM BỘ",
    "hoat-hinh": "HOẠT HÌNH & ANIME",
    "tv-shows": "CHƯƠNG TRÌNH TV",
    "phim-chieu-rap": "PHIM CHIẾU RẠP",
};

export async function generateMetadata({ params }) {
    const { loai } = await params;  // Format lại tên cho đẹp (ví dụ: viet-nam -> Việt Nam)
    const title = TITLES[loai] || loai.toUpperCase().replace("-", " ");
    return {
        title: `${title} | CinePro`,
        description: `Danh sách phim ${title} mới nhất.`,
    };
}

async function getMoviesByCategory(category, page = 1) {
    if (category === "phim-moi-cap-nhat") {
        return await getMovieData(`/danh-sach/${category}?page=${page}&limit=24`);
    } else {
        return await getMovieData(`/v1/api/danh-sach/${category}?page=${page}&limit=24`);
    }
}

export default async function CategoryPage({ params, searchParams }) {
    const { loai } = await params;
    const search = await searchParams;
    const currentPage = Number(search?.page) || 1;

    const data = await getMoviesByCategory(loai, currentPage);

    let movies = [];
    let totalPages = 1;

    if (loai === "phim-moi-cap-nhat") {
        movies = data?.items || [];
        const pagination = data?.pagination || {};
        totalPages = Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 10));
    } else {
        movies = data?.data?.items || [];
        const pagination = data?.data?.params?.pagination || {};
        totalPages = Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 10));
    }

    if (totalPages < 1) totalPages = 1;

    const title = TITLES[loai] || loai.toUpperCase().replace("-", " ");
    const isAnime = loai === "hoat-hinh";

    if (isAnime) {
        return <AnimePage movies={movies} currentPage={currentPage} totalPages={totalPages} loai={loai} />;
    }

    return (
        <div className="container mx-auto px-4 py-8 md:px-8 pt-24">
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase font-display">
                        KHO <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">{title}</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">
                        Tổng hợp phim chất lượng cao
                    </p>
                </div>
                <div className="hidden md:block text-right">
                    <span className="text-xs text-gray-500 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        PAGE {currentPage} / {totalPages}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie) => (
                    <MovieCard key={movie._id} movie={{ ...movie, poster_url: getImageUrl(movie.poster_url) }} />
                ))}
            </div>

            {movies.length === 0 && (
                <div className="text-center py-20 text-gray-500">Không tìm thấy phim nào.</div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/danh-sach/${loai}`} />
        </div>
    );
}

// ── ANIME THEME PAGE ──
function AnimePage({ movies, currentPage, totalPages, loai }) {
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;700;800;900&family=Zen+Kaku+Gothic+New:wght@900&display=swap');

                .anime-page {
                    font-family: 'Be Vietnam Pro', sans-serif;
                }

                /* Nền anime: gradient tối tím */
                .anime-bg-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(ellipse 70% 50% at 10% 0%, rgba(168,85,247,0.09) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 60% at 90% 80%, rgba(236,72,153,0.07) 0%, transparent 60%),
                        radial-gradient(ellipse 40% 40% at 50% 40%, rgba(99,102,241,0.05) 0%, transparent 70%);
                }

                /* Scanlines */
                .anime-scanlines {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.06) 2px,
                        rgba(0,0,0,0.06) 3px
                    );
                }

                /* Tiêu đề Nhật */
                .anime-jp {
                    font-family: 'Zen Kaku Gothic New', sans-serif;
                    font-weight: 900;
                }

                .anime-title {
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    line-height: 1.0;
                    text-transform: uppercase;
                    background: linear-gradient(135deg, #fff 0%, #e879f9 40%, #a855f7 70%, #818cf8 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                              padding: 0.12em 0 0.12em;

                }

                .anime-card-wrap {
                    position: relative;
                }
                .anime-card-wrap::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, rgba(168,85,247,0.0), rgba(236,72,153,0.0));
                    transition: background 0.3s;
                    z-index: 0;
                    pointer-events: none;
                }
                .anime-card-wrap:hover::before {
                    background: linear-gradient(135deg, rgba(168,85,247,0.5), rgba(236,72,153,0.4));
                }

                .shimmer-bar {
                    background: linear-gradient(90deg, #a855f7, #ec4899, #818cf8, #a855f7);
                    background-size: 300% 100%;
                    animation: shimbar 3s linear infinite;
                    height: 2px;
                    border-radius: 2px;
                }
                @keyframes shimbar {
                    0% { background-position: 0% center; }
                    100% { background-position: 300% center; }
                }

                .tag-anime {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 3px 10px;
                    border-radius: 4px;
                }

                .page-badge {
                    font-size: 11px;
                    font-weight: 700;
                    padding: 5px 14px;
                    border-radius: 6px;
                    background: rgba(168,85,247,0.1);
                    border: 1px solid rgba(168,85,247,0.25);
                    color: #d8b4fe;
                    letter-spacing: 0.05em;
                }

                /* Glow dots trang trí */
                .glow-dot {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(1px);
                }
            `}</style>

            {/* Nền riêng cho anime */}
            <div className="anime-bg-overlay" />
            <div className="anime-scanlines" />

            <div className="anime-page relative z-10 container mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24">

                {/* ── HEADER ── */}
                <div className="relative mb-12 overflow-hidden">

                    {/* Chữ Nhật trang trí phía sau */}
                    <div className="anime-jp absolute -top-4 -left-2 text-[120px] md:text-[180px] text-white/[0.025] select-none pointer-events-none leading-none">
                        アニメ
                    </div>

                    {/* Dot glow trang trí */}
                    <div className="glow-dot" style={{ width: 200, height: 200, top: -60, right: "5%", background: "radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)" }} />
                    <div className="glow-dot" style={{ width: 120, height: 120, top: 20, right: "20%", background: "radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%)" }} />

                    <div className="relative z-10">
                        {/* Label */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="tag-anime bg-purple-500/15 border border-purple-500/30 text-purple-300">
                                ✦ Thế giới anime
                            </span>
                            <span className="tag-anime bg-pink-500/10 border border-pink-500/20 text-pink-300">
                                アニメ・漫画
                            </span>
                        </div>

                        {/* Tiêu đề chính */}
                        <h1 className="anime-title text-5xl md:text-7xl xl:text-8xl mb-3">
                            Anime &<br className="md:hidden" /> Hoạt Hình
                        </h1>

                        <p className="text-gray-400 text-sm font-light tracking-wide max-w-md mt-3 mb-5">
                            Tuyển tập anime, hoạt hình Nhật Bản và thế giới — từ shounen bùng nổ đến slice-of-life lắng đọng.
                        </p>

                        {/* Shimmer bar + page indicator */}
                        <div className="flex items-center gap-4">
                            <div className="shimmer-bar flex-1 max-w-[160px]" />
                            <span className="page-badge">
                                Trang {currentPage} / {totalPages}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── GRID PHIM ── */}
                {movies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                        {movies.map((movie) => (
                            <div key={movie._id} className="anime-card-wrap rounded-[13px]">
                                <div className="relative z-10">
                                    <MovieCard movie={{ ...movie, poster_url: getImageUrl(movie.poster_url) }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <p className="anime-jp text-4xl text-white/10 mb-3">見つからない</p>
                        <p className="text-gray-500 text-sm">Không tìm thấy anime nào.</p>
                    </div>
                )}

                {/* ── PAGINATION ── */}
                <div className="mt-10 relative">
                    {/* Accent trước pagination */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="shimmer-bar w-10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400/60">Chuyển trang</span>
                        <div className="shimmer-bar flex-1" />
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        basePath={`/danh-sach/${loai}`}
                    />
                </div>

            </div>
        </>
    );
}