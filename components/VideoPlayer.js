"use client";
import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function VideoPlayer({ url, slug, episodeName }) {
  const artRef = useRef(null);
  const playerInstance = useRef(null); // Dùng để kiểm soát instance
  const [user, setUser] = useState(null);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // 1. Lấy User
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. Xử lý phím tắt
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!playerInstance.current) return;
      const player = playerInstance.current;
      const video = player.video;
      
      // Tránh conflict với các phím khác
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          if (video.paused) {
            player.play();
          } else {
            player.pause();
          }
          break;
        case "f":
          player.fullscreen = !player.fullscreen;
          break;
        case "m":
          player.muted = !player.muted;
          break;
        case "c":
          // Bật/tắt subtitle
          if (player.subtitles.length > 0) {
            player.subtitle = player.subtitle === player.subtitles[0] ? "" : player.subtitles[0];
          }
          break;
        case "arrowup":
          e.preventDefault();
          player.volume = Math.min(1, player.volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          player.volume = Math.max(0, player.volume - 0.1);
          break;
        case "arrowleft":
          e.preventDefault();
          player.seek = player.currentTime - 5;
          break;
        case "arrowright":
          e.preventDefault();
          player.seek = player.currentTime + 5;
          break;
        case "?":
        case "/":
          setShowShortcuts(!showShortcuts);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showShortcuts]);

  useEffect(() => {
    if (playerInstance.current) {
        return;
    }

    if (!artRef.current) return;

    // Khởi tạo Artplayer
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
            if (data.episode === episodeName && data.seconds > 10) {
              shouldPlayImmediately = false; 
              
              art.seek = data.seconds;
              art.notice.show = `Đang phát tiếp từ ${formatTime(data.seconds)}`;
              
              setTimeout(() => {
                  art.play(); 
              }, 300);
            }
          }
        } catch (error) {
          console.error("Lỗi history:", error);
        }
      }

      // Nếu không có lịch sử thì play từ đầu luôn
      if (shouldPlayImmediately) {
          art.play();
      }
    });

    // Lưu lịch sử
    art.on("video:timeupdate", async () => {
        if (!user || !slug) return;
        const currentTime = art.currentTime;
        if (currentTime > 0 && Math.floor(currentTime) % 5 === 0) {
           await setDoc(doc(db, "users", user.uid, "history", slug), {
             slug: slug,
             episode: episodeName,
             seconds: currentTime,
             last_watched: serverTimestamp()
           }, { merge: true });
        }
    });

    // --- CLEANUP ---
    return () => {
      if (playerInstance.current) {
        const player = playerInstance.current;
        
        if (player.video) {
            player.video.pause();
            player.video.src = "";
            player.video.load();
        }

        if (player.hls) {
            player.hls.destroy();
        }

        player.destroy(true); 
        playerInstance.current = null;
      }
    };
  }, [url, user, slug, episodeName]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const shortcuts = [
    { key: "SPACE", action: "Phát / Dừng" },
    { key: "F", action: "Toàn màn hình" },
    { key: "M", action: "Tắt tiếng" },
    { key: "C", action: "Phụ đề" },
    { key: "↑", action: "Tăng âm lượng" },
    { key: "↓", action: "Giảm âm lượng" },
    { key: "→", action: "Tua nhanh 5s" },
    { key: "←", action: "Tua lại 5s" },
    { key: "?", action: "Hiển thị phím tắt" },
  ];

  return (
    <div className={`w-full aspect-video overflow-hidden rounded-lg border shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all duration-500 ${
      cinemaMode 
        ? "border-primary/50 bg-black fixed inset-0 aspect-auto z-50 rounded-none" 
        : "border-white/10 bg-black"
    }`}>
      {/* Nút Cinema Mode */}
      <button
        onClick={() => setCinemaMode(!cinemaMode)}
        className={`absolute top-4 right-4 z-50 px-3 py-2 text-xs font-bold transition-all duration-300 ${
          cinemaMode
            ? "bg-primary text-black hover:bg-white"
            : "bg-black/60 text-primary border border-primary/50 hover:bg-black hover:border-primary"
        }`}
      >
        {cinemaMode ? "✕ EXIT" : "🎬 CINEMA"}
      </button>

      {/* Nút Shortcuts */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className="absolute top-4 right-24 z-50 px-3 py-2 text-xs font-bold bg-black/60 text-gray-400 border border-white/20 hover:text-white hover:border-white transition-all duration-300"
      >
        {showShortcuts ? "✕" : "?"}
      </button>

      {/* Shortcuts Help Panel */}
      {showShortcuts && (
        <div className="absolute top-16 right-4 z-50 bg-black/95 border border-primary/30 rounded-lg p-4 w-64 backdrop-blur-sm">
          <h3 className="text-primary font-bold mb-4 text-sm">PHÍM TẮT</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {shortcuts.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="bg-primary/20 text-primary px-2 py-1 rounded font-bold">{item.key}</span>
                <span className="text-gray-400 text-right flex-1 ml-2 pt-1">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Player */}
      <div ref={artRef} className="w-full h-full" />

      {/* Cinema Mode Background */}
      {cinemaMode && (
        <div className="fixed inset-0 -z-10 bg-black" />
      )}
    </div>
  );
}
