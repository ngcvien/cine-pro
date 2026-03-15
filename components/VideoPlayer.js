"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react";
import { renderToString } from "react-dom/server";

export default function VideoPlayer({ url, slug, movieName, episodeName, episodes = [], episodeSlug }) {
  const artRef = useRef(null);
  const playerInstance = useRef(null);
  const currentTimeRef = useRef(0);
  const lastFirebaseSyncRef = useRef(0);
  const [user, setUser] = useState(null);
  const [isChangingEpisode, setIsChangingEpisode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- HÀM ĐỒNG BỘ FIREBASE (ĐỊNH NGHĨA NGOÀI ĐỂ DÙNG Ở NHIỀU NƠII) ---
  const syncTimeToFirebase = useCallback(async (timeToSave) => {
    if (!user || !slug || timeToSave <= 0) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "history", slug), {
        seconds: timeToSave,
        last_watched: serverTimestamp(),
        [`details.${episodeSlug}`]: timeToSave
      });
      console.log("✅ Đã lưu mốc thời gian lên Firebase:", timeToSave);
    } catch (error) {
      console.error("❌ Lỗi lưu lịch sử:", error);
    }
  }, [user, slug, episodeSlug]);

  // Tính toán tập trước/sau
  const currentEpIndex = episodes.findIndex((ep) => ep.name === episodeName);
  const nextEp = episodes[currentEpIndex + 1];
  const prevEp = episodes[currentEpIndex - 1];

  const formatTimeSkip = (seconds) => {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 5 ? "0" : ""}${sec}`;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // --- KIỂM TRA PENDING HISTORY TỪMETA LOCALSTORAGE LÚC MOUNT ---
  useEffect(() => {
    if (!user) return;

    // Tìm tất cả pending sync từ localStorage
    const keys = Object.keys(localStorage);
    const pendingKeys = keys.filter(k => k.startsWith('pending_sync_'));

    pendingKeys.forEach(async (key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.uid === user.uid) {
          const { slug: pendingSlug, episodeSlug: pendingEpisodeSlug, currentTime: pendingTime } = data;
          
          // Đồng bộ lên Firebase
          await updateDoc(doc(db, "users", user.uid, "history", pendingSlug), {
            seconds: pendingTime,
            last_watched: serverTimestamp(),
            [`details.${pendingEpisodeSlug}`]: pendingTime
          });
          
          // Xóa khỏi localStorage sau khi sync thành công
          localStorage.removeItem(key);
          console.log(`✅ Synced pending history: ${pendingSlug} - ${pendingTime}s`);
        }
      } catch (error) {
        console.error("Lỗi sync pending history:", error);
      }
    });
  }, [user]);

  // --- GLOBAL HOTKEYS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (!playerInstance.current) return;
      const art = playerInstance.current;

      switch (e.key) {
        case ' ': case 'k': case 'K':
          e.preventDefault();
          art.toggle();
          // art.notice.show = art.playing ? "Tạm dừng" : "Tiếp tục";
          break;
        case 'j': case 'J':
          e.preventDefault();
          art.backward = 5;
          art.notice.show = "Lùi 5 giây";
          break;
        case 'l': case 'L':
          e.preventDefault();
          art.forward = 5;
          art.notice.show = "Tới 5 giây";
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.ctrlKey) {
            e.preventDefault();
            art.forward = 30;
            art.notice.show = "Tới 30 giây";
            break;
          }
          art.forward = 5;
          art.notice.show = "Tới 5 giây";
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.ctrlKey) {
            e.preventDefault();
            art.backward = 30;
            art.notice.show = "Lùi 30 giây";
            break;
          }
          art.backward = 5;
          art.notice.show = "Lùi 5 giây";
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
          art.fullscreen = !art.fullscreen;
          break;
        case 'm': case 'M':
          art.muted = !art.muted;
          art.notice.show = art.muted ? "Đã tắt tiếng" : "Đã bật tiếng";
          break;
        case 'n': case 'N':
          if (nextEp) {
            art.notice.show = "Đang chuyển tập tiếp theo...";
            setIsChangingEpisode(true);
            router.push(`/phim/${slug}?tap=${nextEp.slug}`);
          } else {
            art.notice.show = "Đây là tập cuối cùng";
          }
          break;
        case 'p': case 'P':
          if (prevEp) {
            art.notice.show = "Đang quay lại tập trước...";
            setIsChangingEpisode(true);
            router.push(`/phim/${slug}?tap=${prevEp.slug}`);
          }
          break;

        default: break;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [nextEp, prevEp, router, slug]);

  // Tắt overlay khi đã load xong tập mới
  useEffect(() => {
    setIsChangingEpisode(false);
  }, [url, episodeSlug]);

  // --- INIT PLAYER ---
  useEffect(() => {
    if (playerInstance.current) return;
    if (!artRef.current) return;

    const art = new Artplayer({
      container: artRef.current,
      url: url,

      lang: "vi",

      i18n: {
        vi: {
          "Play": "Phát",
          "Pause": "Tạm dừng",
          "Mute": "Tắt tiếng",
          "Unmute": "Bật tiếng",
          "Fullscreen": "Toàn màn hình",
          "Exit fullscreen": "Thoát toàn màn hình",
          "PIP": "Chế độ cửa sổ nổi",
          "Exit PIP": "Thoát cửa sổ nổi",
          "Aspect Ratio": "Tỉ lệ khung hình",
          "Default": "Mặc định",
          "Normal": "Bình thường",
          "Mini Player": "Trình phát thu nhỏ",
          "Screenshot": "Chụp màn hình",
          "Settings": "Cài đặt",
          "Playback Rate": "Tốc độ phát",
          "Video Flip": "Lật video",
          "Horizontal": "Lật ngang",
          "Vertical": "Lật dọc",
          "Reconnect": "Kết nối lại",
          "Show Controls": "Hiện điều khiển",
          "Hide Controls": "Ẩn điều khiển",
          "Show Setting" : "Hiện cài đặt",
          "Play Speed": "Tốc độ phát",
          "Close": "Đóng",
          "Video Info": "Thông tin video"
        }
      },
      title: episodeName,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      autoOrientation: true,
      pip: true,
      fullscreen: true,
      // fullscreenWeb: true,
      // miniProgressBar: true,
      theme: "#00FF41",
      hotkey: false,
      setting: true,
      playbackRate: true,
      aspectRatio: true,

      flip: true,
      controls: [
        // {
        //   name: 'prev-episode',
        //   position: 'left',
        //   index: 10,
        //   html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
        //   tooltip: 'Tập trước (P)',
        //   style: {
        //     display: prevEp ? 'flex' : 'none',
        //     marginRight: '10px',
        //     cursor: 'pointer',
        //   },
        //   click: function () {
        //     if (prevEp) router.push(`/phim/${slug}?tap=${prevEp.slug}`);
        //   },
        // },
        {
          name: 'next-episode',
          position: 'left',
          index: 11,
          html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
          tooltip: 'Tập tiếp theo (N)',
          style: {
            display: nextEp ? 'flex' : 'none',
            marginRight: '10px',
            cursor: 'pointer',
          },
          click: function () {
            if (nextEp) {
              setIsChangingEpisode(true);
              router.push(`/phim/${slug}?tap=${nextEp.slug}`);
            }
          },
        },
        {
          name: 'backward-5s',
          position: 'left',
          index: 12,
          html: `<svg width="22" height="22" viewBox="0 0 24 24" style="fill:none; stroke:#ffffff; stroke-width:2;" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
          tooltip: 'Lùi 5s (J)',
          style: { cursor: 'pointer' },
          click: function () {
            art.backward = 5;
            art.notice.show = "Lùi 5 giây";
          },
        },
        {
          name: 'forward-5s',
          position: 'left',
          index: 13,
          html: `<svg width="22" height="22" viewBox="0 0 24 24" style="fill:none; stroke:#ffffff; stroke-width:2;" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/> <path d="M21 3v5h-5"/></svg>`
          , tooltip: 'Tới 5s (L)',
          style: { cursor: 'pointer' },
          click: function () {
            art.forward = 5;
            art.notice.show = "Tới 5 giây";
          },
        },
        {
          name: 'skip-ad',
          position: 'right',
          index: 20,
          html: `<svg width="22" height="22" viewBox="0 0 24 24" style="fill:#ffffff;"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
          tooltip: 'Bỏ qua quảng cáo (30s)',
          style: { cursor: 'pointer', marginLeft: '10px' },
          click: function () {
            art.forward = 30;
            art.notice.show = "Bỏ qua quảng cáo (+30s)";
          },
        },

      ],
      layers: [
        {
          name: 'movieTitle',
          html: `
                        <style>
                            /* GIAO DIỆN GỐC (PC) */
                            .art-custom-title {
                                position: absolute;
                                top: 0; left: 0; right: 0;
                                padding: 25px 20px;
                                background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
                                display: flex; 
                                align-items: center; gap: 12px;
                                transition: opacity 0.4s ease, transform 0.4s ease;
                                pointer-events: none;
                                z-index: 50;
                            }
                            .art-custom-title-mark {
                                width: 4px; height: 18px; background-color: #00FF41; border-radius: 2px; flex-shrink: 0;
                            }
                            .art-custom-title-text {
                                font-size: 18px; font-weight: bold; color: #ffffff; 
                                text-shadow: 0 2px 5px rgba(0,0,0,0.8);
                                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                            }
                            .art-custom-title-ep {
                                color: #a3a3a3; font-size: 15px; font-weight: 500; margin-left: 5px;
                            }

                            /* 1. TRÊN ĐIỆN THOẠI: ẨN HOÀN TOÀN CHO ĐỠ CHẬT */
                            @media (max-width: 768px) {
                                .art-custom-title { display: none; }
                            }

                            /* 2. KHI PHÓNG TO TOÀN MÀN HÌNH: ÉP HIỂN THỊ LẠI */
                            .art-fullscreen .art-custom-title {
                                display: flex !important; /* Phá vỡ lệnh ẩn ở trên */
                                padding: 15px 20px; /* Thu gọn lề một chút khi xoay ngang điện thoại */
                            }
                            .art-fullscreen .art-custom-title-text {
                                font-size: 16px; /* Chữ vừa vặn hơn trên đt xoay ngang */
                            }
                            /* 1. Ép vị trí ra giữa và vô hiệu hóa kiểu tắt đột ngột của Artplayer */
                            .art-video-player .art-notice {
                                display: block !important; /* QUAN TRỌNG: Chống Artplayer giấu hẳn element */
                                position: absolute !important;
                                bottom: auto !important;
                                top: 15% !important; /* Nằm cách đáy 15% (bên dưới một tí) */
                                left: 50% !important;
                                right: auto !important;
                                width: auto !important;
                                margin: 0 !important;
                                z-index: 999 !important;
                                pointer-events: none !important; /* Không cản trở click chuột vào video */
                                
                                /* TRẠNG THÁI ẨN: Trong suốt 100% và tụt nhẹ xuống */
                                opacity: 0 !important;
                                transform: translate(-50%, -20px) !important;
                                transition: opacity 0.5s ease, transform 0.5s ease !important;
                            }
                            
                            /* KHI HIỂN THỊ: Artplayer sẽ gắn class art-notice-show vào video player */
                            .art-video-player.art-notice-show .art-notice {
                                opacity: 1 !important; /* Hiện rõ lên */
                                // transform: translate(-50%, 0) !important; /* Trượt nhẹ lên vị trí gốc */
                            }
                            
                            /* 2. Làm đẹp nội dung (Dạng viên nang bo tròn mượt mà) */
                            .art-video-player .art-notice-inner {
                                background: rgba(0, 0, 0, 0.7) !important;
                                // backdrop-filter: blur(10px) !important;
                                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                                color: #ffffff !important;
                                padding: 10px 24px !important;
                                font-size: 13px !important;
                                font-weight: bold !important;
                                border-radius: 50px !important; /* Bo tròn hoàn toàn hai đầu */
                                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.6) !important;
                                text-transform: uppercase !important;
                                white-space: nowrap !important;
                                letter-spacing: 1px !important;
                            }
                        </style>

                        <div class="art-custom-title">
                            <span class="art-custom-title-mark"></span>
                            <span class="art-custom-title-text">
                                ${movieName || 'Đang tải...'} 
                                ${episodeName ? `<span class="art-custom-title-ep">| ${episodeName}</span>` : ''}
                            </span>
                        </div>
                    `,
        }
      ],


      customType: {
        m3u8: function (video, url) {
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
          } else {
            art.notice.show = "Trình duyệt không hỗ trợ phát video này";
          }
        },
      },
      lang: "vi",
      lock: true,
      autoSize: false,

    });
    // 2. LẮNG NGHE SỰ KIỆN ẨN/HIỆN CỦA THANH ĐIỀU KHIỂN
    art.on('control', (state) => {
      // Kiểm tra an toàn xem cái thẻ gốc của React có còn trên màn hình không
      if (!artRef.current) return;

      // Dùng thẳng biến artRef.current của React để tìm, bất chấp mọi phiên bản Artplayer
      const titleEl = artRef.current.querySelector('.art-custom-title');

      if (titleEl) {
        if (state) {
          // Khi thanh điều khiển hiện
          titleEl.style.opacity = '1';
          titleEl.style.transform = 'translateY(0)';
        } else {
          // Khi thanh điều khiển ẩn
          titleEl.style.opacity = '0';
          titleEl.style.transform = 'translateY(-15px)';
        }
      }
    });

    playerInstance.current = art;


    // --- LOGIC: TẢI LỊCH SỬ THÔNG MINH ---
    art.on("ready", async () => {
      let shouldPlayImmediately = true;

      if (user && slug) {
        try {
          const docRef = doc(db, "users", user.uid, "history", slug);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentTapParam = searchParams.get('tap');

            // 1. Logic chuyển hướng: Vào từ Home -> Nhảy đến tập đang xem dở
            if (!currentTapParam && data.episode_slug && data.episode_slug !== episodeSlug) {
              art.notice.show = `Đang chuyển đến ${data.episode}`;
              router.replace(`/phim/${slug}?tap=${data.episode_slug}`);
              return;
            }

            // 2. LOGIC MỚI: TÌM ĐÚNG GIÂY CỦA TẬP NÀY
            // Kiểm tra xem trong 'details' có lưu tập này chưa?
            // Nếu có thì lấy, nếu không thì mặc định là 0
            const specificTime = data.details ? (data.details[episodeSlug] || 0) : 0;

            // Nếu tìm thấy thời gian của tập này > 10s thì tua
            if (specificTime > 10) {
              shouldPlayImmediately = false;
              art.seek = specificTime;
              art.notice.show = `Đang phát tiếp từ ${formatTime(specificTime)}`;
              setTimeout(() => { art.play(); }, 300);
            }
          }
        } catch (error) { console.error(error); }
      }

      if (shouldPlayImmediately) art.play();
    });

    // --- 2. CẬP NHẬT LIÊN TỤC VÀO LOCALSTORAGE (MIỄN PHÍ) ---
    art.on("video:timeupdate", () => {
      const time = art.currentTime;
      currentTimeRef.current = time;
      
      // Lưu ngay lập tức vào trình duyệt (0 tốn Quota)
      localStorage.setItem(`history_${slug}_${episodeSlug}`, time);

      // Backup lưu lên Firebase mỗi 120 giây (Chỉ 1 lần/2phút)
      if (time - lastFirebaseSyncRef.current >= 120) {
        lastFirebaseSyncRef.current = time;
        syncTimeToFirebase(time);
      }
    });

    // --- 3. LƯU FIREBASE KHI NGƯỜI DÙNG BẤM TẠM DỪNG ---
    art.on("pause", () => {
      lastFirebaseSyncRef.current = currentTimeRef.current;
      syncTimeToFirebase(currentTimeRef.current);
    });
    
    // --- 4. LƯU FIREBASE KHI VIDEO KẾT THÚC ---
    art.on("video:ended", () => {
      syncTimeToFirebase(currentTimeRef.current);
      if (nextEp) {
        art.notice.show = "Đang chuyển sang tập tiếp theo...";
        setIsChangingEpisode(true);
        setTimeout(() => {
          router.push(`/phim/${slug}?tap=${nextEp.slug}`);
        }, 2000);
      }
    });

    return () => {
      if (playerInstance.current) {
        const player = playerInstance.current;
        if (player.video) {
          player.video.pause();
          player.video.src = "";
          player.video.load();
        }
        if (player.hls) player.hls.destroy();
        player.destroy(true);
        playerInstance.current = null;
      }
    };
  }, [url, user, slug, episodeName, episodes, nextEp, prevEp, router, episodeSlug, searchParams]);

  // --- 5. LƯU FIREBASE KHI NGƯỜI DÙNG ĐÓNG TAB HOẶC CHUYỂN TRANG ---
  useEffect(() => {
    // Khi người dùng đóng tab/trình duyệt
    const handleBeforeUnload = (e) => {
      if (!user || !slug || currentTimeRef.current <= 0) return;
      
      // Lưu ngay vào localStorage làm backup (trường hợp Firebase không kịp lưu)
      localStorage.setItem(`pending_sync_${slug}_${episodeSlug}`, JSON.stringify({
        uid: user.uid,
        currentTime: currentTimeRef.current,
        slug: slug,
        episodeSlug: episodeSlug,
        timestamp: new Date().toISOString()
      }));

      // Cố gắng sync lên Firebase bằng sendBeacon (request không bị hủy khi tab đóng)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/save-watch-history', JSON.stringify({
          uid: user.uid,
          slug: slug,
          episodeSlug: episodeSlug,
          currentTime: currentTimeRef.current
        }));
      }
      
      console.log(`⏱️ Đóng trang - Đã lưu thời gian ${currentTimeRef.current}s vào localStorage`);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // Cleanup khi component unmount (chuyển trang)
      if (user && slug && currentTimeRef.current > 0) {
        console.log(`✅ Component unmount - Lưu ${currentTimeRef.current}s lên Firebase`);
        syncTimeToFirebase(currentTimeRef.current);
      }
    };
  }, [user, slug, episodeSlug, syncTimeToFirebase]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,255,65,0.2)]">
        <div
          ref={artRef}
          className="absolute inset-0"
        />
      </div>
    </div>
  );

}