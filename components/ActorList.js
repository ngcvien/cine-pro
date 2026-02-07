"use client"; // Bắt buộc vì dùng useEffect để fetch ảnh

import { useState, useEffect } from "react";
import Link from "next/link";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY ;

// Component con: Tự lo việc lấy ảnh của chính mình
const ActorCard = ({ name }) => {
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActorImage = async () => {
      try {
        // Gọi API Search của TMDB để tìm ảnh theo tên
        const res = await fetch(
          `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}&language=vi-VN`
        );
        const data = await res.json();
        // Lấy kết quả đầu tiên
        if (data.results && data.results.length > 0) {
          setAvatar(data.results[0].profile_path);
        }
      } catch (error) {
        console.error("Lỗi lấy ảnh diễn viên:", name);
      } finally {
        setLoading(false);
      }
    };

    if (name) fetchActorImage();
  }, [name]);

  const cardContent = (
    <>
      {name !== "Đang cập nhật" && (
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/10 bg-[#121212] relative group-hover:border-primary transition-all duration-300 shadow-lg">
          {loading ? (
              // Skeleton Loading (Đang tải)
              <div className="w-full h-full bg-white/5 animate-pulse" />
          ) : avatar ? (
              // Có ảnh thật
              <img
                  src={`https://image.tmdb.org/t/p/w200${avatar}`}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
          ) : (
              // Không có ảnh -> Hiện chữ cái đầu
              <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-black text-gray-600 bg-white/5 group-hover:text-primary group-hover:bg-white/10 transition-colors">
                  {name.charAt(0)}
              </div>
          )}
        </div>
      )}
      
      <span className="text-xs md:text-sm font-bold text-gray-300 text-center line-clamp-2 group-hover:text-white transition-colors">
        {name}
      </span>
    </>
  );

  // Chỉ dẫn tới link khi có avatar
  if (!avatar && !loading) {
    return (
      <div className="flex flex-col items-center gap-2 group cursor-default">
        {cardContent}
      </div>
    );
  }

  return (
    <Link 
        href={`/dien-vien/${encodeURIComponent(name)}`}
        className="flex flex-col items-center gap-2 group cursor-pointer"
    >
      {cardContent}
    </Link>
  );
};

// Component chính: Render danh sách
export default function ActorList({ actors }) {
  // Chỉ lấy tối đa 10 diễn viên đầu tiên để tránh spam API
  const limitedActors = actors?.slice(0, 10) || [];

  if (limitedActors.length === 0) return <p className="text-gray-500 italic">Đang cập nhật...</p>;

  return (
    <div className="flex flex-wrap gap-4 md:gap-6">
      {limitedActors.map((actor, index) => (
        <ActorCard key={index} name={actor} />
      ))}
    </div>
  );
}