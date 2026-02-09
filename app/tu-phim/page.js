"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import HistoryItem from "../../components/HistoryItem";
import { Clock, AlertCircle, Film, History, Bookmark, Play, Sparkles } from "lucide-react";
import Link from "next/link";

export default function MovieCabinetPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Lấy dữ liệu Realtime
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const collectionName = activeTab === 'history' ? 'history' : 'watch_later';
    const sortField = activeTab === 'history' ? 'last_watched' : 'added_at';

    const q = query(
      collection(db, "users", user.uid, collectionName),
      orderBy(sortField, "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(data);
      setLoading(false);
      setIsTransitioning(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // Hàm chuyển tab với animation
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setIsTransitioning(true);
      setTimeout(() => setActiveTab(tab), 150);
    }
  };

  // Hàm xóa phim
  const handleDelete = async (movieId) => {
    if (!user) return;
    const collectionName = activeTab === 'history' ? 'history' : 'watch_later';
    try {
      await deleteDoc(doc(db, "users", user.uid, collectionName, movieId));
    } catch (error) {
      console.error("Lỗi xóa phim:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // Hàm xóa tất cả
  const handleClearAll = async () => {
    const title = activeTab === 'history' ? 'Lịch sử xem' : 'Danh sách Xem sau';
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa toàn bộ ${title}?`)) return;

    const collectionName = activeTab === 'history' ? 'history' : 'watch_later';
    try {
      const batchPromises = items.map((item) => 
        deleteDoc(doc(db, "users", user.uid, collectionName, item.id))
      );
      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Lỗi xóa tất cả:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={24} />
        </div>
        <p className="mt-6 text-gray-500 text-sm font-medium tracking-wider">ĐANG TẢI DỮ LIỆU...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505] flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center rotate-6 transition-transform hover:rotate-12 hover:scale-110 duration-300">
              <AlertCircle size={48} className="text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-ping"></div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Chưa Đăng Nhập
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Đăng nhập để quản lý tủ phim cá nhân và theo dõi lịch sử xem của bạn.
            </p>
          </div>

          <Link 
            href="/login" 
            className="group relative bg-primary hover:bg-white text-black px-10 py-4 rounded-full font-black text-lg tracking-wide transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:shadow-[0_0_50px_rgba(74,222,128,0.5)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              ĐĂNG NHẬP NGAY
              <Play size={20} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-2">
                Tủ Phim <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Của Tôi</span>
              </h1>
              <p className="text-gray-500 text-sm md:text-base font-medium">Quản lý và theo dõi phim của bạn</p>
            </div>
            
            {/* TAB SWITCHER with smooth animation */}
            <div className="relative bg-white/5 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-white/10 shadow-lg">
              {/* Sliding background indicator */}
              <div 
                className="absolute top-1.5 h-[calc(100%-12px)] bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl transition-all duration-300 ease-out border border-primary/30"
                style={{
                  width: 'calc(50% - 6px)',
                  left: activeTab === 'history' ? '6px' : 'calc(50% + 0px)',
                }}
              ></div>

              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => handleTabChange('history')}
                  className={`flex items-center gap-2.5 px-6 md:px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
                    activeTab === 'history' 
                      ? 'text-primary scale-105' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <History size={18} className={activeTab === 'history' ? 'animate-pulse' : ''} />
                  <span className="hidden sm:inline">Lịch sử xem</span>
                  <span className="sm:hidden">Lịch sử</span>
                  {activeTab === 'history' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping"></span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('watch-later')}
                  className={`flex items-center gap-2.5 px-6 md:px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
                    activeTab === 'watch-later' 
                      ? 'text-primary scale-105' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Bookmark size={18} className={activeTab === 'watch-later' ? 'animate-pulse' : ''} />
                  Xem sau
                  {activeTab === 'watch-later' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats & Clear Button */}
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="flex items-baseline gap-2 justify-end mb-1">
                <span className="text-5xl md:text-6xl font-black bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
                  {items.length}
                </span>
                <Sparkles className="text-primary animate-pulse" size={24} />
              </div>
              <span className="text-gray-500 text-xs font-bold tracking-widest">PHIM TRONG TỦ</span>
            </div>

            {items.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="group flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary transition-all duration-300 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider backdrop-blur-sm"
              >
                <Clock size={16} className="group-hover:rotate-12 transition-transform duration-300" /> 
                <span className="hidden md:inline">Xóa toàn bộ</span>
                <span className="md:hidden">Xóa</span>
              </button>
            )}
          </div>
        </div>

        {/* CONTENT GRID with transition animation */}
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {items.map((item, index) => (
                <div 
                  key={item.id}
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <HistoryItem 
                    item={item} 
                    onDelete={handleDelete}
                    hideProgress={activeTab === 'watch-later'} 
                  />
                </div>
              ))}
            </div>
          ) : (
            // EMPTY STATE with beautiful design
            <div className="relative text-center py-32 border-2 border-dashed border-white/10 rounded-3xl bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden group hover:border-primary/30 transition-all duration-500">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="w-28 h-28 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center rotate-6 group-hover:rotate-12 transition-all duration-500 group-hover:scale-110">
                    {activeTab === 'history' ? 
                      <Film size={48} className="text-gray-600 group-hover:text-primary transition-colors duration-500" /> : 
                      <Bookmark size={48} className="text-gray-600 group-hover:text-primary transition-colors duration-500" />
                    }
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full blur-md group-hover:scale-150 transition-transform duration-500"></div>
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                  {activeTab === 'history' ? 'Lịch sử trống' : 'Danh sách trống'}
                </h3>
                <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
                  {activeTab === 'history' 
                    ? 'Bạn chưa xem bộ phim nào. Hãy bắt đầu khám phá thư viện phim phong phú của chúng tôi!' 
                    : 'Bạn chưa lưu bộ phim nào để xem sau. Thêm phim vào danh sách khi bạn tìm thấy điều thú vị!'}
                </p>

                <Link 
                  href="/" 
                  className="group/btn relative bg-gradient-to-r from-primary to-emerald-400 hover:from-white hover:to-white text-black font-black px-10 py-4 rounded-full transition-all duration-300 flex items-center gap-3 hover:scale-105 shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:shadow-[0_0_50px_rgba(74,222,128,0.5)] overflow-hidden"
                >
                  <span className="relative z-10">Khám phá phim mới</span>
                  <Play size={20} fill="currentColor" className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}