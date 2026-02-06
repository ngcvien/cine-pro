"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "../../lib/firebase"; 
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import HistoryItem from "../../components/HistoryItem"; // Import Component của bạn

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [watchHistory, setWatchHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        setDisplayName(u.displayName || "");
        
        // --- LẤY DỮ LIỆU TỪ FIREBASE ---
        try {
            // Lấy 4 phim xem gần nhất (để xếp vừa đẹp lưới 2 hoặc 4 cột)
            const q = query(
                collection(db, "users", u.uid, "history"), 
                orderBy("last_watched", "desc"),
                limit(4) 
            );

            const querySnapshot = await getDocs(q);
            // Chỉ cần lấy data thô, việc hiển thị để HistoryItem lo
            const historyData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            setWatchHistory(historyData);
        } catch (error) {
            console.error("Lỗi lấy lịch sử profile:", error);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (user) {
        try {
            await updateProfile(user, { displayName: displayName });
            alert("Đã cập nhật tên hiển thị!");
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen pt-28 pb-20 container mx-auto px-4 md:px-8 max-w-5xl">
       
       {/* --- 1. HEADER PROFILE (Giữ nguyên vẻ đẹp cũ) --- */}
       <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-primary to-green-600 shadow-2xl">
                <img 
                    src={user?.photoURL || "https://api.dicebear.com/9.x/initials/svg?seed=User"} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover bg-black" 
                />
            </div>
             <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black font-black text-xs px-3 py-1 rounded-full border-4 border-[#050505]">VIP</div>
        </div>
        <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{user?.displayName}</h1>
            <p className="text-gray-400 font-mono">{user?.email}</p>
            <p className="text-green-500 font-bold text-sm flex items-center justify-center md:justify-start gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 
                Đang hoạt động
            </p>
        </div>
      </div>

      <hr className="border-white/10 mb-12" />

      {/* --- 2. SECTION: TIẾP TỤC XEM (Sử dụng HistoryItem) --- */}
      <div className="mb-16">
        <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
                Tiếp Tục Xem
            </h2>
            <Link href="/tu-phim" className="text-sm font-bold text-primary hover:text-white transition-colors flex items-center gap-1 group">
                Xem tất cả tủ phim 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
        </div>

        {watchHistory.length > 0 ? (
            // Dùng Grid để phù hợp với Poster dọc của HistoryItem
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {watchHistory.map((item) => (
                    // Chỉ cần truyền item vào, component con tự lo fetch ảnh và tính %
                    <HistoryItem key={item.id} item={item} />
                ))}
            </div>
        ) : (
            <div className="p-10 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-gray-400 mb-2">Bạn chưa xem bộ phim nào gần đây.</p>
                <Link href="/" className="inline-block bg-primary text-black font-bold px-6 py-2 rounded hover:scale-105 transition-transform">
                    Khám phá phim ngay
                </Link>
            </div>
        )}
      </div>

       {/* --- 3. FORM CÀI ĐẶT --- */}
       <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
            <span className="w-2 h-8 bg-gray-500 rounded-full inline-block"></span>
            Thông Tin Cá Nhân
        </h2>
        <form onSubmit={handleUpdateProfile} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tên hiển thị</label>
                    <input 
                        type="text" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                    <input 
                        type="email" 
                        value={user?.email || ""} 
                        disabled 
                        className="w-full bg-[#050505]/50 border border-white/5 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <button type="submit" className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-primary transition-colors shadow-lg shadow-white/10">
                    Lưu Thay Đổi
                </button>
                <button type="button" onClick={() => auth.signOut()} className="text-red-500 font-bold text-sm hover:text-red-400 hover:underline">
                    Đăng xuất
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}