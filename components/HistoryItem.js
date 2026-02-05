"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HistoryItem({ item }) {
  const [movie, setMovie] = useState(null);

  // Gọi API lấy thông tin chi tiết phim dựa trên slug đã lưu
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`https://phimapi.com/phim/${item.slug}`);
        const data = await res.json();
        if (data.status) {
          setMovie(data.movie);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin phim:", error);
      }
    };
    
    if (item.slug) fetchInfo();
  }, [item.slug]);

  if (!movie) return <div className="w-full aspect-[2/3] bg-white/5 animate-pulse rounded"></div>;

  // Tính phần trăm đã xem (Giả sử phim trung bình 45p = 2700s, hoặc lấy số giây / 60)
  const watchedMinutes = Math.floor(item.seconds / 60);

  return (
    <Link href={`/phim/${item.slug}`} className="group relative block">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded border border-white/10 group-hover:border-primary transition-colors">
        <img
          src={movie.poster_url}
          alt={movie.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay thông tin */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-center p-2">
            <span className="text-primary font-black text-xs uppercase mb-1">ĐANG XEM</span>
            <span className="text-white font-bold text-sm line-clamp-2">{item.episode}</span>
            <span className="text-gray-400 text-xs mt-2">Phút thứ {watchedMinutes}</span>
            <button className="mt-3 bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-full">
                XEM TIẾP
            </button>
        </div>

        {/* Thanh tiến độ giả lập (Visual feedback) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
             <div className="h-full bg-primary" style={{ width: '40%' }}></div>
        </div>
      </div>
      
      <h3 className="mt-2 text-sm font-bold text-gray-300 truncate group-hover:text-primary transition-colors">
        {movie.name}
      </h3>
    </Link>
  );
}