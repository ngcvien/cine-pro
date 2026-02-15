"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { getMovieData } from "@/lib/movieService";
import { sendNotificationToFollowers } from "@/lib/notificationService";
import AdminGuard from "@/components/AdminGuard";
import { get } from "http";
import { s } from "framer-motion/client";

export default function AddMoviePage() {
    // 1. STATE CHO TÌM KIẾM
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // State Form (Giữ nguyên)
    const [formData, setFormData] = useState({
        slug: "",
        name: "",
        poster_url: "",
        thumb_url: "",
        serverName: "Vietsub",
        epName: "",
        epSlug: "",
        m3u8: "",
        embed: "",
        priority: false
    });

    // 2. HÀM TÌM KIẾM PHIM
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            // Gọi API tìm kiếm 
            const data = await getMovieData(`/v1/api/tim-kiem?keyword=${searchQuery}&limit=10`);
            if (data.status === 'success') {
                setSearchResults(data.data.items);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // 3. HÀM CHỌN PHIM (Tự động điền)
    const handleSelectMovie = (movie) => {
        // Xử lý link ảnh (API trả về link tương đối, cần thêm domain)
        const domain = "https://phimimg.com/";
        const poster = movie.poster_url.startsWith("http") ? movie.poster_url : domain + movie.poster_url;
        const thumb = movie.thumb_url.startsWith("http") ? movie.thumb_url : domain + movie.thumb_url;

        // Tự động điền vào Form
        setFormData({
            ...formData,
            slug: movie.slug,
            name: movie.name,
            poster_url: poster,
            thumb_url: thumb,
            // Reset các trường tập phim để nhập mới
            epName: "",
            epSlug: "",
            m3u8: "",
            embed: ""
        });

        // Xóa kết quả tìm kiếm để gọn giao diện
        setSearchResults([]);
        setSearchQuery("");
    };

    // Hàm Submit (Giữ nguyên logic cũ của bạn)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { slug, name, poster_url, thumb_url, serverName, epName, epSlug, m3u8, embed, priority } = formData;

        try {
            // --- BƯỚC A: KIỂM TRA XEM TẬP NÀY ĐÃ CÓ CHƯA (Logic Thông báo) ---
            let isNewEpisode = false;
            let currentMovieImage = thumb_url || poster_url;

            // Lấy dữ liệu phim hiện tại (Gộp cả API và Custom)
            const currentMovieData = await getMovieData(`/phim/${slug}`);

            if (currentMovieData?.status) {
                // Phim đã tồn tại -> Kiểm tra danh sách tập
                const allEpisodes = currentMovieData.episodes || [];

                // Làm phẳng danh sách: Gom tất cả tập từ các server lại thành 1 mảng
                const allSlugs = allEpisodes.flatMap(server =>
                    server.server_data.map(ep => ep.slug)
                );

                // Nếu slug tập mới KHÔNG nằm trong danh sách cũ -> Là tập mới
                if (!allSlugs.includes(epSlug)) {
                    isNewEpisode = true;
                }

                // Lấy ảnh hiện tại nếu admin không nhập ảnh mới
                if (!currentMovieImage) {
                    currentMovieImage = currentMovieData.movie.thumb_url || currentMovieData.movie.poster_url;
                }
            } else {
                // Phim chưa tồn tại bao giờ -> Chắc chắn là tập mới (hoặc phim mới)
                isNewEpisode = true;
            }
            // ----------------------------------------------------------------

            // --- BƯỚC B: LƯU VÀO FIRESTORE (Logic cũ giữ nguyên) ---
            const docRef = doc(db, "custom_movies", slug);
            const docSnap = await getDoc(docRef);

            const newEpisode = {
                name: epName,
                slug: epSlug,
                link_m3u8: m3u8,
                link_embed: embed || "",
                priority: priority
            };

            if (docSnap.exists()) {
                const data = docSnap.data();
                let episodes = data.episodes || [];
                const serverIndex = episodes.findIndex(s => s.server_name === serverName);

                if (serverIndex !== -1) {
                    episodes[serverIndex].server_data.push(newEpisode);
                } else {
                    episodes.push({ server_name: serverName, server_data: [newEpisode] });
                }

                await updateDoc(docRef, {
                    episodes,
                    ...(poster_url && { poster_url }),
                    ...(thumb_url && { thumb_url })
                });
            } else {
                await setDoc(docRef, {
                    slug,
                    name,
                    poster_url,
                    thumb_url,
                    is_custom_only: false,
                    episodes: [{ server_name: serverName, server_data: [newEpisode] }]
                });
            }

            // --- BƯỚC C: GỬI THÔNG BÁO (Nếu là tập mới) ---
            if (isNewEpisode) {
                const watchLink = `/phim/${slug}?tap=${epSlug}`;

                // Lấy ID Token của Admin hiện tại để gửi lên Server xác thực
                const token = await auth.currentUser.getIdToken();

                // Gọi API
                fetch("/api/admin/notify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // Gửi token xác thực
                    },
                    body: JSON.stringify({
                        slug: slug,
                        movieName: name || currentMovieData?.movie?.name,
                        episodeName: epName,
                        posterUrl: currentMovieImage,
                        link: watchLink
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert(`✅ Server: Đã gửi thông báo cho ${data.count} người!`);
                        } else {
                            console.log("Server message:", data.message);
                        }
                    })
                    .catch(err => console.error("Lỗi gọi API notify:", err));

                alert("Đã lưu phim thành công!");
            } else {
                alert("Đã lưu phim thành công! (Tập này đã tồn tại trước đó, không gửi thông báo)");
            }

        } catch (error) {
            console.error(error);
            alert("Lỗi: " + error.message);
        }
    };

    return (
        <AdminGuard>
            <div className="p-10 bg-gray-900 min-h-screen text-white">
                <h1 className="text-2xl font-bold mb-5 mt-16">Thêm, Cập nhật phim & Server Thủ Công</h1>

                {/* --- KHU VỰC TÌM KIẾM NHANH (MỚI) --- */}
                <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-primary font-bold mb-2">Nhập nhanh từ API</h3>
                    <div className="flex gap-2">
                        <input
                            placeholder="Nhập tên phim để tìm (vd: One Piece)..."
                            className="flex-1 p-2 bg-black border border-gray-600 rounded"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
                        >
                            {isSearching ? "Đang tìm..." : "Tìm & Điền"}
                        </button>
                    </div>

                    {/* Danh sách kết quả tìm kiếm */}
                    {searchResults.length > 0 && (
                        <ul className="mt-2 bg-black border border-gray-700 rounded max-h-60 overflow-y-auto">
                            {searchResults.map(movie => (
                                <li key={movie._id}
                                    onClick={() => handleSelectMovie(movie)}
                                    className="p-2 hover:bg-gray-700 cursor-pointer flex gap-3 items-center border-b border-gray-800 last:border-0"
                                >
                                    <img
                                        src={movie.poster_url.startsWith('http') ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`}
                                        className="w-10 h-14 object-cover rounded"
                                    />
                                    <div>
                                        <div className="font-bold text-white">{movie.name}</div>
                                        <div className="text-xs text-gray-400">{movie.original_name} ({movie.year})</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* ------------------------------------ */}

                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                    {/* Các Input Form (Đã được liên kết với state formData) */}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400">Slug (Tự động điền)</label>
                            <input
                                value={formData.slug} // Binding 2 chiều
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="Slug (vd: dao-hai-tac)"
                                className="w-full p-2 bg-black border border-gray-700 rounded"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Tên phim (Tự động điền)</label>
                            <input
                                value={formData.name} // Binding 2 chiều
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Tên phim"
                                className="w-full p-2 bg-black border border-gray-700 rounded"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <input
                            value={formData.poster_url}
                            onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
                            placeholder="Link Poster"
                            className="w-full p-2 bg-black border border-gray-700 rounded"
                        />

                        <input
                            value={formData.thumb_url}
                            onChange={e => setFormData({ ...formData, thumb_url: e.target.value })}
                            placeholder="Link Thumb"
                            className="w-full p-2 bg-black border border-gray-700 rounded"
                        />
                    </div>

                    {/* --- Phần nhập Tập phim (Giữ nguyên) --- */}
                    <div className="border p-4 rounded border-gray-700 bg-gray-800/50">
                        <h3 className="mb-2 font-bold text-primary">Thông tin Tập & Server</h3>
                        <input
                            value={formData.serverName}
                            onChange={e => setFormData({ ...formData, serverName: e.target.value })}
                            placeholder="Tên Server (vd: Lồng Tiếng)"
                            className="w-full p-2 bg-black border border-gray-600 rounded mb-2"
                        />

                        <div className="flex gap-2 mb-2">
                            <input
                                value={formData.epName}
                                onChange={e => setFormData({ ...formData, epName: e.target.value })}
                                placeholder="Tên tập (Tập 1)"
                                className="w-1/2 p-2 bg-black border border-gray-600 rounded"
                            />
                            <input
                                value={formData.epSlug}
                                onChange={e => setFormData({ ...formData, epSlug: e.target.value })}
                                placeholder="Slug tập (tap-1)"
                                className="w-1/2 p-2 bg-black border border-gray-600 rounded"
                            />
                        </div>

                        <input
                            value={formData.m3u8}
                            onChange={e => setFormData({ ...formData, m3u8: e.target.value })}
                            placeholder="Link M3U8"
                            className="w-full p-2 bg-black border border-gray-600 rounded mb-2"
                        />

                        <input
                            value={formData.embed}
                            onChange={e => setFormData({ ...formData, embed: e.target.value })}
                            placeholder="Link Embed"
                            className="w-full p-2 bg-black border border-gray-600 rounded mb-2"
                        />

                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="priority"
                                className="w-5 h-5 accent-primary"
                                checked={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.checked })}
                            />
                            <label htmlFor="priority" className="text-primary font-bold cursor-pointer">
                                Ưu tiên tập này (Ghi đè API)
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary hover:bg-green-400 text-black font-bold py-3 rounded transition-all">
                        Lưu Phim
                    </button>
                </form>
            </div>
        </AdminGuard>
    );
}