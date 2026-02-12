"use client";
import Link from "next/link";
import { ChevronRight, Flame, TrendingUp, Clock, Star, Sparkles } from "lucide-react";
import MovieCard from "./MovieCard";

// 1. NEON GLOW SECTION - with animated border
export function NeonGlowSection({ title, subtitle, description, link, movies, CardComponent = MovieCard }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative">
      {/* Animated background glow */}
      <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl animate-pulse"></div>
      
      <div className="relative bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-primary/30 sm:border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden">
        {/* Decorative corner elements - responsive */}
        <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 border-l-2 sm:border-t-4 sm:border-l-4 border-primary/50 rounded-tl-xl sm:rounded-tl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 border-r-2 sm:border-b-4 sm:border-r-4 border-primary/50 rounded-br-xl sm:rounded-br-2xl"></div>

        {/* Header - responsive */}
        <div className="flex  sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-primary/20 sm:border-b-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary animate-pulse" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white">
                {title} <span className="text-primary">{subtitle}</span>
              </h2>
            </div>
            <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 font-bold uppercase tracking-widest">
              {description}
            </p>
          </div>

          <Link
            href={link}
            className="group mt-2 relative px-2 sm:px-2.5 py-2 sm:py-2.5 md:py-3 bg-primary/10 hover:bg-primary border border-primary hover:border-white rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 self-start sm:self-auto hover:px-4 sm:hover:px-5 md:hover:px-6"
          >
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-primary group-hover:text-black font-black text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden group-hover:inline transition-all duration-300">XEM TẤT CẢ</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Movies scroll - responsive */}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 sm:pb-8 scroll-smooth scrollbar-hide">
            {movies.map((movie, idx) => (
              <div key={movie._id} className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px]">
                <CardComponent movie={movie} rank={idx + 1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. BRUTALIST SECTION - raw, minimal with heavy typography
export function BrutalistSection({ title, subtitle, description, link, movies, CardComponent = MovieCard }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative bg-black border-2 sm:border-4 border-white p-4 sm:p-6 md:p-10">
      {/* Header - brutalist style, responsive */}
      <div className="mb-6 sm:mb-8 md:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex-1">
            <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white uppercase mb-1 sm:mb-2">
              {title}
            </h2>
            <h3 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none text-primary uppercase">
              {subtitle}
            </h3>
          </div>
          
          <Link
            href={link}
            className="group bg-white mt-2 text-black px-2 sm:px-2.5 md:px-3 py-2.5 sm:py-3 md:py-4 font-black text-[10px] sm:text-xs hover:bg-primary transition-all duration-300 border-2 sm:border-4 border-black hover:border-white self-start sm:self-auto whitespace-nowrap hover:px-4 sm:hover:px-5 md:hover:px-6 flex items-center gap-1.5"
          >
            <span className="hidden group-hover:inline transition-all duration-300">XEM TẤT CẢ</span>
            <span className="group-hover:hidden">→</span>
            <span className="hidden group-hover:inline">→</span>
          </Link>
        </div>

        <div className="h-0.5 sm:h-1 w-full bg-primary"></div>
        <p className="text-white text-[9px] sm:text-[10px] md:text-xs font-mono mt-3 sm:mt-4 uppercase tracking-widest bg-primary/20 px-3 sm:px-4 py-1.5 sm:py-2 inline-block">
          {description}
        </p>
      </div>

      {/* Movies - responsive */}
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-10 md:px-10">
        <div className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-6 sm:pb-8 scroll-smooth scrollbar-hide">
          {movies.map((movie, idx) => (
            <div key={movie._id} className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px] border border-white sm:border-2">
              <CardComponent movie={movie} rank={idx + 1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. GRADIENT MESH SECTION - modern, colorful
export function GradientMeshSection({ title, subtitle, description, link, movies, CardComponent = MovieCard }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
      {/* Animated gradient mesh background - responsive */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-purple-500 via-pink-500 to-primary rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-blue-500 via-primary to-green-400 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content - responsive */}
      <div className="relative backdrop-blur-xl bg-black/40 border border-white/10 p-4 sm:p-6 md:p-8">
        {/* Header - responsive */}
        <div className="flex  sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-black fill-black" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
                {title} {subtitle}
              </h2>
            </div>
            <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium tracking-wide">
              {description}
            </p>
          </div>

          <Link
            href={link}
            className="group mt-2 relative px-2 sm:px-2.5 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-primary to-purple-500 hover:from-white hover:to-white text-black rounded-full font-black text-xs sm:text-sm transition-all duration-300 hover:scale-105 overflow-hidden self-start sm:self-auto hover:px-4 sm:hover:px-5 md:hover:px-6"
          >
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <span className="hidden group-hover:inline transition-all duration-300">XEM TẤT CẢ</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Movies - responsive */}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 sm:pb-8 scroll-smooth scrollbar-hide">
            {movies.map((movie) => (
              <div key={movie._id} className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px]">
                <CardComponent movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. GLASS MORPHISM SECTION - frosted glass effect
export function GlassMorphismSection({ title, subtitle, description, link, movies, CardComponent = MovieCard }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative">
      {/* Background blur elements - responsive */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <div className="absolute -top-12 sm:-top-16 md:-top-20 -left-12 sm:-left-16 md:-left-20 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-primary/30 rounded-full blur-2xl sm:blur-3xl"></div>
        <div className="absolute -bottom-12 sm:-bottom-16 md:-bottom-20 -right-12 sm:-right-16 md:-right-20 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-purple-500/30 rounded-full blur-2xl sm:blur-3xl"></div>
      </div>

      {/* Glass container - responsive */}
      <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
        {/* Header - responsive */}
        <div className="flex flex-row items-end justify-between sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white">
                {title} <span className="text-primary">{subtitle}</span>
              </h2>
            </div>
            <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium">
              {description}
            </p>
          </div>

          <Link
            href={link}
            className="group px-2 mt sm:px-2.5 py-2 sm:py-2.5 md:py-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary rounded-xl sm:rounded-2xl transition-all duration-300 self-start sm:self-auto hover:px-4 sm:hover:px-5 md:hover:px-6"
          >
            <span className="flex items-center gap-1.5 sm:gap-2 text-white group-hover:text-primary font-black text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden group-hover:inline transition-all duration-300">XEM TẤT CẢ</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Movies - responsive */}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 sm:pb-8 scroll-smooth scrollbar-hide">
            {movies.map((movie) => (
              <div key={movie._id} className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px]">
                <CardComponent movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add scrollbar hide utility
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}