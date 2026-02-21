"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, rtdb } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, push, onValue, serverTimestamp, set, get } from "firebase/database";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { getMovieData } from "@/lib/movieService";

export default function WatchPartyRoom() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId;

    // --- AUTH & ROOM STATES ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roomInfo, setRoomInfo] = useState(null);
    const [isHost, setIsHost] = useState(false);

    // --- MOVIE & EPISODE STATES ---
    const [movieData, setMovieData] = useState(null);
    const [videoLink, setVideoLink] = useState("");
    const [episodes, setEpisodes] = useState([]);
    const [currentEpName, setCurrentEpName] = useState("");

    // --- COUNTDOWN STATES ---
    const [isWaiting, setIsWaiting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const isWaitingRef = useRef(false);

    // --- UI STATES ---
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [showDanmaku, setShowDanmaku] = useState(true);

    // --- CHAT STATES ---
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [danmakuList, setDanmakuList] = useState([]);

    // --- REFS ---
    const messagesEndRef = useRef(null);
    const wrapperRef = useRef(null);
    const artContainerRef = useRef(null);
    const processedMsgIds = useRef(new Set());
    const isInitialLoad = useRef(true);

    // 1. KIỂM TRA ĐĂNG NHẬP
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. LẤY THÔNG TIN PHÒNG
    useEffect(() => {
        if (!roomId || !user) return;
        const infoRef = ref(rtdb, `rooms/${roomId}/info`);

        const unsubscribe = onValue(infoRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setRoomInfo(data);
                setIsHost(user.uid === data.hostId);
            } else {
                alert("Phòng không tồn tại hoặc đã đóng!");
                router.push('/watch-party');
            }
        });
        return () => unsubscribe();
    }, [roomId, user, router]);

    // 3. LOGIC ĐẾM NGƯỢC
    useEffect(() => {
        if (!roomInfo || roomInfo.mode !== "scheduled") {
            setIsWaiting(false);
            isWaitingRef.current = false;
            return;
        }
        const checkTime = () => {
            const diff = roomInfo.scheduledTime - Date.now();
            if (diff > 0) {
                setTimeRemaining(diff);
                setIsWaiting(true);
                isWaitingRef.current = true;
            } else {
                setTimeRemaining(0);
                setIsWaiting(false);
                isWaitingRef.current = false;
            }
        };
        checkTime();
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [roomInfo]);

    // 4. LẤY DATA PHIM
    useEffect(() => {
        if (!roomInfo?.movieSlug) return;
        const fetchMovie = async () => {
            try {
                const data = await getMovieData(`phim/${roomInfo.movieSlug}`);
                if (data.status) {
                    setMovieData(data.movie);
                    setEpisodes(data.episodes);
                }
            } catch (error) {
                console.error("Lỗi tải phim:", error);
            }
        };
        fetchMovie();
    }, [roomInfo?.movieSlug]);

    // 5. ĐỒNG BỘ TẬP PHIM
    useEffect(() => {
        if (!roomId) return;
        const epRef = ref(rtdb, `rooms/${roomId}/currentEpisode`);
        const unsubscribe = onValue(epRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setVideoLink(data.link);
                setCurrentEpName(data.name);
            }
        });
        return () => unsubscribe();
    }, [roomId]);

    // Host tự động chọn tập 1 nếu phòng mới tạo chưa có tập nào
    useEffect(() => {
        if (!movieData || !isHost) return;

        const initEpisode = async () => {
            // LỚP PHÒNG THỦ: Kiểm tra xem phim có mảng episodes và có dữ liệu bên trong không
            if (!episodes || episodes.length === 0) {
                console.warn("Dữ liệu phim không có danh sách tập.");
                return; // Dừng lại an toàn, không làm sập web
            }

            const snap = await get(ref(rtdb, `rooms/${roomId}/currentEpisode`));

            if (!snap.exists()) {
                const firstServer = episodes[0];

                // Kiểm tra thêm một lớp nữa cho server_data để chắc chắn 100%
                if (firstServer && firstServer.server_data && firstServer.server_data.length > 0) {
                    const firstEp = firstServer.server_data[0];
                    handleSelectEpisode(`${firstEp.name} (${firstServer.server_name})`, firstEp.link_m3u8);
                }
            }
        };

        initEpisode();
    }, [episodes, isHost, roomId]);

    const handleSelectEpisode = async (epName, link) => {
        if (!isHost) return;
        try {
            await set(ref(rtdb, `rooms/${roomId}/currentEpisode`), { name: epName, link: link });
            await set(ref(rtdb, `rooms/${roomId}/videoState`), { playing: true, currentTime: 0, updatedAt: Date.now() });
        } catch (error) {
            console.error("Lỗi chuyển tập:", error);
        }
    };

    // 6. KHỞI TẠO ARTPLAYER & PHÍM TẮT
    useEffect(() => {
        if (!videoLink || !artContainerRef.current || !roomInfo) return;

        // Xây dựng thanh công cụ tùy chỉnh (Tối giản icon)
        const playerControls = [
            {
                position: 'left',
                index: 10,
                html: '<div class="px-2 py-1 mx-1 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded cursor-pointer transition-all">-5s</div>',
                tooltip: 'Lùi 5 giây',
                click: function () {
                    if (art) art.currentTime = Math.max(0, art.currentTime - 5);
                }
            },
            {
                position: 'left',
                index: 11,
                html: '<div class="px-2 py-1 mx-1 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded cursor-pointer transition-all">+5s</div>',
                tooltip: 'Tới 5 giây',
                click: function () {
                    if (art) art.currentTime += 5;
                }
            },
            {
                position: 'right',
                html: '<div style="display:flex; align-items:center; padding: 0 10px; cursor:pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg></div>',
                tooltip: 'Toàn màn hình',
                click: () => toggleFullscreen()
            }
        ];

        if (!isHost) {
            playerControls.unshift({
                position: 'left',
                html: '<div id="live-indicator-btn" class="flex items-center gap-2 px-3 text-[11px] font-bold text-gray-400 cursor-pointer transition-all hover:text-white bg-black/40 rounded-full py-1"><span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Chờ đồng bộ</div>',
                tooltip: 'Đồng bộ với Host',
            });
        }

        const art = new Artplayer({
            container: artContainerRef.current,
            url: videoLink,
            theme: '#00FF41',
            volume: 0.8,
            autoplay: false,
            fullscreen: false,
            fullscreenWeb: false,
            hotkey: false, // Tắt hotkey mặc định để tự quản lý
            pip: true,
            setting: true,
            miniProgressBar: true,
            playbackRate: isHost,
            fastForward: false, // Tắt tua nhanh mặc định 
            controls: playerControls,
            customType: {
                m3u8: function (video, url) {
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.hls = hls;
                        art.on('destroy', () => hls.destroy());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                }
            }
        });

        // BẮT SỰ KIỆN PHÍM TẮT CHUNG (HOTKEYS)
        const handleKeyDown = (e) => {
            if (document.activeElement.tagName === 'INPUT') return; // Không kích hoạt khi đang gõ chat

            switch (e.key) {
                case 'ArrowLeft':
                    art.currentTime = Math.max(0, art.currentTime - 5);
                    break;
                case 'ArrowRight':
                    art.currentTime += 5;
                    break;
                case ' ': // Phím Space
                    e.preventDefault();
                    art.toggle();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    art.volume = Math.min(art.volume + 0.1, 1);
                    art.notice.show = `Âm lượng: ${Math.round(art.volume * 100)}%`;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    art.volume = Math.max(art.volume - 0.1, 0);
                    art.notice.show = `Âm lượng: ${Math.round(art.volume * 100)}%`;
                    break;
                case 'f': case 'F':
                    toggleFullscreen();
                    break;
                case 'm': case 'M':
                    art.muted = !art.muted;
                    art.notice.show = art.muted ? "Đã tắt tiếng" : "Đã bật tiếng";
                    break;
                default:
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // HOST LOGIC (Khôi phục trí nhớ)
        let hostHeartbeat;
        if (isHost) {
            let isRestoring = true;

            const updateVideoState = (playing) => {
                if (isRestoring) return;
                set(ref(rtdb, `rooms/${roomId}/videoState`), {
                    playing: playing,
                    currentTime: art.currentTime,
                    updatedAt: Date.now()
                });
            };

            art.on('ready', async () => {
                try {
                    const snapshot = await get(ref(rtdb, `rooms/${roomId}/videoState`));
                    const state = snapshot.val();
                    if (state && state.currentTime > 0) {
                        let targetTime = state.currentTime;
                        if (state.playing) targetTime += (Date.now() - state.updatedAt) / 1000;
                        art.currentTime = targetTime;
                        if (state.playing && !isWaitingRef.current) art.play().catch(e => e);
                    }
                } finally {
                    isRestoring = false;
                }
            });

            art.on('play', () => {
                if (isWaitingRef.current) { art.pause(); return; }
                updateVideoState(true);
            });
            art.on('pause', () => updateVideoState(false));
            art.on('seek', () => updateVideoState(art.playing));

            hostHeartbeat = setInterval(() => {
                if (art.playing && !isRestoring) updateVideoState(true);
            }, 5000);
        }

        // ==========================================
        // VIEWER LOGIC (Thuật toán bù trừ & Giám sát ngầm)
        // ==========================================
        let unsubscribeState;
        let syncMonitorInterval; // Vòng lặp giám sát liên tục

        if (!isHost) {
            let currentLiveState = { playing: false, currentTime: 0, updatedAt: Date.now() };

            const getLiveTime = () => {
                if (!currentLiveState) return art.currentTime;
                return currentLiveState.playing
                    ? currentLiveState.currentTime + (Date.now() - currentLiveState.updatedAt) / 1000
                    : currentLiveState.currentTime;
            };

            // 1. Lắng nghe trạng thái Play/Pause từ DB
            unsubscribeState = onValue(ref(rtdb, `rooms/${roomId}/videoState`), (snapshot) => {
                const state = snapshot.val();
                if (!state || !art) return;

                const wasPlaying = currentLiveState.playing;
                currentLiveState = state;
                const liveTime = getLiveTime();

                if (state.playing && !wasPlaying) {
                    if (!isWaitingRef.current) {
                        art.currentTime = liveTime;
                        art.play().catch(e => e);
                    }
                } else if (!state.playing && wasPlaying) {
                    art.pause();
                    art.currentTime = liveTime;
                }
            });

            // 2. Chặn tua thủ công (Phản hồi UI lập tức)
            art.on('seek', (time) => {
                const liveTime = getLiveTime();
                if (time > liveTime + 1.5) {
                    art.currentTime = liveTime;
                    art.notice.show = "Không thể tua vượt mốc Trực Tiếp!";
                }
            });

            art.on('play', () => {
                if (isWaitingRef.current) { art.pause(); return; }
                const liveTime = getLiveTime();
                if (Math.abs(art.currentTime - liveTime) > 2) {
                    art.currentTime = liveTime;
                }
            });

            art.on('ready', () => {
                const liveTime = getLiveTime();
                if (currentLiveState.playing && !isWaitingRef.current) {
                    art.currentTime = liveTime;
                    art.play().catch(e => e);
                }
            });

            // ==========================================
            // KẺ GIÁM SÁT NGẦM (CHẠY MỖI 1 GIÂY)
            // ==========================================
            syncMonitorInterval = setInterval(() => {
                if (!art || isWaitingRef.current) return;

                const liveTime = getLiveTime();
                const diff = art.currentTime - liveTime; // diff > 0 là khách đang đi trước Host

                // KỶ LUẬT 1: Khách chạy nhanh hơn Host (Do Host lag mạng, v.v...)
                if (diff > 2) {
                    art.currentTime = liveTime;
                    art.notice.show = "Đang chờ Host đồng bộ...";
                }
                // KỶ LUẬT 2: Khách bị tụt lại phía sau quá sâu
                else if (diff < -4 && currentLiveState.playing) {
                    art.currentTime = liveTime;
                    art.notice.show = "Tự động bắt kịp Trực Tiếp...";
                }

                // Cập nhật giao diện nút UI
                const indicator = document.getElementById('live-indicator-btn');
                if (indicator) {
                    indicator.onclick = () => {
                        art.currentTime = getLiveTime();
                        if (currentLiveState.playing) art.play();
                    };
                    if (Math.abs(diff) <= 3) {
                        indicator.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse shadow-[0_0_5px_#00FF41]"></span> <span class="text-[#00FF41]">Trực Tiếp</span>';
                    } else {
                        indicator.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span> <span class="text-gray-400">Trở Về Mốc Của Host</span>';
                    }
                }
            }, 1000);
        }

        art.on('dblclick', () => toggleFullscreen());

        // Dọn dẹp RAM khi thoát
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (hostHeartbeat) clearInterval(hostHeartbeat);
            if (unsubscribeState) unsubscribeState();
            if (syncMonitorInterval) clearInterval(syncMonitorInterval); // Đừng quên clear nó
            if (art && art.destroy) art.destroy(false);
        };
    }, [videoLink, isHost]); // Kết thúc useEffect số 6

    // 7. LẮNG NGHE CHAT & DANMAKU
    useEffect(() => {
        if (!roomId || !user) return;
        const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setMessages(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
            else setMessages([]);
        });
        return () => unsubscribe();
    }, [roomId, user]);

    useEffect(() => {
        if (!showDanmaku || messages.length === 0) return;
        const newMessages = messages.filter(msg => !processedMsgIds.current.has(msg.id));
        if (isInitialLoad.current) {
            messages.forEach(msg => processedMsgIds.current.add(msg.id));
            isInitialLoad.current = false;
            return;
        }
        newMessages.forEach(msg => {
            processedMsgIds.current.add(msg.id);
            const isMe = msg.uid === user?.uid;
            const newDanmaku = {
                id: msg.id + '-' + Date.now(),
                text: msg.text,
                displayName: msg.displayName,
                photoURL: msg.photoURL,
                isMe: isMe,
                top: Math.floor(Math.random() * 65) + 5 + "%"
            };
            setDanmakuList(prev => [...prev, newDanmaku]);
            setTimeout(() => setDanmakuList(prev => prev.filter(item => item.id !== newDanmaku.id)), 8000);
        });
    }, [messages, showDanmaku, user]);

    // 8. SCROLL & COOLDOWN
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, showChat]);
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user || cooldown > 0) return;
        try {
            await push(ref(rtdb, `rooms/${roomId}/messages`), {
                text: newMessage.trim(),
                uid: user.uid,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`,
                timestamp: serverTimestamp(),
            });
            setNewMessage("");
            setCooldown(5);
        } catch (error) {
            console.error("Lỗi gửi:", error);
        }
    };

    // 9. FULLSCREEN
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current?.requestFullscreen().catch(e => e);
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#00FF41] border-t-transparent rounded-full animate-spin"></div></div>;
    if (!user) return <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4"><p className="text-xl font-bold text-red-500 uppercase tracking-widest">Yêu Cầu Đăng Nhập</p><button onClick={() => router.push('/login')} className="bg-[#00FF41] text-black px-8 py-3 font-bold uppercase hover:bg-white transition-colors rounded-sm">Xác Thực Ngay</button></div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col md:flex-row pt-16 overflow-hidden font-sans">

            {/* ================= CỘT TRÁI (VIDEO + CHỌN TẬP) ================= */}
            <div className={`flex-1 flex flex-col transition-all duration-500 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent ${showChat ? 'md:mr-0' : 'md:mr-0 w-full'}`}>

                {/* TOOLBAR ĐỈNH CAO */}
                <div className="px-6 py-4 bg-[#111111] border-b border-white/5 flex flex-wrap gap-4 justify-between items-center z-10 sticky top-0 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <span className={`text-[10px] px-3 py-1 rounded uppercase font-bold tracking-widest ${isWaiting ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20'}`}>
                            {isWaiting ? 'Sắp Công Chiếu' : 'Phòng Xem Chung'}
                        </span>
                        <span className="text-base font-bold text-white tracking-wide line-clamp-1">
                            {movieData ? `${movieData.name} ${currentEpName ? ` | ${currentEpName}` : ''}` : (roomInfo?.movieSlug || "Đang kết nối dữ liệu...")}
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-[11px] font-bold uppercase text-gray-400 group-hover:text-white transition-colors">Danmaku</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={showDanmaku} onChange={() => setShowDanmaku(!showDanmaku)} />
                                <div className={`block w-9 h-5 rounded-full transition-colors duration-300 ${showDanmaku ? 'bg-[#00FF41]' : 'bg-white/10'}`}></div>
                                <div className={`absolute left-1 top-1 bg-black w-3 h-3 rounded-full transition-transform duration-300 ${showDanmaku ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                        <button onClick={() => setShowChat(!showChat)} className="text-[11px] font-bold uppercase text-gray-400 hover:text-white transition-colors hidden md:block border-l border-white/10 pl-6">
                            {showChat ? 'Mở Rộng Phim' : 'Hiện Trò Chuyện'}
                        </button>
                    </div>
                </div>

                {/* THE MASTER WRAPPER */}
                <div ref={wrapperRef} className="relative w-full aspect-video md:min-h-[60vh] bg-black overflow-hidden flex items-center justify-center flex-shrink-0 border-b border-white/5 shadow-2xl">

                    {videoLink ? (
                        <div ref={artContainerRef} className="absolute inset-0 z-0 outline-none focus:outline-none"></div>
                    ) : (
                        <div className="text-gray-600 text-xs font-bold uppercase tracking-widest animate-pulse z-0">Đang chuẩn bị luồng phát...</div>
                    )}

                    {/* MÀN HÌNH CHỜ */}
                    {isWaiting && (
                        <div className="absolute inset-0 z-[5] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center pointer-events-auto">
                            <h2 className="text-xl font-bold text-gray-400 tracking-[0.3em] uppercase mb-4">Giờ G Sắp Điểm</h2>
                            <p className="text-[#00FF41] text-7xl md:text-8xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(0,255,65,0.3)] mb-8">
                                {formatTime(timeRemaining)}
                            </p>
                            <div className="bg-[#111] border border-white/5 px-8 py-4 rounded-xl shadow-2xl">
                                <p className="text-gray-400 text-sm mb-2">Chủ phòng: <span className="text-white font-bold">{roomInfo?.hostName}</span></p>
                                <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">Video tự động mở khóa khi hết giờ</p>
                            </div>
                        </div>
                    )}

                    {/* DANMAKU */}
                    {showDanmaku && (
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                            {danmakuList.map(danmaku => (
                                <div
                                    key={danmaku.id}
                                    className={`absolute whitespace-nowrap animate-danmaku flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all ${danmaku.isMe ? 'bg-[#00FF41]/20 border border-[#00FF41]/40' : 'bg-black/50 border border-white/10'
                                        }`}
                                    style={{ top: danmaku.top }}
                                >
                                    {!danmaku.isMe && <img src={danmaku.photoURL} alt="avt" className="w-5 h-5 rounded-full object-cover border border-white/20 shadow-sm" />}
                                    <span className={`text-[12px] font-bold tracking-wide ${danmaku.isMe ? 'text-[#00FF41]' : 'text-gray-100'}`}>
                                        {!danmaku.isMe && <span className="text-gray-400 font-medium mr-1">{danmaku.displayName}:</span>}
                                        {danmaku.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* INPUT CHAT TÀNG HÌNH TRONG FULLSCREEN */}
                    {isFullscreen && (
                        <div className="absolute bottom-[80px] left-0 right-0 h-[80px] z-20 flex flex-col justify-end items-center opacity-0 hover:opacity-100 transition-opacity duration-300 pb-4 px-6">
                            <form onSubmit={handleSendMessage} className="bg-black/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex gap-2 w-full max-w-3xl shadow-2xl">
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={cooldown > 0 ? `Đợi ${cooldown}s...` : "Gõ tin nhắn gửi phòng..."} disabled={cooldown > 0} className="flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none disabled:opacity-50" maxLength={150} />
                                <button type="submit" disabled={!newMessage.trim() || cooldown > 0} className="bg-[#00FF41] text-black px-8 font-bold text-xs uppercase hover:bg-white transition-colors disabled:opacity-30 rounded-xl">{cooldown > 0 ? `${cooldown}s` : 'Gửi'}</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ================= KHU VỰC CHỌN TẬP (MỚI, SẠCH SẼ) ================= */}
                <div className="p-6 md:p-10 bg-[#0a0a0a] flex-1">
                    <div className="max-w-4xl">
                        <h3 className="text-sm font-bold uppercase text-white mb-6 border-b border-white/5 pb-4">
                            Chọn Tập Phim
                        </h3>

                        {movieData?.episodes?.map((server, sIdx) => (
                            <div key={sIdx} className="mb-8 last:mb-0">
                                <p className="text-gray-500 text-[11px] uppercase font-bold mb-4 tracking-widest">
                                    Server: <span className="text-gray-300">{server.server_name}</span>
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {server.server_data.map((ep, eIdx) => {
                                        const epFullName = `${ep.name} (${server.server_name})`;
                                        const isPlaying = videoLink === ep.link_m3u8;

                                        return (
                                            <button
                                                key={eIdx}
                                                onClick={() => handleSelectEpisode(epFullName, ep.link_m3u8)}
                                                disabled={!isHost}
                                                className={`min-w-[80px] px-5 py-3 text-[13px] font-bold rounded-xl transition-all duration-300 border ${isPlaying
                                                    ? 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/50 shadow-[0_0_15px_rgba(0,255,65,0.1)]'
                                                    : 'bg-[#111] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
                                                    } ${!isHost && !isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {ep.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!isHost && <p className="text-[10px] text-gray-600 mt-4 italic">* Chỉ Chủ phòng mới có quyền thay đổi tập phim.</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= CỘT PHẢI: KHUNG CHAT SIÊU THỰC ================= */}
            {showChat && (
                <div className="w-full md:w-[380px] h-[50vh] md:h-[calc(100vh-64px)] flex flex-col bg-[#111111] border-l border-white/5 shadow-2xl z-20 flex-shrink-0">
                    <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-[#111]">
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Live Chat</span>
                        <div className="flex items-center gap-2 bg-[#00FF41]/10 px-2.5 py-1 rounded border border-[#00FF41]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse"></span>
                            <span className="text-[9px] text-[#00FF41] font-bold uppercase tracking-wider">live</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                        {messages.length === 0 && <p className="text-center text-xs text-gray-600 font-bold uppercase tracking-widest mt-10">Chưa có tin nhắn nào</p>}

                        {messages.map((msg, index) => {
                            const isMe = msg.uid === user.uid;
                            return (
                                <div key={index} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <img src={msg.photoURL} alt="avt" className="w-8 h-8 rounded-full border border-white/10 shadow-sm object-cover" />
                                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[10px] text-gray-500 mb-1 font-bold">{msg.displayName}</span>
                                        <div className={`px-3 py-2 text-[13px] leading-relaxed rounded-xl shadow-sm ${isMe ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20 rounded-tr-sm' : 'bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-tl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-5 border-t border-white/5 bg-[#111]">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={cooldown > 0 ? `Đợi ${cooldown} giây...` : "Gõ phím trò chuyện..."}
                                disabled={cooldown > 0}
                                className="w-full bg-[#0a0a0a] border border-white/5 px-4 py-3.5 pr-16 text-sm text-white outline-none focus:border-[#00FF41]/50 rounded-xl disabled:opacity-50 transition-all placeholder-gray-600"
                            />
                            <button type="submit" disabled={!newMessage.trim() || cooldown > 0} className="absolute right-2 bg-white/10 text-white px-4 py-2 font-bold text-[10px] uppercase hover:bg-[#00FF41] hover:text-black transition-colors disabled:opacity-20 rounded-lg">
                                Gửi
                            </button>
                        </div>
                        {cooldown > 0 && (
                            <div className="h-0.5 w-full bg-[#222] mt-4 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00FF41] transition-all duration-1000 ease-linear shadow-[0_0_10px_#00FF41]" style={{ width: `${(cooldown / 5) * 100}%` }}></div>
                            </div>
                        )}
                        <div className="mt-3 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                            <span>Bảo vệ Spam</span>
                            <span>{newMessage.length}/150</span>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}