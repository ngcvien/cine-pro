"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase"; // Đảm bảo đường dẫn import đúng
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/movieService";
import { AnimatePresence, motion } from "framer-motion";
import NotificationItem from "./NotificationItem";

export default function NotificationBell() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Hàm update state local để UI phản hồi ngay
  const handleRemoveNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Nếu có state count (số lượng chưa đọc), nhớ trừ đi
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // 1. Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, []);

  // 2. Lắng nghe thông báo Realtime
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Query: Lấy thông báo của user hiện tại, sắp xếp mới nhất lên đầu
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20) // Chỉ lấy 20 cái mới nhất cho nhẹ
    );

    const unsubSnapshot = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(data);
      // Đếm số lượng chưa đọc
      setUnreadCount(data.filter(n => !n.isRead).length);
    }, (error) => {
      console.error("Lỗi Realtime Notification:", error);
      // Nếu lỗi index, link tạo index sẽ hiện ở console trình duyệt
    });

    return () => unsubSnapshot();
  }, [user]);

  // 3. Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Hàm đánh dấu đã đọc
  const handleRead = async (noti) => {
    setIsOpen(false); // Đóng menu
    if (!noti.isRead) {
      // Cập nhật Firestore
      const notiRef = doc(db, "notifications", noti.id);
      await updateDoc(notiRef, { isRead: true });
    }
  };

  // 5. Hàm đánh dấu đã đọc tất cả
  const markAllAsRead = async () => {
    const unreadDocs = notifications.filter(n => !n.isRead);
    unreadDocs.forEach(async (noti) => {
      const notiRef = doc(db, "notifications", noti.id);
      await updateDoc(notiRef, { isRead: true });
    });
  };

  if (!user) return null; // Chưa đăng nhập thì không hiện chuông

  return (
    <>
      {/* Global CSS cho animation lắc lư */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: rotate(5deg); }
        }
        
        .bell-shake-animation {
          animation: bellShake 1.5s ease-in-out infinite;
          transform-origin: top center;
        }
      `}} />

      <div className="relative" ref={dropdownRef}>
        {/* Nút Cái Chuông */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <div className={unreadCount > 0 ? "bell-shake-animation" : ""}>
            <Bell
              size={24}
              className={isOpen ? "text-primary" : "text-gray-300"}
            />
          </div>

          {/* Chấm đỏ số lượng */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-[-40] mt-3 w-80 backdrop-blur-md md:w-96 bg-[#121212]/70 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200">

            {/* Header Dropdown */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-white text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Check size={12} /> Đã đọc tất cả
                </button>
              )}
            </div>

            {/* List Thông báo */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Bell size={32} className="mx-auto mb-3 opacity-20" />
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((noti) => (
                  <Link 
                    href={`/phim/${noti.movieSlug}`} 
                    key={noti.id}
                    onClick={() => handleRead(noti)}
                    className={`
                      flex gap-3 p-4 border-b border-white/5 transition-colors hover:bg-white/5
                      ${!noti.isRead ? 'bg-primary/5' : ''}
                    `}
                  >
                    {/* Ảnh Poster nhỏ */}
                    <img 
                      src={getImageUrl(noti.poster)} 
                      alt="poster" 
                      className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'} // Ẩn nếu lỗi ảnh
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm truncate pr-2  font-bold ${!noti.isRead ? 'text-white' : 'text-gray-300'}`}>
                          {noti.movieName}
                        </p>
                        {!noti.isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>}
                      </div>

                      <p className={`${!noti.isRead ? 'text-primary' : 'text-gray-400'} text-xs font-medium mt-0.5`}>{noti.message}</p>

                      <p className="text-gray-500 text-[10px] mt-2 font-mono">
                        {/* Xử lý hiển thị thời gian */}
                        {noti.createdAt?.seconds 
                          ? new Date(noti.createdAt.seconds * 1000).toLocaleString('vi-VN') 
                          : "Vừa xong"}
                      </p>
                    </div>
                  </Link>
                ))
                // <AnimatePresence mode="popLayout">
                //   {notifications.map((noti) => (
                //     <motion.div
                //       key={noti.id}
                //       layout // Giúp các item bên dưới tự trượt lên lấp chỗ trống
                //       initial={{ opacity: 0, y: 10 }}
                //       animate={{ opacity: 1, y: 0 }}
                //       exit={{ opacity: 0, height: 0, marginBottom: 0 }} // Hiệu ứng thu gọn
                //       transition={{ duration: 0.2 }}
                //     >
                //       <NotificationItem
                //         notification={noti}
                //         onRemove={handleRemoveNotification}
                //       />
                //     </motion.div>
                //   ))}
                // </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}