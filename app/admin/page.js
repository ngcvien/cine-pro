"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    startAfter,
    getCountFromServer,
    where
} from "firebase/firestore";
import AdminGuard from "@/components/AdminGuard";
import { searchMoviesHybrid } from "@/lib/movieService";
import AddMoviePage from "./add-movie/page"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | hot | custom | users | reports
    const [editSlug, setEditSlug] = useState(null);

    // 2. HÀM CHUYỂN TAB SANG CHẾ ĐỘ SỬA
    const handleEditClick = (slug) => {
        setEditSlug(slug);      // Lưu slug
        setActiveTab("add-movie"); // Chuyển tab
    };
    const handleAddNewClick = () => {
        setEditSlug(null);      // Xóa slug để form trống
        setActiveTab("add-movie");
    };
    return (
        <AdminGuard>
            <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans flex ">

                {/* --- SIDEBAR (MENU TRÁI) --- */}
                <aside className="w-64 border-r border-white/5 bg-[#050505] flex flex-col fixed h-full z-10">
                    <div className="p-6 border-b border-white/5">
                        <h1 className="text-xl font-bold text-white tracking-widest uppercase">ADMIN CP</h1>
                        <p className="text-[10px] text-gray-500 mt-1">Version 2.0</p>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-6 space-y-1">
                        <MenuItem label="Tổng Quan" id="dashboard" activeTab={activeTab} onClick={setActiveTab} />
                        <div className="px-6 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">Quản Lý Phim</div>
                        <MenuItem label="Phim Đề Cử (Hot)" id="hot" activeTab={activeTab} onClick={setActiveTab} />
                        <MenuItem label="Danh Sách Phim" id="custom" activeTab={activeTab} onClick={setActiveTab} />
                        {/* <MenuItem label="Thêm phim mới" id="add-movie" activeTab={activeTab} onClick={setActiveTab} /> */}


                        <button
                            onClick={handleAddNewClick}
                            className={`w-full text-left px-6 py-3 text-sm font-medium transition-all border-l-2 ${activeTab === 'add-movie'
                                ? "border-[#00FF41] text-white bg-white/5"
                                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            + Thêm Phim Mới
                        </button>
                        {/* Link sang trang Add Movie riêng biệt */}
                        {/* <Link href="/admin/add-movie" className="block px-6 py-3 text-sm hover:bg-white/5 hover:text-[#00FF41] transition-colors text-gray-400">
                            + Thêm Phim Mới
                        </Link> */}

                        <div className="px-6 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">Hệ Thống</div>
                        <MenuItem label="Báo Lỗi (Report)" id="reports" activeTab={activeTab} onClick={setActiveTab} />
                        <MenuItem label="Người Dùng" id="users" activeTab={activeTab} onClick={setActiveTab} />
                    </nav>

                    <div className="p-4 border-t border-white/5">
                        <Link href="/" className="text-xs text-gray-500 hover:text-white uppercase font-bold">
                            ← Về Trang Chủ
                        </Link>
                    </div>
                </aside>

                {/* --- MAIN CONTENT (CỘT PHẢI) --- */}
                <main className="flex-1 ml-64 p-8">
                    {/* Header của từng Tab */}
                    <header className="mb-8 flex justify-between items-end border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                                {activeTab === 'dashboard' && "Tổng Quan Hệ Thống"}
                                {activeTab === 'hot' && "Quản Lý Phim Hot"}
                                {activeTab === 'custom' && "Danh Sách Phim Custom"}
                                {activeTab === 'users' && "Quản Lý Người Dùng"}
                                {activeTab === 'reports' && "Phản Hồi & Báo Lỗi"}
                            </h2>
                        </div>
                    </header>

                    {/* Nội dung thay đổi theo Tab */}
                    <div className="animate-in fade-in duration-300">
                        {activeTab === 'dashboard' && <DashboardStats
                            switchTab={setActiveTab}
                            triggerAddMovie={handleAddNewClick}
                        />}
                        {activeTab === 'hot' && <HotMovieManager />}
                        {activeTab === 'add-movie' && <AddMoviePage editSlug={editSlug} />}
                        {activeTab === 'custom' && <CustomMovieManager onEdit={handleEditClick} />}
                        {activeTab === 'users' && <UserManager />}
                        {activeTab === 'reports' && <ReportManager />}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}

// --- CÁC COMPONENT CON (PLACEHOLDER CHO BƯỚC NÀY) ---

// --- TRANG TỔNG QUAN (REALTIME DASHBOARD) ---
function DashboardStats({ switchTab, triggerAddMovie }) {
    const [stats, setStats] = useState({
        totalMovies: 0,
        totalUsers: 0,
        totalReports: 0,
        totalViews: 0 // Cái này có thể tính tổng hoặc lấy từ config
    });
    const [recentMovies, setRecentMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Lấy số lượng Phim Custom (Dùng getCountFromServer cho tiết kiệm, không tốn Read nhiều)
                const moviesColl = collection(db, "custom_movies");
                const moviesSnapshot = await getCountFromServer(moviesColl);

                // 2. Lấy số lượng User (Tương tự)
                const usersColl = collection(db, "users");
                const usersSnapshot = await getCountFromServer(usersColl);

                // 3. Lấy 5 phim cập nhật gần nhất
                const recentQuery = query(moviesColl, orderBy("updatedAt", "desc"), limit(5));
                const recentSnap = await getDocs(recentQuery);
                const recentList = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 4. Tính tổng view (Chỉ tính trên 5 phim gần nhất để demo, 
                // hoặc bạn phải lưu tổng view vào 1 biến riêng trong 'configs' để đỡ tốn read)
                const currentViews = recentList.reduce((acc, curr) => acc + (curr.view || 0), 0);

                setStats({
                    totalMovies: moviesSnapshot.data().count,
                    totalUsers: usersSnapshot.data().count,
                    totalReports: 0, // Chưa làm collection report nên để 0
                    totalViews: currentViews // Demo view
                });

                setRecentMovies(recentList);

            } catch (error) {
                console.error("Lỗi tải dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* PHẦN 1: THẺ THỐNG KÊ (STATS CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Tổng Phim */}
                <div className="bg-[#121212] border border-white/5 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🎬</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Kho Phim Custom</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{loading ? "-" : stats.totalMovies}</span>
                        <span className="text-[10px] text-[#00FF41] mb-1 font-bold">▲ Đang hoạt động</span>
                    </div>
                </div>

                {/* Card 2: Thành Viên */}
                <div className="bg-[#121212] border border-white/5 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">👥</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Thành Viên</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{loading ? "-" : stats.totalUsers}</span>
                        <span className="text-[10px] text-blue-500 mb-1 font-bold">+ Mới hôm nay</span>
                    </div>
                </div>

                {/* Card 3: Lượt Xem (Demo) */}
                <div className="bg-[#121212] border border-white/5 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">👁️</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">View (Gần đây)</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{loading ? "-" : stats.totalViews.toLocaleString()}</span>
                        <span className="text-[10px] text-yellow-500 mb-1 font-bold">● Realtime</span>
                    </div>
                </div>

                {/* Card 4: Trạng thái hệ thống */}
                <div className="bg-[#121212] border border-white/5 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">⚡</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Hệ Thống</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-[#00FF41]">TỐT</span>
                        <span className="text-[10px] text-gray-400 mb-1">Ping: 14ms</span>
                    </div>
                </div>
            </div>

            {/* PHẦN 2: HOẠT ĐỘNG GẦN ĐÂY & LỐI TẮT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Cột Trái: Danh sách phim mới cập nhật (Chiếm 2 phần) */}
                <div className="lg:col-span-2 bg-[#121212] border border-white/5">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-l-2 border-[#00FF41] pl-3">
                            Vừa Cập Nhật
                        </h3>
                        <button
                            onClick={() => switchTab('custom')} // Gọi trực tiếp hàm switchTab
                            className="text-[10px] text-gray-500 hover:text-white uppercase font-bold"
                        >
                            Xem tất cả →
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td className="p-4 text-center text-gray-600 text-xs">Đang tải dữ liệu...</td></tr>
                                ) : recentMovies.length === 0 ? (
                                    <tr><td className="p-4 text-center text-gray-600 text-xs">Chưa có hoạt động nào.</td></tr>
                                ) : (
                                    recentMovies.map(movie => (
                                        <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 w-12">
                                                <img
                                                    src={movie.poster_url?.startsWith('http') ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`}
                                                    className="w-8 h-10 object-cover rounded-sm"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="font-bold text-gray-200 text-xs">{movie.name}</div>
                                                <div className="text-[10px] text-gray-500">{movie.slug}</div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="text-[10px] text-gray-400">
                                                    {movie.updatedAt ? new Date(movie.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </div>
                                                <div className="text-[10px] text-gray-600">
                                                    {movie.updatedAt ? new Date(movie.updatedAt).toLocaleDateString('vi-VN') : ''}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${movie.status === 'completed'
                                                    ? 'text-green-500 border-green-900 bg-green-900/10'
                                                    : 'text-yellow-500 border-yellow-900 bg-yellow-900/10'
                                                    }`}>
                                                    {movie.status === 'completed' ? 'FULL' : 'ONGOING'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cột Phải: Lối tắt & Server Info */}
                <div className="space-y-6">

                    {/* Panel Lối Tắt */}
                    <div className="bg-[#121212] border border-white/5 p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Lối Tắt Admin</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={triggerAddMovie} // Gọi hàm triggerAddMovie được truyền xuống
                                className="bg-white/5 hover:bg-[#00FF41] hover:text-black text-gray-300 p-3 text-xs font-bold uppercase transition-all border border-white/10 flex flex-col items-center gap-2"
                            >
                                <span className="text-xl">+</span>
                                Thêm Phim
                            </button>
                            <button
                                className="bg-white/5 hover:bg-white hover:text-black text-gray-300 p-3 text-xs font-bold uppercase transition-all border border-white/10 flex flex-col items-center gap-2"
                            >
                                <span className="text-xl">⚙️</span>
                                Cấu Hình
                            </button>
                            <button
                                className="bg-white/5 hover:bg-red-500 hover:text-white text-gray-300 p-3 text-xs font-bold uppercase transition-all border border-white/10 flex flex-col items-center gap-2"
                            >
                                <span className="text-xl">⚠️</span>
                                Báo Lỗi (0)
                            </button>
                            <button
                                className="bg-white/5 hover:bg-blue-500 hover:text-white text-gray-300 p-3 text-xs font-bold uppercase transition-all border border-white/10 flex flex-col items-center gap-2"
                            >
                                <span className="text-xl">📢</span>
                                Thông Báo
                            </button>
                        </div>
                    </div>

                    {/* Panel Server Health (Giả lập) */}
                    <div className="bg-[#121212] border border-white/5 p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Server Resources</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>Firestore Reads</span>
                                    <span>24%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[24%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>Storage Used</span>
                                    <span>45%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 w-[45%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>Bandwidth</span>
                                    <span>12%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#00FF41] w-[12%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- QUẢN LÝ PHIM HOT (KHỚP VỚI CẤU TRÚC DB CỦA BẠN) ---
function HotMovieManager() {
    const [queryStr, setQueryStr] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [hotList, setHotList] = useState([]); // Danh sách phim đầy đủ (đã fetch từ slug)
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // 1. TẢI DANH SÁCH HOT TỪ DB & FETCH CHI TIẾT
    useEffect(() => {
        const fetchHotMovies = async () => {
            try {
                // Gọi API Route chúng ta vừa tạo ở Bước 1
                const res = await fetch("/api/config/hero");
                const data = await res.json();

                if (Array.isArray(data)) {
                    setHotList(data);
                }
            } catch (e) {
                console.error("Lỗi tải phim hot:", e);
            }
        };
        fetchHotMovies();
    }, []);

    // 2. TÌM KIẾM PHIM (Giữ nguyên logic cũ)
    const handleSearch = async () => {
        if (!queryStr.trim()) return;
        setIsSearching(true);
        try {
            const res = await searchMoviesHybrid(queryStr);
            setSearchResults(res.status === 'success' ? res.data.items : []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    // 3. THÊM PHIM VÀO LIST
    const addMovie = (movie) => {
        if (hotList.find(m => m.slug === movie.slug)) {
            return alert("Phim này đã có trong danh sách!");
        }
        // Thêm vào UI ngay lập tức
        setHotList([...hotList, movie]);
    };

    // 4. XÓA PHIM
    const removeMovie = (slug) => {
        setHotList(hotList.filter(m => m.slug !== slug));
    };

    // 5. SẮP XẾP (Lên/Xuống)
    const moveItem = (index, direction) => {
        const newList = [...hotList];
        if (direction === 'up' && index > 0) {
            [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
        }
        if (direction === 'down' && index < newList.length - 1) {
            [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        }
        setHotList(newList);
    };

    // 6. LƯU VÀO FIRESTORE (QUAN TRỌNG: CHỈ LƯU SLUG)
    const saveChanges = async () => {
        setLoading(true);
        try {
            // Trích xuất chỉ lấy mảng slug từ danh sách phim đầy đủ
            const slugArray = hotList.map(m => m.slug);

            const docRef = doc(db, "configs", "hero_banner"); // Đúng collection/doc của bạn

            // Lưu đè mảng movie_slugs mới
            await setDoc(docRef, { movie_slugs: slugArray }, { merge: true });

            alert(`✅ Đã lưu ${slugArray.length} phim vào Banner thành công!`);
        } catch (e) {
            console.error(e);
            alert("Lỗi lưu: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[80vh]">

            {/* CỘT TRÁI: TÌM KIẾM (GIỮ NGUYÊN GIAO DIỆN CŨ) */}
            <div className="flex flex-col gap-4">
                <div className="bg-[#121212] p-4 border border-white/5">
                    <h3 className="text-xs font-bold uppercase text-[#00FF41] mb-2 tracking-widest">1. Tìm & Chọn Phim</h3>
                    <div className="flex gap-0">
                        <input
                            className="flex-1 bg-black border border-white/10 p-3 text-white text-sm outline-none focus:border-[#00FF41]"
                            placeholder="Nhập tên phim..."
                            value={queryStr}
                            onChange={e => setQueryStr(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <button onClick={handleSearch} disabled={isSearching} className="bg-white text-black px-6 text-xs font-bold uppercase hover:bg-gray-200">
                            {isSearching ? "..." : "Tìm"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#121212] border border-white/5 p-2">
                    {searchResults.map((movie) => (
                        <div key={movie._id} className="flex gap-3 p-2 border-b border-white/5 hover:bg-white/5 group">
                            <img
                                src={movie.poster_url.startsWith('http') ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`}
                                className="w-12 h-16 object-cover bg-gray-800"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <div className="flex-1">
                                <div className="font-bold text-sm text-white group-hover:text-[#00FF41]">{movie.name}</div>
                                <div className="text-xs text-gray-500">{movie.year}</div>
                            </div>
                            <button onClick={() => addMovie(movie)} className="px-4 text-xs font-bold bg-white text-black hover:bg-[#00FF41] uppercase">Thêm</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* CỘT PHẢI: QUẢN LÝ SLUG (ĐÃ FETCH THÔNG TIN) */}
            <div className="flex flex-col gap-4">
                <div className="bg-[#121212] p-4 border border-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-yellow-500 tracking-widest">
                        2. Hero Banner ({hotList.length})
                    </h3>
                    <button
                        onClick={saveChanges}
                        disabled={loading}
                        className="bg-[#00FF41] text-black px-6 py-2 text-xs font-bold uppercase hover:bg-[#00cc33] shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                    >
                        {loading ? "Đang Lưu..." : "Lưu Thay Đổi"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-black border border-white/10 p-2 space-y-2">
                    {hotList.map((movie, index) => (
                        <div key={movie.slug} className="flex items-center gap-3 p-3 border border-white/10 bg-[#0a0a0a]">
                            <span className="font-mono text-gray-500 text-xs w-6 text-center">{index + 1}</span>
                            <img
                                src={movie.poster_url?.startsWith('http') ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`}
                                className="w-10 h-14 object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-gray-300 truncate">{movie.name}</div>
                                <div className="text-[10px] text-gray-600 truncate">{movie.slug}</div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="text-[10px] text-gray-500 hover:text-white disabled:opacity-30">▲</button>
                                <button onClick={() => moveItem(index, 'down')} disabled={index === hotList.length - 1} className="text-[10px] text-gray-500 hover:text-white disabled:opacity-30">▼</button>
                            </div>

                            <button onClick={() => removeMovie(movie.slug)} className="px-3 py-1 text-[10px] font-bold text-red-500 border border-red-900 hover:bg-red-900 ml-2 uppercase">Xóa</button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

// --- QUẢN LÝ PHIM CUSTOM (DATABASE NỘI BỘ) ---
function CustomMovieManager({ onEdit }) {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [lastDoc, setLastDoc] = useState(null); // Dùng cho phân trang (Load more)
    const [sortMode, setSortMode] = useState("updatedAt");

    // 1. Tải danh sách phim từ Firestore
    const fetchMovies = async (isLoadMore = false) => {
        setLoading(true);
        try {
            // Query cơ bản: Lấy phim mới cập nhật trước
            let q = query(
                collection(db, "custom_movies"),
                orderBy(sortMode, sortMode === 'updatedAt' ? "desc" : "asc"),
                limit(20)
            );

            // Nếu là Load More, bắt đầu sau document cuối cùng
            if (isLoadMore && lastDoc) {
                q = query(
                    collection(db, "custom_movies"),
                    orderBy(sortMode, sortMode === 'updatedAt' ? "desc" : "asc"),
                    startAfter(lastDoc),
                    limit(20)
                );
            }

            const snapshot = await getDocs(q);

            // Lưu document cuối để lần sau load tiếp
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible);

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (isLoadMore) {
                setMovies(prev => {
                    // --- ĐOẠN CODE MỚI ĐỂ LỌC TRÙNG ---
                    // 1. Tạo Set chứa các ID đã có để kiểm tra cho nhanh
                    const existingIds = new Set(prev.map(m => m.id));

                    // 2. Chỉ lấy những phim mới tải về mà CHƯA có trong danh sách cũ
                    const uniqueNewMovies = data.filter(m => !existingIds.has(m.id));

                    // 3. Gộp danh sách cũ + danh sách mới đã lọc
                    return [...prev, ...uniqueNewMovies];
                });
            } else {
                setMovies(data);
            }
        } catch (error) {
            console.error("Lỗi tải phim custom:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setLastDoc(null); // Reset phân trang
        fetchMovies(false);
    }, [sortMode]);

    // Gọi lần đầu
    useEffect(() => {
        fetchMovies();
    }, []);

    // 2. Xử lý Xóa phim
    const handleDelete = async (slug) => {
        if (!confirm(`Bạn có chắc muốn xóa phim "${slug}" và toàn bộ tập phim của nó?`)) return;

        try {
            await deleteDoc(doc(db, "custom_movies", slug));
            // Xóa xong thì update lại state UI
            setMovies(movies.filter(m => m.slug !== slug));
            alert("Đã xóa thành công!");
        } catch (error) {
            alert("Lỗi xóa: " + error.message);
        }
    };

    // 3. Lọc phim theo từ khóa (Client-side filter cho nhanh với list nhỏ)
    // Firestore search text khá yếu, nên với < 1000 phim, lọc client là ổn nhất
    const filteredMovies = movies.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Thanh công cụ */}
            <div className="bg-[#121212] p-4 border border-white/5 flex justify-between items-center">
                <div className="flex gap-2 w-1/2">
                    <input
                        className="flex-1 bg-black border border-white/10 p-3 text-white text-sm outline-none focus:border-[#00FF41]"
                        placeholder="Lọc nhanh theo tên hoặc slug..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 uppercase font-bold">Xếp theo:</label>
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        className="bg-black border border-white/10 text-white text-xs p-2 outline-none focus:border-[#00FF41]"
                    >
                        <option value="updatedAt">Mới cập nhật (Ẩn phim lỗi)</option>
                        <option value="slug">Tên A-Z (Hiện tất cả)</option>
                    </select>
                </div>
                <div className="text-xs text-gray-500 uppercase font-bold">
                    Tổng: {movies.length} phim (Đã tải)
                </div>
            </div>

            {/* Bảng Danh Sách */}
            <div className="overflow-x-auto bg-[#121212] border border-white/5">
                <table className="w-full text-left text-sm">
                    {/* ... (Thead giữ nguyên) ... */}
                    <tbody className="divide-y divide-white/5">
                        {filteredMovies.map(movie => (
                            <tr key={movie.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    {/* Xử lý ảnh rỗng */}
                                    {movie.poster_url ? (
                                        <img
                                            src={movie.poster_url.startsWith('http') ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`}
                                            className="w-10 h-14 object-cover border border-white/10"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    ) : (
                                        <div className="w-10 h-14 bg-gray-800 flex items-center justify-center text-[8px] text-gray-500">NO IMG</div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-white text-sm group-hover:text-[#00FF41] transition-colors">
                                        {movie.name || "Không có tên"}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">{movie.slug}</div>
                                </td>
                                <td className="p-4">
                                    {/* Xử lý thiếu status */}
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 border ${movie.status === 'completed'
                                        ? 'text-green-500 border-green-900 bg-green-900/10'
                                        : 'text-gray-500 border-gray-800 bg-gray-800/10'
                                        }`}>
                                        {movie.status || 'Chưa update'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="font-bold text-white">
                                        {movie.episodes?.reduce((acc, server) => acc + server.server_data.length, 0) || 0}
                                    </span>
                                    <span className="text-xs text-gray-600 block">tập</span>
                                </td>
                                <td className="p-4 text-xs text-gray-400">
                                    {/* Xử lý thiếu updatedAt */}
                                    {movie.updatedAt
                                        ? new Date(movie.updatedAt).toLocaleDateString('vi-VN')
                                        : <span className="text-red-500 italic">Thiếu ngày update</span>
                                    }
                                </td>
                                <td className="p-4 text-right space-x-3">
                                    <button onClick={() => onEdit(movie.slug)} className="text-xs font-bold text-gray-400 hover:text-white uppercase">Sửa</button>
                                    <button onClick={() => handleDelete(movie.slug)} className="text-xs font-bold text-red-500 hover:text-red-400 uppercase">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Nút Load More */}
            <div className="text-center">
                <button
                    onClick={() => fetchMovies(true)}
                    disabled={loading}
                    className="text-xs font-bold uppercase text-gray-500 hover:text-white disabled:opacity-30"
                >
                    {loading ? "Đang tải..." : "▼ Tải thêm phim cũ hơn"}
                </button>
            </div>
        </div>
    );
}

function UserManager() {
    return <div className="p-10 border border-dashed border-gray-700 text-center text-gray-500">Chức năng Quản lý User đang phát triển...</div>;
}

function ReportManager() {
    return <div className="p-10 border border-dashed border-gray-700 text-center text-gray-500">Chức năng Report đang phát triển...</div>;
}

// --- HELPER COMPONENTS ---

function MenuItem({ label, id, activeTab, onClick }) {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full text-left px-6 py-3 text-sm font-medium transition-all border-l-2 ${isActive
                ? "border-[#00FF41] text-white bg-white/5"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                }`}
        >
            {label}
        </button>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="bg-[#121212] border border-white/5 p-6">
            <h3 className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-wider">{label}</h3>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
        </div>
    );
}