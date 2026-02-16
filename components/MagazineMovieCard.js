"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Star, Award } from "lucide-react";
import { getImageUrl } from "@/lib/movieService";

export default function MagazineMovieCard({ movie, featured = false }) {
  const router = useRouter();
  
  const imageUrl = getImageUrl(movie.poster_url);

  const handleClick = () => {
    router.push(`/chi-tiet/${movie.slug}`);
  };

  const handleWatchClick = (e) => {
    e.stopPropagation();
    router.push(`/phim/${movie.slug}`);
  };

  const limitWords = (text, maxWords = 20) => {
    if (!text) return "";
    const plain = (typeof text === "string" ? text : "").replace(/<[^>]+>/g, "").trim();
    if (!plain) return "";
    const words = plain.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return plain;
    return words.slice(0, maxWords).join(" ") + "…";
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 hover:border-primary/50 transition-all duration-500 h-full"
      style={{
        clipPath: featured 
          ? "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" 
          : "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)"
      }}
    >
      {/* Background image with parallax effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={movie.name}
          className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative p-4 sm:p-5 md:p-6 flex flex-col h-full min-h-[280px] sm:min-h-[320px] md:min-h-[380px]">
        {/* Top badges */}
        <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
          {featured && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black flex items-center gap-1">
              <Award size={10} className="sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">FEATURED</span>
              <span className="xs:hidden">TOP</span>
            </div>
          )}
          <div className="bg-primary/20 border border-primary text-primary px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black">
            {movie.year || "2024"}
          </div>
        </div>

        {/* Main poster - diagonal positioned */}
        <div className="relative mb-4 md:mb-6 -mx-1 sm:-mx-2">
          <div 
            className="w-24 xs:w-28 sm:w-32 md:w-40 aspect-[2/3] overflow-hidden shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 border-2 sm:border-4 border-white/20"
          >
            <img
              src={imageUrl}
              alt={movie.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          
          {/* Episode badge on poster */}
          <div className="absolute -bottom-2 -right-2 bg-black border-2 border-primary text-primary px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-black shadow-lg">
            {movie.episode_current || "FULL"}
          </div>
        </div>

        {/* Title and description */}
        <div className="flex-1 space-y-2 sm:space-y-3">
          <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-white leading-none tracking-tight group-hover:text-primary transition-colors line-clamp-2">
            {movie.name}
          </h3>
          
          <p className="text-xs sm:text-sm text-gray-400 font-medium line-clamp-1 italic">
            {movie.origin_name}
          </p>

          {movie.content && (
            <p className="hidden sm:block text-xs text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-3">
              {limitWords(movie.content, 25)}
            </p>
          )}
        </div>

        {/* Bottom action area */}
        <div className="flex items-center justify-between mt-3 gap-2 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] sm:text-xs font-bold text-white">{movie.quality || "HD"}</span>
          </div>
          
          <button
            onClick={handleWatchClick}
            className="group/btn bg-primary hover:bg-white text-black px-4 sm:px-5 py-1.5 sm:py-2 font-black text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 transition-all duration-300 hover:scale-105"
          >
            <Play size={12} className="sm:w-3.5 sm:h-3.5" fill="currentColor" />
            Xem
          </button>
        </div>

        {/* Decorative line accent */}
        <div className="absolute top-0 right-0 w-1 h-16 sm:h-20 bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Corner fold effect */}
      <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[30px] sm:border-l-[40px] border-l-transparent border-b-[30px] sm:border-b-[40px] border-b-black/50 opacity-0 group-hover:opacity-100 transition-opacity" 
        style={{ filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.3))' }}
      ></div>
    </motion.div>
  );
}