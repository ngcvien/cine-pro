import Link from "next/link";
import VideoPlayer from "../../../components/VideoPlayer";

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

export default async function MovieDetailPage({ params, searchParams }) {
    // Await params và searchParams trước khi sử dụng (Yêu cầu của Next.js mới)
    const { slug } = await params;
    const { tap } = await searchParams; // Lấy tập phim từ URL (ví dụ ?tap=Tap-01)

    const data = await getMovieDetail(slug);

    if (!data || !data.movie) {
        return <div className="text-center py-20 text-white">Không tìm thấy phim này.</div>;
    }

    const movie = data.movie;
    const episodes = data.episodes[0]?.server_data || []; // Lấy danh sách tập từ server đầu tiên

    // Xác định tập đang xem (Nếu không chọn thì lấy tập đầu tiên)
    const currentEpisode = episodes.find(e => e.slug === tap) || episodes[0];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* BACKGROUND BLUR */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                 <img src={movie.poster_url} className="w-full h-full object-cover blur-3xl" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-4">
                {/* 1. TRÌNH PHÁT VIDEO */}
                <div className="w-full max-w-5xl mx-auto shadow-2xl shadow-primary/20 mb-8">
                     {currentEpisode?.link_m3u8 ? (
                         <VideoPlayer 
                            url={currentEpisode.link_m3u8} 
                            slug={slug} 
                            episodeName={currentEpisode.name}
                         />
                     ) : (
                         <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-500">
                             Chưa có tập phim này
                         </div>
                     )}
                </div>

                {/* 2. THÔNG TIN PHIM & DANH SÁCH TẬP */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    
                    {/* CỘT TRÁI: THÔNG TIN */}
                    <div className="md:col-span-2 space-y-4">
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            {movie.name}
                        </h1>
                        <h2 className="text-xl text-gray-400 font-mono mb-4">{movie.origin_name} ({movie.year})</h2>
                        
                        <div className="flex flex-wrap gap-2 text-xs font-bold mb-4">
                            <span className="bg-white text-black px-2 py-1">⏱ {movie.time}</span>
                            <span className="border border-primary text-primary px-2 py-1">{movie.quality}</span>
                            <span className="bg-gray-800 text-gray-300 px-2 py-1">{movie.lang}</span>
                        </div>

                        <p className="text-gray-400 leading-relaxed text-sm md:text-base border-l-2 border-primary pl-4">
                            {movie.content}
                        </p>

                        <div className="pt-4 grid grid-cols-2 gap-4 text-sm text-gray-500 font-mono">
                            <p>Đạo diễn: <span className="text-white">{movie.actor[0] || "Đang cập nhật"}</span></p>
                            <p>Quốc gia: <span className="text-white">{movie.country[0]?.name}</span></p>
                        </div>
                    </div>

                    {/* CỘT PHẢI: DANH SÁCH TẬP (No Icon Style) */}
                    <div className="bg-surface/50 p-6 border border-white/5 h-fit backdrop-blur-sm">
                        <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                            CHỌN TẬP
                            <span className="text-primary text-xs font-mono">{episodes.length} TẬP</span>
                        </h3>
                        
                        <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {episodes.map((ep) => {
                                const isActive = currentEpisode?.slug === ep.slug;
                                return (
                                    <Link 
                                        key={ep.slug} 
                                        href={`/phim/${slug}?tap=${ep.slug}`}
                                        scroll={false} // Giữ nguyên vị trí không scroll lại
                                    >
                                        <div className={`
                                            text-center py-3 text-xs font-bold transition-all duration-300 border
                                            ${isActive 
                                                ? "bg-primary text-black border-primary scale-105" 
                                                : "bg-black/40 text-gray-400 border-white/10 hover:border-white hover:text-white"
                                            }
                                        `}>
                                            {ep.name}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}