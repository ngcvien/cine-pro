"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function EpisodeList({ episodes, currentEpisode, slug, currentEpisodeLink }) {
  const [hoveredEpisode, setHoveredEpisode] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e, epIndex) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPreviewPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* EPISODES HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-2xl uppercase tracking-wide">Chọn Tập</h2>
        <span className="text-primary text-sm font-bold bg-primary/20 px-3 py-1.5 rounded-full">
          {episodes.length} tập
        </span>
      </div>

      {/* EPISODES GRID */}
      <div
        ref={containerRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 relative"
      >
        {episodes.map((ep, index) => {
          const isActive = currentEpisode?.slug === ep.slug;
          const epNumber = ep.name.match(/\d+/)?.[0] || ep.name;

          return (
            <div
              key={ep.slug}
              className="relative group"
              onMouseEnter={() => setHoveredEpisode(index)}
              onMouseLeave={() => setHoveredEpisode(null)}
              onMouseMove={(e) => handleMouseMove(e, index)}
            >
              <Link href={`/phim/${slug}?tap=${ep.slug}`} scroll={false}>
                <button
                  className={`
                    w-full py-3 px-2 text-xs font-bold transition-all duration-200 border rounded-lg
                    ${
                      isActive
                        ? "bg-primary text-black border-primary shadow-lg shadow-primary/50"
                        : "bg-black/40 text-gray-300 border-white/10 hover:border-primary hover:bg-primary/10 hover:text-primary"
                    }
                  `}
                >
                  Tập {epNumber}
                </button>
              </Link>

              {/* HOVER PREVIEW */}
              {hoveredEpisode === index && !isActive && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  {/* PREVIEW CARD */}
                  <div className="bg-black/95 border border-white/20 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm w-48">
                    {/* THUMBNAIL */}
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-gray-600 text-xs relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>Tập {epNumber}</span>
                    </div>

                    {/* INFO */}
                    <div className="p-3 space-y-2">
                      <h4 className="text-white font-bold text-xs truncate">{ep.name}</h4>
                      <p className="text-gray-400 text-xs line-clamp-2">
                        {currentEpisodeLink?.duration ? `${currentEpisodeLink.duration} phút` : "Chưa cập nhật"}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-0" />
                        </div>
                        <span className="text-primary text-xs font-bold">0%</span>
                      </div>
                    </div>
                  </div>

                  {/* ARROW */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-3 h-2 overflow-hidden">
                    <div className="w-full h-full bg-black/95 border-l border-r border-white/20 border-l-transparent border-r-transparent transform rotate-45 -translate-y-1/2" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
