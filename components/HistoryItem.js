"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { getMovieData } from "@/lib/movieService";

export default function HistoryItem({ item, onDelete }) {
  const [movie, setMovie] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getMovieData(`/phim/${item.slug}`);
      if (data.status) setMovie(data.movie);
    };
    if (item.slug) fetchInfo();
  }, [item.slug]);

  const stats = useMemo(() => {
    if (!movie) return { percent: 0, watched: 0, total: 0 };
    
    // Parse tổng thời lượng & tính %
    const total = parseInt(movie.time?.match(/\d+/)?.[0] || 0);
    const watched = Math.floor((item.seconds || 0) / 60);
    const percent = total > 0 ? Math.min((watched / total) * 100, 100) : 0;
    
    return { percent, watched, total };
  }, [movie, item.seconds]);

  if (!movie) return <div className="w-full aspect-[2/3] bg-white/5 animate-pulse rounded" />;

  const hrefLink = item.episode_slug 
    ? `/phim/${item.slug}?tap=${item.episode_slug}` 
    : `/phim/${item.slug}`;

  const historyId = item.id || item.slug;

  return (
    <div className="group relative flex-shrink-0 w-40 md:w-48">
      <Link href={hrefLink} className="block">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded border border-white/10 group-hover:border-primary transition-colors bg-surface">
        {onDelete && (
          <div ref={menuRef} className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-colors border border-white/10"
              title="Tùy chọn"
              aria-label="Tùy chọn"
              aria-expanded={menuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 min-w-[160px] py-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(historyId);
                  }}
                  className="w-full px-2 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-white-400">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Xóa khỏi tủ phim  
                </button>
              </div>
            )}
          </div>
        )}
        <img
          src={movie.poster_url}
          alt={movie.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-center p-4 backdrop-blur-sm">
          <span className="text-primary font-black text-xs uppercase mb-2 tracking-widest">ĐANG XEM</span>
          <span className="text-white font-bold text-sm line-clamp-2 mb-1">{movie.name}</span>
          <span className="text-gray-400 text-xs font-mono bg-white/10 px-2 py-1 rounded">{item.episode}</span>
          <span className="text-gray-500 text-[10px] mt-2">{stats.watched} / {stats.total || "??"} phút</span>
          <button className="mt-4 bg-primary text-black text-xs font-black px-4 py-2 rounded-full hover:scale-110 transition-transform">
            XEM TIẾP ►
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/80 backdrop-blur">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_#00FF41]" 
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>
      
      <div className="mt-2">
        <h3 className="text-sm font-bold text-gray-300 truncate group-hover:text-primary transition-colors">{movie.name}</h3>
        <p className="text-[10px] text-gray-500 flex justify-between">
          <span>{item.episode}</span>
          <span>{Math.round(stats.percent)}%</span>
        </p>
      </div>
      </Link>
    </div>
  );
}