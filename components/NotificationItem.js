"use client";
import { useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore"; // Client SDK
import { db } from "@/lib/firebase";

export default function NotificationItem({ notification, onRemove }) {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  // Hàm xử lý xóa trên Firebase
  const handleDelete = async () => {
    // 1. Gọi callback để xóa trên UI ngay lập tức (cho mượt)
    onRemove(notification.id);

    try {
      // 2. Xóa thật trong database
      await deleteDoc(doc(db, "notifications", notification.id));
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
    }
  };

  // Hàm xử lý khi thả tay ra
  const handleDragEnd = async (event, info) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Nếu kéo sang trái quá 100px hoặc búng mạnh sang trái
    if (offset < -100 || velocity < -500) {
      // Chạy animation bay sang trái luôn
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      handleDelete();
    } else {
      // Nếu kéo chưa tới thì đàn hồi lại vị trí cũ
      controls.start({ x: 0, opacity: 1 });
    }
  };

  return (
    <div className="relative w-full overflow-hidden mb-2 group">
      
      {/* 1. LỚP NỀN (BACKGROUND) - CHỨA ICON THÙNG RÁC */}
      <div className="absolute inset-0 bg-red-600 rounded-lg flex items-center justify-end pr-4 z-0">
        <Trash2 className="text-white w-5 h-5 animate-pulse" />
      </div>

      {/* 2. LỚP NỘI DUNG (FOREGROUND) - CÁI MÌNH KÉO */}
      <motion.div
        drag="x" // Chỉ cho phép kéo ngang
        dragConstraints={{ left: -1000, right: 0 }} // Giới hạn kéo
        dragElastic={0.1} // Độ đàn hồi
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ cursor: "grabbing" }}
        style={{ x: 0, touchAction: "none" }} // touchAction quan trọng cho mobile
        className={`relative z-10 bg-[#1f1f1f] border border-white/5 p-3 rounded-lg flex gap-3 shadow-md ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Poster phim */}
        <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-800/40">
             {notification.poster ? (
                 <img src={notification.poster} alt="" className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full bg-gray-700"></div>
             )}
        </div>

        {/* Nội dung text */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold truncate ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>
            {notification.title}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
             {notification.message}
          </p>
          <span className="text-[10px] text-gray-600 mt-1 block">
             {/* Format ngày tháng nếu cần */}
             {notification.createdAt?.seconds 
                ? new Date(notification.createdAt.seconds * 1000).toLocaleDateString('vi-VN') 
                : 'Vừa xong'}
          </span>
        </div>
        
        {/* Chấm đỏ chưa đọc (nếu cần) */}
        {!notification.isRead && (
             <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
        )}

      </motion.div>
    </div>
  );
}