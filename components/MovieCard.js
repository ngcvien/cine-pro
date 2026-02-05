"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MovieCard({ movie }) {
  // PhimAPI trả về đường dẫn ảnh, ta cần ghép với domain nếu nó thiếu (thường là có sẵn domain)
  // Tuy nhiên, logic ảnh của PhimAPI đôi khi là đường dẫn tương đối, nên ta dùng logic an toàn:
  const imageUrl = movie.poster_url.includes("http") 
    ? movie.poster_url 
    : `https://phimimg.com/${movie.poster_url}`; 

  return (
    <Link href={`/phim/${movie.slug}`}>
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="group relative w-full aspect-[2/3] overflow-hidden bg-surface border border-white/10 cursor-pointer"
      >
        {/* 1. ẢNH POSTER */}
        <img
          src={imageUrl}
          alt={movie.name}
          className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-40"
          loading="lazy"
        />

        {/* 2. LỚP PHỦ THÔNG TIN (Hiện ra khi Hover) */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/80 to-transparent">
          
          {/* Năm phát hành & Chất lượng */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold border border-primary text-primary px-1 py-0.5">
              {movie.year || "2024"}
            </span>
            <span className="text-[10px] font-bold bg-white text-black px-1 py-0.5">
              {movie.quality || "HD"}
            </span>
          </div>

          {/* Tên Phim */}
          <h3 className="text-lg font-black leading-tight text-white uppercase tracking-tight mb-1">
            {movie.name}
          </h3>
          <p className="text-xs text-gray-400 truncate font-mono">
            {movie.origin_name}
          </p>

          {/* Nút giả lập (Thay cho icon Play) */}
          <div className="mt-4 w-full py-2 border border-white/20 text-center text-xs font-bold text-white group-hover:border-primary group-hover:text-primary transition-colors">
            XEM NGAY
          </div>
        </div>

        {/* 3. NHÃN TẬP MỚI (Luôn hiện) */}
        <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1">
          {movie.episode_current || "FULL"}
        </div>
      </motion.div>
    </Link>
  );
}