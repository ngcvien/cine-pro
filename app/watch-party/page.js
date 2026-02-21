"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, rtdb } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set, onValue } from "firebase/database";
import { searchMoviesHybrid } from "@/lib/movieService"; // Sửa lại đường dẫn này cho chuẩn với file của bạn

export default function WatchPartyHub() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // --- STATE CHO DANH SÁCH PHÒNG ---
    const [publicRooms, setPublicRooms] = useState([]);

    // --- STATE CHO TÌM KIẾM PHIM ---
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null); // Lưu { name, slug }

    // --- STATE CHO FORM TẠO PHÒNG ---
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        isPrivate: false,
        mode: "now", 
        scheduledTime: "" 
    });

    // 1. Kiểm tra đăng nhập
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Lắng nghe danh sách phòng công khai
    useEffect(() => {
        const roomsRef = ref(rtdb, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomArray = Object.entries(data)
                    .map(([id, roomData]) => ({ id, ...roomData.info }))
                    .filter(room => room && !room.isPrivate && room.status !== "ended"); 
                
                roomArray.sort((a, b) => b.createdAt - a.createdAt);
                setPublicRooms(roomArray);
            } else {
                setPublicRooms([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 3. Logic tìm kiếm phim (Có độ trễ Debounce để tránh spam API)
    useEffect(() => {
        if (!searchKeyword.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await searchMoviesHybrid(searchKeyword);
                if (res.status === 'success') {
                    setSearchResults(res.data.items || []);
                }
            } catch (error) {
                console.error("Lỗi tìm phim:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // Đợi 0.5s sau khi ngừng gõ mới tìm kiếm

        return () => clearTimeout(timer);
    }, [searchKeyword]);

    // 4. Xử lý Tạo Phòng
    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!user) return alert("Vui lòng đăng nhập!");
        if (!selectedMovie) return alert("Vui lòng tìm và chọn một bộ phim!");
        
        if (formData.mode === "scheduled" && !formData.scheduledTime) {
            return alert("Vui lòng chọn thời gian công chiếu!");
        }

        setIsCreating(true);
        try {
            const newRoomId = "room_" + Math.random().toString(36).substr(2, 9);
            
            const startTime = formData.mode === "scheduled" 
                ? new Date(formData.scheduledTime).getTime() 
                : Date.now();

            await set(ref(rtdb, `rooms/${newRoomId}/info`), {
                hostId: user.uid,
                hostName: user.displayName || user.email.split('@')[0],
                movieSlug: selectedMovie.slug, // Lưu slug để load API phim
                movieName: selectedMovie.name, // Lưu tên phim để hiển thị đẹp ở Sảnh
                isPrivate: formData.isPrivate,
                mode: formData.mode,
                scheduledTime: startTime,
                status: "waiting", 
                createdAt: Date.now()
            });

            await set(ref(rtdb, `rooms/${newRoomId}/videoState`), {
                playing: false,
                currentTime: 0,
                updatedAt: Date.now()
            });

            router.push(`/watch-party/${newRoomId}`);
        } catch (error) {
            console.error("Lỗi tạo phòng:", error);
            alert("Có lỗi xảy ra, không thể tạo phòng.");
            setIsCreating(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#00FF41] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 md:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                
                <div className="mb-10 text-center md:text-left border-b border-white/5 pb-6">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-white mb-2">
                        Phòng <span className="text-[#00FF41]">Công Chiếu</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-bold tracking-wider uppercase">Tạo phòng xem phim hoặc tham gia cùng mọi người</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* ================= CỘT TRÁI: FORM TẠO PHÒNG ================= */}
                    <div className="md:col-span-1 bg-[#111111] border border-white/5 p-6 shadow-2xl h-fit">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#00FF41] mb-6">Khởi Tạo Phòng</h2>
                        
                        {!user ? (
                            <div className="text-center py-8">
                                <p className="text-xs text-gray-500 mb-4 uppercase font-bold tracking-widest">Yêu cầu đăng nhập</p>
                                <button onClick={() => router.push('/login')} className="bg-[#00FF41] text-black px-6 py-3 font-bold text-xs uppercase hover:bg-white transition-colors">Xác Thực Ngay</button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateRoom} className="space-y-6">
                                
                                {/* 1. Ô TÌM KIẾM VÀ CHỌN PHIM */}
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chọn Phim</label>
                                    
                                    {!selectedMovie ? (
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
                                                placeholder="Gõ tên phim để tìm..."
                                                className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#00FF41] transition-colors"
                                            />
                                            {isSearching && <span className="absolute right-4 top-3.5 w-4 h-4 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin"></span>}
                                            
                                            {/* DROPDOWN KẾT QUẢ TÌM KIẾM */}
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 max-h-60 overflow-y-auto z-20 shadow-2xl">
                                                    {searchResults.map((movie) => (
                                                        <div 
                                                            key={movie.slug}
                                                            onClick={() => {
                                                                setSelectedMovie({ name: movie.name, slug: movie.slug });
                                                                setSearchKeyword("");
                                                                setSearchResults([]);
                                                            }}
                                                            className="px-4 py-3 hover:bg-[#00FF41]/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                                        >
                                                            <p className="text-sm font-bold text-white line-clamp-1">{movie.name}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase mt-1">{movie.origin_name || movie.slug}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // GIAO DIỆN KHI ĐÃ CHỌN PHIM
                                        <div className="bg-[#0a0a0a] border border-[#00FF41]/30 p-3 flex justify-between items-center">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <p className="text-[10px] text-[#00FF41] uppercase font-bold mb-1">Đã chọn</p>
                                                <p className="text-sm font-bold text-white truncate">{selectedMovie.name}</p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setSelectedMovie(null)}
                                                className="text-[10px] text-gray-400 hover:text-white uppercase font-bold bg-white/5 px-2 py-1"
                                            >
                                                Đổi
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Quyền riêng tư */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quyền Riêng Tư</label>
                                    <div className="flex flex-col gap-3">
                                        <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${!formData.isPrivate ? 'border-[#00FF41] bg-[#00FF41]/5' : 'border-white/5 bg-[#0a0a0a]'}`}>
                                            <input type="radio" name="privacy" checked={!formData.isPrivate} onChange={() => setFormData({...formData, isPrivate: false})} className="hidden" />
                                            <div className={`w-3 h-3 rounded-full border ${!formData.isPrivate ? 'border-[#00FF41] bg-[#00FF41]' : 'border-gray-600'}`}></div>
                                            <span className="text-sm font-bold text-gray-200">Công Khai (Hiển thị ở sảnh)</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${formData.isPrivate ? 'border-[#00FF41] bg-[#00FF41]/5' : 'border-white/5 bg-[#0a0a0a]'}`}>
                                            <input type="radio" name="privacy" checked={formData.isPrivate} onChange={() => setFormData({...formData, isPrivate: true})} className="hidden" />
                                            <div className={`w-3 h-3 rounded-full border ${formData.isPrivate ? 'border-[#00FF41] bg-[#00FF41]' : 'border-gray-600'}`}></div>
                                            <span className="text-sm font-bold text-gray-200">Kín (Chỉ vào bằng Link)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* 3. Chế độ xem */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời Gian Phát</label>
                                    <select 
                                        value={formData.mode}
                                        onChange={(e) => setFormData({...formData, mode: e.target.value})}
                                        className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#00FF41] cursor-pointer"
                                    >
                                        <option value="now">Xem Ngay Lập Tức</option>
                                        <option value="scheduled">Lên Lịch Công Chiếu</option>
                                    </select>
                                </div>

                                {/* 4. Chọn giờ nếu là Công Chiếu */}
                                {formData.mode === "scheduled" && (
                                    <div className="space-y-2 animate-pulse">
                                        <label className="text-[10px] font-bold text-[#00FF41] uppercase tracking-widest">Chọn Giờ G</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            value={formData.scheduledTime}
                                            onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                                            className="w-full bg-[#0a0a0a] border border-[#00FF41]/30 px-4 py-3 text-sm text-white outline-none focus:border-[#00FF41]"
                                        />
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isCreating || !selectedMovie}
                                    className="w-full bg-[#00FF41] text-black py-4 font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed mt-4"
                                >
                                    {isCreating ? 'Đang Khởi Tạo...' : 'Bắt Đầu Xem Chung'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* ================= CỘT PHẢI: DANH SÁCH PHÒNG CÔNG KHAI ================= */}
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300">Phòng Đang Hoạt Động</h2>
                            <span className="text-[10px] border border-[#00FF41]/30 text-[#00FF41] px-3 py-1 font-bold uppercase tracking-widest bg-[#00FF41]/5">
                                {publicRooms.length} Phòng
                            </span>
                        </div>

                        {publicRooms.length === 0 ? (
                            <div className="bg-[#111111] border border-white/5 p-16 text-center">
                                <span className="text-4xl opacity-10 block mb-4">🎬</span>
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Sảnh đang trống</p>
                                <p className="text-gray-600 text-xs mt-2">Hãy là người đầu tiên tạo phòng công chiếu!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {publicRooms.map((room) => {
                                    const isScheduled = room.mode === "scheduled";
                                    const timeString = isScheduled 
                                        ? new Date(room.scheduledTime).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit' })
                                        : "Đang phát";

                                    return (
                                        <div key={room.id} onClick={() => router.push(`/watch-party/${room.id}`)} className="bg-[#111111] border border-white/5 hover:border-[#00FF41]/40 transition-all p-5 group cursor-pointer flex flex-col justify-between relative overflow-hidden">
                                            {/* Hiệu ứng viền sáng nhẹ khi hover */}
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF41] transform -translate-x-1 group-hover:translate-x-0 transition-transform"></div>
                                            
                                            <div>
                                                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                                    <span className={`text-[9px] px-2 py-1 font-bold uppercase tracking-widest ${isScheduled ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20 animate-pulse'}`}>
                                                        {isScheduled ? 'Lên Lịch' : 'Live'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500">{timeString}</span>
                                                </div>
                                                
                                                {/* Hiển thị Tên Phim thay vì Slug */}
                                                <h3 className="font-bold text-white text-base leading-snug mb-2 line-clamp-2" title={room.movieName || room.movieSlug}>
                                                    {room.movieName || room.movieSlug}
                                                </h3>
                                                <p className="text-[11px] text-gray-500 font-bold uppercase">
                                                    Host: <span className="text-gray-300">{room.hostName}</span>
                                                </p>
                                            </div>
                                            
                                            <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-[#00FF41] font-bold uppercase tracking-widest">Tham gia ngay</span>
                                                <span className="text-[#00FF41]">➔</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}