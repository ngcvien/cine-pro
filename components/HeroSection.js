"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronRight } from "lucide-react";
import Link from "next/link";
import WatchLaterButton from "./WatchLaterButton";
import { getImageUrl } from "@/lib/movieService";

// Thêm font vào <head> bằng cách import trong layout.js hoặc _document.js:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Be+Vietnam+Pro:wght@300;400;600;700;800&display=swap" rel="stylesheet" />

const SLIDE_DURATION = 6000;

export default function HeroSection({ movies = [] }) {
  const heroMovies = movies.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);

  // Hàm khởi động lại timer — dùng useCallback để tránh re-create liên tục
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, SLIDE_DURATION);
  }, [heroMovies.length]);

  // Khởi động timer khi mount hoặc heroMovies thay đổi
  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [startTimer]);

  // Khi người dùng chọn slide → reset timer ngay lập tức
  const selectSlide = (index) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    startTimer(); // ← FIX: reset timer khi chọn slide
    setTimeout(() => setIsTransitioning(false), 600);
  };

  if (heroMovies.length === 0) return null;

  const currentMovie = heroMovies[currentIndex];

  const getPoster = (movie) => {
    if (!movie) return "";
    return getImageUrl(movie.thumb_url);
  };

  const getSmallPoster = (movie) => {
    if (!movie) return "";
    return getImageUrl(movie.poster_url);
  };

  const limitWords = (text, maxWords = 20) => {
    if (!text) return "";
    const plain = (typeof text === "string" ? text : "").replace(/<[^>]+>/g, "").trim();
    if (!plain) return "";
    const words = plain.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return plain;
    return words.slice(0, maxWords).join(" ") + "…";
  };

  const rawPlot =
    currentMovie?.content ||
    currentMovie?.description ||
    currentMovie?.desc ||
    currentMovie?.summary ||
    "";
  const plotText = limitWords(rawPlot, 35);
  const movieTitle = currentMovie?.name || "";

  // Tách tên phim để làm hiệu ứng chữ
  const titleWords = movieTitle.split(" ");

  return (
    <>
      {/* Font import inline (hoặc có thể đưa vào layout) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');

        .hero-title {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 900;
          letter-spacing: -0.01em;
          line-height: 1.2;
          text-transform: uppercase;
          overflow: visible;
          padding-top: 0.1em;
        }
        .hero-subtitle {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-weight: 700;
        }
        .hero-ui {
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .hero-tag {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(
            45deg,
            #ffffff 0%,
            #ffffff 40%,
            #11ff04b2 50%,
            #ffffff 60%,
            #ffffff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 8s linear infinite;
        }

        .poster-card {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .poster-card:hover {
          transform: scale(1.08) translateY(-4px);
        }
        .poster-card.active {
          transform: scale(1.12) translateY(-6px);
        }

        .btn-play {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          letter-spacing: 0.05em;
          position: relative;
          overflow: hidden;
        }
        .btn-play::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        .btn-play:hover::before {
          left: 100%;
        }

        .progress-bar {
          transform-origin: left;
        }

        .noise-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 5;
        }

        .vignette {
          background: radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(0,0,0,0.6) 100%);
        }
      `}</style>

      <div className="hero-ui relative w-full h-[580px] md:h-[720px] mb-12 overflow-hidden rounded-b-2xl group">

        {/* ── 1. BACKGROUND ── */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 z-0"
          >
            <img
              src={getPoster(currentMovie)}
              alt={currentMovie?.name}
              className="w-full h-full object-cover"
            />

            {/* Multi-layer gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#05050520] to-transparent" />
            <div className="absolute inset-0 vignette" />
          </motion.div>
        </AnimatePresence>

        {/* Noise grain overlay */}
        <div className="noise-overlay" />

        {/* Decorative vertical accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/60 to-transparent z-20 hidden md:block" />

        {/* ── 2. NỘI DUNG CHÍNH ── */}
        <div className="absolute inset-0 container mx-auto px-6 md:px-10 flex items-end pb-24 z-10">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMovie?._id || currentMovie?.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >

                {/* Tags row */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="hero-tag bg-primary text-black text-[10px] px-3 py-1 rounded-sm shadow-lg shadow-primary/30">
                    #{currentIndex + 1} Trending
                  </span>
                  <span className="hero-tag text-[10px] text-gray-300 border border-white/15 px-2.5 py-1 rounded-sm bg-white/5 backdrop-blur-sm">
                    {currentMovie?.year}
                  </span>

                  <span className="hero-tag text-[10px] text-gray-300 border border-white/15 px-2.5 py-1 rounded-sm bg-white/5 backdrop-blur-sm">
                    {currentMovie.quality || "FHD"}
                  </span>


                  <span className="hero-tag text-[10px] text-gray-300 border border-white/15 px-2.5 py-1 rounded-sm bg-white/5 backdrop-blur-sm">
                    {currentMovie?.episode_current || "FULL"}
                  </span>
                </div>
                {currentMovie.type && (
                  <>
                    <span className="text-gray-300 font-medium">{currentMovie.type}</span>
                    <span className="text-gray-500">|</span>
                  </>
                )}

                {/* ── TÊN PHIM — Playfair Display ── */}
                <div className="mb-2 overflow-hidden">
                  <motion.h1
                    className="hero-title text-4xl md:text-7xl text-white leading-[1.02] uppercase shimmer-text"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  >
                    {movieTitle}
                  </motion.h1>
                </div>

                {/* Tên gốc */}
                {currentMovie?.origin_name && (
                  <motion.h2
                    className="hero-subtitle text-lg md:text-2xl text-primary/90 mb-6"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                  >
                    — {currentMovie.origin_name}
                  </motion.h2>
                )}

                {/* Cốt truyện */}
                {plotText && (
                  <motion.div
                    className="mb-8 hidden md:block max-w-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-0.5 h-full min-h-[3rem] bg-primary/50 rounded-full flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300/90 text-sm md:text-base leading-relaxed font-light tracking-wide">
                        {plotText}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Buttons */}
                <motion.div
                  className="flex items-center gap-3 flex-wrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Link
                    href={`/phim/${currentMovie?.slug}`}
                    className="btn-play flex items-center gap-2.5 bg-primary hover:bg-white text-black px-6 py-3 md:px-8 md:py-3.5 rounded-full text-sm md:text-base transition-colors duration-300 shadow-[0_0_30px_rgba(74,222,128,0.35)]"
                  >
                    <Play size={18} fill="currentColor" />
                    XEM NGAY
                  </Link>

                  <Link
                    href={`/chi-tiet/${currentMovie?.slug}`}
                    className="hero-tag flex items-center gap-2 bg-white/8 hover:bg-white/15 text-white border border-white/15 px-4 py-3 md:px-6 md:py-3.5 rounded-full text-sm md:text-base backdrop-blur-md transition-all duration-300"
                  >
                    <Info size={18} />
                    <span className="hidden sm:inline">CHI TIẾT</span>
                  </Link>

                  <span className="w-px h-8 bg-white/15 hidden sm:block" aria-hidden />

                  <WatchLaterButton
                    hero
                    slug={currentMovie?.slug}
                    movie={currentMovie}
                  />
                </motion.div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── 3. POSTER NHỎ GÓC PHẢI ── */}
        <div className="absolute bottom-8 right-6 md:right-10 z-20 hidden lg:flex items-end gap-2.5">
          {heroMovies.map((movie, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={movie._id || movie.slug}
                onClick={() => selectSlide(index)}
                className={`poster-card relative cursor-pointer rounded-xl overflow-hidden ${isActive
                    ? "active w-[72px] h-[105px] ring-2 ring-primary ring-offset-2 ring-offset-black/50 shadow-[0_8px_32px_rgba(74,222,128,0.3)]"
                    : "w-[58px] h-[88px] ring-1 ring-white/20 opacity-50 hover:opacity-90"
                  }`}
              >
                <img
                  src={getSmallPoster(movie)}
                  className="w-full h-full object-cover"
                  alt={movie?.name || ""}
                />

                {/* Overlay khi không active */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity hover:opacity-0" />
                )}

                {/* Số thứ tự */}
                {/* <div className={`absolute top-1.5 left-1.5 hero-tag text-[9px] px-1.5 py-0.5 rounded-sm ${isActive ? "bg-primary text-black" : "bg-black/60 text-white/70"
                  }`}>
                  {index + 1}
                </div> */}

                {/* Progress bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/40">
                    <motion.div
                      key={`progress-${currentIndex}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                      className="progress-bar h-full bg-primary origin-left"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── SLIDE INDICATOR BOTTOM (Desktop) ── */}
        {/* <div className="absolute bottom-8 left-6 md:left-10 z-20 hidden lg:flex items-center gap-2">
          {heroMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => selectSlide(idx)}
              className={`transition-all duration-400 rounded-full ${idx === currentIndex
                  ? "w-8 h-1.5 bg-primary"
                  : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"
                }`}
            />
          ))}
          <span className="hero-tag text-[10px] text-white/30 ml-2">
            {String(currentIndex + 1).padStart(2, "0")} / {String(heroMovies.length).padStart(2, "0")}
          </span>
        </div> */}

        {/* Dots Mobile */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 lg:hidden z-20">
          {heroMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => selectSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-white/30"
                }`}
            />
          ))}
        </div>

      </div>
    </>
  );
}