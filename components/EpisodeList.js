"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const EPISODE_DISPLAY_LIMIT = 16;

export default function EpisodeList({ episodes, currentEpisode, slug, totalDuration }) {
  const [historyDetails, setHistoryDetails] = useState({});
  const [user, setUser] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !slug) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "history", slug), (doc) => {
        if (doc.exists()) {
            setHistoryDetails(doc.data().details || {});
        }
    });
    return () => unsub();
  }, [user, slug]);

  const getProgress = (epSlug) => {
      const seconds = historyDetails[epSlug] || 0;
      if (!totalDuration || totalDuration === 0) return 0;
      let percent = ((seconds / 60) / totalDuration) * 100;
      return Math.min(percent, 100);
  };

  const displayEpisodes = showAll ? episodes : episodes.slice(0, EPISODE_DISPLAY_LIMIT);
  const hasMore = episodes.length > EPISODE_DISPLAY_LIMIT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-white font-display font-bold text-xl uppercase tracking-wide">
            Danh Sách Tập
        </h2>
        <span className="text-gray-400 font-mono text-xs border border-white/10 px-2 py-1 rounded">
          {episodes.length} TẬP
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
        {displayEpisodes.map((ep) => {
          const isActive = currentEpisode?.slug === ep.slug;
          const epNumber = ep.name.match(/\d+/)?.[0] || ep.name;
          const percent = getProgress(ep.slug);

          return (
            <Link key={ep.slug} href={`/phim/${slug}?tap=${ep.slug}`} scroll={false}>
              <button
                className={`
                  relative w-full py-3 px-1 text-sm font-bold transition-all duration-300 border rounded overflow-hidden group
                  ${
                    isActive
                      /* STYLE MỚI: Nền tối pha chút xanh nhẹ, Viền xanh, Chữ xanh sáng */
                      ? "bg-primary/10 text-primary border-primary shadow-[0_0_15px_rgba(0,255,65,0.15)]"
                      /* STYLE CŨ: Nền tối, Viền mờ */
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/30"
                  }
                `}
              >
                <span className="relative z-10">
                    {epNumber.length > 3 ? epNumber : `Tập ${epNumber}`}
                </span>
                
                {/* Thanh tiến trình */}
                {percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/50">
                        <div 
                          className={`h-full ${isActive ? 'bg-primary shadow-[0_0_5px_#00FF41]' : 'bg-gray-400'}`} 
                          style={{ width: `${percent}%` }}
                        />
                    </div>
                )}
              </button>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide bg-white/5 hover:bg-primary hover:text-black border border-white/10 text-white transition-all duration-300"
          >
            {showAll ? "Thu gọn" : `Xem tất cả (${episodes.length} tập)`}
          </button>
        </div>
      )}
    </div>
  );
}