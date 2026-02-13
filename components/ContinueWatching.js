"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import HistoryItem from "./HistoryItem";

export default function ContinueWatching() {
  const [user, setUser] = useState(null);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const q = query(
            collection(db, "users", u.uid, "history"),
            orderBy("last_watched", "desc"),
            limit(6)
          );

          const querySnapshot = await getDocs(q);
          const historyData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setWatchHistory(historyData);
        } catch (error) {
          console.error("Lỗi lấy lịch sử xem:", error);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (!loading && watchHistory.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
            TIẾP <span className="text-primary">TỤC XEM</span>
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-2 font-mono">
            CÁC PHIM BẠN ĐÃ BẮT ĐẦU XEM
          </p>
        </div>

        {watchHistory.length > 0 && (
          <Link
                    href="/tu-phim"
                    className="group px-2 mt-2 sm:px-2.5 py-2 sm:py-2.5 md:py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary rounded-xl sm:rounded-2xl transition-all duration-300 self-start sm:self-auto hover:px-4 sm:hover:px-5 md:hover:px-6"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2 text-white group-hover:text-primary font-black text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden group-hover:inline transition-all duration-300">XEM TỦ PHIM</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link> 

        )}
      </div>

      {watchHistory.length > 0 ? (
        <div className="-mx-4 px-4 md:-mx-8 md:px-8">
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
            {watchHistory.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-40 md:w-48 lg:w-56">
                <HistoryItem item={item} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-gray-400 mb-2">Hãy bắt đầu xem một phim nào đó!</p>
          <Link href="/" className="inline-block bg-primary text-black font-bold px-6 py-2 rounded hover:scale-105 transition-transform">
            Khám phá phim ngay
          </Link>
        </div>
      )}
    </div>
  );
}
