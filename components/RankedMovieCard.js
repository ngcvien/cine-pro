"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Star, Crown, Award, Trophy, Sparkles } from "lucide-react";

export default function RankedMovieCard({ movie, rank }) {
  const router = useRouter();
  
  const imageUrl = movie.poster_url.includes("http") 
    ? movie.poster_url 
    : `https://phimimg.com/${movie.poster_url}`;

  const handleClick = () => {
    router.push(`/chi-tiet/${movie.slug}`);
  };

  const handleWatchClick = (e) => {
    e.stopPropagation();
    router.push(`/phim/${movie.slug}`);
  };

  // Enhanced rank styling
  const getRankStyles = () => {
    if (rank === 1) return {
      gradient: "from-yellow-400 via-yellow-500 to-orange-500",
      textGradient: "from-yellow-300 via-yellow-400 to-orange-400",
      shadow: "shadow-[0_0_60px_rgba(251,191,36,0.6)]",
      glow: "bg-yellow-400/30",
      border: "border-yellow-400/50",
      badgeBg: "bg-gradient-to-r from-yellow-400 to-orange-500",
      icon: Crown,
      iconColor: "text-yellow-400",
      label: "CHAMPION"
    };
    if (rank === 2) return {
      gradient: "from-slate-200 via-slate-300 to-gray-400",
      textGradient: "from-slate-200 via-slate-300 to-slate-400",
      shadow: "shadow-[0_0_50px_rgba(148,163,184,0.5)]",
      glow: "bg-slate-300/30",
      border: "border-slate-300/50",
      badgeBg: "bg-gradient-to-r from-slate-200 to-slate-400",
      icon: Award,
      iconColor: "text-slate-300",
      label: "RUNNER-UP"
    };
    if (rank === 3) return {
      gradient: "from-amber-600 via-orange-600 to-amber-700",
      textGradient: "from-amber-500 via-orange-500 to-amber-600",
      shadow: "shadow-[0_0_50px_rgba(217,119,6,0.5)]",
      glow: "bg-amber-600/30",
      border: "border-amber-600/50",
      badgeBg: "bg-gradient-to-r from-amber-600 to-orange-600",
      icon: Trophy,
      iconColor: "text-amber-600",
      label: "THIRD PLACE"
    };
    return {
      gradient: "from-primary via-emerald-400 to-primary",
      textGradient: "from-primary via-emerald-400 to-primary",
      shadow: "shadow-[0_0_40px_rgba(74,222,128,0.4)]",
      glow: "bg-primary/20",
      border: "border-primary/50",
      badgeBg: "bg-gradient-to-r from-primary to-emerald-400",
      icon: Sparkles,
      iconColor: "text-primary",
      label: `TOP ${rank}`
    };
  };

  const styles = getRankStyles();
  const RankIcon = styles.icon;
  const isTopThree = rank <= 3;

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05, duration: 0.5, type: "spring" }}
      whileHover={{ y: -12, scale: 1.03 }}
      className="group relative cursor-pointer w-full"
    >
      {/* Floating glow background */}
      <div className={`absolute -inset-2 sm:-inset-3 ${styles.shadow} rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl ${styles.glow}`}></div>

      {/* Main Card Container with angled design */}
      <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0a0a0a] overflow-hidden border-2 ${styles.border} transition-all duration-500 shadow-2xl"
        style={{
          clipPath: isTopThree 
            ? "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))"
            : "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
        }}
      >
        {/* Animated corner decorations */}
        <div className={`absolute top-0 right-0 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-gradient-to-bl ${styles.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
        <div className={`absolute bottom-0 left-0 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-gradient-to-tr ${styles.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>

        {/* Rank Label Banner - Top */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <div className={`${styles.badgeBg} text-black px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <RankIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-black tracking-wider">
                {styles.label}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-black" />
              <span className="text-[9px] sm:text-[10px] font-black">
                #{rank}
              </span>
            </div>
          </div>
        </div>

        <div className="relative pt-8 sm:pt-10 md:pt-12 p-3 sm:p-4 md:p-5">
          {/* Poster Image with sophisticated layout */}
          <div className="relative mb-3 sm:mb-4">
            <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg sm:rounded-xl shadow-2xl">
              <img
                src={imageUrl}
                alt={movie.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className={`absolute inset-0 ${styles.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              {/* Floating Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <motion.button
                  onClick={handleWatchClick}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${styles.badgeBg} text-black p-3 sm:p-4 md:p-5 rounded-full shadow-2xl `}
                >
                  <Play size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" fill="currentColor" />
                </motion.button>
              </div>

              {/* Quality Badge - Floating */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-black/90  border-2 ${styles.border} text-white px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-black rounded-lg shadow-xl">
                {movie.quality || "HD"}
              </div>

              {/* Episode Badge - Floating */}
              <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 ${styles.badgeBg} text-black px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-black rounded-lg shadow-xl`}>
                {movie.episode_current || "FULL"}
              </div>

              {/* Bottom info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-1 sm:w-1.5 h-8 sm:h-10 md:h-12 bg-gradient-to-b ${styles.gradient} rounded-full`}></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-black text-white leading-tight line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${styles.textGradient} group-hover:bg-clip-text transition-all duration-300">
                      {movie.name}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 line-clamp-1 mt-0.5 sm:mt-1 font-medium">
                      {movie.origin_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className={`flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r ${styles.gradient} bg-opacity-10 rounded-lg border ${styles.border}`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`p-1 sm:p-1.5 bg-black/50 rounded-full`}>
                <Star className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${styles.iconColor} fill-current`} />
              </div>
              <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white">
                {movie.year || "2024"}
              </span>
            </div>

            <button
              onClick={handleWatchClick}
              className={`${styles.badgeBg} text-black px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-black rounded-full hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-1 sm:gap-1.5`}
            >
              <Play size={10} className="sm:w-3 sm:h-3" fill="currentColor" />
              <span className="hidden xs:inline">WATCH NOW</span>
              <span className="xs:hidden">PLAY</span>
            </button>
          </div>
        </div>

        {/* MASSIVE Rank Number - Artistic Placement */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <div className={`text-[120px] xs:text-[150px] sm:text-[200px] md:text-[250px] lg:text-[300px] font-black bg-gradient-to-br ${styles.gradient} bg-clip-text text-transparent`}
            style={{
              WebkitTextStroke: '2px rgba(255,255,255,0.1)',
              textShadow: '0 0 100px rgba(0,0,0,0.5)'
            }}
          >
            {rank}
          </div>
        </div>

        {/* Corner accent lines */}
        <div className={`absolute top-0 left-0 w-12 sm:w-16 md:w-20 h-0.5 bg-gradient-to-r ${styles.gradient}`}></div>
        <div className={`absolute top-0 left-0 w-0.5 h-12 sm:h-16 md:h-20 bg-gradient-to-b ${styles.gradient}`}></div>
        <div className={`absolute bottom-0 right-0 w-12 sm:w-16 md:w-20 h-0.5 bg-gradient-to-l ${styles.gradient}`}></div>
        <div className={`absolute bottom-0 right-0 w-0.5 h-12 sm:h-16 md:h-20 bg-gradient-to-t ${styles.gradient}`}></div>

        {/* Animated particles for top 3 */}
        {isTopThree && (
          <>
            <div className={`absolute top-1/4 left-1/4 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-${styles.iconColor} rounded-full animate-ping`}></div>
            <div className={`absolute top-3/4 right-1/4 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-${styles.iconColor} rounded-full animate-ping`} style={{ animationDelay: '0.5s' }}></div>
            <div className={`absolute top-1/2 right-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-${styles.iconColor} rounded-full animate-ping`} style={{ animationDelay: '1s' }}></div>
          </>
        )}
      </div>
    </motion.div>
  );
}