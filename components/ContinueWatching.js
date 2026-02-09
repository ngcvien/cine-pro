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
            className="
            relative group inline-flex items-center gap-2
            rounded-xl px-3 py-2
            border border-white/15
            bg-white/5 backdrop-blur-md
            overflow-hidden
            transition-all duration-300
            hover:border-primary/60 hover:bg-white/10
          "
          >
            {/* Glow layer */}
            <span
              className="
              absolute inset-0 rounded-xl opacity-0
              bg-gradient-to-r from-primary/30 via-transparent to-primary/30
              group-hover:opacity-100 transition-opacity duration-300
            "
            />

            <span
              className="
              relative overflow-hidden max-w-0
              group-hover:max-w-[8rem]
              transition-[max-width] duration-300 ease-out
              whitespace-nowrap text-xs font-bold
              text-gray-400 group-hover:text-primary
            "
            >
              XEM LỊCH SỬ
            </span>

            <ChevronRight
              className="
              relative w-4 h-4
              text-gray-400 group-hover:text-primary
              transition-transform duration-300
              group-hover:translate-x-1
            "
            />
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
