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

  // 1. Lấy User
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,255,65,0.2)]">
      <div ref={artRef} className="w-full h-full" />
    </div>
  );
}