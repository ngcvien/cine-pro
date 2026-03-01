"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, rtdb } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, push, onValue, serverTimestamp, set, get } from "firebase/database";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { getMovieData } from "@/lib/movieService";

const formatServerName = (name) => {
    if (!name) return "Server Chính";
    return name.replace(/#|Hà Nội|Đà Nẵng|Hồ Chí Minh/g, "").replace(/[()]/g, "").trim();
};

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
    const [activeServerIndex, setActiveServerIndex] = useState(0);

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
                const data = await getMovieData(`phim/${roomInfo.movieSlug}`, { cache: "no-store" });
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
                console.log("data: " + JSON.stringify(data))
            }
        });
        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        if (!episodes || episodes.length === 0 || !videoLink) return;
        const sIndex = episodes.findIndex(server => 
            server.server_data.some(ep => ep.link_m3u8 === videoLink)
        );
        if (sIndex !== -1) {
            setActiveServerIndex(sIndex);
        }
    }, [videoLink, episodes]);

    // Host tự động chọn tập 1 nếu phòng mới tạo chưa có tập nào
    useEffect(() => {
        console.log("movieData: " + JSON.stringify(movieData));

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
                        // Trường hợp 1: Host F5 tải lại trang, tiếp tục xem
                        let targetTime = state.currentTime;
                        if (state.playing) targetTime += (Date.now() - state.updatedAt) / 1000;
                        art.currentTime = targetTime;

                        if (state.playing && !isWaitingRef.current) {
                            art.play().catch(() => {
                                art.notice.show = "Trình duyệt chặn tự động phát. Hãy click vào phim!";
                            });
                        }
                    } else if (!isWaitingRef.current) {
                        // Trường hợp 2: PHÒNG MỚI TẠO -> ÉP TỰ ĐỘNG PHÁT LUÔN
                        art.play().catch(() => {
                            art.notice.show = "Trình duyệt chặn tự động phát. Hãy click vào phim!";
                        });
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
                        art.play().catch(() => {
                            art.notice.show = "Host đã phát. Click vào màn hình để xem cùng!";
                        });
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

                // Ép luôn thời gian thực tế ngay khi vừa load xong
                art.currentTime = liveTime;

                // Nếu Host đang phát -> Khách cũng phải tự động phát theo
                if (currentLiveState.playing && !isWaitingRef.current) {
                    art.play().catch(() => {
                        // Lỗi này xảy ra khi trình duyệt chặn âm thanh
                        art.notice.show = "Bị chặn tự động phát. Hãy click vào phim để đồng bộ!";
                    });
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
    }, [videoLink, isHost, roomInfo]); // Kết thúc useEffect số 6

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
            setTimeout(() => setDanmakuList(prev => prev.filter(item => item.id !== newDanmaku.id)), 10000);
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


    // ========== LOADING & AUTH SCREENS ==========
    if (loading) return (
        <div className="min-h-screen bg-[#050905] flex items-center justify-center">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;700&display=swap');
                @keyframes spin-glow { to { transform: rotate(360deg); } }
                @keyframes fade-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                .loader { width:48px; height:48px; border:3px solid transparent; border-top-color:#22FF00; border-right-color:#22FF00; border-radius:50%; animation: spin-glow 0.8s linear infinite; box-shadow: 0 0 20px rgba(34,255,0,0.5); }
            `}</style>
            <div className="flex flex-col items-center gap-5 animate-[fade-in_0.5s_ease]">
                <div className="loader"></div>
                <p style={{fontFamily:'IBM Plex Mono'}} className="text-[11px] text-[#22FF00]/50 uppercase tracking-[0.3em]">Đang kết nối...</p>
            </div>
        </div>
    );

    if (!user) return (
        <div className="min-h-screen bg-[#050905] flex flex-col items-center justify-center relative overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700;800&family=IBM+Plex+Mono&display=swap');
                @keyframes aurora { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,-30px) scale(1.1);} }
            `}</style>
            <div className="absolute inset-0 pointer-events-none">
                <div style={{animation:'aurora 8s ease-in-out infinite'}} className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#22FF00]/6 blur-[100px]"></div>
                <div style={{animation:'aurora 10s ease-in-out infinite reverse'}} className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#22FF00]/5 blur-[100px]"></div>
            </div>
            <div className="relative z-10 text-center space-y-6 p-8">
                <p style={{fontFamily:'Be Vietnam Pro'}} className="text-3xl font-bold text-white">Yêu Cầu Đăng Nhập</p>
                <p style={{fontFamily:'IBM Plex Mono'}} className="text-sm text-gray-500">Bạn cần tài khoản để tham gia phòng xem chung</p>
                <button onClick={() => router.push('/login')} style={{fontFamily:'Be Vietnam Pro'}} className="group relative px-10 py-3.5 bg-gradient-to-r from-[#22FF00] to-[#1acc00] text-black font-bold uppercase tracking-widest text-sm rounded-xl overflow-hidden hover:shadow-[0_0_30px_rgba(34,255,0,0.5)] transition-all duration-300">
                    <span className="relative z-10">Đăng nhập ngay</span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050905] text-gray-300 flex flex-col md:flex-row overflow-hidden mt-17" style={{fontFamily:'IBM Plex Mono, monospace'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;700&display=swap');

                :root {
                    --accent: #22FF00;
                    --accent2: #22FF00;
                    --glow: rgba(34,255,0,0.3);
                    --glow2: rgba(34,255,0,0.15);
                    --surface: rgba(255,255,255,0.03);
                    --border: rgba(255,255,255,0.07);
                    --surface-hover: rgba(255,255,255,0.06);
                }

                .bvp { font-family: 'Be Vietnam Pro', sans-serif; }
                .ibm { font-family: 'IBM Plex Mono', monospace; }

                /* AURORA BG */
                .aurora-bg::before {
                    content:'';
                    position:fixed; inset:0; pointer-events:none; z-index:0;
                    background: radial-gradient(ellipse 80% 60% at 15% 15%, rgba(34,255,0,0.06) 0%, transparent 55%),
                                radial-gradient(ellipse 60% 50% at 85% 85%, rgba(34,255,0,0.04) 0%, transparent 55%);
                }

                /* SCROLLBAR */
                .scrollbar-sleek::-webkit-scrollbar { width: 3px; }
                .scrollbar-sleek::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-sleek::-webkit-scrollbar-thumb { background: #22FF00; border-radius: 999px; opacity: 0.6; }

                /* DANMAKU */
                @keyframes fly-danmaku {
                    from { transform: translateX(110vw); opacity: 1; }
                    to   { transform: translateX(-110%); opacity: 0.7; }
                }
                .animate-danmaku { animation: fly-danmaku 8s linear forwards; }

                /* PULSE DOT */
                @keyframes live-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34,255,0,0.7); }
                    50%       { box-shadow: 0 0 0 6px rgba(34,255,0,0); }
                }
                .live-dot { animation: live-pulse 1.8s ease-in-out infinite; }

                /* SHIMMER */
                @keyframes shimmer {
                    from { background-position: -200% center; }
                    to   { background-position: 200% center; }
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #22FF00, #90ff80, #22FF00);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s linear infinite;
                }

                /* COUNTDOWN GLOW */
                @keyframes count-glow {
                    0%, 100% { text-shadow: 0 0 20px rgba(34,255,0,0.6), 0 0 60px rgba(34,255,0,0.2); }
                    50%       { text-shadow: 0 0 40px rgba(34,255,0,1), 0 0 100px rgba(34,255,0,0.4); }
                }
                .count-glow { animation: count-glow 2s ease-in-out infinite; }

                /* GLASS */
                .glass {
                    background: rgba(255,255,255,0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.07);
                }
                .glass-strong {
                    background: rgba(5,10,5,0.9);
                    backdrop-filter: blur(30px);
                    -webkit-backdrop-filter: blur(30px);
                    border: 1px solid rgba(34,255,0,0.2);
                }

                /* EP BUTTON */
                .ep-btn { transition: all 0.2s ease; }
                .ep-btn:hover:not(:disabled) { transform: translateY(-1px); }

                /* TOGGLE */
                .toggle-track { background: rgba(255,255,255,0.08); transition: background 0.3s; }
                .toggle-track.on { background: #22FF00; }

                /* FADE UP */
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .fade-up { animation: fadeUp 0.5s ease forwards; }

                /* GRADIENT BORDER ANIMATED */
                @keyframes border-spin {
                    to { --angle: 360deg; }
                }

                /* CHAT MSG FADE */
                @keyframes msg-in { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
                .msg-in { animation: msg-in 0.25s ease forwards; }
            `}</style>

            {/* AURORA BACKGROUND */}
            <div className="aurora-bg fixed inset-0 pointer-events-none z-0"></div>

            {/* ===== CỘT TRÁI ===== */}
            <div className={`relative z-10 flex-1 flex flex-col transition-all duration-500 overflow-y-auto scrollbar-sleek ${showChat ? '' : 'w-full'}`}>

                {/* TOP TOOLBAR */}
                <div className="sticky top-0 z-20 glass border-b border-white/[0.06] px-5 py-3 flex flex-wrap gap-3 justify-between items-center">
                    {/* LEFT: Badge + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] mono font-bold uppercase tracking-wider ${
                            isWaiting
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-[#22FF00]/8 text-[#22FF00] border border-[#22FF00]/15'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isWaiting ? 'bg-amber-400' : 'bg-[#22FF00] live-dot'}`}></span>
                            {isWaiting ? 'Sắp chiếu' : 'Live'}
                        </span>
                        <h1 className="bvp font-bold text-white text-sm md:text-base line-clamp-1 truncate">
                            {movieData
                                ? `${movieData.name}${currentEpName ? ` · ${formatServerName(currentEpName)}` : ''}`
                                : (roomInfo?.movieSlug || 'Đang kết nối...')}
                        </h1>
                        {isHost && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] mono uppercase tracking-widest bg-gradient-to-r from-[#22FF00]/10 to-[#1acc00]/20 text-[#22FF00] border border-[#22FF00]/15">
                                Host
                            </span>
                        )}
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="flex items-center gap-4">
                        {/* Danmaku toggle */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="ibm text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">Danmaku</span>
                            <div className="relative w-9 h-5">
                                <input type="checkbox" className="sr-only" checked={showDanmaku} onChange={() => setShowDanmaku(!showDanmaku)} />
                                <div className={`toggle-track absolute inset-0 rounded-full ${showDanmaku ? 'on' : ''}`}></div>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${showDanmaku ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>

                        {/* Chat toggle (desktop only) */}
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="hidden md:flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider text-gray-500 hover:text-white border-l border-white/[0.06] pl-4 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            {showChat ? 'Thu chat' : 'Mở chat'}
                        </button>
                    </div>
                </div>

                {/* ===== VIDEO PLAYER WRAPPER ===== */}
                <div ref={wrapperRef} className="relative w-full aspect-video md:min-h-[58vh]  bg-black overflow-hidden flex-shrink-0">

                    {/* Gradient vignette overlay */}
                    <div className="absolute inset-0 z-[1] pointer-events-none"
                        style={{background:'radial-gradient(ellipse at center, transparent 60%, rgba(5,5,8,0.6) 100%)'}}></div>

                    {videoLink ? (
                        <div ref={artContainerRef} className="absolute inset-0 z-0 outline-none focus:outline-none"></div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-0">
                            <div className="w-12 h-12 rounded-full border-2 border-[#22FF00]/15 border-t-[#22FF00] animate-spin"></div>
                            <p className="ibm text-[11px] text-[#22FF00]/35 uppercase tracking-[0.25em]">Đang chuẩn bị luồng phát...</p>
                        </div>
                    )}

                    {/* WAITING SCREEN */}
                    {isWaiting && (
                        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-center"
                            style={{background:'linear-gradient(135deg, rgba(5,5,8,0.97) 0%, rgba(2,12,2,0.97) 100%)'}}>
                            {/* Decorative rings */}
                            <div className="absolute w-96 h-96 rounded-full border border-[#22FF00]/8 animate-pulse"></div>
                            <div className="absolute w-64 h-64 rounded-full border border-[#22FF00]/20/15" style={{animation:'spin-glow 15s linear infinite'}}></div>

                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <p className="ibm text-[11px] text-[#22FF00]/40 uppercase tracking-[0.4em]">Giờ G Sắp Điểm</p>
                                <p className="bvp font-black count-glow" style={{fontSize:'clamp(4rem,12vw,8rem)', color:'#22FF00', lineHeight:1}}>
                                    {formatTime(timeRemaining)}
                                </p>
                                <div className="glass-strong px-8 py-4 rounded-2xl mt-2">
                                    <p className="text-gray-400 text-sm">Chủ phòng: <span className="bvp font-bold text-white">{roomInfo?.hostName}</span></p>
                                    <p className="ibm text-[10px] text-gray-600 uppercase tracking-widest mt-1">Video tự mở khóa khi đếm ngược kết thúc</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DANMAKU LAYER */}
                    {showDanmaku && (
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                            {danmakuList.map(danmaku => (
                                <div
                                    key={danmaku.id}
                                    className="absolute whitespace-nowrap animate-danmaku flex items-center gap-1.5 px-3 py-1 rounded-full"
                                    style={{
                                        top: danmaku.top,
                                        background: danmaku.isMe
                                            ? 'linear-gradient(90deg, rgba(34,255,0,0.3), rgba(34,255,0,0.2))'
                                            : 'rgba(0,0,0,0.55)',
                                        border: danmaku.isMe ? '1px solid rgba(34,255,0,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(8px)',
                                        boxShadow: danmaku.isMe ? '0 0 12px rgba(34,255,0,0.3)' : 'none'
                                    }}
                                >
                                    {!danmaku.isMe && (
                                        <img src={danmaku.photoURL} alt="" className="w-4 h-4 rounded-full object-cover border border-white/20" />
                                    )}
                                    <span className="ibm text-[11px] font-bold" style={{color: danmaku.isMe ? '#0a4a00' : '#F3F4F6'}}>
                                        {!danmaku.isMe && <span style={{color:'rgba(156,163,175,0.7)'}} className="mr-1">{danmaku.displayName}:</span>}
                                        {danmaku.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* FULLSCREEN CHAT INPUT */}
                    {isFullscreen && (
                        <div className="absolute bottom-60 left-0 right-0 z-20 flex justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 px-6">
                            <form onSubmit={handleSendMessage} className="glass-strong p-2 rounded-2xl flex gap-2 w-full max-w-2xl shadow-2xl">
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={cooldown > 0 ? `Chờ ${cooldown}s...` : 'Gõ tin nhắn...'}
                                    disabled={cooldown > 0}
                                    className="flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder-gray-600 mono disabled:opacity-40"
                                    maxLength={150}
                                />
                                <button type="submit" disabled={!newMessage.trim() || cooldown > 0}
                                    className="bg-gradient-to-r from-[#22FF00] to-[#1acc00] text-black px-6 py-2 mono text-xs font-bold uppercase rounded-xl hover:opacity-90 disabled:opacity-30 transition-all">
                                    {cooldown > 0 ? `${cooldown}s` : 'Gửi'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ===== EPISODE PICKER ===== */}
                <div className="p-5 md:p-8 flex-1">
                    <div className="max-w-5xl">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#22FF00] to-[#22FF00]"></div>
                            <h3 className="bvp font-bold text-white text-sm uppercase tracking-widest">Chọn phiên bản & Tập phim</h3>
                        </div>

                        {episodes && episodes.length > 0 ? (
                            <div className="fade-up">
                                {/* SERVER TABS */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {episodes.map((server, sIdx) => (
                                        <button
                                            key={sIdx}
                                            onClick={() => setActiveServerIndex(sIdx)}
                                            className={`px-4 py-2 mono text-[10px] uppercase tracking-widest rounded-lg transition-all duration-200 border ${
                                                activeServerIndex === sIdx
                                                ? 'bg-gradient-to-r from-[#22FF00]/10 to-[#1acc00]/20 text-[#22FF00] border-[#22FF00]/30 shadow-[0_0_16px_rgba(34,255,0,0.15)]'
                                                : 'bg-white/[0.03] text-gray-600 border-white/[0.06] hover:text-gray-300 hover:bg-white/[0.06]'
                                            }`}
                                        >
                                            {formatServerName(server.server_name)}
                                        </button>
                                    ))}
                                </div>

                                {/* EPISODE LIST */}
                                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                    <div className="flex flex-wrap gap-2">
                                        {episodes[activeServerIndex]?.server_data.map((ep, eIdx) => {
                                            const serverName = episodes[activeServerIndex].server_name;
                                            const epFullName = `${ep.name} (${serverName})`;
                                            const isPlaying = videoLink === ep.link_m3u8;
                                            return (
                                                <button
                                                    key={eIdx}
                                                    onClick={() => handleSelectEpisode(epFullName, ep.link_m3u8)}
                                                    disabled={!isHost}
                                                    title={!isHost ? 'Chỉ Host mới đổi được tập' : 'Đổi tập'}
                                                    className={`ep-btn min-w-[56px] px-3.5 py-2 mono text-xs font-bold rounded-lg border transition-all duration-200 ${
                                                        isPlaying
                                                        ? 'bg-[#22FF00] text-black border-transparent shadow-[0_0_20px_rgba(34,255,0,0.35)]'
                                                        : 'bg-white/[0.03] text-gray-400 border-white/[0.07] hover:bg-white/[0.07] hover:text-white hover:border-[#22FF00]/20'
                                                    } ${!isHost && !isPlaying ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                >
                                                    {ep.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {!isHost && (
                                        <p className="ibm text-[10px] text-gray-700 mt-4 uppercase tracking-wider">
                                            * Chỉ Host mới có quyền đổi tập
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="w-4 h-4 border-2 border-[#22FF00]/15 border-t-[#22FF00]/60 rounded-full animate-spin"></div>
                                <p className="ibm text-[11px] uppercase tracking-[0.25em] animate-pulse">Đang tải danh sách tập...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== CỘT PHẢI: CHAT ===== */}
            {showChat && (
                <div className="relative z-10 w-full md:w-[360px] h-[48vh] md:h-[85vh] flex flex-col glass-strong border-l border-[#22FF00]/8 flex-shrink-0">
                    {/* Subtle top gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22FF00]/40 to-transparent"></div>

                    {/* CHAT HEADER */}
                    <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#22FF00]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span className="bvp font-bold text-white text-sm">Trò chuyện</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22FF00]/8 border border-[#22FF00]/15">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22FF00] live-dot"></span>
                            <span className="ibm text-[9px] text-[#22FF00] uppercase tracking-wider">Live</span>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-sleek">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#22FF00]/40"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <p className="ibm text-[10px] text-gray-700 uppercase tracking-widest">Chưa có tin nhắn</p>
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const isMe = msg.uid === user.uid;
                            return (
                                <div key={index} className={`msg-in flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <img
                                        src={msg.photoURL}
                                        alt=""
                                        className="w-7 h-7 rounded-full object-cover border flex-shrink-0 mt-7"
                                        style={{borderColor: isMe ? 'rgba(34,255,0,0.4)' : 'rgba(255,255,255,0.08)'}}
                                    />
                                    <div className={`flex flex-col max-w-[78%] gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                        <span className="ibm text-[9px] text-gray-600 uppercase tracking-wider">{msg.displayName}</span>
                                        <div
                                            className="px-3.5 py-2 text-[12.5px] leading-relaxed rounded-2xl"
                                            style={isMe ? {
                                                background: 'linear-gradient(135deg, rgba(34,255,0,0.25), rgba(34,255,0,0.2))',
                                                border: '1px solid rgba(34,255,0,0.25)',
                                                color: '#a8ffa5',
                                                borderBottomRightRadius: '4px'
                                            } : {
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                color: '#D1D5DB',
                                                borderBottomLeftRadius: '4px'
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* CHAT INPUT */}
                    <div className="p-4 border-t border-white/[0.05]">
                        <form onSubmit={handleSendMessage}>
                            <div className="relative flex items-center rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={cooldown > 0 ? `Chờ ${cooldown} giây...` : 'Nhắn điều gì đó...'}
                                    disabled={cooldown > 0}
                                    maxLength={150}
                                    className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder-gray-700 mono disabled:opacity-40"
                                    style={{caretColor:'#22FF00'}}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || cooldown > 0}
                                    className="m-1.5 px-4 py-2 mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-20"
                                    style={{background:'#22FF00', color:'#000'}}
                                >
                                    {cooldown > 0 ? `${cooldown}s` : 'Gửi'}
                                </button>
                            </div>

                            {cooldown > 0 && (
                                <div className="mt-2.5 h-0.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.04)'}}>
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                                        style={{
                                            width: `${(cooldown / 5) * 100}%`,
                                            background: '#22FF00',
                                            boxShadow: '0 0 8px rgba(34,255,0,0.6)'
                                        }}
                                    ></div>
                                </div>
                            )}

                            <div className="mt-2 flex justify-between">
                                <span className="ibm text-[9px] text-gray-800 uppercase tracking-widest">Anti-spam</span>
                                <span className="ibm text-[9px] text-gray-700">{newMessage.length}/150</span>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}