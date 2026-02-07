"use client";
import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react";
import { renderToString } from "react-dom/server";

export default function VideoPlayer({ url, slug, episodeName, episodes = [], episodeSlug }) {
  const artRef = useRef(null);
  const playerInstance = useRef(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
          art.notice.show = art.playing ? "Tạm dừng" : "Tiếp tục";
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
          art.forward = 5;
          art.notice.show = "Tới 5 giây";
          break;
        case 'ArrowLeft':
          e.preventDefault();
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
            router.push(`/phim/${slug}?tap=${nextEp.slug}`);
          } else {
            art.notice.show = "Đây là tập cuối cùng";
          }
          break;
        case 'p': case 'P':
          if (prevEp) {
            art.notice.show = "Đang quay lại tập trước...";
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

  // --- INIT PLAYER ---
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
            marginRight: '15px',
            cursor: 'pointer',
          },
          click: function () {
            if (nextEp) router.push(`/phim/${slug}?tap=${nextEp.slug}`);
          },
        },
        {
          name: 'backward-5s',
          position: 'left',
          index: 12,
          html: `<svg width="22" height="22" viewBox="0 0 24 24" style="fill:none; stroke:#ffffff; stroke-width:2;" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
          tooltip: 'Lùi 5s (J)',
          style: { marginRight: '5px', cursor: 'pointer' },
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

    // --- LOGIC: LƯU LỊCH SỬ THÔNG MINH ---
    art.on("video:timeupdate", async () => {
      if (!user || !slug) return;
      const currentTime = art.currentTime;

      // Lưu mỗi 5 giây
      if (currentTime > 0 && Math.floor(currentTime) % 5 === 0) {
        await setDoc(doc(db, "users", user.uid, "history", slug), {
          // 1. Thông tin chung (Dùng cho Tủ Phim hiển thị tập mới nhất)
          slug: slug,
          episode: episodeName,
          episode_slug: episodeSlug || '',
          seconds: currentTime, // Thời gian của tập mới nhất
          last_watched: serverTimestamp(),

          // 2. THÊM MỚI: Lưu chi tiết thời gian cho TỪNG tập
          // Cấu trúc này giúp lưu: { "tap-1": 120, "tap-2": 500 }
          details: {
            [episodeSlug]: currentTime
          }
        }, { merge: true }); // merge: true cực quan trọng để không mất dữ liệu các tập khác
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
  }, [url, user, slug, episodeName, episodes, nextEp, prevEp, router, episodeSlug, searchParams]);

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