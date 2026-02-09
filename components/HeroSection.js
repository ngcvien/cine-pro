"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info } from "lucide-react";
import Link from "next/link";
import WatchLaterButton from "./WatchLaterButton";

export default function HeroSection({ movies = [] }) {
  // Lấy tối đa 5 phim
  const heroMovies = movies.slice(0, 5);
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Tự động chuyển slide (6s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, 6000); 

    return () => clearInterval(timer);
  }, [heroMovies.length]);

  const selectSlide = (index) => {
    setCurrentIndex(index);
  };

  if (heroMovies.length === 0) return null;

  const currentMovie = heroMovies[currentIndex];

  // Hàm lấy ảnh
  const getPoster = (movie) => { // Ảnh nền to (ưu tiên thumb ngang)
    if (!movie) return "";
    return movie.poster_url?.includes("http")
      ? movie.thumb_url
      : `https://phimimg.com/${movie.thumb_url}`; 
  };

  const getSmallPoster = (movie) => { // Ảnh nhỏ (ưu tiên poster dọc)
      if (!movie) return "";
      return movie.poster_url?.includes("http")
        ? movie.poster_url
        : `https://phimimg.com/${movie.poster_url}`; 
  };

  // Giới hạn cốt truyện theo số từ 
  const limitWords = (text, maxWords = 20) => {
    if (!text) return "";
    const plain = (typeof text === "string" ? text : "").replace(/<[^>]+>/g, "").trim();
    if (!plain) return "";
    const words = plain.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return plain;
    return words.slice(0, maxWords).join(" ") + "…";
  };

  // Cốt truyện: ưu tiên content, fallback description / desc / summary (API có thể dùng tên khác)
  const rawPlot =
    currentMovie?.content ||
    currentMovie?.description ||
    currentMovie?.desc ||
    currentMovie?.summary ||
    "";
  const plotText = limitWords(rawPlot, 40);
  const movieTitle = limitWords(currentMovie?.name, 10);

  return (
    <div className="relative w-full h-[550px] md:h-[700px] mb-12 overflow-hidden group rounded-b-lg ">
      
      {/* --- 1. BACKGROUND --- */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={getPoster(currentMovie)}
            alt={currentMovie?.name}
            className="w-full h-full object-cover"
          />
          {/* Lớp phủ Gradient để làm rõ chữ */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* --- 2. NỘI DUNG CHÍNH (BÊN TRÁI) --- */}
      <div className="absolute inset-0 container mx-auto px-4 md:px-8 flex items-end pb-20 z-10">
        <div className="max-w-2xl pt-10 md:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie?._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Tags */}
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary text-black font-black text-[10px] md:text-xs px-3 py-1 rounded shadow-lg shadow-primary/20">
                  #{currentIndex + 1} TRENDING
                </span>
                <span className="text-gray-300 text-xs font-bold border border-white/20 px-2 py-1 rounded bg-black/20 backdrop-blur-sm">
                   {currentMovie?.year}
                </span>
                <span className="text-gray-300 text-xs font-bold border border-white/20 px-2 py-1 rounded bg-black/20 backdrop-blur-sm">
                   {currentMovie?.quality || "FHD"}
                </span>
                <span className="text-gray-300 text-xs font-bold border border-white/20 px-2 py-1 rounded bg-black/20 backdrop-blur-sm">
                   {currentMovie?.episode_current || "FULL"}
                </span>
              </div>

              {/* Tên Phim */}
              <h1 className="text-3xl md:text-6xl font-black text-white mb-2 leading-tight tracking-tight uppercase drop-shadow-lg">
                {movieTitle}
              </h1>
              <h2 className="text-lg md:text-2xl text-primary font-bold italic mb-6 opacity-90">
                 {currentMovie?.origin_name}
              </h2>

              {/* Cốt truyện (giới hạn từ) */}
              {plotText && (
                <div className="mb-8 hidden md:block max-w-lg">
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed text-justify">
                    {plotText}
                  </p>
                </div>
              )}

              {/* Nút bấm */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/phim/${currentMovie?.slug}`}
                  className="flex items-center gap-2 bg-primary hover:bg-white hover:text-black text-black px-6 py-3 md:px-8 md:py-4 rounded-full font-black text-sm md:text-base transition-all hover:scale-105 shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                >
                  <Play size={20} fill="currentColor" />
                  XEM NGAY
                </Link>
                <Link
                  href={`/chi-tiet/${currentMovie?.slug}`}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm md:text-base backdrop-blur-md transition-all"
                >
                  <Info size={20} />
                  CHI TIẾT
                </Link>
                <span className="w-px h-8 bg-white/20 hidden sm:block" aria-hidden />
                <WatchLaterButton
                  hero
                  slug={currentMovie?.slug}
                  movie={currentMovie}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- 3. DANH SÁCH POSTER NHỎ (GÓC DƯỚI PHẢI) --- */}
      <div className="absolute bottom-8 right-4 md:right-8 z-20 hidden md:flex items-end gap-3">
        {heroMovies.map((movie, index) => {
          const isActive = index === currentIndex;
          return (
            <div 
              key={movie._id}
              onClick={() => selectSlide(index)}
              className={`relative cursor-pointer transition-all duration-300 rounded-lg overflow-hidden group/item ${
                isActive 
                  ? "w-20 h-28 border-2 border-primary shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-110 z-10" 
                  : "w-16 h-24 border border-white/30 opacity-60 hover:opacity-100 hover:scale-105"
              }`}
            >
              {/* Ảnh Poster */}
              <img 
                src={getSmallPoster(movie)} 
                className="w-full h-full object-cover" 
                alt="" 
              />
              
              {/* Overlay đen mờ khi không active */}
              {!isActive && (
                <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors" />
              )}

              {/* Thanh thời gian chạy (Chỉ hiện khi Active) */}
              {isActive && (
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                    <motion.div 
                        key={currentIndex} // Reset animation khi đổi slide
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="h-full bg-primary"
                    />
                 </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dots cho Mobile (Thay thế list poster trên điện thoại) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 md:hidden z-20">
          {heroMovies.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => selectSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-white/30"}`}
              />
          ))}
      </div>
    </div>
  );
}