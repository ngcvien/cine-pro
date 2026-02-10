import Link from "next/link";
import { notFound } from "next/navigation";
import ActorList from "../../../components/ActorList";
import WatchLaterButton from "../../../components/WatchLaterButton";
import { i } from "framer-motion/client";
import { getMovieData } from "@/lib/movieService";

// --- 1. HÀM LẤY DỮ LIỆU ---

// Lấy chi tiết phim
async function getMovieDetail(slug) {
    return await getMovieData(`/phim/${slug}`);
}

// Lấy phim liên quan (Dựa theo slug thể loại đầu tiên)
async function getRelatedMovies(categorySlug) {
    if (!categorySlug) return [];
    const data = await getMovieData(`v1/api/the-loai/${categorySlug}?limit=5`);
    return data?.data?.items || [];

}

// Metadata SEO
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getMovieDetail(slug);
    if (!data?.movie) return { title: "Chi tiết phim" };
    return {
        title: `${data.movie.name} (${data.movie.year}) - CinePro`,
        description: data.movie.content,
        openGraph: { images: [data.movie.poster_url] },
    };
}

export default async function MovieDetailPage({ params }) {
    const { slug } = await params;
    const data = await getMovieDetail(slug);

    if (!data || !data.movie) return notFound();

    const movie = data.movie;

    // Lấy danh sách phim liên quan
    const categorySlug = movie.category?.[0]?.slug;
    const relatedMovies = await getRelatedMovies(categorySlug);
    // Lọc bỏ phim hiện tại ra khỏi danh sách liên quan
    const filteredRelated = relatedMovies.filter(m => m.slug !== movie.slug).slice(0, 4);

    // Link Xem Phim
    const firstEpisodeSlug = data.episodes?.[0]?.server_data?.[0]?.slug;
    const watchLink = firstEpisodeSlug ? `/phim/${slug}` : "#";

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 font-sans selection:bg-primary selection:text-black">

            {/* --- BACKGROUND HERO (Làm nền mờ) --- */}
            <div className="fixed inset-0 z-0 h-[80vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10"></div>
                <img src={movie.poster_url} alt="Backdrop" className="w-full h-full object-cover opacity-30" />
            </div>

            <div className="relative z-20 container mx-auto px-4 md:px-8 pt-24 md:pt-32">

                {/* --- SECTION 1: MAIN INFO (Poster & Title) --- */}
                <div className="flex flex-col md:flex-row gap-10 items-start mb-16">

                    {/* Cột Trái: Poster + Action */}
                    <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-4 group">
                        <div className="relative rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 aspect-[2/3]">
                            <img src={movie.poster_url} alt={movie.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                            {/* Badge Chất lượng */}
                            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2 py-1 rounded shadow-lg">
                                {movie.quality}
                            </div>
                        </div>

                        {/* Nút Xem Phim + Xem sau */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={watchLink}
                                className="flex-1 bg-primary hover:bg-green-400 text-black font-black py-4 rounded-xl text-center text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                XEM PHIM NGAY
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
                    </div>

                    {/* Cột Phải: Thông tin chi tiết */}
                    <div className="flex-1 space-y-6">

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                            <Link href="/" className="hover:text-primary">Home</Link> /
                            <Link href="/the-loai" className="hover:text-primary">Phim</Link> /
                            <span className="text-white">{movie.origin_name}</span>
                        </div>

                        {/* Tiêu đề */}
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-2">
                                {movie.name}
                            </h1>
                            <h2 className="text-xl md:text-2xl text-gray-400 italic font-light">
                                {movie.origin_name} <span className="text-gray-600 not-italic mx-2">|</span> {movie.year}
                            </h2>
                        </div>

                        {/* Meta Tags: TMDB rating, trạng thái, loại phim, time, lang, thể loại */}
                        <div className="flex flex-wrap items-center gap-4 py-4 border-y border-white/10">
                            {(movie.tmdb?.vote_average != null) && (
                                <>
                                    <div className="flex items-center gap-1 text-yellow-500 font-black text-lg" title={movie.tmdb?.vote_count ? `${movie.tmdb.vote_count} đánh giá` : ""}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <span>{Number(movie.tmdb.vote_average).toFixed(1)}</span>
                                        {movie.tmdb?.vote_count != null && <span className="text-gray-500 font-normal text-sm">({movie.tmdb.vote_count})</span>}
                                    </div>
                                    <span className="text-gray-500">|</span>
                                </>
                            )}
                            {movie.status && (
                                <>
                                    <span className="bg-white/10 text-gray-300 text-xs font-bold px-2 py-1 rounded">{movie.status === "ongoing" ? "Đang chiếu" : movie.status === "completed" ? "Hoàn thành" : movie.status}</span>
                                    <span className="text-gray-500">|</span>
                                </>
                            )}
                            {movie.type && (
                                <>
                                    <span className="text-gray-300 font-medium">{movie.type}</span>
                                    <span className="text-gray-500">|</span>
                                </>
                            )}
                            <span className="text-gray-300 font-medium">{movie.time}</span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-300 font-medium">{movie.lang}</span>
                            <span className="text-gray-500">|</span>
                            <div className="flex flex-wrap gap-2">
                                {movie.category?.map((c, i) => (
                                    <Link key={c.slug ? `${c.slug}-${i}` : i} href={`/the-loai/${c.slug}`} className="bg-white/10 hover:bg-white/20 text-xs font-bold px-2 py-1 rounded text-gray-300 transition-colors">
                                        {c.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Nội dung phim */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary rounded-full"></span>
                                Cốt truyện
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-lg font-light text-justify">
                                {movie.content.replace(/<[^>]+>/g, '')}
                            </p>
                        </div>

                        {/* Bảng thông tin chi tiết */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 bg-white/5 p-6 rounded-xl border border-white/5">
                            <InfoRow label="Đạo diễn" value={Array.isArray(movie.director) ? movie.director.filter(Boolean).join(", ") : movie.director} />
                            <InfoRow label="Quốc gia" value={movie.country?.map((c) => c?.name).filter(Boolean).join(", ")} />
                            <InfoRow label="Số tập" value={[movie.episode_current, movie.episode_total].every((v) => v != null) ? `${movie.episode_current} / ${movie.episode_total}` : null} />
                            <InfoRow label="Lượt xem" value={movie.view != null ? `${Number(movie.view).toLocaleString("vi")}` : null} />
                            {movie.notify && <InfoRow label="Thông báo" value={movie.notify} />}
                            <InfoRow label="Cập nhật" value={movie.modified?.time ? new Date(movie.modified.time).toLocaleDateString("vi-VN") : null} />
                        </div>
                    </div>
                </div>

                {/* --- SECTION 2: DIỄN VIÊN (CAST) --- */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                        Diễn Viên
                    </h3>

                    {/* Thay thế code cũ bằng component mới này */}
                    <ActorList actors={movie.actor} />

                </div>
                {/* --- SECTION 3: TRAILER (nhúng từ movie.trailer_url) --- */}
                <TrailerSection trailerUrl={movie.trailer_url} posterUrl={movie.poster_url} movieName={movie.name} />

                {/* --- SECTION 4: PHIM LIÊN QUAN (RELATED) --- */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                            Có Thể Bạn Muốn Xem
                        </div>
                        <Link href={`/the-loai/${categorySlug}`} className="text-sm font-bold text-primary hover:underline">
                            Xem thêm
                        </Link>
                    </h3>

                    {filteredRelated.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {filteredRelated.map((relMovie) => (
                                <Link key={relMovie._id} href={`/phim/${relMovie.slug}`} className="group block">
                                    <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 relative mb-3">
                                        <img
                                            src={`https://phimimg.com/${relMovie.poster_url}`}
                                            alt={relMovie.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 right-2 bg-primary text-black font-bold text-[10px] px-2 py-0.5 rounded">
                                            {relMovie.year}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                                                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-white truncate group-hover:text-primary transition-colors">{relMovie.name}</h4>
                                    <p className="text-xs text-gray-500">{relMovie.origin_name}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Chưa có phim liên quan.</p>
                    )}
                </div>

                {/* --- SECTION 5: BÌNH LUẬN (Giả lập để trang trông "động" hơn) --- */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                        Bình Luận (3)
                    </h3>
                    <div className="bg-[#121212] border border-white/5 rounded-xl p-6 space-y-6">
                        {/* Form bình luận */}
                        <div className="flex gap-4 mb-8">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                            <div className="flex-1">
                                <input type="text" placeholder="Viết bình luận của bạn..." className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                            </div>
                        </div>

                        {/* List bình luận giả */}
                        <CommentItem user="Minh Khôi" time="2 giờ trước" content="Phim quá đỉnh, xem đi xem lại không chán!" color="bg-blue-600" />
                        <CommentItem user="Thảo Vy" time="1 ngày trước" content="Đoạn kết hơi buồn nhưng xứng đáng 10 điểm." color="bg-pink-600" />
                        <CommentItem user="MovieFan99" time="3 ngày trước" content="Web load nhanh quá, giao diện đẹp. 1 like cho admin!" color="bg-green-600" />
                    </div>
                </div>

            </div>
        </div>
    );
}

// Lấy video ID từ URL YouTube (watch?v=, youtu.be/, embed/)
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

// Component: Trailer nhúng YouTube hoặc placeholder
function TrailerSection({ trailerUrl, posterUrl, movieName }) {
    const videoId = getYoutubeVideoId(trailerUrl);

    return (
        <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                Trailer Chính Thức
            </h3>
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative">
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
                        <img src={posterUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="trailer" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            {trailerUrl ? (
                                <a href={trailerUrl} target="_blank" rel="noopener noreferrer" className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:scale-110 transition-transform cursor-pointer">
                                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </a>
                            ) : null}
                            <p className="text-center text-gray-400 text-sm">
                                {trailerUrl ? "Mở trailer trên YouTube" : "Chưa có trailer"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Component phụ: Dòng thông tin
function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex flex-col border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</span>
            <span className="text-white font-medium">{value}</span>
        </div>
    );
}

// Component phụ: Bình luận item
function CommentItem({ user, time, content, color }) {
    return (
        <div className="flex gap-4">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                {user.charAt(0)}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{user}</span>
                    <span className="text-xs text-gray-500">• {time}</span>
                </div>
                <p className="text-gray-300 text-sm">{content}</p>
            </div>
        </div>
    )
}