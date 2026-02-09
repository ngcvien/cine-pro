"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import HistoryItem from "../../components/HistoryItem";
import { Trash2, Clock, AlertCircle, Film, History, Bookmark, Play } from "lucide-react";
import Link from "next/link";

export default function MovieCabinetPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Tab: 'history' hoặc 'watch-later'
  const [activeTab, setActiveTab] = useState('history');

  // 1. Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Lấy dữ liệu Realtime (Tự động chạy lại khi user hoặc activeTab thay đổi)
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Xác định collection và trường sắp xếp dựa trên Tab đang chọn
    const collectionName = activeTab === 'history' ? 'history' : 'watch_later';
    const sortField = activeTab === 'history' ? 'last_watched' : 'added_at';

    const q = query(
      collection(db, "users", user.uid, collectionName),
      orderBy(sortField, "desc")
    );

    // Dùng onSnapshot để lắng nghe thay đổi (xóa phim là danh sách tự cập nhật)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // 3. Hàm Xóa Phim (Tùy theo Tab đang đứng)
  const handleDelete = async (movieId) => {
    if (!user) return;
    const collectionName = activeTab === 'history' ? 'history' : 'watch_later';
    try {
      // Không cần confirm ở đây nếu bên trong HistoryItem đã có confirm rồi
      // Nếu HistoryItem chưa có confirm thì bỏ comment dòng dưới:
      // if (!window.confirm("Bạn muốn xóa phim này?")) return;
      
      await deleteDoc(doc(db, "users", user.uid, collectionName, movieId));
    } catch (error) {
      console.error("Lỗi xóa phim:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // 4. Hàm Xóa Tất Cả
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

  // --- GIAO DIỆN ---

  // Trạng thái đang tải
  if (loading) {
    return (
        <div className="min-h-screen bg-[#050505] pt-32 text-center text-white">
             <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-2 text-gray-500 text-sm">Đang tải dữ liệu...</p>
        </div>
    );
  }

  // Trạng thái chưa đăng nhập
  if (!user) {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-6 p-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-primary animate-bounce">
                <AlertCircle size={40} />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Bạn chưa đăng nhập</h2>
                <p className="text-gray-400">Vui lòng đăng nhập để quản lý tủ phim cá nhân.</p>
            </div>
            <Link href="/login" className="bg-primary hover:bg-white text-black px-8 py-3 rounded-full font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                ĐĂNG NHẬP NGAY
            </Link>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 font-sans px-4 md:px-8">
      <div className="container mx-auto">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/10 pb-6">
            <div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
                    Tủ Phim <span className="text-primary">Của Tôi</span>
                </h1>
                
                {/* --- TAB SWITCHER --- */}
                <div className="flex items-center gap-2 mt-6 bg-[#121212] p-1 rounded-lg w-fit border border-white/10">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-md font-bold text-sm transition-all ${
                            activeTab === 'history' 
                            ? 'bg-white/10 text-primary shadow-lg' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        <History size={16} /> <span className="hidden md:inline">Lịch sử xem</span><span className="md:hidden">Lịch sử</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('watch-later')}
                        className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-md font-bold text-sm transition-all ${
                            activeTab === 'watch-later' 
                            ? 'bg-white/10 text-primary shadow-lg' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        <Bookmark size={16} /> Xem sau
                    </button>
                </div>
            </div>

            <div className="text-right">
                <div className="mb-2">
                    <span className="text-4xl font-black text-white">{items.length}</span>
                    <span className="text-gray-500 text-xs block font-bold">PHIM</span>
                </div>
                {items.length > 0 && (
                    <button 
                        onClick={handleClearAll}
                        className="flex items-center justify-end gap-2 text-red-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider group"
                    >
                        <Trash2 size={14} className="group-hover:rotate-12 transition-transform" /> 
                        Xóa toàn bộ
                    </button>
                )}
            </div>
        </div>

        {/* CONTENT GRID */}
        {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {items.map((item) => (
                    <HistoryItem 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDelete}
                        // Ẩn thanh progress bar nếu đang ở tab "Xem sau" (vì chưa xem)
                        hideProgress={activeTab === 'watch-later'} 
                    />
                ))}
            </div>
        ) : (
            // EMPTY STATE
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-[#121212]/30 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    {activeTab === 'history' ? <Film size={40} className="text-gray-600" /> : <Bookmark size={40} className="text-gray-600" />}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                    {activeTab === 'history' ? 'Lịch sử trống' : 'Danh sách trống'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {activeTab === 'history' 
                        ? 'Bạn chưa xem bộ phim nào cả.' 
                        : 'Bạn chưa lưu bộ phim nào để xem sau.'}
                </p>
                <Link href="/" className="bg-white/10 hover:bg-primary text-white hover:text-black font-bold px-8 py-3 rounded-full transition-all flex items-center gap-2">
                    <Play size={18} fill="currentColor" /> Khám phá phim mới
                </Link>
            </div>
        )}

      </div>
    </div>
  );
}