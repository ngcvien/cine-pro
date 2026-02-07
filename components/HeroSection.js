"use client";

import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";
import Link from "next/link";

export default function HeroSection({ featuredMovie }) {
  return (
    <div className="relative w-full h-[600px] md:h-[700px] mb-16 overflow-hidden rounded-2xl group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={
            featuredMovie?.poster_url?.includes("http")
              ? featuredMovie.thumb_url
              : `https://phimimg.com/${featuredMovie?.thumb_url}`
          }
          alt={featuredMovie?.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* Category Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="text-xs font-black bg-primary text-black px-3 py-1 rounded-full">
              PHIM NỔI BẬT
            </span>
            <span className="text-xs font-bold text-gray-300">{featuredMovie?.year || "2024"}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-tight"
          >
            {featuredMovie?.name}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 text-sm md:text-base mb-6 leading-relaxed max-w-xl"
          >
            {featuredMovie?.origin_name || "Phim đặc sắc từ CinePro"}
          </motion.p>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 mb-8 text-sm font-mono text-gray-400"
          >
            <span className="border-l-2 border-primary pl-3">
              {featuredMovie?.episode_current || "FULL"}
            </span>
            <span>HD Quality</span>
            <span className="flex items-center gap-1">
              ⭐ 8.5/10
            </span>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-4"
          >
            <Link
              href={`/phim/${featuredMovie?.slug}`}
              className="flex items-center gap-2 bg-primary text-black px-8 py-3 font-black text-sm md:text-base hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all duration-300 hover:scale-105 rounded-lg"
            >
              <Play size={20} fill="currentColor" />
              XEM NGAY
            </Link>

            <Link
              href={`/chi-tiet/${featuredMovie?.slug}`}
              className="flex items-center gap-2 border-2 border-white/30 text-white px-8 py-3 font-bold text-sm md:text-base hover:border-primary hover:text-primary transition-all duration-300 rounded-lg hover:bg-primary/5"
            >
              <Info size={20} />
              CHI TIẾT
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
