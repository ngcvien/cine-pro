"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import WatchLaterButton from "./WatchLaterButton";
import HeroSection from "./HeroSection";
import { getImageUrl } from "@/lib/movieService";

export default function MovieCard({ movie }) {
  const router = useRouter();
  
  // PhimAPI trả về đường dẫn ảnh, ta cần ghép với domain nếu nó thiếu (thường là có sẵn domain)
  const imageUrl = getImageUrl(movie.poster_url); 

  const handleDetailClick = () => {
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

  const movieTitle = limitWords(movie?.name, 15);

  return (
    <motion.div
      onClick={handleDetailClick}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="group relative w-full cursor-pointer md:aspect-[2/3]"
    >
      {/* Phần poster + overlay: trên mobile không dùng aspect cố định để chừa chỗ cho info bên dưới */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-surface border border-white/10">
        <img
          src={imageUrl}
          alt={movie.name}
          className="w-full h-full object-cover transition-opacity duration-500 md:group-hover:opacity-40"
          loading="lazy"
        />

        {/* Lớp phủ thông tin: chỉ hover trên desktop (md+) */}
        <div className="absolute inset-0 hidden md:flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold border border-primary text-primary px-1 py-0.5">
              {movie.year || "2024"}
            </span>
            <span className="text-[10px] font-bold bg-white text-black px-1 py-0.5">
              {movie.quality || "HD"}
            </span>
          </div>
          <h3 className="text-lg font-black leading-tight text-white uppercase tracking-tight mb-1">
            {movieTitle}
          </h3>
          <p className="text-xs text-gray-400 truncate font-mono">
            {movie.origin_name}
          </p>
          <div 
            onClick={handleWatchClick}
            className="mt-4 w-full py-2 border border-white/20 text-center text-xs font-bold text-white group-hover:border-primary group-hover:text-primary transition-colors cursor-pointer hover:bg-primary/10"
          >
            XEM NGAY
          </div>
        </div>

        {/* Nút Xem sau (góc trái, tránh bấm mở chi tiết) */}
        {/* <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <WatchLaterButton slug={movie.slug} movie={movie} />
        </div> */}

        {/* Nhãn tập (luôn hiện) */}
        <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1">
          {movie.episode_current || "FULL"}
        </div>
      </div>

      {/* Chỉ mobile: ít thông tin bên dưới poster, bấm vào card vẫn vào /chi-tiet */}
      <div className="md:hidden mt-2 px-0.5">
        <h3 className="text-sm font-bold text-white truncate leading-tight">
          {movieTitle}
        </h3>
        <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
          <span>{movie.year || "—"}</span>
          <span>·</span>
          <span>{movie.quality || "HD"}</span>
        </p>
      </div>
    </motion.div>
  );
}