"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Bookmark, Check, Loader2 } from "lucide-react";

export default function WatchLaterButton({ movie, slug, hero = true }) {
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 1. Kiểm tra trạng thái đăng nhập & Trạng thái phim
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, "users", u.uid, "watch_later", slug);
          const docSnap = await getDoc(docRef);
          setIsSaved(docSnap.exists());
        } catch (error) {
          console.error("Lỗi kiểm tra xem sau:", error);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [slug]);

  // 2. Hàm xử lý Thêm/Xóa
  const handleToggle = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này!");
      return;
    }
    if (processing) return;

    setProcessing(true);
    try {
      const docRef = doc(db, "users", user.uid, "watch_later", slug);

      if (isSaved) {
        // Xóa khỏi danh sách
        await deleteDoc(docRef);
        setIsSaved(false);
      } else {
        // Thêm vào danh sách
        await setDoc(docRef, {
          slug: slug,
          name: movie.name,
          origin_name: movie.origin_name,
          poster_url: movie.poster_url,
          thumb_url: movie.thumb_url,
          year: movie.year,
          added_at: serverTimestamp(), // Thời gian thêm
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Lỗi cập nhật xem sau:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  const iconSize = hero ? 22 : 20;
  if (loading) {
    return (
      <div
        className={`shrink-0 ${hero ? "w-12 h-12 md:w-14 md:h-14 rounded-full" : "w-10 h-10 rounded-lg"}`}
        aria-hidden
      />
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={processing}
      className={`flex items-center justify-center transition-all shrink-0 ${
        hero
          ? `rounded-full p-3 md:p-4 backdrop-blur-md ${
              isSaved
                ? "bg-primary/20 text-primary border border-primary/50 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500"
                : "bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white"
            }`
          : `w-10 h-10 rounded-lg ${
              isSaved
                ? "bg-white/10 text-primary border border-primary/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
                : "bg-[#121212] text-white border border-white/10 hover:bg-white/20 hover:border-white"
            }`
      }`}
      title={isSaved ? "Bỏ khỏi Xem sau" : "Thêm vào Xem sau"}
      aria-label={isSaved ? "Bỏ khỏi Xem sau" : "Thêm vào Xem sau"}
    >
      {processing ? (
        <Loader2 className="animate-spin" size={iconSize} />
      ) : isSaved ? (
        <Check size={iconSize} />
      ) : (
        <Bookmark size={iconSize} />
      )}
    </button>
  );
}