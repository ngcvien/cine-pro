"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Clock } from "lucide-react";

export default function CircularMovieCard({ movie }) {
  const router = useRouter();
  
  const imageUrl = movie.poster_url.includes("http") 
    ? movie.poster_url 
    : `https://phimimg.com/${movie.poster_url}`;

  const handleClick = () => {
    router.push(`/chi-tiet/${movie.slug}`);
  };

  const handleWatchClick = (e) => {
    e.stopPropagation();
    router.push(`/phim/${movie.slug}`);
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -10 }}
      className="group cursor-pointer flex flex-col items-center gap-4 p-4"
    >
      {/* HEXAGONAL CONTAINER */}
      <div className="relative w-40 h-40 md:w-48 md:h-48">
        {/* Hexagon background glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
        
        {/* Rotating border */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-border animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" style={{ animationDuration: '8s' }}></div>
        
        {/* Main circular image */}
        <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-primary/50 transition-all duration-300 shadow-2xl">
          <img
            src={imageUrl}
            alt={movie.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleWatchClick}
              className="bg-primary text-black p-4 rounded-full hover:scale-110 transition-transform shadow-2xl"
            >
              <Play size={24} fill="currentColor" />
            </button>
          </div>

          {/* Episode badge */}
          <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
            {movie.episode_current || "FULL"}
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary/50 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary/50 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Info below */}
      <div className="text-center space-y-2 max-w-[180px]">
        <h3 className="text-sm md:text-base font-black text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {movie.name}
        </h3>
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
          <span className="font-bold">{movie.year || "2024"}</span>
          <span>•</span>
          <span className="font-bold">{movie.quality || "HD"}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </motion.div>
  );
}
