"use client";
import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

export default function VideoPlayer({ url, slug, episodeName, episodes = [], episodeSlug }) {
  const artRef = useRef(null);
  const playerInstance = useRef(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tính toán tập
  const currentEpIndex = episodes.findIndex((ep) => ep.name === episodeName);
  const nextEp = episodes[currentEpIndex + 1];
  const prevEp = episodes[currentEpIndex - 1];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // --- 1. LOGIC XỬ LÝ PHÍM TẮT TOÀN CỤC (GLOBAL HOTKEYS) ---
  // Đoạn này giúp phím tắt hoạt động ngay cả khi chưa bấm vào player
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        // QUAN TRỌNG: Nếu đang gõ phím vào ô Tìm kiếm (Input) thì KHÔNG chạy phím tắt video
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

        // Nếu player chưa sẵn sàng thì thôi
        if (!playerInstance.current) return;
        const art = playerInstance.current;

        switch (e.key) {
            case ' ': // Phím Space (Khoảng trắng)
            case 'k':
            case 'K':
                e.preventDefault(); // Chặn cuộn trang
                art.toggle(); // Play/Pause
                art.notice.show = art.playing ? "Tạm dừng" : "Tiếp tục";
                break;
            
            case 'ArrowRight': // Mũi tên phải
                e.preventDefault();
                art.forward = 10; // Tua tới 10s
                break;

            case 'ArrowLeft': // Mũi tên trái
                e.preventDefault();
                art.backward = 10; // Lùi 10s
                break;

            case 'ArrowUp': // Mũi tên lên
                e.preventDefault(); // Chặn cuộn trang
                art.volume = Math.min(art.volume + 0.1, 1);
                art.notice.show = `Âm lượng: ${Math.round(art.volume * 100)}%`;
                break;

            case 'ArrowDown': // Mũi tên xuống
                e.preventDefault(); // Chặn cuộn trang
                art.volume = Math.max(art.volume - 0.1, 0);
                art.notice.show = `Âm lượng: ${Math.round(art.volume * 100)}%`;
                break;

            case 'f': // Phím F: Fullscreen
            case 'F':
                art.fullscreen = !art.fullscreen;
                break;

            case 'm': // Phím M: Mute
            case 'M':
                art.muted = !art.muted;
                art.notice.show = art.muted ? "Đã tắt tiếng" : "Đã bật tiếng";
                break;

            case 'n': // Phím N: Next tập
            case 'N':
                if (nextEp) {
                    art.notice.show = "Đang chuyển tập tiếp theo...";
                    router.push(`/phim/${slug}?tap=${nextEp.slug}`);
                } else {
                    art.notice.show = "Đây là tập cuối cùng";
                }
                break;

            case 'p': // Phím P: Previous tập
            case 'P':
                if (prevEp) {
                    art.notice.show = "Đang quay lại tập trước...";
                    router.push(`/phim/${slug}?tap=${prevEp.slug}`);
                }
                break;
                
            default:
                break;
        }
    };

    // Gắn sự kiện vào cửa sổ trình duyệt
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Dọn dẹp sự kiện khi thoát trang
    return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [nextEp, prevEp, router, slug]); // Cập nhật khi tập phim thay đổi


  // --- 2. KHỞI TẠO PLAYER (GIỮ NGUYÊN) ---
  useEffect(() => {
    if (playerInstance.current) return;
    if (!artRef.current) return;

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      title: episodeName,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      autoOrientation: true,
      pip: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      theme: "#00FF41",
      
      // Tắt hotkey mặc định của Artplayer để dùng bộ Global ở trên (tránh xung đột)
      hotkey: false, 

      controls: [
        {
          name: 'prev-episode',
          position: 'left',
          index: 10,
          html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
          tooltip: 'Tập trước (P)',
          style: {
             display: prevEp ? 'flex' : 'none',
             marginRight: '10px',
             cursor: 'pointer',
          },
          click: function () {
            if (prevEp) router.push(`/phim/${slug}?tap=${prevEp.slug}`);
          },
        },
        {
          name: 'next-episode',
          position: 'left',
          index: 11,
          html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
          tooltip: 'Tập tiếp theo (N)',
          style: {
             display: nextEp ? 'flex' : 'none',
             cursor: 'pointer',
          },
          click: function () {
             if (nextEp) router.push(`/phim/${slug}?tap=${nextEp.slug}`);
          },
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
      autoSize: true, 
      lock: true,
    });

    playerInstance.current = art;

    art.on("ready", async () => {
      let shouldPlayImmediately = true;
      if (user && slug) {
        try {
          const docRef = doc(db, "users", user.uid, "history", slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentTapParam = searchParams.get('tap');
            
            if (!currentTapParam && data.episode_slug && data.episode_slug !== episodeSlug) {
                art.notice.show = `Đang chuyển đến ${data.episode}`;
                router.replace(`/phim/${slug}?tap=${data.episode_slug}`);
                return; 
            }
            if (data.episode === episodeName && data.seconds > 10) {
              shouldPlayImmediately = false;
              art.seek = data.seconds;
              art.notice.show = `Đang phát tiếp từ ${formatTime(data.seconds)}`;
              setTimeout(() => { art.play(); }, 300);
            }
          }
        } catch (error) { console.error(error); }
      }
      if (shouldPlayImmediately) art.play();
    });

    art.on("video:timeupdate", async () => {
        if (!user || !slug) return;
        const currentTime = art.currentTime;
        if (currentTime > 0 && Math.floor(currentTime) % 5 === 0) {
           await setDoc(doc(db, "users", user.uid, "history", slug), {
             slug: slug,
             episode: episodeName,
             episode_slug: episodeSlug,
             seconds: currentTime,
             last_watched: serverTimestamp()
           }, { merge: true });
        }
    });

    art.on("video:ended", () => {
        if (nextEp) {
            art.notice.show = "Đang chuyển sang tập tiếp theo...";
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
  }, [url, user, slug, episodeName, episodes, nextEp, prevEp, router, searchParams]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,255,65,0.2)]">
      <div ref={artRef} className="w-full h-full" />
    </div>
  );
}