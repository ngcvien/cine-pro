import Link from "next/link";
import { notFound } from "next/navigation";
import ActorList from "../../../components/ActorList";
import WatchLaterButton from "../../../components/WatchLaterButton";
import { getMovieData, getImageUrl } from "@/lib/movieService";

async function getMovieDetail(slug) {
    return await getMovieData(`/phim/${slug}`);
}

async function getRelatedMovies(categorySlug) {
    if (!categorySlug) return [];
    const data = await getMovieData(`v1/api/the-loai/${categorySlug}?limit=5`);
    return data?.data?.items || [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getMovieDetail(slug);
    if (!data?.movie) return { title: "Chi tiết phim" };
    return {
        title: `${data.movie.name} (${data.movie.year}) - CinePro`,
        description: data.movie.content,
        openGraph: { images: [data.movie.thumb_url] },
    };
}

export default async function MovieDetailPage({ params }) {
    const { slug } = await params;
    const data = await getMovieDetail(slug);

    if (!data || !data.movie) return notFound();

    const movie = data.movie;
    const episodes = data.episodes || [];
    const firstServerEps = episodes[0]?.server_data || [];
    const categorySlug = movie.category?.[0]?.slug;
    const relatedMovies = await getRelatedMovies(categorySlug);
    const filteredRelated = relatedMovies.filter(m => m.slug !== movie.slug).slice(0, 4);
    const firstEpisodeSlug = data.episodes?.[0]?.server_data?.[0]?.slug;
    const watchLink = firstEpisodeSlug ? `/phim/${slug}` : "#";
    const plotText = movie.content?.replace(/<[^>]+>/g, '') || "";

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400&display=swap');

                .detail-page * {
                    font-family: 'Be Vietnam Pro', sans-serif;
                }
                .detail-title {
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                    text-transform: uppercase;
                }
                .section-heading {
                    font-weight: 800;
                    font-size: 1.1rem;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }
                .glass-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    backdrop-filter: blur(12px);
                }
                .tag-pill {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    border-radius: 4px;
                }
                .ep-btn {
                    font-size: 11px;
                    font-weight: 700;
                    min-width: 44px;
                    text-align: center;
                    padding: 6px 10px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #9ca3af;
                    transition: all 0.2s;
                }
                .ep-btn:hover {
                    background: rgba(74,222,128,0.1);
                    border-color: rgba(74,222,128,0.35);
                    color: #4ade80;
                }
                .info-row-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 3px;
                }
                .info-row-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: #e5e7eb;
                }
                .related-card img {
                    transition: transform 0.5s cubic-bezier(0.25,0.1,0.25,1);
                }
                .related-card:hover img {
                    transform: scale(1.07);
                }
                .play-btn-glow {
                    box-shadow: 0 0 28px rgba(74,222,128,0.35), 0 4px 16px rgba(0,0,0,0.4);
                    transition: all 0.25s;
                }
                .play-btn-glow:hover {
                    box-shadow: 0 0 40px rgba(74,222,128,0.5), 0 4px 20px rgba(0,0,0,0.5);
                    transform: translateY(-2px);
                }
                .divider-accent {
                    width: 3px;
                    border-radius: 2px;
                    background: linear-gradient(to bottom, #4ade80, transparent);
                }
            `}</style>

            <div className="detail-page min-h-screen bg-[#080808] text-white pb-24 selection:bg-primary selection:text-black">

                {/* ── BACKGROUND SCROLLABLE ── */}
                <div className="absolute top-0 left-0 right-0 h-[110vh] z-0 pointer-events-none overflow-hidden">
                    <img
                        src={movie.thumb_url || movie.poster_url}
                        alt=""
                        className="w-full h-full object-cover object-top opacity-20"
                        style={{ filter: "blur(2px)" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/60 via-[#080808]/80 to-[#080808]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-[#080808]/60" />
                </div>

                {/* ── DECORATIVE BG LAYERS (phần dưới) ── */}
                {/* Orb xanh lá góc trái giữa trang */}
                <div className="pointer-events-none fixed z-0" style={{
                    top: "55vh", left: "-12vw",
                    width: "55vw", height: "55vw", maxWidth: 700, maxHeight: 700,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(74,222,128,0.055) 0%, transparent 70%)",
                    filter: "blur(40px)",
                }} />
                {/* Orb tím mờ góc phải */}
                <div className="pointer-events-none fixed z-0" style={{
                    top: "70vh", right: "-10vw",
                    width: "45vw", height: "45vw", maxWidth: 600, maxHeight: 600,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
                    filter: "blur(50px)",
                }} />
                {/* Grid pattern toàn trang */}
                <div className="pointer-events-none fixed inset-0 z-0" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
                    backgroundSize: "72px 72px",
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 75%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 75%, transparent 100%)",
                }} />
                {/* Đường kẻ dọc accent trái */}
                <div className="pointer-events-none fixed left-0 top-0 bottom-0 z-0 w-px hidden lg:block" style={{
                    background: "linear-gradient(to bottom, transparent, rgba(74,222,128,0.18) 30%, rgba(74,222,128,0.06) 70%, transparent)",
                }} />
                {/* Noise grain toàn trang */}
                <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "180px",
                    mixBlendMode: "overlay",
                }} />

                <div className="relative z-10 container mx-auto px-4 md:px-8 pt-20 md:pt-28">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-8 tracking-wide">
                        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <span>/</span>
                        <Link href="/the-loai" className="hover:text-primary transition-colors">Phim</Link>
                        <span>/</span>
                        <span className="text-gray-300 truncate max-w-[200px]">{movie.name}</span>
                    </div>

                    {/* ── SECTION 1: MAIN INFO ── */}
                    <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start mb-20">

                        {/* ── CỘT TRÁI: Poster ── */}
                        <div className="w-full lg:w-[260px] xl:w-[290px] flex-shrink-0">

                            {/* Poster */}
                            <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/8 aspect-[2/3] mb-4 group">
                                <img
                                    src={movie.poster_url}
                                    alt={movie.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Quality badge */}
                                {movie.quality && (
                                    <div className="absolute top-3 left-3 tag-pill bg-primary text-black shadow-lg">
                                        {movie.quality}
                                    </div>
                                )}
                                {/* Episode badge */}
                                {movie.episode_current && (
                                    <div className="absolute top-3 right-3 tag-pill bg-black/70 text-white border border-white/15 backdrop-blur">
                                        {movie.episode_current}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mb-4">
                                <Link
                                    href={watchLink}
                                    className="play-btn-glow flex-1 bg-primary hover:bg-green-300 text-black font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    XEM NGAY
                                </Link>
                                <WatchLaterButton
                                    slug={movie.slug}
                                    movie={{
                                        name: movie.name,
                                        origin_name: movie.origin_name,
                                        poster_url: movie.poster_url,
                                        thumb_url: movie.thumb_url,
                                        year: movie.year,
                                    }}
                                />
                            </div>

                            {/* Episode picker */}
                            {firstServerEps.length > 1 && (
                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="section-heading text-gray-400 text-[10px]">Chọn tập</span>
                                        <span className="tag-pill bg-primary/10 text-primary border border-primary/20">
                                            {firstServerEps.length} Tập
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {[...firstServerEps].reverse().map((ep, idx) => (
                                            <Link
                                                key={ep.slug || idx}
                                                href={`/phim/${slug}?tap=${ep.slug}`}
                                                className="ep-btn"
                                            >
                                                {ep.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── CỘT PHẢI: Thông tin ── */}
                        <div className="flex-1 min-w-0">

                            {/* Tên phim */}
                            <h1 className="detail-title text-3xl md:text-5xl xl:text-6xl text-white mb-2">
                                {movie.name}
                            </h1>
                            {movie.origin_name && (
                                <p className="text-lg text-gray-400 italic font-light mb-6 tracking-wide">
                                    {movie.origin_name}
                                    {movie.year && <span className="not-italic text-gray-600 mx-2 font-normal">·</span>}
                                    {movie.year && <span className="not-italic text-gray-500 font-normal not-italic">{movie.year}</span>}
                                </p>
                            )}

                            {/* Rating + Meta tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-7">
                                {movie.tmdb?.vote_average != null && (
                                    <div
                                        className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/25 px-3 py-1.5 rounded-lg"
                                        title={movie.tmdb?.vote_count ? `${movie.tmdb.vote_count} đánh giá` : ""}
                                    >
                                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                        <span className="font-black text-yellow-400 text-sm">{Number(movie.tmdb.vote_average).toFixed(1)}</span>
                                        {movie.tmdb?.vote_count != null && (
                                            <span className="text-yellow-600/70 text-xs font-normal">({movie.tmdb.vote_count.toLocaleString()})</span>
                                        )}
                                    </div>
                                )}
                                {movie.status && (
                                    <span className={`tag-pill border ${movie.status === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                                        {movie.status === "ongoing" ? "Đang chiếu" : movie.status === "completed" ? "Hoàn thành" : movie.status}
                                    </span>
                                )}
                                {movie.type && <span className="tag-pill bg-white/5 border border-white/10 text-gray-300">{movie.type}</span>}
                                {movie.time && <span className="tag-pill bg-white/5 border border-white/10 text-gray-300">{movie.time}</span>}
                                {movie.lang && <span className="tag-pill bg-white/5 border border-white/10 text-gray-300">{movie.lang}</span>}
                            </div>

                            {/* Genre tags */}
                            {movie.category?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {movie.category.map((c, i) => (
                                        <Link
                                            key={c.slug ? `${c.slug}-${i}` : i}
                                            href={`/the-loai/${c.slug}`}
                                            className="tag-pill bg-primary/8 hover:bg-primary/15 border border-primary/20 text-primary/80 hover:text-primary transition-colors"
                                        >
                                            {c.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Plot */}
                            {plotText && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="divider-accent h-5" />
                                        <span className="section-heading text-gray-300 text-xs">Cốt truyện</span>
                                    </div>
                                    <p className="text-gray-300/90 leading-relaxed text-base font-light text-justify">
                                        {plotText}
                                    </p>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="glass-card rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
                                <InfoRow label="Đạo diễn" value={Array.isArray(movie.director) ? movie.director.filter(Boolean).join(", ") : movie.director} />
                                <InfoRow label="Quốc gia" value={movie.country?.map(c => c?.name).filter(Boolean).join(", ")} />
                                <InfoRow
                                    label="Số tập"
                                    value={[movie.episode_current, movie.episode_total].every(v => v != null)
                                        ? `${movie.episode_current} / ${movie.episode_total}` : null}
                                />
                                <InfoRow label="Lượt xem" value={movie.view != null ? Number(movie.view).toLocaleString("vi") : null} />
                                {movie.notify && <InfoRow label="Thông báo" value={movie.notify} />}
                                <InfoRow label="Cập nhật" value={movie.modified?.time ? new Date(movie.modified.time).toLocaleDateString("vi-VN") : null} />
                            </div>
                        </div>
                    </div>

                    {/* ── SECTION 2: DIỄN VIÊN ── */}
                    <div className="mb-16">
                        <SectionTitle>Diễn Viên</SectionTitle>
                        <ActorList actors={movie.actor} />
                    </div>

                    {/* ── SECTION 3: TRAILER ── */}
                    <TrailerSection trailerUrl={movie.trailer_url} posterUrl={movie.poster_url} movieName={movie.name} />

                    {/* ── SECTION 4: PHIM LIÊN QUAN ── */}
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-7">
                            <SectionTitle>Có Thể Bạn Muốn Xem</SectionTitle>
                            {categorySlug && (
                                <Link href={`/the-loai/${categorySlug}`} className="text-xs font-bold text-primary hover:text-green-300 flex items-center gap-1 transition-colors">
                                    Xem thêm
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </Link>
                            )}
                        </div>

                        {filteredRelated.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                {filteredRelated.map((relMovie) => (
                                    <Link key={relMovie._id} href={`/chi-tiet/${relMovie.slug}`} className="related-card group block">
                                        <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/8 relative mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                                            <img
                                                src={getImageUrl(relMovie.poster_url)}
                                                alt={relMovie.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {relMovie.year && (
                                                <div className="absolute top-2 right-2 tag-pill bg-black/70 text-white/80 border border-white/10 backdrop-blur">
                                                    {relMovie.year}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                                <div className="w-10 h-10 bg-primary/90 rounded-full flex items-center justify-center text-black shadow-lg">
                                                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-sm text-white/90 truncate group-hover:text-primary transition-colors leading-snug">{relMovie.name}</h4>
                                        {relMovie.origin_name && <p className="text-xs text-gray-500 truncate mt-0.5 font-light italic">{relMovie.origin_name}</p>}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Chưa có phim liên quan.</p>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

// Lấy video ID từ URL YouTube
function getYoutubeVideoId(url) {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    return null;
}

// ── Component: Section heading ──
function SectionTitle({ children }) {
    return (
        <h3 className="flex items-center gap-2.5 mb-6">
            <span
                style={{
                    width: 3,
                    height: 22,
                    borderRadius: 2,
                    background: "linear-gradient(to bottom, #4ade80, #16a34a)",
                    flexShrink: 0,
                    display: "inline-block",
                }}
            />
            <span
                style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#f9fafb",
                }}
            >
                {children}
            </span>
        </h3>
    );
}

// ── Component: Trailer ──
function TrailerSection({ trailerUrl, posterUrl, movieName }) {
    const videoId = getYoutubeVideoId(trailerUrl);

    return (
        <div className="mb-16">
            <SectionTitle>Trailer Chính Thức</SectionTitle>
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/8 relative shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                {videoId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        title={`Trailer ${movieName}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                ) : (
                    <div className="relative w-full h-full group">
                        <img src={posterUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" alt="trailer" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            {trailerUrl ? (
                                <a
                                    href={trailerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_40px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"
                                >
                                    <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </a>
                            ) : null}
                            <p className="text-gray-400 text-sm font-light">
                                {trailerUrl ? "Mở trailer trên YouTube" : "Chưa có trailer"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Component: Info row ──
function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div>
            <div className="info-row-label">{label}</div>
            <div className="info-row-value">{value}</div>
        </div>
    );
}