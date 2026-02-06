"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";

export default function WatchingNow({ movies = [] }) {
  const [watching, setWatching] = useState([]);

  useEffect(() => {
    // Lấy danh sách đang xem từ localStorage
    const savedWatching = localStorage.getItem("watchingNow");
    if (savedWatching) {
      setWatching(JSON.parse(savedWatching));
    }
  }, []);

  if (watching.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="flex items-end justify-between mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
            ĐANG <span className="text-primary">XEM</span>
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-2 font-mono">
            TIẾP TỤC CÁC BỘ PHIM BẠN ĐANG THEO DÕI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watching.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-gradient-to-br from-white/5 to-white/[2%] border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,65,0.1)]"
          >
            {/* Hình nền phim */}
            <div className="relative h-40 bg-gradient-to-b from-white/10 to-black/20 overflow-hidden">
              <img
                src={item.image || "https://via.placeholder.com/400x300"}
                alt={item.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

              {/* Nút play hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-black p-4 rounded-full cursor-pointer shadow-lg"
                >
                  <Play size={24} fill="currentColor" />
                </motion.div>
              </div>
            </div>

            {/* Nội dung */}
            <div className="p-4">
              <h3 className="text-lg font-black text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>

              {/* Thông tin tập hiện tại */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span className="font-mono">Tập {item.currentEpisode || 1}</span>
                <span className="font-mono">{item.progress || 0}%</span>
              </div>

              {/* Thanh tiến trình */}
              <div className="mb-4">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress || 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary via-green-400 to-primary shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                  />
                </div>
              </div>

              {/* Nút hành động */}
              <Link
                href={`/phim/${item.slug}`}
                className="w-full block py-2 text-center text-sm font-bold text-white border border-white/20 hover:border-primary hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
              >
                TIẾP TỤC XEM
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
