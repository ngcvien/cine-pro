"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Eye } from "lucide-react";
import { getImageUrl } from "@/lib/movieService";

export default function StackedMovieCard({ movie }) {
  const router = useRouter();
  
  const imageUrl = getImageUrl(movie.poster_url);

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
      whileHover={{ y: -8 }}
      className="group cursor-pointer relative"
    >
      {/* Stacked shadow layers */}
      <div className="absolute inset-0 bg-white/5 rounded-lg transform translate-y-3 translate-x-3 group-hover:translate-y-4 group-hover:translate-x-4 transition-transform duration-300"></div>
      <div className="absolute inset-0 bg-white/10 rounded-lg transform translate-y-1.5 translate-x-1.5 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-300"></div>

      {/* Main card */}
      <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-lg overflow-hidden border border-white/20 group-hover:border-primary/50 transition-all duration-300 shadow-2xl">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={movie.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleWatchClick}
              className="bg-primary text-black p-4 rounded-full hover:scale-110 transition-transform shadow-2xl"
            >
              <Play size={24} fill="currentColor" />
            </button>
          </div>

          {/* Quality badge */}
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-primary/50 text-primary px-3 py-1 text-[10px] font-black rounded">
            {movie.quality || "HD"}
          </div>

          {/* Episode badge */}
          <div className="absolute top-3 right-3 bg-primary text-black px-3 py-1 text-[10px] font-black rounded shadow-lg">
            {movie.episode_current || "FULL"}
          </div>

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-sm font-black text-white leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {movie.name}
            </h3>
            <p className="text-[10px] text-gray-400 line-clamp-1">
              {movie.origin_name}
            </p>
            
            {/* Year */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-gray-500">
                {movie.year || "2024"}
              </span>
              <Eye className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>

      {/* Floating accent line */}
      <div className="absolute -bottom-1 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </motion.div>
  );
}
