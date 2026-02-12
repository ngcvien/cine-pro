"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "./VideoPlayer";
import { Search } from "lucide-react"; // Cần cài lucide-react hoặc dùng svg icon

const formatServerName = (name) => {
    if (!name) return "Server Chính";
    return name.replace(/#|Hà Nội|Đà Nẵng|Hồ Chí Minh/g, "").replace(/[()]/g, "").trim();
};

export default function MovieWatchArea({ movie, episodes, currentEpSlug }) {
    const router = useRouter();
    const [selectedServerIndex, setSelectedServerIndex] = useState(0);
    
    // --- STATE MỚI CHO TÌM KIẾM & PHÂN TRANG ---
    const [searchQuery, setSearchQuery] = useState("");
    const [currentChunk, setCurrentChunk] = useState(0); // 0 = 1-50, 1 = 51-100
    const EPISODES_PER_CHUNK = 50; // Giới hạn hiển thị 50 tập mỗi tab

    // 1. Load server & Xác định trang chứa tập hiện tại
    useEffect(() => {
        const savedType = localStorage.getItem("preferred_server_type");
        if (savedType) {
            const index = episodes.findIndex(s => s.server_name.includes(savedType));
            if (index !== -1) setSelectedServerIndex(index);
        }
    }, [episodes]);

    // Dữ liệu Server hiện tại
    const currentServerData = episodes[selectedServerIndex];
    if (!currentServerData) return null;

    // Tìm tập hiện tại
    let currentEpisode = currentServerData.server_data.find(e => e.slug === currentEpSlug);
    if (!currentEpisode) currentEpisode = currentServerData.server_data[0];

    // --- LOGIC TỰ ĐỘNG CHUYỂN TAB KHI VÀO TRANG ---
    // Ví dụ: Đang xem tập 60 -> Tự nhảy sang tab [51-100]
    useEffect(() => {
        if (currentEpisode && !searchQuery) {
            const epIndex = currentServerData.server_data.findIndex(e => e.slug === currentEpisode.slug);
            if (epIndex !== -1) {
                const chunkIndex = Math.floor(epIndex / EPISODES_PER_CHUNK);
                setCurrentChunk(chunkIndex);
            }
        }
    }, [currentEpisode, searchQuery, selectedServerIndex]); // Chạy lại khi đổi tập hoặc đổi server

    // --- LOGIC LỌC TẬP PHIM (SEARCH + CHUNK) ---
    const displayEpisodes = useMemo(() => {
        const allEps = currentServerData.server_data;

        // 1. Nếu đang tìm kiếm -> Hiện tất cả kết quả khớp
        if (searchQuery.trim()) {
            return allEps.filter(ep => 
                ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                ep.slug.includes(searchQuery.toLowerCase())
            );
        }

        // 2. Nếu không tìm kiếm -> Cắt theo chunk (Range)
        const start = currentChunk * EPISODES_PER_CHUNK;
        const end = start + EPISODES_PER_CHUNK;
        return allEps.slice(start, end);

    }, [currentServerData, searchQuery, currentChunk]);

    // Tạo danh sách các tab khoảng (1-50, 51-100...)
    const totalChunks = Math.ceil(currentServerData.server_data.length / EPISODES_PER_CHUNK);
    const chunkList = Array.from({ length: totalChunks }, (_, i) => {
        const start = i * EPISODES_PER_CHUNK + 1;
        const end = Math.min((i + 1) * EPISODES_PER_CHUNK, currentServerData.server_data.length);
        return { index: i, label: `${start}-${end}` };
    });

    const handleServerChange = (index) => {
        setSelectedServerIndex(index);
        const type = episodes[index].server_name.includes("Thuyết Minh") ? "Thuyết Minh" : "Vietsub";
        localStorage.setItem("preferred_server_type", type);
        
        // Reset search khi đổi server
        setSearchQuery(""); 

        // Logic check tập tồn tại (như cũ)
        const newServerData = episodes[index];
        const hasEp = newServerData.server_data.find(e => e.slug === currentEpisode.slug);
        if (!hasEp) {
            router.push(`/phim/${movie.slug}?tap=${newServerData.server_data[0].slug}`);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* VIDEO PLAYER */}
            <div className="w-full">
                {currentEpisode?.link_m3u8 ? (
                    <div key={`${selectedServerIndex}-${currentEpisode.slug}`}>
                        <VideoPlayer
                            url={currentEpisode.link_m3u8}
                            slug={movie.slug}
                            episodeName={currentEpisode.name}
                            episodeSlug={currentEpisode.slug}
                            episodes={currentServerData.server_data} 
                        />
                    </div>
                ) : (
                    <div className="aspect-video bg-gray-900 flex items-center justify-center border border-white/10 rounded-xl">
                        <span className="text-gray-500">Đang cập nhật...</span>
                    </div>
                )}
            </div>

            {/* CONTAINER ĐIỀU KHIỂN */}
            <div className="bg-[#121212] p-5 rounded-2xl border border-white/10 shadow-xl">
                
                {/* 1. THANH CÔNG CỤ: CHỌN SERVER + TÌM KIẾM */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                    
                    {/* Chọn Server */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <span className="text-primary font-bold text-sm uppercase whitespace-nowrap mr-2">
                             Server:
                        </span>
                        {episodes.map((server, index) => (
                            <button
                                key={index}
                                onClick={() => handleServerChange(index)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    selectedServerIndex === index 
                                    ? "bg-primary text-black shadow-[0_0_10px_rgba(74,222,128,0.4)]" 
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                {formatServerName(server.server_name)}
                            </button>
                        ))}
                    </div>

                    {/* Ô Tìm Kiếm Tập */}
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" 
                            placeholder="Tìm tập nhanh (vd: 15)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                    </div>
                </div>

                {/* 2. THANH CHỌN KHOẢNG (RANGE) - Chỉ hiện khi KHÔNG tìm kiếm và phim dài > 50 tập */}
                {!searchQuery && totalChunks > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                        {chunkList.map((chunk) => (
                            <button
                                key={chunk.index}
                                onClick={() => setCurrentChunk(chunk.index)}
                                className={`px-3 py-1 rounded text-xs font-medium border transition-all ${
                                    currentChunk === chunk.index
                                    ? "bg-white/10 border-primary/50 text-white"
                                    : "bg-transparent border-white/5 text-gray-500 hover:border-white/20"
                                }`}
                            >
                                {chunk.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* 3. DANH SÁCH TẬP (GRID) */}
                <div>
                    <h3 className="text-white font-bold text-sm mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                            Danh sách tập ({searchQuery ? `Kết quả cho "${searchQuery}"` : chunkList[currentChunk]?.label || "All"})
                        </div>
                        <span className="text-xs text-gray-500 font-normal">
                            Tổng: {currentServerData.server_data.length} tập
                        </span>
                    </h3>
                    
                    {displayEpisodes.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {displayEpisodes.map((ep) => {
                                const isCurrent = currentEpisode?.slug === ep.slug;
                                return (
                                    <button
                                        key={ep.slug}
                                        onClick={() => router.push(`/phim/${movie.slug}?tap=${ep.slug}`)}
                                        className={`
                                            group relative px-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 border
                                            ${isCurrent 
                                                ? "bg-primary/20 border-primary text-primary shadow-[inset_0_0_10px_rgba(74,222,128,0.2)]" 
                                                : "bg-[#1f1f1f] border-transparent text-gray-400 hover:bg-[#2a2a2a] hover:text-white hover:border-white/20"
                                            }
                                        `}
                                    >
                                        {ep.name.replace("Tập ", "")} {/* Rút gọn tên hiển thị nếu muốn */}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm italic">
                            Không tìm thấy tập nào khớp với "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}