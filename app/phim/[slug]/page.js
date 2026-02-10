import Link from "next/link";
import VideoPlayer from "../../../components/VideoPlayer";
import EpisodeList from "../../../components/EpisodeList";
import ActorList from "../../../components/ActorList"; 
import { getMovieData } from "@/lib/movieService";

// Hàm lấy dữ liệu chi tiết phim
async function getMovieDetail(slug) {
    return await getMovieData(`/phim/${slug}`, { cache: "no-store" });
}

export const metadata = {
    title: "Xem Phim - Cine Pro",
    description: "Xem phim trực tuyến miễn phí với chất lượng cao"
};

export default async function MovieDetailPage({ params, searchParams }) {
    const { slug } = await params;
    const { tap } = await searchParams;

    const data = await getMovieDetail(slug);

    if (!data || !data.movie) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim này.</div>;
    }

    const movie = data.movie;
    const episodes = data.episodes[0]?.server_data || [];

    // Logic tính thời gian
    const timeString = movie.time || "";
    const timeMatch = timeString.match(/\d+/);
    const totalDuration = timeMatch ? parseInt(timeMatch[0]) : 0;

    // Xác định tập đang xem
    const currentEpisode = episodes.find(e => e.slug === tap) || episodes[0];

    return (
        <div className="bg-[#050505] pb-20 font-sans text-white min-h-screen">

            {/* BACKGROUND BLUR */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <img src={movie.poster_url} className="w-full h-full object-cover blur-[50px] scale-110" alt={movie.name} />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-8 pt-6 ">

                {/* HEADER WITH BREADCRUMB */}
                <div className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 m-15">
                    <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <span className="text-gray-300 truncate max-w-[200px]">{movie.name}</span>
                </div>

                {/* MAIN CONTENT */}
                <div className="space-y-10 max-w-7xl mx-auto">

                    {/* 1. VIDEO PLAYER SECTION */}
                    <div className="space-y-2">
                        {currentEpisode?.link_m3u8 ? (
                            <VideoPlayer
                                url={currentEpisode.link_m3u8}
                                slug={slug}
                                episodeName={currentEpisode.name}
                                episodes={episodes}
                                episodeSlug={currentEpisode.slug}
                            />
                        ) : (
                            <div className="aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-gray-500 rounded-xl border border-white/10">
                                <span>Chưa có tập phim này</span>
                            </div>
                        )}
                    </div>

                    {/* EPISODE LIST */}
                    <EpisodeList
                        episodes={episodes}
                        currentEpisode={currentEpisode}
                        slug={slug}
                        poster={movie.poster_url}
                        totalDuration={totalDuration}
                    />

                    {/* 3. MOVIE DETAILS - GIAO DIỆN BÙNG NỔ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* CỘT TRÁI (70%) - INFO CHÍNH */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Title Block */}
                            <div>
                                <Link href={`/chi-tiet/${slug}`} className="group block">
                                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] group-hover:text-primary transition-colors duration-300">
                                        {movie.name}
                                    </h1>
                                </Link>
                                <h2 className="text-xl md:text-2xl text-gray-400 italic font-light mt-3">
                                    {movie.origin_name} <span className="text-white/20 mx-2">|</span> {movie.year}
                                </h2>
                            </div>

                            {/* Tags / Badges */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-primary text-black font-black text-xs px-3 py-1 rounded transform -skew-x-12 shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                                    FULL HD
                                </span>
                                <Badge>{movie.quality}</Badge>
                                <Badge>{movie.lang}</Badge>
                                <Badge>{movie.time}</Badge>
                                <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
                                {movie.category?.slice(0, 3).map((c) => (
                                    <span key={c.id} className="text-xs font-bold text-gray-400 border border-white/10 px-2 py-1 rounded hover:text-white hover:border-primary transition-colors cursor-default">
                                        {c.name}
                                    </span>
                                ))}
                            </div>

                            {/* Story / Plot */}
                            <div className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent"></div>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    Nội Dung Phim
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-justify font-light text-base md:text-lg">
                                    {movie.content.replace(/<[^>]+>/g, '')}
                                </p>
                            </div>

                            {/* --- 4. DIỄN VIÊN (ĐÃ THÊM VÀO ĐÂY) --- */}
                            <div className="pt-4">
                                <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                    Dàn Diễn Viên
                                </h3>
                                <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-5">
                                    <ActorList actors={movie.actor} />
                                </div>
                            </div>

                        </div>

                        {/* CỘT PHẢI (30%) - SIDEBAR INFO */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden sticky top-4 shadow-2xl">
                                {/* Thumbnail Poster */}
                                <div className="w-full aspect-video relative overflow-hidden">
                                    <img
                                        src={movie.thumb_url}
                                        alt={movie.name}
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
                                    <div className="absolute bottom-4 left-4">
                                        <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Trạng thái</p>
                                        <p className="text-white font-black text-xl">{movie.episode_current}</p>
                                    </div>
                                </div>

                                {/* Detailed Stats */}
                                <div className="p-6 space-y-5">
                                    <InfoRow label="Đạo diễn" value={movie.actor[0] === "" ? "Đang cập nhật" : movie.actor[0]} />
                                    <InfoRow label="Quốc gia" value={movie.country[0]?.name} />
                                    <InfoRow label="Ngày cập nhật" value={new Date(movie.modified.time).toLocaleDateString('vi-VN')} />

                                    <Link
                                        href={`/chi-tiet/${slug}`}
                                        className="block w-full text-center bg-white/5 hover:bg-primary hover:text-black border border-white/10 text-white font-bold py-3 rounded-xl transition-all mt-6 shadow-lg"
                                    >
                                        Trang Thông Tin Đầy Đủ &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

const Badge = ({ children }) => (
    <span className="bg-white/10 border border-white/5 text-gray-200 text-xs font-bold px-3 py-1 rounded">
        {children}
    </span>
);

const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start">
            <span className="text-gray-500 text-sm font-medium">{label}</span>
            <span className="text-white text-sm font-bold text-right max-w-[60%] truncate">{value}</span>
        </div>
    )
}