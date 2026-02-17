"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { searchMoviesHybrid, getMovieData, getImageUrl } from "@/lib/movieService";
import AdminGuard from "@/components/AdminGuard";


export default function AddMoviePage({ editSlug }) {
    // --- STATE QUẢN LÝ ---
    const [activeTab, setActiveTab] = useState("info"); // 'info' | 'episodes'
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputMode, setInputMode] = useState("table"); // 'table' | 'paste'

    const [genreOptions, setGenreOptions] = useState([]);
    const [countryOptions, setCountryOptions] = useState([]);

    useEffect(() => {
        const loadMovieData = async () => {
            // Nếu không có editSlug (tức là đang thêm mới) -> Reset form về mặc định
            if (!editSlug) {
                resetForm();
                return;
            }

            setLoading(true);
            try {
                // Lấy dữ liệu từ Firestore (Custom Movies)
                const docRef = doc(db, "custom_movies", editSlug);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // A. Điền Tab 1: Thông tin phim
                    // Lưu ý: Cần map đúng cấu trúc nested object mà bạn đã tạo ở bài trước
                    setMovieForm({
                        status: data.api_status || true,
                        msg: data.api_msg || "",
                        movie: {
                            ...data, // Spread toàn bộ data gốc
                            // Xử lý các object con để tránh lỗi undefined
                            tmdb: data.tmdb || { type: "", id: "", season: "", vote_average: 0, vote_count: 0 },
                            imdb: data.imdb || { id: "" },
                            created: data.created || { time: "" },
                            modified: data.modified || { time: "" },
                            actor: data.actor || [],
                            director: data.director || [],
                            category: data.category || [],
                            country: data.country || []
                        }
                    });

                    // B. Điền Tab 2: Danh sách tập
                    if (data.episodes && data.episodes.length > 0) {
                        // Mặc định lấy server đầu tiên để hiển thị lên bảng
                        const firstServer = data.episodes[0];
                        setServerConfig({
                            serverName: firstServer.server_name,
                            priority: false // Hoặc lấy từ data nếu bạn có lưu
                        });
                        setEpisodeList(firstServer.server_data || []);
                    } else {
                        setEpisodeList([]);
                    }

                    // Chuyển về Tab Info để người dùng thấy ngay
                    setActiveTab("info");
                }
            } catch (error) {
                console.error("Lỗi tải phim để sửa:", error);
                alert("Không tải được dữ liệu phim!");
            } finally {
                setLoading(false);
            }
        };

        loadMovieData();
    }, [editSlug]);

    const resetForm = () => {
        setMovieForm({
            status: true, msg: "",
            movie: {
                _id: "", name: "", slug: "", origin_name: "", content: "",
                type: "series", status: "ongoing", poster_url: "", thumb_url: "",
                trailer_url: "", time: "", episode_current: "", episode_total: "",
                quality: "HD", lang: "Vietsub", notify: "", showtimes: "",
                year: 2024, view: 0,
                is_copyright: false, sub_docquyen: false, chieurap: false,
                tmdb: { type: "", id: "", season: "", vote_average: 0, vote_count: 0 },
                imdb: { id: "" },
                created: { time: "" }, modified: { time: "" },
                actor: [], director: [], category: [], country: []
            }
        });
        setEpisodeList([{ name: "Tập 1", slug: "tap-1", m3u8: "", embed: "" }]);
        setServerConfig({ serverName: "Vietsub", priority: false });
        setActiveTab("info");
    };

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const dataGenre = await getMovieData('the-loai/');
                const dataCountry = await getMovieData('quoc-gia/');


                // API trả về mảng trực tiếp: [{name, slug...}, {...}]
                setGenreOptions(dataGenre || []);
                setCountryOptions(dataCountry || []);
            } catch (error) {
                console.error("Lỗi lấy danh sách Thể loại/Quốc gia:", error);
            }
        };

        fetchMetadata();
    }, []);

    // 1. FORM THÔNG TIN PHIM (MOVIE INFO)
    const [movieForm, setMovieForm] = useState({
        status: true,
        msg: "",
        movie: {
            _id: "", name: "", slug: "", origin_name: "", content: "",
            type: "series", status: "ongoing", poster_url: "", thumb_url: "",
            trailer_url: "", time: "", episode_current: "", episode_total: "",
            quality: "HD", lang: "Vietsub", notify: "", showtimes: "",
            year: 2024, view: 0,
            is_copyright: false, sub_docquyen: false, chieurap: false,
            tmdb: { type: "", id: "", season: "", vote_average: 0, vote_count: 0 },
            imdb: { id: "" },
            created: { time: "" },
            modified: { time: "" },
            actor: [], director: [], category: [], country: []
        }
    });

    const handleMovieChange = (field, value) => {
        setMovieForm(prev => ({
            ...prev,
            movie: { ...prev.movie, [field]: value }
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setMovieForm(prev => ({
            ...prev,
            movie: {
                ...prev.movie,
                [parent]: { ...prev.movie[parent], [field]: value }
            }
        }));
    };

    // 2. FORM TẬP PHIM (EPISODES)
    const [serverConfig, setServerConfig] = useState({
        serverName: "Vietsub",
        priority: false
    });
    const [episodeList, setEpisodeList] = useState([
        { name: "Tập 1", slug: "tap-1", link_m3u8: "", link_embed: "" }
    ]);
    const [bulkText, setBulkText] = useState(""); // Dùng cho tab Dán nhanh

    // Hàm tạo slug tự động (vd: Tập 1 -> tap-1)
    const generateSlug = (text) => {
        return text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    };

    // Logic thêm/sửa/xóa dòng trong Bảng
    const handleAddRow = () => {
        const nextEpNum = episodeList.length + 1;
        setEpisodeList([...episodeList, { name: `Tập ${nextEpNum}`, slug: `tap-${nextEpNum}`, link_m3u8: "", link_embed: "" }]);
    };

    const handleRemoveRow = (index) => {
        const newList = [...episodeList];
        newList.splice(index, 1);
        setEpisodeList(newList);
    };

    const handleEpChange = (index, field, value) => {
        const newList = [...episodeList];
        newList[index][field] = value;
        if (field === 'name') newList[index].slug = generateSlug(value); // Auto update slug
        setEpisodeList(newList);
    };

    // Logic Phân tích text khi Dán (Paste)
    const handleParseBulk = () => {
        if (!bulkText.trim()) return alert("Chưa nhập nội dung!");
        const lines = bulkText.split("\n");
        const parsedList = [];

        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = line.split("|").map(s => s.trim());
            if (parts.length >= 2) { // Yêu cầu tối thiểu có Tên và Link
                parsedList.push({
                    name: parts[0],
                    slug: generateSlug(parts[0]),
                    link_m3u8: parts[1],
                    link_embed: parts[2] || ""
                });
            }
        });

        if (parsedList.length > 0) {
            setEpisodeList(parsedList); // Cập nhật vào bảng
            setInputMode("table"); // Chuyển ngay sang chế độ bảng để user check
            setBulkText("");
            alert(`Đã nhận diện ${parsedList.length} tập. Vui lòng kiểm tra lại bảng dữ liệu.`);
        } else {
            alert("Định dạng không đúng. Vui lòng nhập: Tên Tập | Link M3U8");
        }
    };



    // 3. FORM THÔNG BÁO (NOTIFICATION)
    const [notifyForm, setNotifyForm] = useState({
        send: true,
        customTitle: "",
        customMessage: ""
    });

    // --- LOGIC TÌM KIẾM & ĐIỀN DỮ LIỆU ---
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const data = await searchMoviesHybrid(searchQuery);
            console.log('data: ' + JSON.stringify(data.data?.items));
            setSearchResults(data.data?.items || []);
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
    };

    const handleSelectMovie = async (item) => {
        // TRƯỜNG HỢP 1: PHIM CUSTOM (Lấy từ Firebase)
        if (item.is_custom) {
            // Map dữ liệu từ item (phẳng) vào cấu trúc nested của movieForm
            setMovieForm({
                status: true,
                msg: "Dữ liệu từ Firebase",
                movie: {
                    ...item, // Spread toàn bộ dữ liệu gốc

                    // Đảm bảo các object con không bị undefined (tránh lỗi crash)
                    tmdb: item.tmdb || { type: "", id: "", season: "", vote_average: 0, vote_count: 0 },
                    imdb: item.imdb || { id: "" },
                    created: item.created || { time: new Date().toISOString() },
                    modified: item.modified || { time: new Date().toISOString() },

                    // Đảm bảo mảng
                    actor: item.actor || [],
                    director: item.director || [],
                    category: item.category || [],
                    country: item.country || []
                }
            });

            // Nếu muốn tự động set thông báo cho phim custom
            setNotifyForm(prev => ({
                ...prev,
                customTitle: `Phim ${item.name} có cập nhật!`,
                customMessage: `Vừa cập nhật tập mới.`
            }));

            // Dọn dẹp ô tìm kiếm
            setSearchResults([]);
            setSearchQuery("");
            return; // Dừng hàm, không gọi API nữa
        }

        // TRƯỜNG HỢP 2: PHIM TỪ API (Giữ nguyên code cũ)
        try {
            const data = await getMovieData(`phim/${item.slug}`);

            if (data.status) {
                setMovieForm({
                    status: data.status,
                    msg: data.msg || "Cập nhật từ API",
                    movie: {
                        ...data.movie,
                        // Xử lý nested object
                        tmdb: data.movie.tmdb || { type: "", id: "", season: "", vote_average: 0, vote_count: 0 },
                        imdb: data.movie.imdb || { id: "" },
                        created: data.movie.created || { time: new Date().toISOString() },
                        modified: data.movie.modified || { time: new Date().toISOString() },
                        actor: data.movie.actor || [],
                        director: data.movie.director || [],
                        category: data.movie.category || [],
                        country: data.movie.country || []
                    }
                });

                setNotifyForm(prev => ({
                    ...prev,
                    customTitle: `Phim ${data.movie.name} có cập nhật mới!`,
                    customMessage: `Vừa cập nhật tập mới, vào xem ngay!`
                }));
            }
        } catch (e) { console.error(e); }
        setSearchResults([]);
        setSearchQuery("");
    };

    // --- LOGIC LƯU THÔNG TIN PHIM (TAB 1) ---
    const handleSaveInfo = async () => {
        // Lưu ý: State giờ là movieForm.movie.slug chứ không phải movieForm.slug
        if (!movieForm.movie.slug) return alert("Chưa có Slug phim!");
        setLoading(true);
        try {
            const docRef = doc(db, "custom_movies", movieForm.movie.slug);
            const docSnap = await getDoc(docRef);

            let existingEpisodes = [];
            if (docSnap.exists()) {
                existingEpisodes = docSnap.data().episodes || [];
            }

            const saveData = {
                ...movieForm.movie, // Lưu toàn bộ object movie ra root
                api_status: movieForm.status,
                api_msg: movieForm.msg,
                episodes: existingEpisodes,
                updatedAt: new Date().toISOString()
            };

            await setDoc(docRef, saveData, { merge: true });
            alert("Đã lưu đầy đủ thông tin phim!");
        } catch (error) {
            alert("Lỗi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC LƯU TẬP PHIM (TAB 2 - BULK ADD) ---
    const handleSaveEpisodes = async () => {
        // 1. Validate dữ liệu đầu vào
        if (!movieForm.slug) return alert("Vui lòng chọn phim ở Tab 1 trước hoặc nhập Slug!");
        if (episodeList.length === 0) return alert("Danh sách tập đang trống!");

        // Lọc bỏ các dòng không có link (M3U8 hoặc Embed đều được)
        const validEpisodes = episodeList
            .filter(ep => ep.link_m3u8 || ep.link_embed)
            .map(ep => ({
                ...ep,
                name: ep.name.trim(), // Xóa khoảng trắng thừa
                priority: serverConfig.priority
            }));

        if (validEpisodes.length === 0) return alert("Không có tập nào có link! Vui lòng kiểm tra lại.");

        setLoading(true);
        try {
            const docRef = doc(db, "custom_movies", movieForm.slug);
            const docSnap = await getDoc(docRef);

            // 2. Lấy danh sách episodes hiện tại (nếu có)
            let currentEpisodes = [];
            let baseData = {}; // Dữ liệu nền (nếu phải tạo mới phim)

            if (docSnap.exists()) {
                const data = docSnap.data();
                currentEpisodes = data.episodes || [];
            } else {
                // Nếu phim chưa tồn tại, dùng thông tin từ form Movie Info làm nền
                baseData = { ...movieForm };
            }

            // 3. Logic Merge (Gộp tập mới vào danh sách cũ)
            // Tìm xem Server này (vd: Vietsub) đã có chưa?
            let serverIndex = currentEpisodes.findIndex(s => s.server_name === serverConfig.serverName);

            if (serverIndex === -1) {
                // Server mới -> Thêm nguyên cục mới vào
                currentEpisodes.push({
                    server_name: serverConfig.serverName,
                    server_data: validEpisodes
                });
            } else {
                // Server cũ -> Merge từng tập
                // Chúng ta lấy server_data cũ ra để sửa đổi
                const serverData = [...currentEpisodes[serverIndex].server_data];

                validEpisodes.forEach(newEp => {
                    // Tìm xem tập này (vd: tap-13) đã có trong server cũ chưa
                    const existIdx = serverData.findIndex(e => e.slug === newEp.slug);

                    if (existIdx !== -1) {
                        // Có rồi -> Ghi đè thông tin mới
                        serverData[existIdx] = newEp;
                    } else {
                        // Chưa có -> Thêm mới vào
                        serverData.push(newEp);
                    }
                });

                // Gán ngược lại vào danh sách tổng
                currentEpisodes[serverIndex].server_data = serverData;
            }

            // 4. LƯU VÀO FIRESTORE (QUAN TRỌNG)
            // Dùng setDoc với merge: true. 
            // Nó sẽ tự động tạo doc nếu chưa có, hoặc chỉ update field nếu đã có.
            await setDoc(docRef, {
                ...baseData, // Nếu tạo mới thì có thêm tên, ảnh...
                episodes: currentEpisodes // Field quan trọng nhất cần lưu
            }, { merge: true });

            // 5. Gửi thông báo (Logic cũ)
            if (notifyForm.send) {
                const token = await auth.currentUser.getIdToken();
                const lastEp = validEpisodes[validEpisodes.length - 1];

                // Chạy ngầm không cần await để UI phản hồi nhanh hơn
                fetch("/api/admin/notify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        slug: movieForm.slug,
                        movieName: movieForm.name,
                        episodeName: lastEp.name,
                        posterUrl: movieForm.thumb_url || movieForm.poster_url,
                        link: `/xem-phim/${movieForm.slug}?tap=${lastEp.slug}`,
                        customTitle: notifyForm.customTitle,
                        customMessage: notifyForm.customMessage
                    })
                }).catch(err => console.error("Lỗi gửi thông báo:", err));
            }

            console.log("Đã lưu episodes:", currentEpisodes); // Debug xem log có data không
            alert(`Đã lưu thành công ${validEpisodes.length} tập vào Database!`);

        } catch (error) {
            console.error("Lỗi lưu tập phim:", error);
            alert("Lỗi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans p-6">

                {/* HEADER & TÌM KIẾM */}
                <div className="max-w-5xl mx-auto mb-8">
                    <h1 className="text-xl font-bold text-white mb-4 tracking-wider uppercase">Quản Trị Phim</h1>

                    <div className="bg-[#121212] p-4 border border-white/5 rounded-sm">
                        <div className="flex gap-0">
                            <input
                                className="flex-1 bg-black border border-white/10 p-3 text-white focus:border-white/30 outline-none text-sm"
                                placeholder="Nhập tên phim để tìm kiếm nhanh từ API..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-white text-black px-6 text-xs font-bold uppercase hover:bg-gray-200"
                            >
                                {isSearching ? "Đang tìm..." : "Tìm Kiếm"}
                            </button>
                        </div>
                        {/* Kết quả tìm kiếm */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-black border border-white/10 max-h-60 overflow-y-auto">
                                {searchResults.map(m => (
                                    <div key={m._id}
                                        onClick={() => handleSelectMovie(m)}
                                        className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex justify-between items-center group"
                                    >
                                        <span className="font-medium text-white group-hover:text-[#00FF41]">{m.name}</span>
                                        <span className="text-xs text-gray-500">{m.year}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="max-w-5xl mx-auto mb-6 flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === "info"
                            ? "text-[#00FF41] border-b-2 border-[#00FF41]"
                            : "text-gray-500 hover:text-white"
                            }`}
                    >
                        1. Thông Tin Phim
                    </button>
                    <button
                        onClick={() => setActiveTab("episodes")}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === "episodes"
                            ? "text-[#00FF41] border-b-2 border-[#00FF41]"
                            : "text-gray-500 hover:text-white"
                            }`}
                    >
                        2. Quản Lý Tập
                    </button>
                </div>

                {/* TAB CONTENT */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* CỘT TRÁI: PREVIEW ẢNH */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* 1. KHUNG POSTER */}
                        <div className="aspect-[2/3] bg-[#121212] border border-white/5 flex items-center justify-center overflow-hidden relative group">
                            {movieForm.movie.poster_url ? (
                                <img
                                    src={
                                        getImageUrl(movieForm.movie.poster_url)
                                    }
                                    className="w-full h-full object-cover"
                                    alt="Poster Preview"
                                    onError={(e) => e.target.style.display = 'none'} // Ẩn nếu ảnh lỗi
                                />
                            ) : (
                                <div className="flex flex-col items-center text-gray-600">
                                    <span className="text-xs font-bold">NO POSTER</span>
                                </div>
                            )}
                        </div>

                        {/* 2. KHUNG THUMB (BACKDROP) */}
                        <div className="aspect-video bg-[#121212] border border-white/5 flex items-center justify-center overflow-hidden relative">
                            {movieForm.movie.thumb_url ? (
                                <img
                                    src={
                                        getImageUrl(movieForm.movie.thumb_url)
                                    }
                                    className="w-full h-full object-cover"
                                    alt="Thumb Preview"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            ) : (
                                <div className="flex flex-col items-center text-gray-600">
                                    <span className="text-xs font-bold">NO THUMBNAIL</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM NHẬP LIỆU */}
                    <div className="lg:col-span-2">

                        {/* === TAB 1: THÔNG TIN PHIM === */}
                        {activeTab === "info" && (
                            <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* 1. THÔNG TIN CƠ BẢN */}
                                <Section title="Thông Tin Cơ Bản">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Tên Phim" value={movieForm.movie.name} onChange={v => handleMovieChange('name', v)} />
                                        <InputGroup label="Tên Gốc" value={movieForm.movie.origin_name} onChange={v => handleMovieChange('origin_name', v)} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <InputGroup label="Slug" value={movieForm.movie.slug} onChange={v => handleMovieChange('slug', v)} />
                                        <InputGroup label="Loại Phim" value={movieForm.movie.type} onChange={v => handleMovieChange('type', v)} />
                                        <InputGroup label="Trạng thái" value={movieForm.movie.status} onChange={v => handleMovieChange('status', v)} />
                                    </div>
                                    <InputGroup label="Nội dung" value={movieForm.movie.content} onChange={v => handleMovieChange('content', v)} isArea />
                                </Section>

                                {/* 2. MEDIA & CẤU HÌNH */}
                                <Section title="Media & Cấu Hình">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Poster URL" value={movieForm.movie.poster_url} onChange={v => handleMovieChange('poster_url', v)} />
                                        <InputGroup label="Thumb URL" value={movieForm.movie.thumb_url} onChange={v => handleMovieChange('thumb_url', v)} />
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-2">
                                        <Toggle label="Bản quyền" checked={movieForm.movie.is_copyright} onChange={v => handleMovieChange('is_copyright', v)} />
                                        <Toggle label="Sub Độc quyền" checked={movieForm.movie.sub_docquyen} onChange={v => handleMovieChange('sub_docquyen', v)} />
                                        <Toggle label="Chiếu rạp" checked={movieForm.movie.chieurap} onChange={v => handleMovieChange('chieurap', v)} />
                                        <InputGroup label="Trailer URL" value={movieForm.movie.trailer_url} onChange={v => handleMovieChange('trailer_url', v)} />
                                    </div>
                                </Section>

                                {/* 3. CHI TIẾT KỸ THUẬT */}
                                <Section title="Chi Tiết Kỹ Thuật">
                                    <div className="grid grid-cols-4 gap-4">
                                        <InputGroup label="Thời lượng" value={movieForm.movie.time} onChange={v => handleMovieChange('time', v)} />
                                        <InputGroup label="Năm" value={movieForm.movie.year} onChange={v => handleMovieChange('year', v)} />
                                        <InputGroup label="Chất lượng" value={movieForm.movie.quality} onChange={v => handleMovieChange('quality', v)} />
                                        <InputGroup label="Ngôn ngữ" value={movieForm.movie.lang} onChange={v => handleMovieChange('lang', v)} />
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <InputGroup label="Tập hiện tại" value={movieForm.movie.episode_current} onChange={v => handleMovieChange('episode_current', v)} />
                                        <InputGroup label="Tổng tập" value={movieForm.movie.episode_total} onChange={v => handleMovieChange('episode_total', v)} />
                                        <InputGroup label="Lượt xem" value={movieForm.movie.view} onChange={v => handleMovieChange('view', v)} />
                                        <InputGroup label="Notify" value={movieForm.movie.notify} onChange={v => handleMovieChange('notify', v)} />
                                    </div>
                                </Section>
                                {/* 4. PHÂN LOẠI & NHÂN SỰ */}
                                <Section title="Phân Loại & Nhân Sự">

                                    {/* --- CẬP NHẬT PHẦN NÀY --- */}
                                    <div className="space-y-6">
                                        <MultiSelect
                                            label="Quốc Gia (Country)"
                                            options={countryOptions}
                                            value={movieForm.movie.country}
                                            onChange={(newVal) => handleMovieChange('country', newVal)}
                                        />

                                        <MultiSelect
                                            label="Thể Loại (Category)"
                                            options={genreOptions}
                                            value={movieForm.movie.category}
                                            onChange={(newVal) => handleMovieChange('category', newVal)}
                                        />
                                    </div>
                                    {/* ------------------------- */}

                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        {/* Actor và Director vẫn giữ dạng Text Input hoặc bạn có thể làm tương tự nếu có list */}
                                        {renderArrayInput("Diễn Viên (Actor)", movieForm.movie.actor)}
                                        {renderArrayInput("Đạo Diễn (Director)", movieForm.movie.director)}
                                    </div>
                                </Section>

                                {/* 4. TMDB & IMDB (NESTED FIELDS) */}
                                <Section title="Ratings & IDs (TMDB/IMDB)">
                                    <div className="grid grid-cols-2 gap-4 bg-[#121212] p-4 border border-white/5">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-[#00FF41]">TMDB</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <InputGroup label="ID" value={movieForm.movie.tmdb.id} onChange={v => handleNestedChange('tmdb', 'id', v)} />
                                                <InputGroup label="Type" value={movieForm.movie.tmdb.type} onChange={v => handleNestedChange('tmdb', 'type', v)} />
                                                <InputGroup label="Vote" value={movieForm.movie.tmdb.vote_average} onChange={v => handleNestedChange('tmdb', 'vote_average', v)} />
                                                <InputGroup label="Season" value={movieForm.movie.tmdb.season} onChange={v => handleNestedChange('tmdb', 'season', v)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-yellow-500">IMDB & SYSTEM</h4>
                                            <InputGroup label="IMDB ID" value={movieForm.movie.imdb.id} onChange={v => handleNestedChange('imdb', 'id', v)} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <InputGroup label="Created" value={movieForm.movie.created.time} readOnly />
                                                <InputGroup label="Modified" value={movieForm.movie.modified.time} readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </Section>

                                {/* NÚT LƯU */}
                                <button
                                    onClick={handleSaveInfo}
                                    disabled={loading}
                                    className="w-full bg-[#00FF41] text-black font-bold uppercase py-4 text-sm hover:bg-[#00cc33] transition-colors shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                                >
                                    {loading ? "Đang xử lý..." : "Lưu Thông Tin Phim"}
                                </button>
                            </div>
                        )}

                        {/* === TAB 2: QUẢN LÝ TẬP === */}
                        {activeTab === "episodes" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* A. CẤU HÌNH SERVER */}
                                <div className="bg-[#121212] p-4 border border-white/5 flex flex-wrap gap-4 items-end">
                                    <div className="w-64">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Tên Server</label>
                                        <input
                                            className="w-full bg-black border border-white/10 p-2 text-white text-sm outline-none focus:border-[#00FF41]"
                                            value={serverConfig.serverName}
                                            onChange={e => setServerConfig({ ...serverConfig, serverName: e.target.value })}
                                            placeholder="Vietsub"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer select-none h-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-[#00FF41]"
                                            checked={serverConfig.priority}
                                            onChange={e => setServerConfig({ ...serverConfig, priority: e.target.checked })}
                                        />
                                        <span className="text-sm font-bold text-white uppercase">Ưu tiên Server này</span>
                                    </label>
                                </div>

                                {/* B. THANH CHUYỂN ĐỔI CHẾ ĐỘ NHẬP */}
                                <div className="flex border-b border-white/10">
                                    <button
                                        onClick={() => setInputMode("table")}
                                        className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${inputMode === 'table' ? 'text-black bg-white' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Nhập dạng Bảng
                                    </button>
                                    <button
                                        onClick={() => setInputMode("paste")}
                                        className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${inputMode === 'paste' ? 'text-black bg-white' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Dán nhanh (Bulk)
                                    </button>
                                </div>

                                {/* C1. GIAO DIỆN BẢNG (TABLE) */}
                                {inputMode === "table" && (
                                    <div className="bg-[#121212] border border-white/5 p-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-[10px] text-gray-500 uppercase tracking-wider">
                                                        <th className="p-2 w-10">#</th>
                                                        <th className="p-2 w-32">Tên Tập</th>
                                                        <th className="p-2 w-32">Slug (Auto)</th>
                                                        <th className="p-2">Link M3U8</th>
                                                        <th className="p-2">Link Embed (Opt)</th>
                                                        <th className="p-2 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {episodeList.map((ep, idx) => (
                                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                                            <td className="p-2 text-gray-600">{idx + 1}</td>
                                                            <td className="p-2">
                                                                <input
                                                                    className="w-full bg-transparent border-b border-transparent focus:border-[#00FF41] outline-none text-white"
                                                                    value={ep.name}
                                                                    onChange={e => handleEpChange(idx, 'name', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    className="w-full bg-transparent border-b border-transparent focus:border-gray-500 outline-none text-gray-400 text-xs"
                                                                    value={ep.slug}
                                                                    onChange={e => handleEpChange(idx, 'slug', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    className="w-full bg-black border border-white/10 p-1 text-gray-300 focus:border-[#00FF41] outline-none text-xs font-mono"
                                                                    value={ep.link_m3u8}
                                                                    placeholder="https://..."
                                                                    onChange={e => handleEpChange(idx, 'link_m3u8', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    className="w-full bg-black border border-white/10 p-1 text-gray-300 focus:border-[#00FF41] outline-none text-xs font-mono"
                                                                    value={ep.link_embed}
                                                                    placeholder="https://..."
                                                                    onChange={e => handleEpChange(idx, 'link_embed', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <button onClick={() => handleRemoveRow(idx)} className="text-red-500 font-bold px-2 hover:text-red-400">X</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button
                                            onClick={handleAddRow}
                                            className="mt-4 w-full py-2 border border-dashed border-gray-600 text-gray-500 text-xs font-bold uppercase hover:border-white hover:text-white transition-all"
                                        >
                                            + Thêm dòng mới
                                        </button>
                                    </div>
                                )}

                                {/* C2. GIAO DIỆN DÁN (PASTE) */}
                                {inputMode === "paste" && (
                                    <div className="bg-[#121212] border border-white/5 p-4">
                                        <p className="text-xs text-gray-500 mb-2">
                                            Cú pháp: <span className="text-[#00FF41]">Tên Tập | Link M3U8 | Link Embed</span> (Mỗi tập 1 dòng)
                                        </p>
                                        <textarea
                                            className="w-full h-64 bg-black border border-white/10 p-4 text-sm text-gray-300 focus:border-[#00FF41] outline-none font-mono leading-relaxed"
                                            placeholder={`Tập 1 | https://m3u8... \nTập 2 | https://m3u8... | https://embed...`}
                                            value={bulkText}
                                            onChange={e => setBulkText(e.target.value)}
                                        ></textarea>
                                        <button
                                            onClick={handleParseBulk}
                                            className="mt-4 bg-white text-black px-6 py-2 text-xs font-bold uppercase hover:bg-gray-200"
                                        >
                                            Phân Tích & Chuyển Sang Bảng
                                        </button>
                                    </div>
                                )}

                                {/* D. FORM THÔNG BÁO (GIỮ NGUYÊN HOẶC CHỈNH NHẸ) */}
                                <div className="bg-[#121212] p-4 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-white text-sm font-bold uppercase border-l-2 border-yellow-500 pl-3">Thông Báo Đẩy</h3>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold uppercase text-gray-400">Gửi thông báo?</span>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-yellow-500"
                                                checked={notifyForm.send}
                                                onChange={e => setNotifyForm({ ...notifyForm, send: e.target.checked })}
                                            />
                                        </label>
                                    </div>
                                    {notifyForm.send && (
                                        <div className="space-y-3 pl-4 border-l border-white/5">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-500">Tiêu đề</label>
                                                <input className="bg-black border border-white/10 p-2 text-white text-sm"
                                                    value={notifyForm.customTitle} onChange={e => setNotifyForm({ ...notifyForm, customTitle: e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-500">Nội dung</label>
                                                <input className="bg-black border border-white/10 p-2 text-white text-sm"
                                                    value={notifyForm.customMessage} onChange={e => setNotifyForm({ ...notifyForm, customMessage: e.target.value })} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* E. NÚT LƯU */}
                                <button
                                    onClick={handleSaveEpisodes}
                                    disabled={loading}
                                    className="w-full bg-[#00FF41] text-black font-bold uppercase py-4 text-sm hover:bg-[#00cc33] transition-colors shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                                >
                                    {loading ? "Đang xử lý..." : `Lưu ${episodeList.length} Tập Phim`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}



// --- SUB COMPONENTS (Dán ở cuối file) ---

function Section({ title, children }) {
    return (
        <div>
            <h3 className="text-white text-xs font-bold uppercase mb-4 border-l-2 border-[#00FF41] pl-3 tracking-widest">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function InputGroup({ label, value, onChange, isArea, readOnly }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</label>
            {isArea ? (
                <textarea
                    className={`bg-black border border-white/10 p-3 text-white text-sm focus:border-[#00FF41] outline-none h-24 resize-none ${readOnly ? 'opacity-50' : ''}`}
                    value={value || ""}
                    onChange={e => !readOnly && onChange(e.target.value)}
                    readOnly={readOnly}
                />
            ) : (
                <input
                    className={`bg-black border border-white/10 p-3 text-white text-sm focus:border-[#00FF41] outline-none ${readOnly ? 'opacity-50' : ''}`}
                    value={value || ""}
                    onChange={e => !readOnly && onChange(e.target.value)}
                    readOnly={readOnly}
                />
            )}
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group p-2 border border-white/5 bg-black">
            <div className="relative w-8 h-4">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked || false} // Thêm || false để tránh undefined
                    onChange={e => onChange(e.target.checked)}
                />                <div className={`w-full h-full rounded-full transition-colors ${checked ? 'bg-[#00FF41]' : 'bg-gray-700'}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase">{label}</span>
        </label>
    );
}

// Component chọn nhiều (Tags)
function MultiSelect({ label, options, value = [], onChange }) {
    // Hàm xử lý khi bấm vào một tag
    const toggleItem = (item) => {
        // Kiểm tra xem item đã được chọn chưa (dựa vào slug)
        const exists = value.find(v => v.slug === item.slug);

        let newValue;
        if (exists) {
            // Nếu có rồi -> Xóa đi
            newValue = value.filter(v => v.slug !== item.slug);
        } else {
            // Nếu chưa có -> Thêm vào (Giữ cấu trúc object {name, slug})
            newValue = [...value, { name: item.name, slug: item.slug }];
        }

        onChange(newValue);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</label>
            <div className="flex flex-wrap gap-2 bg-black border border-white/10 p-3 min-h-[50px]">
                {options.map((option) => {
                    // Kiểm tra trạng thái active
                    const isActive = value.some(v => v.slug === option.slug);

                    return (
                        <button
                            key={option.slug}
                            onClick={() => toggleItem(option)}
                            className={`px-3 py-1 text-xs rounded-sm border transition-all ${isActive
                                ? "bg-[#00FF41] text-black border-[#00FF41] font-bold"
                                : "bg-transparent text-gray-400 border-white/20 hover:border-white hover:text-white"
                                }`}
                        >
                            {option.name}
                        </button>
                    );
                })}
            </div>
            {/* Hiển thị tóm tắt text bên dưới */}
            <p className="text-[10px] text-gray-500">
                Đang chọn: {value.map(v => v.name).join(", ") || "Chưa chọn"}
            </p>
        </div>
    );
}

// Helper render input cho array (Actor, Category...)
// Hiển thị tên dạng chuỗi, nhưng lưu vẫn giữ cấu trúc gốc nếu không sửa
const renderArrayInput = (label, arrayData, key = 'name') => {
    // Chuyển array object thành string để hiển thị: "Hành động, Phiêu lưu"
    const displayValue = Array.isArray(arrayData)
        ? arrayData.map(item => (typeof item === 'object' ? item[key] : item)).join(", ")
        : arrayData;

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</label>
            <input
                className="bg-black border border-white/10 p-3 text-white text-sm focus:border-[#00FF41] outline-none"
                defaultValue={displayValue}
                // Lưu ý: Logic này chỉ để hiển thị. 
                // Nếu muốn sửa array phức tạp (Category có id, slug) bằng tay thì cần UI phức tạp hơn.
                // Ở đây ta ưu tiên dữ liệu từ API.
                readOnly
                title="Dữ liệu này được lấy từ API. Sửa thủ công phức tạp nên đang để Read-only."
            />
        </div>
    );
};