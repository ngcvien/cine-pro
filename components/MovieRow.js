"use client";
import MovieCard from "./MovieCard";
import Link from "next/link";
import { useRef } from "react";

export default function MovieRow({ title, movies = [], path }) {
  const scrollRef = useRef(null);

  // Xử lý scroll mượt bằng nút bấm (nếu cần sau này)
  const scroll = (offset) => {
    if(scrollRef.current) {
        scrollRef.current.scrollLeft += offset;
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="py-8 md:py-12 border-b border-white/5">
      <div className="container mx-auto px-4 md:px-8">
        {/* Tiêu đề Section */}
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight border-l-4 border-primary pl-4">
            {title}
          </h3>
          <Link 
            href={path} 
            className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            XEM TẤT CẢ <span className="text-lg">›</span>
          </Link>
        </div>

        {/* Danh sách trượt ngang */}
        <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
        >
          {movies.map((movie) => (
            <div key={movie._id} className="min-w-[160px] md:min-w-[200px] w-[160px] md:w-[200px]">
              <MovieCard 
                 movie={{
                    ...movie,
                    poster_url: movie.poster_url.includes("http") ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`,
                 }} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}