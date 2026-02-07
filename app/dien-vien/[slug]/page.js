import Link from "next/link";

// CẤU HÌNH API
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original"; // Lấy ảnh gốc cho nét căng

// 1. Tìm ID diễn viên
async function getActorId(name) {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/search/person?api_key=${TMDB_KEY}&query=${name}&language=vi-VN`);
        const data = await res.json();
        return data.results?.[0] || null;
    } catch (error) {
        return null;
    }
}

// 2. Lấy chi tiết
async function getActorDetails(id) {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_KEY}&language=vi-VN&append_to_response=movie_credits`);
        return await res.json();
    } catch (error) {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const actorName = decodeURIComponent(slug);
    return { title: `Diễn viên ${actorName} - CinePro` };
}

export default async function ActorPage({ params }) {
    const { slug } = await params;
    const actorName = decodeURIComponent(slug);

    const actorBasicInfo = await getActorId(actorName);
    
    if (!actorBasicInfo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">404</h1>
                <p className="text-gray-500 font-mono tracking-widest uppercase">DATA NOT FOUND</p>
                <Link href="/" className="mt-8 border-b-2 border-primary text-primary font-bold hover:text-white hover:border-white transition-colors">
                    QUAY VỀ TRANG CHỦ
                </Link>
            </div>
        );
    }

    const details = await getActorDetails(actorBasicInfo.id);
    
    // Lọc và sắp xếp phim
    const movies = details?.movie_credits?.cast
        ?.filter(m => m.poster_path)
        ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)) || [];

    return (
        <div className="min-h-screen  text-white pt-24 pb-20 container mx-auto px-4 md:px-8 font-sans">
            
            {/* --- 1. HEADER PROFILE (FULL COLOR) --- */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-24 border-b border-white/10 pb-12">
                
                {/* Cột Trái: Ảnh Chân Dung */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="aspect-[3/4] w-full relative bg-[#101010] shadow-[0_0_30px_rgba(255,255,255,0.1)] group overflow-hidden">
                        {details.profile_path ? (
                            <img 
                                src={`${TMDB_IMAGE_URL}${details.profile_path}`} 
                                alt={details.name} 
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-9xl font-black text-gray-800">
                                {details.name.charAt(0)}
                            </div>
                        )}
                        {/* Viền mỏng sang trọng */}
                        <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
                    </div>
                </div>

                {/* Cột Phải: Thông tin */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end">
                    
                    {/* Tên Diễn Viên */}
                    <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8 md:-ml-1 drop-shadow-2xl">
                        {details.name}
                    </h1>

                    {/* Dòng thông tin */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 mb-10 border-t border-white/10 pt-6">
                        <InfoItem label="Ngày sinh" value={details.birthday} />
                        <InfoItem label="Nơi sinh" value={details.place_of_birth} />
                        <InfoItem label="Nghề nghiệp" value={details.known_for_department} />
                        <InfoItem label="Độ nổi tiếng" value={`${details.popularity?.toFixed(0)} Points`} />
                    </div>

                    {/* Tiểu sử */}
                    <div className="max-w-4xl">
                        <span className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Tiểu sử</span>
                        <p className="text-lg md:text-xl font-light text-gray-300 leading-relaxed text-justify">
                            {details.biography 
                                ? (details.biography.length > 600 ? details.biography.substring(0, 600) + "..." : details.biography)
                                : "Chưa có thông tin tiểu sử."}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- 2. DANH SÁCH PHIM (COLORFUL GRID) --- */}
            <div>
                <div className="flex items-baseline gap-4 mb-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                        FILMOGRAPHY
                    </h2>
                    <span className="text-2xl font-bold text-primary align-top">({movies.length})</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-12">
                    {movies.map((movie) => (
                         <Link 
                             key={movie.id} 
                             href={`/tim-kiem?keyword=${encodeURIComponent(movie.title)}`}
                             className="group block"
                         >
                             {/* Poster Container */}
                             <div className="aspect-[2/3] w-full bg-[#101010] relative overflow-hidden mb-4 shadow-lg transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                                 <img 
                                     src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                                     alt={movie.title} 
                                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                 />
                                 
                                 {/* Hover Overlay: Darken + Text */}
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                     <span className="border-2 border-white text-white font-black text-sm uppercase px-5 py-2 tracking-widest hover:bg-white hover:text-black transition-colors">
                                         TÌM PHIM
                                     </span>
                                 </div>

                                 {/* Rating Badge */}
                                 <div className="absolute top-0 right-0 bg-primary text-black text-xs font-black px-2 py-1">
                                     {movie.vote_average?.toFixed(1)}
                                 </div>
                             </div>

                             {/* Thông tin phim */}
                             <div className="pr-2 border-l-2 border-transparent group-hover:border-primary pl-2 transition-all">
                                 <h4 className="font-bold text-white text-sm uppercase tracking-wider truncate group-hover:text-primary transition-colors duration-300">
                                     {movie.title}
                                 </h4>
                                 <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1">
                                     <span>{movie.release_date?.split('-')[0] || "N/A"}</span>
                                     <span className="truncate max-w-[60%] text-right text-gray-400 group-hover:text-white">
                                        {movie.character ? movie.character : "Cast"}
                                     </span>
                                 </div>
                             </div>
                         </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Component hiển thị thông tin dạng text block
function InfoItem({ label, value }) {
    return (
        <div className="flex flex-col gap-1 border-l-2 border-white/10 pl-4 hover:border-primary transition-colors duration-300">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <span className="text-white font-bold text-sm uppercase tracking-wide">
                {value || "N/A"}
            </span>
        </div>
    );
}