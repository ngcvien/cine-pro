import Link from "next/link";
import VideoPlayer from "../../../components/VideoPlayer";
import EpisodeList from "../../../components/EpisodeList";

// Hàm lấy dữ liệu chi tiết phim
async function getMovieDetail(slug) {
    try {
        const res = await fetch(`https://phimapi.com/phim/${slug}`, { cache: "no-store" });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export const metadata = {
    title: "Xem Phim - Cine Pro",
    description: "Xem phim trực tuyến miễn phí với chất lượng cao"
};

export default async function MovieDetailPage({ params, searchParams }) {
    // Await params và searchParams trước khi sử dụng
    const { slug } = await params;
    const { tap } = await searchParams;

    const data = await getMovieDetail(slug);

    if (!data || !data.movie) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim này.</div>;
    }

    const movie = data.movie;
    const episodes = data.episodes[0]?.server_data || [];

    // --- SỬA LỖI: DI CHUYỂN LOGIC TÍNH THỜI GIAN VÀO ĐÂY ---
    // Lúc này biến 'movie' đã có dữ liệu rồi nên mới tính toán được
    const timeString = movie.time || "";
    const timeMatch = timeString.match(/\d+/);
    const totalDuration = timeMatch ? parseInt(timeMatch[0]) : 0;
    // --------------------------------------------------------

    // Xác định tập đang xem
    const currentEpisode = episodes.find(e => e.slug === tap) || episodes[0];

    return (
        <div className=" bg-background pb-20">
            {/* BACKGROUND BLUR */}
            <div className="fixed inset-0 z-0 opacity-15 pointer-events-none">
                <img src={movie.poster_url} className="w-full h-full object-cover blur-3xl" alt={movie.name} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-8 pt-6">
                {/* HEADER WITH BREADCRUMB */}
                <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <span className="text-gray-300">{movie.name}</span>
                </div>

                {/* MAIN CONTENT */}
                <div className="space-y-8 max-w-5xl mx-auto">

                    {/* VIDEO PLAYER SECTION */}
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
                        <p className="text-xs text-gray-500 ml-1">Tập hiện tại: <span className="text-primary font-bold">{currentEpisode?.name}</span></p>
                    </div>

                    {/* EPISODE LIST */}
                    <EpisodeList
                        episodes={episodes}
                        currentEpisode={currentEpisode}
                        slug={slug}
                        poster={movie.poster_url}
                        totalDuration={totalDuration}
                    />

                    {/* MOVIE DETAILS */}
                    <div className="space-y-6 bg-surface/30 border border-white/5 rounded-xl p-6 md:p-8 backdrop-blur-sm">
                        {/* TITLE SECTION */}
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                                {movie.name}
                            </h1>
                            <h2 className="text-lg text-gray-400 font-light">{movie.origin_name}</h2>
                        </div>

                        {/* META TAGS */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                                {movie.year}
                            </span>
                            <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                {movie.time}
                            </span>
                            <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                {movie.quality}
                            </span>
                            <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                {movie.lang}
                            </span>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="border-t border-white/5 pt-6">
                            <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Nội dung</h3>
                            <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                                {movie.content}
                            </p>
                        </div>

                        {/* INFO GRID */}
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                            <div>
                                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Đạo diễn</h4>
                                <p className="text-white text-sm">{movie.actor[0] || "Đang cập nhật"}</p>
                            </div>
                            <div>
                                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Quốc gia</h4>
                                <p className="text-white text-sm">{movie.country[0]?.name}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}