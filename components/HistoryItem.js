"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

export default function HistoryItem({ item }) {
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`https://phimapi.com/phim/${item.slug}`);
        const data = await res.json();
        if (data.status) setMovie(data.movie);
      } catch (error) {
        console.error("Lỗi:", error);
      }
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

  return (
    <Link href={hrefLink} className="group relative block">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded border border-white/10 group-hover:border-primary transition-colors bg-surface">
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
  );
}