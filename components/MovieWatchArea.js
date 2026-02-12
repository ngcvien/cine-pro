"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "./VideoPlayer";
import { Search } from "lucide-react"; 
import { auth, db } from "@/lib/firebase"; // Import Firebase
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const formatServerName = (name) => {
    if (!name) return "Server Chính";
    return name.replace(/#|Hà Nội|Đà Nẵng|Hồ Chí Minh/g, "").replace(/[()]/g, "").trim();
};

export default function MovieWatchArea({ movie, episodes, currentEpSlug }) {
    const router = useRouter();
    const [selectedServerIndex, setSelectedServerIndex] = useState(0);
    const [user, setUser] = useState(null);
    
    // --- STATE CHO PROGRESS BAR (Lịch sử xem) ---
    const [historyDetails, setHistoryDetails] = useState({}); 

    // --- STATE CHO TÌM KIẾM & PHÂN TRANG ---
    const [searchQuery, setSearchQuery] = useState("");
    const [currentChunk, setCurrentChunk] = useState(0); 
    const EPISODES_PER_CHUNK = 50; 

    // 1. Tính toán tổng thời lượng phim (để tính %)
    // Logic giống EpisodeList: Parse số phút từ chuỗi (vd: "45 phút/tập" -> 45)
    const totalDuration = useMemo(() => {
        if (!movie?.time) return 0;
        const match = movie.time.match(/\d+/);
        return match ? parseInt(match[0]) : 0; 
    }, [movie]);

    // 2. Lắng nghe User & Lịch sử xem (REALTIME)
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Lắng nghe thay đổi trong document history của phim này
                const docRef = doc(db, "users", currentUser.uid, "history", movie.slug);
                const unsubDoc = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        // Lấy field 'details' chứa thời gian từng tập
                        setHistoryDetails(docSnap.data().details || {});
                    }
                });
                return () => unsubDoc();
            } else {
                setHistoryDetails({});
            }
        });
        return () => unsubAuth();
    }, [movie.slug]);

    // 3. Hàm tính % tiến trình (Copy từ EpisodeList.js)
    const getProgress = (epSlug) => {
        const seconds = historyDetails[epSlug] || 0;
        if (!totalDuration || totalDuration === 0) return 0;
        // Công thức: (Số giây đã xem / 60) chia cho Tổng số phút
        let percent = ((seconds / 60) / totalDuration) * 100;
        return Math.min(percent, 100);
    };

    // 4. Load server cũ từ localStorage
    useEffect(() => {
        const savedType = localStorage.getItem("preferred_server_type");
        if (savedType) {
            const index = episodes.findIndex(s => s.server_name.includes(savedType));
            if (index !== -1) setSelectedServerIndex(index);
        }
    }, [episodes]);

    const currentServerData = episodes[selectedServerIndex];
    if (!currentServerData) return null;

    let currentEpisode = currentServerData.server_data.find(e => e.slug === currentEpSlug);
    if (!currentEpisode) currentEpisode = currentServerData.server_data[0];

    // 5. Logic Auto-Chunking (Tự nhảy tab)
    useEffect(() => {
        if (currentEpisode && !searchQuery) {
            const epIndex = currentServerData.server_data.findIndex(e => e.slug === currentEpisode.slug);
            if (epIndex !== -1) {
                const chunkIndex = Math.floor(epIndex / EPISODES_PER_CHUNK);
                setCurrentChunk(chunkIndex);
            }
        }
    }, [currentEpisode, searchQuery, selectedServerIndex]); 

    // 6. Logic Lọc tập
    const displayEpisodes = useMemo(() => {
        const allEps = currentServerData.server_data;
        if (searchQuery.trim()) {
            return allEps.filter(ep => 
                ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                ep.slug.includes(searchQuery.toLowerCase())
            );
        }
        const start = currentChunk * EPISODES_PER_CHUNK;
        const end = start + EPISODES_PER_CHUNK;
        return allEps.slice(start, end);
    }, [currentServerData, searchQuery, currentChunk]);

    const totalChunks = Math.ceil(currentServerData.server_data.length / EPISODES_PER_CHUNK);
    const chunkList = Array.from({ length: totalChunks }, (_, i) => ({
        index: i, 
        label: `${i * EPISODES_PER_CHUNK + 1}-${Math.min((i + 1) * EPISODES_PER_CHUNK, currentServerData.server_data.length)}`
    }));

    const handleServerChange = (index) => {
        setSelectedServerIndex(index);
        const type = episodes[index].server_name.includes("Thuyết Minh") ? "Thuyết Minh" : "Vietsub";
        localStorage.setItem("preferred_server_type", type);
        setSearchQuery(""); 
        
        const newServerData = episodes[index];
        const hasEp = newServerData.server_data.find(e => e.slug === currentEpisode.slug);
        if (!hasEp) router.push(`/phim/${movie.slug}?tap=${newServerData.server_data[0].slug}`);
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

            {/* CONTROLS */}
            <div className="bg-[#121212]/40 p-5 rounded-2xl border border-white/10 shadow-xl">
                
                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <span className="text-primary font-bold text-sm uppercase whitespace-nowrap mr-2">Server:</span>
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

                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" 
                            placeholder="Tìm tập nhanh..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                    </div>
                </div>

                {/* RANGE TABS (CHIA NHỎ TẬP) */}
                {!searchQuery && totalChunks > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
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

                {/* LIST EPISODES */}
                <div>
                    <h3 className="text-white font-bold text-sm mb-3 flex justify-between">
                        <span>Danh sách tập | Tập hiện tại: {currentEpisode?.name || "Chưa chọn tập"}</span>
                        <span className="text-xs text-gray-500 font-normal">Tổng: {currentServerData.server_data.length} tập</span>
                    </h3>
                    
                    {displayEpisodes.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {displayEpisodes.map((ep) => {
                                const isCurrent = currentEpisode?.slug === ep.slug;
                                
                                // Tính % tiến trình
                                const percent = getProgress(ep.slug);

                                return (
                                    <button
                                        key={ep.slug}
                                        onClick={() => router.push(`/phim/${movie.slug}?tap=${ep.slug}`)}
                                        className={`
                                            relative group px-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 border overflow-hidden
                                            ${isCurrent 
                                                ? "bg-primary/20 border-primary text-primary shadow-[inset_0_0_10px_rgba(74,222,128,0.2)]" 
                                                : "bg-[#1f1f1f] border-transparent text-gray-400 hover:bg-[#2a2a2a] hover:text-white hover:border-white/20"
                                            }
                                        `}
                                    >
                                        <span className="relative z-10">{ep.name.replace("Tập ", "")}</span>
                                        
                                        {/* --- THANH TIẾN TRÌNH (Y HỆT EPISODELIST.JS) --- */}
                                        {percent > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/50">
                                                <div 
                                                  className={`h-full ${isCurrent ? 'bg-primary shadow-[0_0_5px_#00FF41]' : 'bg-gray-400'}`} 
                                                  style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Icon đang phát (giữ lại cho đẹp) */}
                                        {isCurrent && (
                                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm italic">Không tìm thấy tập nào</div>
                    )}
                </div>
            </div>
        </div>
    );
}