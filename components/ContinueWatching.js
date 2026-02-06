"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
          <Link href="/ho-so" className="hidden md:block">
            <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-primary transition-colors">
              XEM LỊCH SỬ
            </span>
          </Link>
        )}
      </div>

      {watchHistory.length > 0 ? (
        <div className="-mx-4 px-4 md:-mx-8 md:px-8">
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
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
