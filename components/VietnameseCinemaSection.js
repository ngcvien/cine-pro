"use client";
import Link from "next/link";
import { ChevronRight, Sparkles, Heart } from "lucide-react";
import MovieCard from "./MovieCard";

export function VietnameseCinemaSection({ title, subtitle, description, link, movies, CardComponent = MovieCard }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative overflow-hidden">
      {/* Vietnamese flag inspired background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br via-red-700 to-red-800 opacity-5"></div>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b  to-transparent"></div>
      </div>

      {/* Animated stars pattern (inspired by Vietnamese flag) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-400/20 animate-pulse">
            <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" style={{ animationDelay: '0.5s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-400/15 animate-pulse">
            <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16" style={{ animationDelay: '1s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-400/10 animate-pulse">
            <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Main container with cultural patterns */}
      <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a0a0a] to-[#0a0000] border-2 border-red-900/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Decorative Vietnamese pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(220, 38, 38, 0.1) 35px, rgba(220, 38, 38, 0.1) 70px)`
          }}></div>
        </div>

        {/* Vietnamese flag accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

        <div className="relative p-4 sm:p-6 md:p-8">
          {/* Header with Vietnamese flag */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-red-900/30">
            <div className="flex-1">
              {/* Vietnamese Flag */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="relative group">
                  {/* Flag container */}
                  <div className="w-12 h-8 xs:w-14 xs:h-9 sm:w-16 sm:h-10 md:w-20 md:h-14 bg-red-600 rounded shadow-2xl flex items-center justify-center border-2 border-red-700 group-hover:scale-110 transition-transform duration-300">
                    {/* Golden star */}
                    <svg viewBox="0 0 100 100" className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-400">
                      <polygon 
                        points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" 
                        fill="currentColor"
                        className="drop-shadow-lg"
                      />
                    </svg>
                  </div>
                  
                  {/* Flag glow effect */}
                  <div className="absolute inset-0 bg-red-600 rounded blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10"></div>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none">
                    <span className="bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
                      {title}
                    </span>
                    {subtitle && (
                      <>
                        {" "}
                        <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                          {subtitle}
                        </span>
                      </>
                    )}
                  </h2>
                </div>
              </div>

              {/* Description with Vietnamese cultural touch */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500 animate-pulse" />
                <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest">
                  {description || "Tự hào điện ảnh Việt Nam"}
                </p>
                <div className="hidden sm:flex items-center gap-1">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="text-[10px] sm:text-xs text-yellow-400 font-black">MADE IN VIETNAM</span>
                </div>
              </div>
            </div>

            {/* View all button with Vietnamese flag colors */}
            <Link
              href={link}
              className="group relative px-2 sm:px-2.5 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-yellow-400 hover:to-yellow-500 border-2 border-red-500 hover:border-yellow-400 rounded-xl overflow-hidden transition-all duration-300 self-start sm:self-auto hover:px-4 sm:hover:px-5 md:hover:px-6 shadow-lg hover:shadow-red-500/50"
            >
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-white group-hover:text-red-900 font-black text-xs sm:text-sm whitespace-nowrap">
                <span className="hidden group-hover:inline transition-all duration-300">XEM TẤT CẢ</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/50 to-yellow-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
            </Link>
          </div>

          {/* Cultural quote/motto (optional) */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-red-900/20 via-red-800/10 to-transparent border-l-4 border-red-600 pl-3 sm:pl-4 py-2 sm:py-3">
              <p className="text-[10px] xs:text-xs sm:text-sm text-red-300 font-bold italic">
                "Phim Việt - Tâm hồn Việt - Niềm tự hào dân tộc"
              </p>
            </div>
          </div>

          {/* Movies scroll */}
          <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
            <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-6 sm:pb-8 scroll-smooth scrollbar-hide">
              {movies.map((movie, idx) => (
                <div 
                  key={movie._id} 
                  className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px] relative"
                >
                  {/* Vietnamese flag badge on each card */}
                  <div className="absolute -top-0 -left-0 z-20 w-6 h-4 xs:w-7 xs:h-5 sm:w-8 sm:h-6 bg-red-600 rounded-sm shadow-lg flex items-center justify-center border border-red-700">
                    <svg viewBox="0 0 100 100" className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-yellow-400">
                      <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
                    </svg>
                  </div>
                  
                  <CardComponent movie={movie} rank={idx + 1} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom decorative element */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-red-900/30">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-900/20 border border-red-800/30 rounded-full">
                <svg viewBox="0 0 100 100" className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400">
                  <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
                </svg>
                <span className="text-[9px] xs:text-[10px] sm:text-xs font-black text-red-300 uppercase tracking-wider">
                  Vietnam Cinema
                </span>
                <svg viewBox="0 0 100 100" className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400">
                  <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
                </svg>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Corner decorative stars */}
        <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 pointer-events-none">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <svg viewBox="0 0 100 100" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400/30">
              <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 pointer-events-none">
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
            <svg viewBox="0 0 100 100" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400/30">
              <polygon points="50,15 61,40 88,40 67,57 75,82 50,65 25,82 33,57 12,40 39,40" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[3000ms] pointer-events-none"></div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default VietnameseCinemaSection;
