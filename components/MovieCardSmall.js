"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MovieCardSmall({ movie }) {
  const imageUrl = movie.poster_url?.includes("http") 
    ? movie.poster_url 
    : `https://phimimg.com/${movie.poster_url}`; 

  return (
    <Link href={`/phim/${movie.slug}`}>
      <motion.div
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex-shrink-0 w-28 md:w-32 aspect-[2/3] overflow-hidden bg-surface border border-white/10 cursor-pointer group rounded-lg"
      >
        {/* Image */}
        <img
          src={imageUrl}
          alt={movie.name}
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-50"
          loading="lazy"
        />

        {/* Overlay Info */}
        <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/80 to-transparent">
          <h3 className="text-xs font-black leading-tight text-white uppercase tracking-tight mb-1 line-clamp-2">
            {movie.name}
          </h3>
          <div className="text-[10px] text-gray-300 font-mono mb-2">
            {movie.episode_current || "FULL"}
          </div>
        </div>

        {/* Episode Badge */}
        <div className="absolute top-1 right-1 bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded">
          {movie.episode_current || "FULL"}
        </div>
      </motion.div>
    </Link>
  );
}
