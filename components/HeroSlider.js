"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Link from "next/link";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export default function HeroSlider({ movies = [] }) {
    // Chỉ lấy 6 phim đầu tiên để làm Banner
    const featuredMovies = movies.slice(0, 6);

    return (
        <div className="w-full h-[60vh] md:h-[80vh] relative group">
            <Swiper
                modules={[Autoplay, EffectFade, Pagination]}
                effect="fade"
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                loop={true}
                className="w-full h-full"
            >
                {featuredMovies.map((movie) => (
                    <SwiperSlide key={movie._id}>
                        <div className="relative w-full h-full">
                            {/* 1. BACKGROUND IMAGE */}
                            <div className="absolute inset-0">
                                <img
                                    src={movie.thumb_url.includes("http") ? movie.thumb_url : `https://phimimg.com/${movie.thumb_url}`}
                                    alt={movie.name}
                                    className="w-full h-full object-cover"
                                />
                                {/* Lớp phủ đen mờ (Overlay) tạo chiều sâu */}
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-background via-black/60 to-transparent" />
                            </div>

                            {/* 2. NỘI DUNG CHỮ */}
                            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20 flex flex-col justify-end h-full max-w-4xl">
                                <span className="text-primary font-bold tracking-widest text-xs md:text-sm mb-2 animate-in slide-in-from-left duration-700">
                                    #{movie.year} • {movie.quality} • {movie.lang}
                                </span>

                                <h2 className="text-3xl md:text-6xl font-black text-white uppercase leading-tight mb-4 drop-shadow-lg animate-in slide-in-from-bottom duration-700 delay-100">
                                    {movie.name}
                                </h2>

                                <p className="text-gray-300 text-sm md:text-lg line-clamp-2 md:line-clamp-3 max-w-2xl mb-8 font-light drop-shadow animate-in slide-in-from-bottom duration-700 delay-200">
                                    {movie.origin_name}
                                </p>

                                {/* Nút hành động */}
                                <div className="flex gap-4 animate-in slide-in-from-bottom duration-700 delay-300">
                                    <Link
                                        href={`/phim/${movie.slug}`}
                                        className="bg-primary text-black font-black px-8 py-3 rounded hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,65,0.4)]"
                                    >
                                        XEM NGAY
                                    </Link>
                                    <Link
                                        href={`/phim/${movie.slug}`}
                                        className="bg-white/10 backdrop-blur-md text-white font-bold px-8 py-3 rounded border border-white/20 hover:bg-white/20 transition-all duration-300"
                                    >
                                        CHI TIẾT
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}