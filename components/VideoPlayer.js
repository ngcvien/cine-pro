"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { SkipBack, SkipForward } from "lucide-react";

export default function VideoPlayer({ url, slug, episodeName, episodes = [], currentEpisodeIndex = 0 }) {
  const artRef = useRef(null);
  const playerInstance = useRef(null);
  const canvasRef = useRef(null);
  const progressBarRef = useRef(null);
  const captureTimeoutRef = useRef(null);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [hoverPreview, setHoverPreview] = useState({ show: false, x: 0, y: 0, time: 0, thumbnail: null });

  const hasPreviousEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;

  const goToPreviousEpisode = useCallback(() => {
    if (hasPreviousEpisode && episodes[currentEpisodeIndex - 1]) {
      router.push(`/phim/${slug}?tap=${episodes[currentEpisodeIndex - 1].slug}`);
    }
  }, [hasPreviousEpisode, episodes, currentEpisodeIndex, slug, router]);

  const goToNextEpisode = useCallback(() => {
    if (hasNextEpisode && episodes[currentEpisodeIndex + 1]) {
      router.push(`/phim/${slug}?tap=${episodes[currentEpisodeIndex + 1].slug}`);
    }
  }, [hasNextEpisode, episodes, currentEpisodeIndex, slug, router]);

  const captureFrame = useCallback((video, time) => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    try {
      const ctx = canvas.getContext("2d");
      canvas.width = 160;
      canvas.height = 90;
      ctx.drawImage(video, 0, 0, 160, 90);

      return canvas.toDataURL("image/jpeg", 0.5);
    } catch (error) {
      console.error("Lỗi capture frame:", error);
      return null;
    }
  }, []);

  const handleProgressBarHover = useCallback((e) => {
    if (!playerInstance.current || !progressBarRef.current) return;

    const player = playerInstance.current;
    const video = player.video;

    if (!video || video.duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * video.duration;

    setHoverPreview(prev => ({
      ...prev,
      show: true,
      x: e.clientX,
      y: rect.top,
      time: time,
    }));

    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }

    captureTimeoutRef.current = setTimeout(() => {
      const thumbnail = captureFrame(video, time);
      if (thumbnail) {
        setHoverPreview(prev => ({
          ...prev,
          thumbnail: thumbnail
        }));
      }
    }, 100);
  }, [captureFrame]);

  const handleProgressBarLeave = useCallback(() => {
    setHoverPreview(prev => ({ ...prev, show: false, thumbnail: null }));
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }
  }, []);

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
          if (player.subtitles && player.subtitles.length > 0) {
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
        case "n":
          e.preventDefault();
          if (hasNextEpisode) {
            goToNextEpisode();
          }
          break;
        case "p":
          e.preventDefault();
          if (hasPreviousEpisode) {
            goToPreviousEpisode();
          }
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
  }, [showShortcuts, hasNextEpisode, hasPreviousEpisode, goToNextEpisode, goToPreviousEpisode]);

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

    // Thêm event listener cho progress bar hover
    const setupProgressBarListeners = () => {
      const progressBar = artRef.current?.querySelector(".art-bottom");
      if (progressBar) {
        progressBarRef.current = progressBar;
        progressBar.addEventListener("mousemove", handleProgressBarHover);
        progressBar.addEventListener("mouseleave", handleProgressBarLeave);
      }
    };

    setTimeout(setupProgressBarListeners, 1000);

    // --- CLEANUP ---
    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }

      if (progressBarRef.current) {
        progressBarRef.current.removeEventListener("mousemove", handleProgressBarHover);
        progressBarRef.current.removeEventListener("mouseleave", handleProgressBarLeave);
      }

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
  }, [url, user, slug, episodeName, handleProgressBarHover, handleProgressBarLeave]);

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
    { key: "N", action: "Tập tiếp theo" },
    { key: "P", action: "Tập trước" },
    { key: "?", action: "Hiển thị phím tắt" },
  ];

  return (
    <div className="w-full aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl shadow-primary/10 relative group">
      {/* Video Player */}
      <div ref={artRef} className="w-full h-full" />

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Previous Episode Button */}
      {hasPreviousEpisode && (
        <button
          onClick={goToPreviousEpisode}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-black/80 hover:bg-primary/90 text-white hover:text-black p-3 rounded-full border border-white/20 hover:border-primary transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm shadow-lg"
          title="Tập trước (P)"
        >
          <SkipBack size={24} />
        </button>
      )}

      {/* Next Episode Button */}
      {hasNextEpisode && (
        <button
          onClick={goToNextEpisode}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/80 hover:bg-primary/90 text-white hover:text-black p-3 rounded-full border border-white/20 hover:border-primary transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm shadow-lg"
          title="Tập tiếp theo (N)"
        >
          <SkipForward size={24} />
        </button>
      )}

      {/* Video Hover Preview Tooltip */}
      {hoverPreview.show && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${hoverPreview.x}px`,
            bottom: `${window.innerHeight - hoverPreview.y + 20}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-black/95 border border-primary/50 rounded-lg overflow-hidden shadow-2xl shadow-primary/20">
            {hoverPreview.thumbnail ? (
              <img
                src={hoverPreview.thumbnail}
                alt="preview"
                className="w-40 h-[90px] object-cover"
              />
            ) : (
              <div className="w-40 h-[90px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="bg-black/80 px-3 py-1.5 text-center">
              <span className="text-xs font-bold text-primary font-mono">
                {formatTime(hoverPreview.time)}
              </span>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary/50" />
        </div>
      )}

      {/* Shortcuts Button */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className="absolute top-4 right-4 z-40 px-3 py-2 text-xs font-bold bg-black/50 text-gray-300 border border-white/20 hover:text-white hover:border-white transition-all duration-300 backdrop-blur-sm rounded"
        title="Hiển thị phím tắt"
      >
        {showShortcuts ? "✕" : "?"}
      </button>

      {/* Shortcuts Help Panel */}
      {showShortcuts && (
        <div className="absolute top-16 right-4 z-40 bg-black/95 border border-white/20 rounded-lg p-4 w-72 backdrop-blur-md shadow-xl">
          <h3 className="text-primary font-bold mb-4 text-sm">PHÍM TẮT</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {shortcuts.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="bg-primary/20 text-primary px-2 py-1 rounded-sm font-bold text-center flex-shrink-0 min-w-[40px]">{item.key}</span>
                <span className="text-gray-400 text-xs">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
